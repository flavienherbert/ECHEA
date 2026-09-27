<!-- Rapport de l'agent MARKET RESEARCH (ciblage), 26/09/2026 : piste employeurs étudiée puis écartée. -->
# Choix de la verticale : SaaS de suivi des habilitations (26/09/2026)

**Méthode.** L'API recherche-entreprises est bloquée en curl par le proxy, je l'ai donc interrogée via WebFetch. Le filtre `departement` compte toute entreprise ayant au moins un établissement en 14/50/61. Les tranches 11 à 31 correspondent à 10–249 salariés (effectifs 2023). Les emails sont cités mot pour mot, aucun n'a été déduit ; à revérifier à l'œil avant tout envoi.

## 1. Sécurité privée (80.10Z)
- **a)** 5 012 entreprises employeuses et 210 500 salariés fin 2023. 63 % ont 1–10 salariés, 14 % 11–19, 14 % 20–49, 7,5 % 50–299 — FACT ([AKTO](https://observatoire.akto.fr/content/uploads/sites/3/2025/04/Prevention-et-securite-privee-Panorama-statistique-Exercice-2023-Rapport.pdf)). Les 245 entreprises de plus de 100 salariés font 73 % du CA — FACT ([DPSA](https://www.dpsa-securite.fr/rapport-de-branche-prevention-et-securite-2023-les-principaux-chiffres/)). 28 entreprises de 10–249 salariés en 14/50/61 — FACT ([API](https://recherche-entreprises.api.gouv.fr/search?activite_principale=80.10Z&departement=14,50,61&tranche_effectif_salarie=11,12,21,22,31)).
- **b)** Carte professionnelle CNAPS valable 5 ans, renouvellement conditionné au MAC — FACT ([eBrigade](https://ebrigade.app/articles/renouvellement-carte-professionnelle-cnaps/)). SSIAP : recyclage tous les 3 ans ; SST : 24 mois — FACT ([CQP-SSIAP](https://www.formation-cqp-ssiap-paris.fr/recyclage-ssiap-delais/)).
- **c)** Carte expirée : l'agent ne peut plus exercer — FACT ([LegiDesk](https://legidesk.fr/article/renouvellement-carte-agent-de-securite-guide-2026/)). Employeur : 2 ans de prison et 30 000 € (L617-7). Agent : 1 an et 15 000 € (L617-8). Exemple de sanction CNAPS : 12 mois d'interdiction d'exercer — FACT ([Sécurité Solutions](https://securitesolutions.fr/travailler-sans-carte-professionnelle/)).
- **d)** Hector Solution : alertes J-60/J-30/J-12, 89 €/mois jusqu'à 20 agents, planning inclus — FACT ([hector-solution.fr](https://hector-solution.fr/securite)). eBrigade bloque l'affectation d'un agent dont la carte a expiré — FACT ([ebrigade.app](https://ebrigade.app/logiciel-securite-privee/)). Comète : 800 sociétés clientes, « alertes administratives » — FACT ([logiciel-comete.fr](https://www.logiciel-comete.fr/)).

## 2. Transport routier de marchandises (49.41A/B)
- **a)** 25 306 établissements et 424 145 salariés au 31/12/2024 (le périmètre OPTL inclut aussi 53.20Z et une partie du 80.10Z). 62 % ont 1–9 salariés, 31 % 10–49, 7 % 50+ — FACT ([OPTL 2025](https://optl.fr/wp-content/uploads/Rapport-OPTL-2025.pdf)). 212 entreprises de 10–249 salariés en 14/50/61 — FACT ([API](https://recherche-entreprises.api.gouv.fr/search?activite_principale=49.41A,49.41B&departement=14,50,61&tranche_effectif_salarie=11,12,21,22,31)).
- **b)** FCO tous les 5 ans — FACT ([Empowill](https://www.empowill.com/blog/fco-definition-obligations)). Carte conducteur valable 5 ans — FACT ([Chronoservices](https://www.chronoservices.fr/fr/carte-chronotachygraphe/conducteur/renouvellement.html)). Permis C : 5 ans avant 60 ans, 2 ans de 60 à 76 ans, 1 an au-delà, après examen médical — FACT ([service-public](https://www.service-public.gouv.fr/particuliers/vosdroits/F2843)). Certificat ADR : 5 ans — FACT ([Mauffrey](https://academy.mauffrey.com/formation/formation-recyclage-adr/)).
- **c)** Employeur : contravention de 4e classe (jusqu'à 750 €) par conducteur sans FCO — FACT ([Empowill](https://www.empowill.com/blog/fco-definition-obligations)). Rouler avec une carte échue équivaut à rouler sans carte, un délit puni jusqu'à 3 750 € et 6 mois — FACT ([TachoCheck](https://tachocheck.fr/carte-conducteur-perimee-renouvellement)).
- **d)** SOLID Expert (SDEI) suit la FCO et la visite médicale — FACT ([sdei-pro.com](https://sdei-pro.com/on-traite-vos-donnees-cartes-conducteurs-et-chronotachygraphes/solid-expert/)). Axiotrans alerte à J-30/J-15/J-3 sur la FCO et la carte conducteur — FACT ([axiotrans.fr](https://axiotrans.fr/blog/controle-technique-poids-lourd)). Ces alertes font partie d'outils (analyse chrono, TMS) que les transporteurs paient déjà — INFERENCE.

## 3. Ambulances (86.90A)
- **a)** 4 794 établissements et 67 178 salariés au 31/12/2024. 53 % ont 1–9 salariés, 45 % 10–49, environ 2 % 50+ — FACT ([OPTL 2025](https://optl.fr/wp-content/uploads/Rapport-OPTL-2025.pdf)). 5 212 transporteurs sanitaires en 2023 ; 95 % des dépenses sont payées par l'Assurance maladie — FACT ([FNAP](https://federationnationaleambulanciersprives.fr/index.php/actualites?view=article&id=1247%3Ales-chiffres-de-2023-pour-mieux-connaitre-le-transport-sanitaire&catid=84)). 90 entreprises de 10–249 salariés en 14/50/61 — FACT ([API](https://recherche-entreprises.api.gouv.fr/search?activite_principale=86.90A&departement=14,50,61&tranche_effectif_salarie=11,12,21,22,31)). 31 dans le Calvados, dont au moins 3 à Vire Normandie — FACT ([API 14](https://recherche-entreprises.api.gouv.fr/search?activite_principale=86.90A&departement=14&tranche_effectif_salarie=11,12,21,22)).
- **b)** AFGSU 2 tous les 4 ans, sinon la formation complète est à refaire. Attestation préfectorale d'aptitude à la conduite : 5 ans avant 60 ans, 2 ans de 60 à 76 ans, 1 an au-delà — FACT ([ARS Grand Est](https://www.grand-est.ars.sante.fr/media/60661/download)).
- **c)** L'entreprise doit « tenir constamment à jour la liste des membres de [son] personnel » et signaler toute modification à l'ARS. Sanctions : suspension, retrait temporaire ou définitif de l'agrément (R6312-5, R6313-7) ; le retrait définitif supprime aussi les autorisations des véhicules — FACT ([ARS Grand Est](https://www.grand-est.ars.sante.fr/media/60661/download)).
- **d)** eBrigade : alertes avant échéance et blocage d'affectation si le diplôme n'est plus valide — FACT ([ebrigade.app](https://ebrigade.app/logiciel-transport-sanitaire/)). AmbuCheck (19–29 € TTC/mois) alerte sur le matériel et les entretiens, pas sur le personnel (d'après sa page d'accueil) — FACT ([ambucheck.fr](https://ambucheck.fr/)). Reelia mentionne des « habilitations » sans alerte d'échéance ; Lomaco et SanteMobile n'en parlent pas — FACT ([reelia.fr](https://www.reelia.fr/), [lomaco.fr](https://lomaco.fr/transport-sanitaire/logiciel-regulation/), [santemobile.io](https://santemobile.io/blog/logiciel-gestion-ambulance)).

## 4. Logistique / entreposage (52.10B, 52.29)
- **a)** 52.10B : 1 673 établissements, 59 293 salariés, 43 % à 10 salariés ou plus. 52.29A/B : 4 665 établissements, 118 182 salariés, 49 % à 10 ou plus — FACT ([OPTL 2025](https://optl.fr/wp-content/uploads/Rapport-OPTL-2025.pdf)). 48 entreprises de 10–249 salariés en 14/50/61, dont beaucoup ont leur siège hors région (Geodis…) — FACT ([API](https://recherche-entreprises.api.gouv.fr/search?activite_principale=52.10B,52.29A,52.29B&departement=14,50,61&tranche_effectif_salarie=11,12,21,22,31)).
- **b)** CACES : 5 ans (10 ans pour les engins de chantier) — FACT ([INRS](https://www.inrs.fr/demarche/caces-certificat-aptitude-conduite-securite/ce-qu-il-faut-retenir.html)). SST : 24 mois — FACT ([Alertis](https://www.alertis.fr/faq/quelle-est-la-validite-de-la-formation-sst/)).
- **c)** Le CACES « n'est pas obligatoire » : l'obligation porte sur la formation et l'autorisation de conduite (R4323-55/56), aptitude médicale comprise — FACT ([INRS](https://www.inrs.fr/publications/juridique/focus-juridiques/focus-dispositions-caces.html)). L'article L4741-1 prévoit 10 000 € d'amende par salarié concerné — FACT ([code.travail.gouv.fr](https://code.travail.gouv.fr/code-du-travail/l4741-1)) ; il s'applique à ces articles — INFERENCE. Après un accident avec un CACES expiré, la faute inexcusable de l'employeur est presque toujours retenue — FACT ([Empowill](https://www.empowill.com/blog/renouvellement-caces)).
- **d)** Je n'ai trouvé aucun outil propre à la logistique. Outils multi-secteurs : CertPilot (alertes à 30/60/90 jours) — FACT ([certpilot.fr](https://www.certpilot.fr/solutions/caces)) ; Duerp App (J-90/J-30) — FACT ([duerp.app](https://duerp.app/logiciel-habilitations/)).

## 5. Joignabilité — FACT (sites ouverts le 26/09/2026, effectifs INSEE 2023)

| Vert. | Nom | Ville | Effectif | Site | Email affiché |
|---|---|---|---|---|---|
| Sécu | LPSECURITE | Flers (61) | 20–49 | lpsecurite.com | [email masqué] |
| Sécu | DEVANCES SECURITY | Le Molay-Littry (14) | 20–49 | devances.fr | [email masqué] (+ [email masqué]) |
| Sécu | COTENTIN MANCHE SÉCURITÉ PROTECTION | Cherbourg-en-Cotentin (50) | 20–49 | cmsp.fr | [email masqué] (lien mailto) |
| Sécu | VT SÉCURITÉ | Cagny (14) | 20–49 | vt-securite.fr | formulaire seulement |
| Sécu | TRIANGLE PROTECTION | Biéville-Beuville (14) | 50–99 | triangle-protection.fr | non trouvé (site non chargé) |
| TRM | FIRST TRANSPORT AFFRÈTEMENT | Saint-Georges-des-Groseillers (61) | 100–199 | first-transports.fr | [email masqué] |
| TRM | BARIAU LECLERC | Mondeville (14) | 100–199 | bariau-leclerc.fr | formulaire seulement |
| TRM | LE GOFF – BRÉHALAISE DE TRANSPORTS | Orval-sur-Sienne (50) | 100–199 | legoff-transports.com | formulaire seulement |
| TRM | TRANSPORTS F. ROSELIER | Beuvillers (14) | 50–99 | transports-roselier.fr | formulaire seulement |
| TRM | TTB TRANSPORT | Condé-sur-Sarthe (61) | 50–99 | transports-ttb.fr | non trouvé (domaine injoignable) |
| Amb. | AMBULANCES PRUNIER | Flers (61) | 20–49 | ambulancesprunier-flers.site-solocal.com | [email masqué] (lien mailto) |
| Amb. | AMBULANCES LEBLATIER | Marcey-les-Grèves (50) | 50–99 | ambulances-taxis-leblatier.fr | formulaire seulement |
| Amb. | SARL SEIZEUR | Cherbourg-en-Cotentin (50) | 50–99 | groupe-seizeur.fr | formulaire seulement |
| Amb. | AMBULANCES VAL 2 VIRE | Torigny-les-Villes (50) | 20–49 | ambulances-val2vire.fr | non trouvé (domaine repris par un casino en ligne) |
| Amb. | AMBULANCES VIROISES | Vire Normandie (14) | 20–49 | ambulances-viroises.fr | non trouvé (domaines injoignables) |
| Log. | SUPPLYWEB | Démouville (14) | 100–199 | supplyweb.fr | [email masqué] |
| Log. | SAS NOYON LOGISTIQUE | Mondeville (14) | 20–49 | noyon.eu | formulaire seulement |
| Log. | TRANSPORTS LECAMUS (52.29B) | Saint-Désir (14) | 50–99 | transports-lecamus.com | non trouvé |
| Log. | TLA EXPRESS | Lingèvres (14) | 20–49 | aucun site trouvé | non trouvé |

Emails publiés : sécurité 3/5, TRM 1/5, ambulances 1/5, logistique 1/4 — FACT (tableau).

## Recommandation : ambulances / transport sanitaire (86.90A)

1. **La bonne taille d'entreprise** : 45 % des établissements ont 10–49 salariés, la part la plus élevée des quatre (TRM 31 %, 52.29 37 %, 52.10B 30 %, sécurité 28 % en 11–49) — FACT (OPTL, AKTO).
2. **Un enjeu vital** : l'ARS exige une liste du personnel à jour et peut aller jusqu'au retrait d'agrément — FACT (ARS Grand Est).
3. **Un problème de calendrier pur** : deux titres par salarié, aux cycles différents (AFGSU tous les 4 ans ; attestation tous les 5, 2 ou 1 an selon l'âge) — FACT (ARS Grand Est). Aucune intégration technique n'est nécessaire, contrairement au chronotachygraphe — INFERENCE.
4. **Une concurrence moins installée** : en sécurité, Hector et eBrigade intègrent déjà l'alerte au planning ; en TRM, SOLID et Axiotrans aussi — FACT (liens ci-dessus). Parmi les logiciels ambulanciers consultés, seul eBrigade la propose — FACT (liens section 3).
5. **Un marché test à portée de voiture** : 90 entreprises cibles en 14/50/61 (TRM : 212 ; sécurité : 28), dont au moins 3 à Vire Normandie et d'autres à Souleuvre-en-Bocage, Condé-en-Normandie et Torigny-les-Villes — FACT (API). On peut les démarcher en personne — INFERENCE.

**Risque principal : la disposition à payer.** AmbuCheck fixe la référence de prix à 19–29 € TTC/mois — FACT (ambucheck.fr). Les entreprises à plusieurs véhicules dégagent 2 à 10 % de marge (données 2021) — FACT (FNAP). Une PME de 30 salariés n'a que 13 à 14 renouvellements par an (30/4 + 30/5) — INFERENCE. La présence web est faible (1 email sur 5 sites, un domaine repris par un casino) — FACT (tableau) — donc la vente passera par le téléphone et le terrain — INFERENCE.

**Test avant de coder** : appeler les 3 ambulanciers de Vire et leur demander comment ils suivent l'AFGSU aujourd'hui — INFERENCE.

---

