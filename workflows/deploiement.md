# Déploiement

1. `npm test` (tests unitaires) et `npm run test:e2e` (parcours desktop et mobile) : tout doit être vert.
2. Si le format a changé : vérifier les en-têtes générés (20 colonnes ADF, 29 colonnes JDR) sur `app/public/exemple-stagiaires.xlsx`.
3. `bash scripts/deploy.sh` : build Vite puis publication de `app/dist` sur la branche `gh-pages`.
4. Vérifier https://flavienherbert.github.io/ECHEA/ (landing, application, démo, pages légales) une à deux minutes après la publication.
5. Noter la version et les changements dans `progress.md`.

Rollback : `git -C <worktree gh-pages> revert HEAD && git push` ramène la version précédente du site.
