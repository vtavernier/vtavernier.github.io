#!/bin/bash

set -euxo pipefail

if [[ ! -v BUILD_ONLY || "${BUILD_ONLY:-}" != "true" ]]; then
  npm ci
  npm run ci:check
fi

npm run build

if [[ -v GITHUB_OUTPUT ]]; then
  echo "build-dir=./dist" >> "$GITHUB_OUTPUT"
fi

echo "Generated files:"
ls -R ./dist
