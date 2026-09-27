#!/usr/bin/env python3
"""Fusionne les lots de prospects, attribue un niveau de priorité et prépare le message J0
de chaque prospect joignable par email.

Aucune donnée nominative dans ce fichier : les lots, les accroches (faits relevés sur les sites)
et les niveaux de priorité sont lus dans sales/private/ (hors Git).

Entrées  : sales/private/prospects-lot1-raw.csv, prospects-lot1-qa.csv, prospects-lot2-raw.csv,
           sales/private/prospect-hooks.json (HOOKS, TOOL_NOTE, TIER_B, TIER_C, LOCAL_DEPTS)
Sorties  : sales/private/prospects.csv (les statuts déjà saisis sont conservés),
           sales/private/messages.json, sales/private/messages.md
"""
import csv, json, re, pathlib
from collections import Counter

ROOT = pathlib.Path(__file__).resolve().parents[2]
P = ROOT / 'sales' / 'private'
SITE = 'https://flavienherbert.github.io/ECHEA/'
SUBJECT = 'Passeport de prévention : déclarer vos sessions depuis votre Excel'
PRIVACY = SITE + 'confidentialite.html#prospection'
NO_MESSAGE = {'ne plus contacter', 'perdu', 'client'}


def read_csv(name):
    with open(P / name, encoding='utf-8') as f:
        return list(csv.DictReader(f, delimiter=';'))


cfg = json.loads((P / 'prospect-hooks.json').read_text(encoding='utf-8'))
HOOKS, TOOL_NOTE = cfg['HOOKS'], cfg.get('TOOL_NOTE', {})
TIER_B, TIER_C = cfg.get('TIER_B', {}), cfg.get('TIER_C', {})
LOCAL_DEPTS = set(cfg.get('LOCAL_DEPTS', []))

lot1 = read_csv('prospects-lot1-raw.csv')
qa = {r['company']: r for r in read_csv('prospects-lot1-qa.csv')}
lot2 = read_csv('prospects-lot2-raw.csv')
previous = {r['company']: r for r in read_csv('prospects.csv')} if (P / 'prospects.csv').exists() else {}


def clean_email(v):
    v = (v or '').strip()
    return v if re.fullmatch(r'[^@\s;/]+@[^@\s;/]+\.[a-z]{2,}', v, re.I) else ''


rows = []
for r in lot1:
    q = qa.get(r['company'].split(' (')[0]) or qa.get(r['company']) or {}
    emails = [e.strip() for e in (q.get('email_seen') or '').split('/') if e.strip()] if q.get('email_verified') == 'oui' else []
    rows.append({**r, 'email': clean_email(emails[0]) if emails else '', 'contact_name': q.get('contact_name', ''),
                 'contact_role': q.get('contact_role', ''), 'software_seen': q.get('software_seen', r.get('outil_detecte', '')),
                 'verification': q.get('verification_note', ''), 'lot': '1'})
for r in lot2:
    rows.append({**r, 'email': clean_email(r['public_contact']), 'software_seen': r.get('outil_detecte', ''),
                 'verification': "Vérifié par l'agent SALES lot 2 (26/09/2026).", 'lot': '2'})

