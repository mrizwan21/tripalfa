#!/usr/bin/env bash
set -euo pipefail

# 1) Create ignore files in repo root
cat > .eslintignore <<'EOF'
**/.vscode/extensions/**/typescript/lib/lib.dom.d.ts
.vscode/extensions/**/typescript/lib/lib.dom.d.ts
/Users/*/.vscode/extensions/**/typescript/lib/lib.dom.d.ts
EOF

cat > .codacy.yml <<'EOF'
exclude:
  - "**/.vscode/extensions/**/typescript/lib/lib.dom.d.ts"
  - ".vscode/extensions/**/typescript/lib/lib.dom.d.ts"
  - "/Users/*/.vscode/extensions/**/typescript/lib/lib.dom.d.ts"
EOF

echo "Created .eslintignore and .codacy.yml"

# 2) Download & install Codacy Analysis CLI (arm64 macOS)
REPO="codacy/codacy-analysis-cli"

ASSET_URL=$(curl -s "https://api.github.com/repos/${REPO}/releases/latest" \
  | grep -Eo '"browser_download_url":\s*"([^"]+)"' \
  | sed -E 's/.*"([^"]+)".*/\1/' \
  | grep -i 'darwin' \
  | grep -i 'arm64\|arm' \
  | head -n1 || true)

if [ -z "$ASSET_URL" ]; then
  echo "Could not automatically find a darwin-arm64 asset for the Codacy CLI."
  echo "Open https://github.com/${REPO}/releases and download the macOS (arm64) asset manually."
  exit 1
fi

TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT
FILENAME="$TMPDIR/$(basename "$ASSET_URL")"

echo "Downloading $ASSET_URL..."
curl -sL "$ASSET_URL" -o "$FILENAME"

# Extract or use binary directly
if file "$FILENAME" | grep -qE 'gzip|Zip archive'; then
  mkdir -p "$TMPDIR/extract"
  case "$FILENAME" in
    *.tar.gz|*.tgz) tar -xzf "$FILENAME" -C "$TMPDIR/extract" ;;
    *.zip) unzip -q "$FILENAME" -d "$TMPDIR/extract" ;;
    *) echo "Unknown archive format: $FILENAME"; exit 1 ;;
  esac
  BINPATH=$(find "$TMPDIR/extract" -type f -perm -111 -maxdepth 4 | head -n1 || true)
  if [ -z "$BINPATH" ]; then
    echo "Could not find extracted CLI binary."
    exit 1
  fi
else
  BINPATH="$FILENAME"
  chmod +x "$BINPATH"
fi

sudo mv "$BINPATH" /usr/local/bin/codacy_cli_analyze
sudo chmod +x /usr/local/bin/codacy_cli_analyze
echo "Installed /usr/local/bin/codacy_cli_analyze"

# 3) Run Codacy analysis for the two files
echo "Codacy CLI version:"
codacy_cli_analyze --version || true

echo "Running Codacy analysis for .eslintignore"
codacy_cli_analyze --rootPath "$(pwd)" --file ".eslintignore" || true

echo "Running Codacy analysis for .codacy.yml"
codacy_cli_analyze --rootPath "$(pwd)" --file ".codacy.yml" || true

echo "Done."
