# Vente

| Fichier | Contenu |
|---|---|
| `icp.md` | Cible, critères de qualification et priorités A/B/C |
| `sequence.md` | Séquence J0 / J+4 / J+10, réponses types, cadre CNIL |
| `objections.md` | Objections fréquentes et réponses sourcées |
| `roi.md` | Argumentaire chiffré (recyclages, temps, risque) |
| `demo-script.md` | Démonstration de 15 minutes |
| `private/` | **Hors Git** : prospects nominatifs, messages, journal des brouillons Gmail |

Le fichier des prospects (`private/prospects.csv`) contient des données personnelles publiques (dirigeants, emails affichés sur les sites). Il n'est jamais poussé sur le dépôt public ; il se régénère avec `python3 scripts/sales/build_prospects.py` à partir des lots vérifiés.

Liens de paiement (Stripe, **mode test** tant que le compte n'est pas en live) :
- Pro mensuel : https://buy.stripe.com/test_9B600j2rogO38yC7dHbfO00
- Pro annuel : https://buy.stripe.com/test_8x25kD9TQfJZ5mqcy1bfO01
- Offre pilote, 3 mois offerts, 10 places : https://buy.stripe.com/test_7sYfZhea6gO38yCapTbfO02

Après chaque paiement : `node scripts/license/license.mjs issue --org "Organisme" --email client@exemple.fr --months 13` (annuel ; `--months 4` pour le mensuel ou le pilote, renouvelée chaque trimestre), puis envoyer la clé (voir `workflows/onboarding-client.md`).
