# Décision business — Échéa

Date : 26/09/2026 (décision), mise à jour le 27/09/2026. Légende : **FACT** (source liée) · **INFERENCE** (déduction) · **HYPOTHESIS** (à tester) · **ASSUMPTION** (posée par défaut).
Rapports complets : [`docs/research/`](research/).

## Business choisi

**Échéa** : une web app pour les organismes de formation (OF) en santé-sécurité (SST, incendie, habilitation électrique, CACES…). L'OF glisse son fichier Excel de stagiaires ; Échéa :

1. contrôle chaque ligne (NIR, nom de naissance, SIRET, dates, codes, règles conditionnelles) avant le dépôt ;
2. génère le fichier CSV officiel d'import en masse du Passeport de prévention (attestations ADF et justificatifs de réussite JDR) ;
3. calcule les recyclages à venir (MAC SST, habilitations, CACES…) et prépare les emails de relance aux **entreprises clientes**.

Tout le traitement a lieu dans le navigateur : aucun NIR n'est envoyé sur un serveur.

## Problème

- **FACT** : depuis le 01/09/2025, les OF doivent déclarer au Passeport de prévention les formations santé-sécurité éligibles qu'ils dispensent ([portail](https://passeport-prevention.travail-emploi.gouv.fr/aide/quelles-sont-mes-obligations-en-tant-quorganisme-de-formation)).
- **FACT** : la saisie en ligne est limitée à 50 personnes à la fois ; l'import en masse (CSV à `|`, 20 ou 29 colonnes, codes ROME/Formacode/NSF, NIR à 13 caractères) existe depuis le 09/07/2026 ([guide ADF](https://passeport-prevention.travail-emploi.gouv.fr/espace-public/sites/pp/files/2026-02/Guide%20import%20en%20masse_OF_ADF.pdf), [Wedof](https://wedof.fr/blog/obligation-declaration-passeport-prevention)).
- **FACT** : au moindre écart, « le fichier sera rejeté dans sa globalité » ; le couple NIR / nom de naissance est contrôlé (guide ADF).
- **FACT** : amende administrative pouvant atteindre 2 000 € par manquement pour l'OF qui ne remplit pas le passeport, plafond doublé en cas de récidive sous 2 ans ([L6356-1](https://code.travail.gouv.fr/code-du-travail/l6356-1), [L6356-2](https://code.travail.gouv.fr/code-du-travail/l6356-2)). UNKNOWN : ce qu'est un « manquement ».
- **FACT** : témoignages de charge : « un ETP en plus sur 80 ETP » (Assocca), données « réparties entre fichiers Excel, mails, dossiers partagés » ([Prévention BTP](https://www.preventionbtp.fr/actualites/formation/le-passeport-de-prevention-franchit-une-nouvelle-etape_fcf8AeUmurJFePiQeNUixE), [Hop3team](https://hop3team.com/passeport-prevention-organisme-formation-2026/)).
- **Second problème, commercial** : les recyclages (MAC SST tous les 24 mois selon l'INRS) sont un revenu récurrent que beaucoup d'OF relancent à la main. FACT : 54 % des SST formés sont des MAC ([ProtectUp, données INRS](https://www.protectup.fr/formations-sst-la-stat-3/)).

## ICP

OF privés de 1 à 20 salariés, habilités INRS SST, qui vendent le SST/MAC SST et au moins une autre formation sécurité, et qui gèrent leurs stagiaires sous Excel ou avec un outil sans export Passeport (Argalis, Formadmin, Edusign…). Décideur : gérant·e ou responsable administratif. Zone de départ : Normandie, Bretagne, Pays de la Loire (proximité de Vire).

- **FACT** : 6 500 OF habilités INRS et 1,4 million de stagiaires formés en 2025 ([INRS](https://www.inrs.fr/services/formation/demultiplication.html)) ; 3 600 OF ont déjà déposé 66 000 déclarations ([Prévention BTP](https://www.preventionbtp.fr/actualites/formation/le-passeport-de-prevention-franchit-une-nouvelle-etape_fcf8AeUmurJFePiQeNUixE)).

## Pourquoi maintenant

- **FACT** : formations de 2026 à déclarer dans les 6 mois suivant la fin du trimestre (T2 → 31/12/2026) ; à partir de 2027, 3 mois seulement ([portail, 15/06/2026](https://passeport-prevention.travail-emploi.gouv.fr/actualites/actualites-dans-le-deploiement-du-passeport-de-prevention)).
- **FACT** : la sanction administrative a été créée par la loi n° 2026-534 du 25/06/2026 ([Centre Inffo](https://www.centre-inffo.fr/site-droit-formation/actualites-droit/passeport-de-prevention-modification-du-cadre-legal)).
- **FACT** : le 16/11/2026, les travailleurs pourront consulter leur passeport (portail, 15/06/2026). INFERENCE : les oublis de l'OF deviendront visibles pour ses stagiaires et ses clients.

## Alternatives et concurrents (prix lus le 26/09/2026)

| Acteur | Prix affiché | Passeport | Relances recyclage |
|---|---|---|---|
| [Digiforma](https://www.digiforma.com/prix/) | Indep 49 € HT/mois (annuel) + module Admin+ « à partir de 29 € » | CSV conforme (Admin+) | Oui (Admin+) |
| [Dendreo](https://www.dendreo.com/prix) | Starter 225 € HT/mois + 1 490 € de frais initiaux | Oui | Alerte, pas de relance email ([doc](https://doc.dendreo.com/article/366-les-recyclages)) |
| [Formaness](https://www.formaness.fr/) | 99 € HT/mois | Export SST | Oui, J-90/J-30/J-7 |
| [Loop Formations](https://loop-formations.fr/s/logiciel-formation-caces/) | 99 € HT/mois | Non mentionné | Oui |
| [Queoval](https://www.queoval-formation.com/tarifs-logiciel-formation) | 89 / 159 € HT/mois | « exports prêts à l'emploi » | Non mentionné |
| [Argalis](https://argalis.fr/) · [Formadmin](https://formadmin.fr/tarifs-logiciel-organisme-formation.html) · [Edusign](https://edusign.com/fr/tarifs) | 39 à 179 € HT/mois | Pas d'export | Non |
| [Générateur Travail-Industrie](https://travail-industrie.com/passeport-prevention/outils/generateur-csv) | Gratuit | ADF + JDR, en local, saisie stagiaire par stagiaire | Non |
| Excel + saisie manuelle | 0 € | 50 personnes max par saisie | À la main |

Détail : [`research/concurrence-logiciels-of.md`](research/concurrence-logiciels-of.md).

## Positionnement

« Votre Excel tel quel, prêt pour le Passeport. » Échéa ne remplace pas le logiciel de gestion : il se branche **à côté** de n'importe quel fichier. Il vend la qualité des données avant dépôt et le chiffre d'affaires de recyclage récupéré, pas « un CSV ».

## Avantage proposé

1. Import du fichier existant avec reconnaissance des colonnes (pas de ressaisie, contrairement au générateur gratuit).
2. Contrôles avant dépôt : clé du NIR, SIRET (Luhn), dates, bornes des codes, règles conditionnelles, doublons, découpage à 500 stagiaires.
3. Relances de recyclage **à l'entreprise cliente**, qui paie la formation (Dendreo n'envoie pas de relance ; GesCOF relance le stagiaire).
4. Local-first : les NIR ne quittent pas l'ordinateur et ne sont pas mémorisés.
5. Prix d'un outil unique : 29 € HT/mois, contre 78 € minimum chez Digiforma pour les deux fonctions.

## Modèle économique

- **Gratuit** : contrôles illimités, export jusqu'à 25 stagiaires par fichier, relances pour 3 entreprises.
- **Pro** : 29 € HT/mois sans engagement, ou 290 € HT/an (2 mois offerts). Paiement Stripe, clé de licence par email.
- INFERENCE (ROI) : un organisme affiche un MAC SST intra « à partir de 650 € HT par session de 10 stagiaires » ([CNFSE](https://sst-formation.info/recyclage-sst)) ; une session récupérée couvre environ 22 mois d'abonnement.
- INFERENCE (taille) : 3 % des 3 600 OF déclarants à 29 € ≈ 108 clients ≈ 3 100 € MRR.

## Hypothèses à tester

- HYPOTHESIS : les petits OF paient 29 €/mois pour éviter la ressaisie et les rejets (test : 5 clients payants sur les 37 premiers prospects).
- HYPOTHESIS : le portail accepte le fichier tel que généré (CRLF, sans BOM) — à valider au premier dépôt réel d'un client pilote.
- HYPOTHESIS : les relances de recyclage à l'entreprise sont l'argument qui déclenche l'achat.
- ASSUMPTION : durées de recyclage par défaut = recommandations INRS/référentiels (SST 24 mois, habilitation 36, CACES 60/120), modifiables.

## Risques

- Un générateur gratuit existe : la valeur doit venir de l'import, des contrôles et des relances.
- Les suites (Digiforma, Dendreo, Ypareo) intègrent déjà l'export : les OF équipés ne sont pas la cible.
- Le format officiel peut évoluer : Échéa suit la trame publiée à la date de chaque version.
- Pas de contrôle d'existence en ligne des codes ROME/Formacode/NSF ni du couple NIR/nom : Échéa contrôle le format, le portail l'existence.
- Licence vérifiée côté navigateur : contournable (acceptable pour un B2B honnête ; v2 : vérification serveur).
- Dépendance à une réglementation encore en transition (décret d'application de la sanction annoncé).

## Preuves de demande

- Mise en place d'exports Passeport par Digiforma (juin 2026), Ypareo (07/07/2026) et Dendreo : les éditeurs investissent sur le sujet.
- Signaux publics de difficulté (Prévention BTP, AEF info, Wedof, Digiformag, Certiforma, Hop3team), cités dans `research/concurrence-logiciels-of.md`.
- 3 600 OF déjà déclarants.

## Raisons de la sélection

Obligation récente et sanctionnée ; démonstration de valeur immédiate (le fichier passe ou non) ; ROI chiffrable par les recyclages ; prospects publics (les OF affichent leurs contacts) ; construction simple sans serveur ni coût récurrent ; abonnement récurrent calé sur le rythme trimestriel des déclarations.

**Piste écartée** : le suivi des habilitations côté employeurs (ambulances, sécurité, transport). Au moins 9 SaaS existent déjà, dont un gratuit jusqu'à 20 salariés ([`research/piste-ecartee-habilitations-employeurs.md`](research/piste-ecartee-habilitations-employeurs.md)).

## Nom

« Échéa » vient d'« échéance ». FACT : `echea.fr` n'était pas enregistré au registre AFNIC le 26/09/2026 (RDAP 404). NON VÉRIFIÉ : disponibilité à l'INPI ; ne pas considérer la marque comme disponible sans recherche d'antériorité.
