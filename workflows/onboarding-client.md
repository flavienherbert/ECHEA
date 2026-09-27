# Onboarding d'un client (après paiement)

1. **Paiement reçu** (email Stripe ou rapport du lundi) : noter l'organisme, l'email et la formule (mensuel, annuel, pilote).
2. **Émettre la clé** sur le poste de Flavien :
   ```bash
   node scripts/license/license.mjs issue --org "Nom de l'organisme" --email client@exemple.fr --months 13   # annuel
   node scripts/license/license.mjs issue --org "Nom de l'organisme" --email client@exemple.fr --months 4    # mensuel ou pilote
   ```
   (Annuel : 13 mois, nouvelle clé à chaque renouvellement annuel. Mensuel et pilote : 4 mois, nouvelle clé tous les 3 mois tant que l'abonnement est actif ; la tâche planifiée hebdomadaire signale les clés à renouveler. Un abonnement résilié garde sa clé jusqu'à expiration, comme le prévoient les CGV.)
3. **Envoyer l'email de bienvenue** (modèle ci-dessous) avec la clé.
4. **CRM** : statut « client », date, formule.
5. **J+7** : proposer un appel de 15 minutes pour le premier dépôt ; après le dépôt, noter « fichier accepté » (ou le message d'erreur exact du portail, à transmettre en priorité au développement).

Modèle d'email :

> Bonjour,
>
> Merci pour votre confiance ! Voici votre clé Échéa Pro :
>
> [CLÉ]
>
> Pour l'activer : https://flavienherbert.github.io/ECHEA/app.html?tab=reglages → Licence → coller la clé → Activer.
> Avant votre premier export, renseignez une fois les codes de vos formations (onglet Formations, liens vers les fiches officielles).
>
> Je vous propose de faire le premier dépôt ensemble (15 minutes, en visio ou par téléphone). Quel créneau vous arrange cette semaine ?
>
> Flavien Herbert — Échéa
