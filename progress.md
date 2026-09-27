# progress.md — continuité de la mission Échéa

Fichier de reprise : un autre agent doit pouvoir continuer à partir d'ici. Mettre à jour à chaque étape.
Légende : DONE · WAITING (attend une action) · BLOCKED · TODO.

## Mission

Brief « AI Autonomous Founder » de Flavien Herbert (Vire, 14) : choisir UN business, le construire, le tester, le déployer, préparer la vente et l'automatisation, sans dépense ni envoi sans son accord.

## Décision business (DONE — 26/09/2026)

**Échéa** : web app local-first pour organismes de formation santé-sécurité. Excel de stagiaires → contrôles → CSV officiel du Passeport de prévention (ADF + JDR) + relances de recyclages aux entreprises clientes. Gratuit (25 stagiaires/export) · Pro 29 € HT/mois ou 290 € HT/an.
Voir [`docs/business-decision.md`](docs/business-decision.md).

## Historique des sessions

- **Session 1 (26/09, 18 h 21 → 19 h 59)** : audit des outils, 3 agents de recherche, décision, 25 prospects (lot 1). Coupée par la limite d'usage.
- **Session 2 (26/09, 22 h 58 → 23 h 40)** : dépôt GitHub cloné, 7 agents lancés (codes officiels, référentiels, réglementation, concurrence, QA prospects, lot 2, pages légales). Coupée par la limite d'usage ; 3 agents sur 7 ont fini, le QA et le lot 2 ont laissé leurs fichiers.
- **Session 3 (27/09, depuis 3 h 50)** : récupération des sorties sur disque, construction, tests, déploiement, Stripe test, brouillons, CRM, agents.
- **Session 4 (27/09, fin de matinée)** : vérification indépendante (agent QA) puis corrections : historique Git réécrit (données personnelles retirées), code, textes, brouillons, tâche planifiée.

Leçon : les agents en parallèle consomment vite la limite d'usage. Pousser sur GitHub à chaque étape.

## Outils (audit du 26/09, revérifié le 27/09)

