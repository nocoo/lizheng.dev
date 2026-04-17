#!/usr/bin/env bash
set -euo pipefail
echo "🧪 Running tests..."
bun test
echo "🔍 Running lint..."
bunx biome check .
echo "✅ Pre-commit checks passed"
