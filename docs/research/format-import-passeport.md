# Format d'import en masse du Passeport de prévention (organismes de formation)

Référence de développement d'Échéa. Sources : guides officiels « Guide import en masse OF ADF » et « OF JDR » (versions de février 2026), lus le 26 et le 27/09/2026 via WebFetch, qui renvoie un résumé et non le PDF brut. Deux lectures indépendantes du guide ADF donnent le même ordre de colonnes.

- ADF : https://passeport-prevention.travail-emploi.gouv.fr/espace-public/sites/pp/files/2026-02/Guide%20import%20en%20masse_OF_ADF.pdf
- JDR : https://passeport-prevention.travail-emploi.gouv.fr/espace-public/sites/pp/files/2026-02/Guide%20import%20en%20masse_OF_JDR.pdf

> HYPOTHESIS à valider au premier dépôt réel : fin de ligne (CRLF retenu), absence de BOM, guillemets (aucun retenu).

## Règles communes (FACT)

- Fichier `.csv`, séparateur `|`, encodage UTF-8, une ligne d'en-tête, une ligne par stagiaire.
- 200 Mo maximum ; 1 à 500 stagiaires par `ID_DECLARATION`.
- Nom de fichier : 200 caractères maximum, sans `@ < > : " / \ | ? * %`.
- Plusieurs valeurs dans un champ : séparées par `/`. Dates : `jj/mm/aaaa`.
- Au moindre écart sur une condition globale, le fichier est rejeté dans sa globalité.
- Pour un même `ID_DECLARATION`, les données de la formation doivent être identiques sur toutes les lignes.
- `ID_UNIQUE_PARTENAIRE` : unique dans le fichier ET pour l'ensemble des fichiers importés. Un doublon est rejeté (le portail y voit une double déclaration).
- `NIR` : 13 caractères (sans la clé). Le couple « NIR + nom de naissance » est contrôlé ; s'il n'est pas reconnu, la ligne du titulaire est rejetée.
- `NOM_TITULAIRE` : 30 caractères maximum, nom de naissance tel qu'il figure sur une pièce officielle, « sans modification ni troncature ».
- `PRESENCE_EMPLOYEUR` = OUI → `SIRET_EMPLOYEUR` obligatoire (14 chiffres, existence contrôlée). NON → `SIRET_EMPLOYEUR` et `REFERENCE_EMPLOYEUR` vides.
- `COMPETENCE_TRANSFERABLE` : 3 à 10 codes du référentiel ROME, 70 caractères maximum, existence contrôlée.
- `FORMATION_CERTIFIANTE` = OUI → `CERTIFICATION_VISEE` (un code RS, 9 caractères max) obligatoire, `DOMAINE_FORMATION` et `SPECIALITE_FORMATION` vides. NON → `CERTIFICATION_VISEE` vide, 1 à 5 Formacodes (30 car. max) et 1 à 3 codes NSF (15 car. max) obligatoires.
- `QUALIFICATION_FORMATEUR` : `ENSEIGNANT`, `FORMATEUR_D_ADULTES_FORMATION_SPECIALISEE`, `INGENIEUR`, `PREVENTEUR`, `PSYCHOLOGUE`, `RESPONSABLE_QHSE`, `ANCIEN_PROFESSIONNEL`.
- `MODALITE_DISPENSE` : `A_DISTANCE`, `PRESENTIEL`, `MIXTE`.
- `DATE_DEBUT_VALIDITE` ≥ `DATE_FIN_FORMATION` ; `DATE_FIN_VALIDITE` (facultative) ≥ `DATE_DEBUT_VALIDITE`. Dates de formation ≤ date du jour.

## Attestation de formation (ADF) — 20 colonnes, dans cet ordre

