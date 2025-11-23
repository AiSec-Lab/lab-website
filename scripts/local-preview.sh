#!/usr/bin/env bash
set -euo pipefail

# Build the static site and serve the dist folder locally.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="${ROOT_DIR}/dist"
PORT="${PORT:-4000}"

cd "$ROOT_DIR"
node build.js

cd "$DIST_DIR"
echo "Serving dist at http://localhost:${PORT} (Ctrl+C to stop)"
python3 -m http.server "${PORT}"
