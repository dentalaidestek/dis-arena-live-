#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
exec bash termux-preview.sh --check "$@"
