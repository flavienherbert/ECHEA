# Tarifs

| Formule | Prix | Stripe (mode test) |
|---|---|---|
| Gratuit | 0 € — contrôles illimités, fichiers jusqu'à 25 stagiaires (sessions complètes), relances pour 3 entreprises | — |
| Pro mensuel | 29 € HT / mois, sans engagement | `price_1UKCyEEGJoc9TCKl7COpqJ08` · https://buy.stripe.com/test_9B600j2rogO38yC7dHbfO00 |
| Pro annuel | 290 € HT / an (2 mois offerts) | `price_1UKCyIEGJoc9TCKlW3al34zl` · https://buy.stripe.com/test_8x25kD9TQfJZ5mqcy1bfO01 |
| Offre pilote | 3 mois offerts puis 29 € HT / mois, 10 places | lien limité à 10 paiements · https://buy.stripe.com/test_7sYfZhea6gO38yCapTbfO02 |

Produit Stripe : `prod_VKsjqjuICeWP4t` (« Échéa Pro »). Prix en `tax_behavior: exclusive` (HT). Les liens redirigent vers `merci.html?plan=…`, collectent l'adresse de facturation, le nom de l'organisme et le n° de TVA éventuel.

Justification (voir `docs/research/concurrence-logiciels-of.md`) : un générateur gratuit existe, les suites complètes coûtent au moins 78 € HT/mois pour les deux fonctions ; au-delà de 39 € un outil unique perd la comparaison. Un MAC SST récupéré couvre environ 22 mois d'abonnement mensuel.

Passage en live : dans Stripe, activer le compte, recréer produit, prix et liens en mode live (ou demander à Claude de le faire une fois le connecteur en live), puis remplacer les trois liens et `STRIPE_MODE` dans `app/src/config.js`, et redéployer.
