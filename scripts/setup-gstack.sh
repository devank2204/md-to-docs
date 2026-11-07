#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
git submodule update --init .agents/skills/gstack
export GSTACK_HOME="$ROOT/.gstack/state"
exec .agents/skills/gstack/setup --host codex "$@"
