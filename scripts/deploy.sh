#!/usr/bin/env bash
# Construit le site et publie app/dist sur la branche gh-pages (GitHub Pages).
# Usage : bash scripts/deploy.sh [dossier-worktree]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WT="${1:-$ROOT/../echea-gh-pages}"
cd "$ROOT"
npm run -s build
npx vitest run --config app/vite.config.js
if [ ! -d "$WT/.git" ] && [ ! -f "$WT/.git" ]; then
  git fetch origin gh-pages:gh-pages 2>/dev/null || true
  git worktree add "$WT" gh-pages
fi
cd "$WT"
git rm -rq --ignore-unmatch . >/dev/null 2>&1 || true
cp -r "$ROOT/app/dist/." .
touch .nojekyll
git add -A
if git diff --cached --quiet; then echo "Rien à publier."; exit 0; fi
git commit -q -m "Déploiement du site Échéa ($(date +%Y-%m-%d\ %H:%M))" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -q origin gh-pages
echo "Publié : https://flavienherbert.github.io/ECHEA/"
