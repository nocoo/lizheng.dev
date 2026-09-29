#!/usr/bin/env bash
set -euo pipefail

archive=${1:-release-artifact.tgz}
test -f "$archive"
# Consume the entire listing: grep -q closes tar's pipe and fails with pipefail.
tar -tzf "$archive" | grep '^\.release-worker/' > /dev/null
tar -xzf "$archive"
test -f .release-worker/index.js
for surface in resume landing; do
  for locale in en zh; do
    test -f "dist/_sites/$surface/$locale/index.html"
  done
done