out = []
for i, r in enumerate(rows, 1):
    name = r['company']
    short = name.split(' (')[0]
    tier, why = 'A', 'Petit OF, SST + autres formations à recyclage, aucun logiciel avec export Passeport détecté.'
    if short in TIER_C or name in TIER_C:
        tier, why = 'C', TIER_C.get(short) or TIER_C.get(name)
    elif short in TIER_B or name in TIER_B:
        tier, why = 'B', TIER_B.get(short) or TIER_B.get(name)
    channel = 'email' if r['email'] else ('formulaire' if 'formulaire' in (r.get('public_contact') or '') or r.get('contact_page_url', '').startswith('http') else 'téléphone')
    status = 'brouillon prêt' if (r['email'] and tier != 'C' and name in HOOKS) else ('à contacter (formulaire/téléphone)' if tier != 'C' else 'en réserve')
    prev = previous.get(name, {})
    out.append({
        'id': f'P{i:02d}', 'priorite': tier, 'company': name, 'city': r['city'], 'department': r['department'], 'region': r['region'],
        'size': r['size'], 'trainings': r['trainings'], 'email': r['email'], 'contact_name': r.get('contact_name', ''),
        'contact_role': r.get('contact_role', ''), 'phone': r.get('phone', ''), 'contact_page_url': r.get('contact_page_url', ''),
        'website': r['website'], 'software_seen': r.get('software_seen', ''), 'reason_fit': r.get('reason_fit', ''),
        'priority_reason': why, 'hook': HOOKS.get(name, ''), 'channel': channel,
        # Le suivi saisi depuis (brouillon créé, envoyé, réponse…) n'est jamais écrasé.
        'status': prev.get('status') or status, 'next_action': prev.get('next_action', ''), 'last_contact': prev.get('last_contact', ''),
        'source': r.get('source', ''), 'lot': r['lot'],
    })


def message(p):
    lines = [
        'Bonjour,', '',
        p['hook'], '',
        "Depuis septembre 2025, les organismes de formation doivent déclarer au Passeport de prévention leurs formations "
        "santé-sécurité éligibles, et celles terminées d'avril à juin 2026 avant le 31 décembre. Le portail est strict : "
        "une erreur de structure fait rejeter tout le fichier, et si le NIR ne correspond pas au nom de naissance, la déclaration du stagiaire est rejetée.", '',
        "J'ai créé Échéa pour ça. Vous déposez votre fichier de stagiaires tel quel : l'outil vérifie chaque ligne (clé du NIR, nom de "
        "naissance, SIRET, dates, codes), puis génère le fichier d'import au format officiel. Il calcule aussi les MAC SST et les "
        "recyclages à venir, entreprise par entreprise, avec l'email de relance prêt à partir.",
    ]
    if p['company'] in TOOL_NOTE:
        lines += ['', TOOL_NOTE[p['company']]]
    lines += ['', f"Tout se passe dans votre navigateur : aucun NIR ne quitte votre ordinateur. La démo prend deux minutes : {SITE}", '',
              "Je cherche dix organismes pilotes : trois mois offerts, en échange de vos retours sur un premier dépôt. "
              "Seriez-vous partant pour l'essayer sur votre prochaine déclaration ?"]
    if p['department'] in LOCAL_DEPTS:
        lines += ['', "Je suis basé à Vire : si vous préférez, je peux passer vous le montrer."]
    lines += ['', 'Bien cordialement,', '', 'Flavien Herbert', 'Échéa · Vire (Calvados)', SITE, '', '—',
              "Votre adresse figure sur votre site internet. Si je ne m'adresse pas à la bonne personne, ou si vous préférez ne plus recevoir "
              "de message de ma part, dites-le-moi simplement : je supprimerai vos coordonnées. Plus d'informations : " + PRIVACY]
    return {'id': p['id'], 'company': p['company'], 'to': p['email'], 'subject': SUBJECT, 'body': '\n'.join(lines)}


messages = [message(p) for p in out if p['email'] and p['priorite'] != 'C' and p['hook'] and p['status'] not in NO_MESSAGE]
with open(P / 'prospects.csv', 'w', encoding='utf-8', newline='') as f:
    w = csv.DictWriter(f, fieldnames=list(out[0].keys()), delimiter=';')
    w.writeheader()
    w.writerows(out)
(P / 'messages.json').write_text(json.dumps(messages, ensure_ascii=False, indent=1), encoding='utf-8')
with open(P / 'messages.md', 'w', encoding='utf-8') as f:
    for m in messages:
        f.write(f"## {m['id']} · {m['company']}\n\nÀ : {m['to']}\nObjet : {m['subject']}\n\n{m['body']}\n\n")

print(len(out), 'prospects', dict(Counter(p['priorite'] for p in out)), '| emails :', sum(1 for p in out if p['email']), '| messages :', len(messages))
print(dict(Counter(p['status'] for p in out)))
print('sans accroche :', [p['id'] for p in out if p['email'] and p['priorite'] != 'C' and not p['hook']])
