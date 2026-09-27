# Pages légales : ce qu'il reste à faire

Les pages publiées (`app/mentions-legales.html`, `app/cgv.html`, `app/confidentialite.html`, générées par `scripts/legal-pages.mjs`) sont des **modèles à faire relire par un professionnel du droit**. Marqueurs à compléter :

1. Statut de l'éditeur (entrepreneur individuel / micro-entreprise), SIRET, adresse professionnelle, téléphone.
2. Mention TVA : « TVA non applicable, art. 293 B du CGI » en franchise en base, sinon n° de TVA intracommunautaire (et Stripe Tax ou taux de TVA à configurer).
3. Entité Stripe indiquée dans le contrat du compte (Stripe Payments Europe, Limited ou autre).

Points à faire vérifier :

1. **Statut et TVA** : activité compatible avec l'emploi salarié actuel ; régime de TVA ; facturation B2B conforme (mentions obligatoires sur les factures Stripe).
2. **Assurance RC professionnelle** : couvrant un logiciel d'aide à la déclaration.
3. **Mention « outil d'aide »** : l'organisme reste responsable de ses déclarations (déjà dans les CGV, art. 2 ; à garder visible dans l'application).
4. **Prospection B2B par email** : autorisée sans consentement préalable si le message concerne la profession du destinataire, avec identification de l'expéditeur et possibilité simple de s'opposer ([CNIL](https://www.cnil.fr/fr/la-prospection-commerciale-par-courrier-electronique)). Tenir la liste des oppositions.
5. **Conservation** : factures 10 ans (Code de commerce, art. L123-22) ; échanges commerciaux 3 ans après le dernier contact.
