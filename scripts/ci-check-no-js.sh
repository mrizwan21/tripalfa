#!/usr/bin/env bash
set -euo pipefail

# List tracked JS-like files and exclude common build/output/vendor paths
# Also exclude node_modules_old directories and config files
disallowed=$(git ls-files | grep -E '\.(js|jsx|mjs|cjs)$' | grep -Ev '^(dist|build|out|coverage|node_modules|node_modules_old|docs|infrastructure|wicked-config|@workspace)/|(^apps/.*/dist/)|(^apps/.*/node_modules_old/)|(^services/.*/dist/)|(^packages/.*/dist/)|(^automapper/dist/)|(^services/.*/node_modules_old/)|(^packages/.*/node_modules_old/)|eslint\.config\.|postcss\.config\.|vite\.config\.|\.eslintrc\.' || true)

if [ -n "$disallowed" ]; then
  echo "Disallowed JS files found (use TypeScript only):"
  echo "$disallowed"
  exit 1
else
  echo "No disallowed JS files found."
fi
