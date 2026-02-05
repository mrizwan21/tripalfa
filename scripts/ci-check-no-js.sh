#!/usr/bin/env bash
set -euo pipefail

# List tracked JS-like files and exclude common build/output/vendor paths
disallowed=$(git ls-files | grep -E '\.(js|jsx|mjs|cjs)$' | grep -Ev '^(dist|build|out|coverage|node_modules|docs|infrastructure|wicked-config|@workspace)/|(^apps/.*/dist/)|(^services/.*/dist/)|(^packages/.*/dist/)|(^automapper/dist/)' || true)

if [ -n "$disallowed" ]; then
  echo "Disallowed JS files found (use TypeScript only):"
  echo "$disallowed"
  exit 1
else
  echo "No disallowed JS files found."
fi