| # | Colonne | Règle |
|---|---|---|
| 1 | ID_DECLARATION | obligatoire, 255 |
| 2 | REFERENCE_DECLARATION | obligatoire, 280 |
| 3 | ID_UNIQUE_PARTENAIRE | obligatoire, 255 |
| 4 | NOM_FORMATION | obligatoire, 250 |
| 5 | DATE_DEBUT_FORMATION | obligatoire |
| 6 | DATE_FIN_FORMATION | obligatoire |
| 7 | MODALITE_DISPENSE | facultatif |
| 8 | COMPETENCE_TRANSFERABLE | obligatoire |
| 9 | QUALIFICATION_FORMATEUR | facultatif |
| 10 | FORMATION_CERTIFIANTE | obligatoire (OUI/NON) |
| 11 | CERTIFICATION_VISEE | conditionnel |
| 12 | DOMAINE_FORMATION | conditionnel |
| 13 | SPECIALITE_FORMATION | conditionnel |
| 14 | NIR | obligatoire, 13 |
| 15 | NOM_TITULAIRE | obligatoire, 30 |
| 16 | PRESENCE_EMPLOYEUR | obligatoire (OUI/NON) |
| 17 | SIRET_EMPLOYEUR | conditionnel, 14 |
| 18 | REFERENCE_EMPLOYEUR | conditionnel, 255 |
| 19 | DATE_DEBUT_VALIDITE | obligatoire |
| 20 | DATE_FIN_VALIDITE | facultatif |

## Justificatif de réussite (JDR) — 29 colonnes, dans cet ordre

| # | Colonne | Règle |
|---|---|---|
| 1 | ID_DECLARATION | obligatoire |
| 2 | REFERENCE_DECLARATION | obligatoire |
| 3 | ID_UNIQUE_PARTENAIRE | obligatoire |
| 4 | TYPE_JDR | obligatoire : DIPLOME, TITRE, HABILITATION, CERTIFICAT |
| 5 | NOM_JDR | obligatoire, 255 |
| 6 | NOM_OPTION_SPECIALITE | facultatif |
| 7 | MODE_OBTENTION | facultatif : PAR_ADMISSION, PAR_SCORING |
| 8 | COMPETENCE_TRANSFERABLE | obligatoire, 3 à 10 codes |
| 9 | PRESENCE_FORMATION | facultatif : OUI, NON |
| 10 | NOM_FORMATION | obligatoire si PRESENCE_FORMATION = OUI, sinon vide |
| 11 | DATE_DEBUT_FORMATION | idem |
| 12 | DATE_FIN_FORMATION | idem |
| 13 | MODALITE_DISPENSE | facultatif si OUI, sinon vide |
| 14 | QUALIFICATION_FORMATEUR | facultatif si OUI, sinon vide |
| 15 | FORMATION_CERTIFIANTE | obligatoire si OUI, sinon vide |
| 16 | CERTIFICATION_VISEE | si FORMATION_CERTIFIANTE = OUI |
| 17 | DOMAINE_FORMATION | si FORMATION_CERTIFIANTE = NON (vide si PRESENCE_FORMATION ≠ OUI) |
| 18 | SPECIALITE_FORMATION | idem |
| 19 | NIR | obligatoire, 13 |
| 20 | NOM_TITULAIRE | obligatoire, 30 |
| 21 | PRESENCE_EMPLOYEUR | obligatoire |
| 22 | SIRET_EMPLOYEUR | conditionnel |
| 23 | REFERENCE_EMPLOYEUR | conditionnel |
| 24 | DATE_DEBUT_VALIDITE | obligatoire |
| 25 | DATE_FIN_VALIDITE | facultatif |
| 26 | RESULTAT_OBTENU | facultatif, 1 000 |
| 27 | MENTION_OBTENUE | facultatif, 255 |
| 28 | LIEN_PREUVE | facultatif, URL http(s) |
| 29 | IDENTIFIANT_PREUVE | facultatif, 255 |

Cohérence JDR : DATE_DEBUT_FORMATION ≤ DATE_FIN_FORMATION ≤ DATE_DEBUT_VALIDITE ≤ DATE_FIN_VALIDITE.

## ADF ou JDR ?

- FACT (FAQ officielle) : si une formation donne lieu aux deux documents, ne déclarer que le justificatif de réussite.
- INFERENCE : un SST ou un MAC SST réussi se déclare en JDR de type CERTIFICAT, un échec en ADF. Échéa applique cette règle par défaut, modifiable formation par formation.

## Délais de déclaration (FACT, portail officiel, 15/06/2026)

- Formations terminées de septembre à décembre 2025 : avant le 30/09/2026 inclus.
- Formations 2026 : dans les 6 mois qui suivent la fin du trimestre (T1 → 30/09/2026, T2 → 31/12/2026, T3 → 31/03/2027, T4 → 30/06/2027).
- À partir de 2027 : dans les 3 mois qui suivent la fin du trimestre.
- Point de départ : date de fin de formation (ADF) ou date de début de validité (JDR).
