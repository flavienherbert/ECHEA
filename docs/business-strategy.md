# Stratégie — Échéa

Version du 27/09/2026. Décision et sources : [`business-decision.md`](business-decision.md).

## Business

Outil web pour organismes de formation (OF) santé-sécurité : fichier d'import du Passeport de prévention préparé et contrôlé à partir de l'Excel existant, plus suivi des recyclages et relances des entreprises clientes. Local-first : aucune donnée de stagiaire ne quitte le navigateur.

## ICP

OF privés de 1 à 20 salariés, habilités INRS SST, vendant SST/MAC SST et au moins une autre formation à recyclage, sans logiciel qui exporte vers le Passeport (Excel, Argalis, Formadmin, Edusign…). Détail : [`sales/icp.md`](../sales/icp.md).

## Problème

1. Déclaration obligatoire, format strict, rejet du fichier entier au moindre écart global, délais qui passent de 6 à 3 mois en 2027.
2. Recyclages (MAC SST, habilitations, CACES) relancés à la main, donc perdus.

## Offre et pricing

| | Gratuit | Pro |
|---|---|---|
| Prix | 0 € | 29 € HT/mois sans engagement ou 290 € HT/an |
| Contrôles | illimités | illimités |
| Fichiers ADF/JDR | sessions complètes jusqu'à 25 stagiaires | illimités, découpage à 500 |
| Relances | 3 entreprises | illimitées + export Excel |

Offre pilote : 3 mois offerts, 10 places (lien Stripe dédié, limité à 10 paiements).

## Positionnement

« Votre Excel tel quel, prêt pour le Passeport. » Un outil unique à côté de l'existant, pas une suite à adopter. La confidentialité (NIR non transmis, code public) est une preuve, pas le message principal.

## Concurrents et différenciation

Suites complètes avec export (Digiforma dès 78 € pour les deux fonctions, Dendreo 225 € + frais, Ypareo, Formaness 99 €) ; générateur gratuit à la saisie ; outils sans export (Argalis, Formadmin, Edusign). Différences : import du fichier existant, contrôles ligne par ligne, JDR/ADF automatique, délais par session, relances à l'entreprise qui paie, prix d'outil.

## Acquisition

1. **Email B2B personnalisé** (25 brouillons prêts, séquence J0/J+4/J+10), 5 à 10 envois par jour ouvré.
2. **Terrain en Normandie** : proposition de passage aux OF du 14, 50 et 61 (Vire comme base).
3. **Contenu** : post LinkedIn sur les échéances (31/12/2026, puis 31/03/2027), mise à jour à chaque trimestre.
4. **Plus tard** : partenariats avec formateurs de formateurs SST et réseaux (C&S, franchisés), référencement « import passeport de prévention csv ».

## Funnel

Email ou post → landing → démo (fichier fictif) → essai sur son propre fichier (gratuit, 25 stagiaires) → offre pilote ou Pro → clé de licence → premier dépôt accompagné → relances de recyclage (valeur récurrente) → renouvellement annuel.

## Métriques

| Étape | Mesure | Objectif à 30 jours |
|---|---|---|
| Prospection | emails envoyés / réponses | 25 envoyés, 20 % de réponses |
| Activation | démos ou essais sur fichier réel | 8 |
| Conversion | pilotes signés / Pro payants | 5 pilotes, 1 payant |
| Valeur | premier dépôt accepté par le portail | 3 |
| Récurrence | relances envoyées depuis Échéa | 10 |

Mesure : suivi des prospects (CRM), Stripe, et GoatCounter (sans cookie) une fois activé.

## Risques et parades

| Risque | Parade |
|---|---|
| Fichier refusé par le portail (détail de format non documenté) | Premier dépôt accompagné avec les pilotes ; correctif publié le jour même |
| Générateur gratuit suffisant pour les petits volumes | Vendre l'import, les contrôles et les relances |
| Évolution de la trame officielle | Veille trimestrielle (tâche planifiée), version datée |
| Faible volonté de payer | Offre pilote, ROI par les recyclages, prix bas |
| Licence contournable (vérifiée côté navigateur) | Accepté pour un B2B honnête ; v2 : vérification serveur |

## Hypothèses à valider

Le fichier généré est accepté tel quel (CRLF, sans BOM) ; les OF sous Excel paient 29 €/mois ; la relance des entreprises clientes déclenche l'achat ; les 19 fiches officielles permettent de pré-remplir les codes.

## Roadmap

1. **Semaine 1** : envoi des 25 emails, 3 démos, premier dépôt pilote, statut juridique et Stripe live.
2. **Mois 1** : codes des 19 fiches officielles pré-remplis (si Flavien fournit les 5 fichiers .xlsx), import multi-feuilles guidé, emails de licence automatisés.
3. **Trimestre** : relances programmées (rappels J-90/J-30), export PDF des attestations, vérification de licence côté serveur (Stripe webhook sur une fonction gratuite), domaine echea.fr.
