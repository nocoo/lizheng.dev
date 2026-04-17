#!/usr/bin/env bash
set -euo pipefail
echo "🧪 Running tests..."
bun test
echo "🔍 Running lint..."
bunx biome check .
echo "🔐 Running gitleaks..."
if command -v gitleaks &> /dev/null; then
  gitleaks protect --staged --no-banner
else
  echo "⚠️  gitleaks not installed, skipping secret scan"
fi
echo "✅ Pre-push checks passed"
