# Échéa

Votre Excel de stagiaires, prêt pour le Passeport de prévention.

Échéa est une application web pour les organismes de formation santé-sécurité (SST, incendie, habilitation électrique, CACES…). Elle importe le fichier de stagiaires tel quel, contrôle chaque ligne (NIR et sa clé, nom de naissance, SIRET, dates, codes, règles conditionnelles, doublons), génère les fichiers d'import officiels du Passeport de prévention (attestations ADF, 20 colonnes, et justificatifs de réussite JDR, 29 colonnes) et calcule les recyclages à relancer auprès des entreprises clientes.

**Tout se passe dans le navigateur** : aucun fichier ni NIR n'est envoyé à un serveur, et les NIR ne sont jamais enregistrés.

- Site et application : https://flavienherbert.github.io/ECHEA/
- Démo avec un fichier fictif : https://flavienherbert.github.io/ECHEA/app.html?demo=1

## Structure

| Dossier | Contenu |
|---|---|
| `app/` | Site (landing, pages légales) et application, Vite + JavaScript sans framework |
| `app/src/core/` | Règles métier testées : NIR, SIRET, dates, codes, colonnes, déclarations, CSV, délais, recyclages, licences |
| `app/src/ui/` | Interface de l'application et des pages publiques |
| `tests/unit/` | Tests Vitest des règles métier |
| `tests/e2e/` | Parcours Playwright (desktop et mobile) |
| `scripts/` | Licences, fichier d'exemple, pages légales, déploiement, prospection |
| `docs/` | Décision, stratégie, recherche sourcée, architecture |
| `agents/`, `workflows/` | Agents IA, orchestrateur et procédures d'exploitation |
| `sales/`, `marketing/` | Supports commerciaux (les données nominatives restent hors dépôt) |
| `progress.md` | État d'avancement et reprise par un autre agent |

## Développement

```bash
npm install
npm run dev          # http://localhost:5173/
npm test             # tests unitaires
npm run build        # site statique dans app/dist
npm run test:e2e     # parcours navigateur (lance vite preview)
bash scripts/deploy.sh   # publie app/dist sur la branche gh-pages
```

Sous Windows (PowerShell), les mêmes commandes fonctionnent ; `scripts/deploy.sh` demande Git Bash.

## Licences Pro

La clé privée de signature n'est **jamais** dans le dépôt (par défaut `~/.echea/license-private.pem`).

```bash
node scripts/license/license.mjs init                                  # une seule fois
node scripts/license/license.mjs issue --org "OF Exemple" --email client@exemple.fr --months 13
```

La clé publique correspondante est dans `app/src/config.js` (`LICENSE_PUBLIC_KEY`).

## Configuration

`app/src/config.js` : email de contact, liens de paiement Stripe (mode test actuellement), limites de la version gratuite, identifiant GoatCounter (vide = aucune mesure d'audience).

## Avertissement

Échéa est un outil d'aide indépendant, sans lien avec le ministère du Travail ni la Caisse des Dépôts. L'organisme reste responsable de ses déclarations. Le format suit les guides officiels d'import en masse (février 2026) : voir `docs/research/format-import-passeport.md`.

© 2026 Flavien Herbert. Code publié pour transparence ; tous droits réservés.
