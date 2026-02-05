#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Installing npm dependencies (lifecycle scripts skipped)..."

# Capture verbose npm output to a log file to help diagnose lifecycle/config errors
LOGFILE="/tmp/install_deps.log"
if npm install --ignore-scripts --loglevel=verbose 2>&1 | tee "$LOGFILE"; then
  echo "npm install completed successfully."
else
  echo "npm install failed. Showing last 200 lines of $LOGFILE for diagnosis:" >&2
  tail -n 200 "$LOGFILE" >&2 || true
  echo "You can share $LOGFILE if you want me to inspect it." >&2
  exit 1
fi

echo
echo "Inspecting package.json for lifecycle scripts..."
POSTINSTALL=$(node -e "const p=require('./package.json'); console.log(p.scripts && p.scripts.postinstall ? p.scripts.postinstall : '')")
PREPARE=$(node -e "const p=require('./package.json'); console.log(p.scripts && p.scripts.prepare ? p.scripts.prepare : '')")

echo "postinstall: ${POSTINSTALL:-<none>}"
echo "prepare: ${PREPARE:-<none>}"

if [ -z "${POSTINSTALL}" ] && [ -z "${PREPARE}" ]; then
  echo "No lifecycle scripts found. Done."
  exit 0
fi

echo
echo "By default this helper will NOT run lifecycle scripts to avoid unexpected side-effects."
echo "To run detected lifecycle scripts, set RUN_POSTINSTALL=1 in your environment and re-run this script."
echo "Detected scripts will be printed below and executed if RUN_POSTINSTALL=1 is set."

if [ "${RUN_POSTINSTALL:-0}" != "1" ]; then
  echo "RUN_POSTINSTALL not set — skipping execution of lifecycle scripts."
  exit 0
fi

echo "RUN_POSTINSTALL=1 detected — executing safe lifecycle scripts..."

# Safety: only run scripts that are not obviously destructive. This is a best-effort check.
is_safe() {
  local script="$1"
  # disallow if script contains common destructive tokens
  case "$script" in
    *rm\ -*|*rm\ -rf*|*sudo*|*curl\ .*\|\ *sh*|*wget*|*\:>*)
      return 1
      ;;
    *)
      return 0
      ;;
  esac
}

run_if_safe() {
  local name="$1"; shift
  local body="$1"; shift
  if is_safe "$body"; then
    echo "Running npm run $name -> $body"
    npm run --silent "$name"
  else
    echo "Lifecycle script '$name' looks unsafe; skipping execution. Set RUN_POSTINSTALL=1 and modify package.json if you really want to run it." >&2
  fi
}

if [ -n "${POSTINSTALL}" ]; then
  run_if_safe postinstall "$POSTINSTALL"
fi
if [ -n "${PREPARE}" ]; then
  run_if_safe prepare "$PREPARE"
fi

echo "Done."
