# Pipeline hebdomadaire (orchestré)

Déclencheur : tâche planifiée « Échéa — pipeline du lundi » (chaque lundi, 8 h 47, heure de Paris). Prompt exact : `../prompts/pipeline-hebdo.md`.

```
LUNDI 8 h 47
  │
  ▼
ORCHESTRATEUR ── lit progress.md, CRM, limites
  │
  ├─1─► SUIVI DES RÉPONSES : Gmail (7 j) → classement → CRM → brouillons de réponse
  ├─2─► ONBOARDING : Stripe (7 j) → nouveaux clients → brouillon de bienvenue + commande de clé
  ├─3─► RÉDACTION : relances J+4 / J+10 des emails sans réponse → brouillons
  ├─4─► PROSPECTION : 5 nouveaux OF vérifiés → CRM (« à qualifier »)
  ├─5─► (1er lundi du mois) VEILLE : portail, guides, délais → alerte si changement
  │
  ▼
QA DU RUN ── pas de doublon, pas de donnée inventée, pas d'envoi
  │
  ▼
RAPPORT ── message à Flavien : chiffres, brouillons à relire, actions à faire
```

Limites : 12 étapes, 40 appels web, 15 brouillons, 30 minutes ; une seule nouvelle tentative par étape ; arrêt immédiat sur anomalie de sécurité.

Ce que Flavien fait ensuite (10 minutes) : relire et envoyer les brouillons, lancer la commande de clé pour chaque nouveau client, caler les démos demandées.
