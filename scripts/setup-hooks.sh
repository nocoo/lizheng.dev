#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOKS_DIR="$REPO_ROOT/.git/hooks"

ln -sf "$REPO_ROOT/scripts/pre-commit.sh" "$HOOKS_DIR/pre-commit"
ln -sf "$REPO_ROOT/scripts/pre-push.sh" "$HOOKS_DIR/pre-push"

echo "✅ Git hooks installed"