| Capacité | Statut |
|---|---|
| Terminal Linux, Node 22, Python 3, git | AVAILABLE |
| Chromium + Playwright (tests) | AVAILABLE |
| Recherche web (WebSearch / WebFetch) | AVAILABLE (quota par session) |
| Accès réseau du shell | Registres npm/PyPI et GitHub seulement (gouv.fr, data.gouv.fr, github.io, stripe.com bloqués) |
| GitHub `flavienherbert/ECHEA` (public) | AVAILABLE (push via le proxy git) |
| Stripe (MCP) | AVAILABLE, compte `acct_1SRCunEGJoc9TCKl` en **mode test** |
| Gmail (brouillons) | AVAILABLE — aucun envoi sans accord |
| Google Drive | AVAILABLE |
| Tâches planifiées | AVAILABLE |
| Vercel, Netlify, Canva, Exa | NOT CONNECTED (à reconnecter par l'utilisateur) |
| Registrar de domaine | NOT AVAILABLE |
| Analytics | NOT AVAILABLE (GoatCounter prévu, compte à créer) |
| Chrome de l'utilisateur | NOT CONNECTED |

## État actuel

| Élément | Statut |
|---|---|
| Recherche (réglementation, concurrence, format) | DONE — `docs/research/` |
| Prospects | DONE — 37 organismes (28 A, 4 B, 5 C), 29 emails vérifiés ; données personnelles hors Git (`sales/private/`) |
| App | DONE — `app/app.html` + `app/src/` (import, colonnes, contrôle, export ADF/JDR, recyclages, formations, réglages, licence, démo) |
| Landing + pages légales | DONE — `app/index.html`, mentions, CGV, confidentialité, merci (marqueurs [À COMPLÉTER] : statut, SIRET, adresse, TVA) |
| Tests | DONE — 31 tests unitaires + 20 parcours E2E (10 scénarios × desktop/mobile), tous verts le 27/09 après corrections |
| Déploiement GitHub Pages | DONE — https://flavienherbert.github.io/ECHEA/ (branche `gh-pages`, `bash scripts/deploy.sh`) — vérifié par WebFetch le 27/09 |
| Stripe (mode test) | DONE (config) — produit `prod_VKsjqjuICeWP4t`, prix 29 €/mois `price_1UKCyEEGJoc9TCKl7COpqJ08` et 290 €/an `price_1UKCyIEGJoc9TCKlW3al34zl`, liens mensuel / annuel / pilote (3 mois offerts, 10 places) ; paiement réel NON testé (stripe.com inaccessible depuis le shell) |
| Messages + brouillons Gmail | DONE — 25 brouillons personnalisés dans la boîte Gmail de Flavien, **non envoyés**, réécrits le 27/09 (formulations exactes, origine de l'adresse, HTML + texte : plus aucun lien réécrit en google.com/url, vérifié par la recherche Gmail) ; journal `sales/private/drafts-log.json` ; script `scripts/sales/build_prospects.py` (données dans `sales/private/`) |
| CRM | DONE — artefact privé « Pipeline Échéa » [URL du CRM privé : galerie d'artefacts de Flavien, « Pipeline Échéa »] (collection `prospects`, 37 fiches, lecture/écriture réservées au propriétaire) ; code de la page : `sales/crm-pipeline.html` |
| Agents / orchestrateur / automatisations | DONE — 8 fiches (`agents/`), 5 procédures (`workflows/`), tâche planifiée « Échéa — pipeline du lundi » (lundi 8 h 47, heure de Paris ; prompt `prompts/pipeline-hebdo.md`, mis à jour le 27/09 ; ses exécutions demandent une validation tant que « Automatically approve » n'est pas activé) |
| Stratégie, README, supports | DONE — `docs/business-strategy.md`, `README.md`, `sales/*.md`, `marketing/pitch.md`, `marketing/echea-presentation.pdf` |

## Décisions importantes

1. Local-first, sans serveur : aucun NIR transmis ni mémorisé (seules les données utiles aux recyclages sont gardées dans le navigateur).
2. Hébergement GitHub Pages (gratuit, repo public). Conséquence : aucune donnée personnelle de prospects dans Git.
3. Paiement : Stripe Payment Links ; accès Pro par clé de licence signée Ed25519, vérifiée dans le navigateur.
4. Pas de promesse de dépôt automatique : aucune API de dépôt n'existe ; l'OF importe lui-même le fichier sur le portail.
5. Durées de recyclage présentées comme des recommandations (INRS, référentiels), jamais comme « la loi ».
6. Sanction citée comme « jusqu'à 2 000 € par manquement » (plafond), jamais « par stagiaire ».

## Variables nécessaires (jamais dans Git)

- `ECHEA_LICENSE_PRIVATE_KEY` : clé privée Ed25519 de signature des licences (hors dépôt).
- Liens de paiement Stripe (publics, dans `app/src/config.js`).
- `GOATCOUNTER_CODE` (optionnel) : identifiant GoatCounter si l'analytics est activé.

## Actions bloquées / en attente de l'utilisateur

- Statut juridique, SIRET, adresse, régime de TVA pour les mentions légales et les CGV (marqueurs [À COMPLÉTER]).
- Passage de Stripe en mode live, puis un vrai paiement de bout en bout (jamais testé).
- Relire et envoyer les 25 brouillons (5 à 10 par jour).
- Conserver la clé privée de licence hors du dépôt (fichier remis le 27/09 ; le conteneur de travail est éphémère).
- Optionnel : domaine `echea.fr`, compte GoatCounter, les 5 fichiers .xlsx des fiches officielles de codes.
- Les anciens commits (avant réécriture) peuvent rester consultables par leur identifiant sur GitHub jusqu'au nettoyage de GitHub : demande possible au support GitHub (« remove cached views »).

## Tests effectués

- `npm test` : 31 tests unitaires (NIR + clé + Corse, SIRET Luhn, dates Excel, délais officiels, codes, colonnes, formations, ADF/JDR, découpage 500, identifiants stables, intitulé déclaré, fin de validité, doublons, recyclages, licences, fichier d'exemple réel).
- `npm run test:e2e` : 20/20 (desktop + mobile) — arrivée, compréhension, CTA, réglages conservés, éditeur de codes, import → corrections → export conforme (20 et 29 colonnes), liens Stripe + activation de licence, « Tout effacer », démo (export du fichier fictif seulement), erreurs de fichier, pages légales.
- Site public vérifié par WebFetch (index, app, mentions légales, asset JS).

## Problèmes rencontrés

- Limite d'usage atteinte deux fois (sessions 1 et 2).
- Les 19 fiches officielles de codes sont des .xlsx illisibles par WebFetch et inaccessibles au shell : Échéa ne pré-remplit pas les codes, il contrôle leur format.
- Vérification indépendante du 27/09 : email personnel et emails de prospects présents dans l'historique Git public (corrigé par réécriture), phrase de rejet inexacte dans les emails et la landing (corrigée), validité inscrite à tort sur l'attestation d'un échec SST (corrigée), export possible d'un fichier réel avec les codes d'exemple en démo (bloqué).
- L'outil Gmail enregistre les liens en redirections google.com/url quand le brouillon n'a qu'un corps texte : toujours fournir htmlBody + body.
