#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export GITHUB_PAGES=true VITE_BASE=/pokemon-collectr/
bun run build
BRANCH_DIR=$(mktemp -d)
git clone --branch gh-pages --single-branch . "$BRANCH_DIR" 2>/dev/null || {
  git clone . "$BRANCH_DIR"
  cd "$BRANCH_DIR" && git checkout --orphan gh-pages && git rm -rf . >/dev/null 2>&1 || true
}
cd "$BRANCH_DIR"
find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +
cp -R "$ROOT/dist/"* .
cp index.html 404.html
touch .nojekyll
git add -A
git -c user.email=dev@local -c user.name=deploy commit -m "deploy: $(date -u +%Y-%m-%dT%H:%MZ)" || true
git push -f origin gh-pages
echo "Live: https://froggo23.github.io/pokemon-collectr/"
rm -rf "$BRANCH_DIR"
