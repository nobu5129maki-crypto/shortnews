#!/usr/bin/env bash
# Ship the current committed work to GitHub and trigger Vercel Production
# (Vercel deploys automatically on push to main via GitHub integration).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not a git repository" >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is dirty. Commit changes before shipping." >&2
  git status --short >&2
  exit 1
fi

BRANCH="$(git branch --show-current)"
if [[ -z "$BRANCH" ]]; then
  echo "Detached HEAD is not supported. Check out a branch first." >&2
  exit 1
fi

echo "==> Pushing branch: $BRANCH"
git push -u origin "$BRANCH"

if [[ "$BRANCH" == "main" ]]; then
  echo "==> Already on main; Vercel Production will deploy from this push."
else
  echo "==> Updating origin/main from $BRANCH"
  git fetch origin main
  git push origin "$BRANCH:main"
fi

if [[ -n "${VERCEL_TOKEN:-}" ]]; then
  echo "==> Deploying with Vercel CLI (token detected)"
  npx vercel --prod --yes --token "$VERCEL_TOKEN"
else
  echo "==> Vercel CLI token not set; Production deploy is handled by GitHub → Vercel on main."
fi

echo "==> Ship complete."
echo "    Branch:  https://github.com/nobu5129maki-crypto/shortnews/tree/$BRANCH"
echo "    Live:    https://shortnews-theta.vercel.app"
