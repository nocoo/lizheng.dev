#!/bin/sh
set -eu

image=${PLAYWRIGHT_IMAGE:-mcr.microsoft.com/playwright:v1.65.1-noble@sha256:1507cbfc550a63a6b7396791ca4f00df17beb56342d2447b3f106c306f525579}
case "$image" in
  *@sha256:*) ;;
  *) echo "PLAYWRIGHT_IMAGE must include a digest" >&2; exit 1 ;;
esac

docker run --rm --init --ipc=host --platform linux/amd64 \
  --mount "type=bind,source=$(pwd),target=/workspace" \
  --mount type=volume,destination=/workspace/node_modules \
  --workdir /workspace -e BUN_CONFIG_REGISTRY -e npm_config_registry \
  --entrypoint /bin/sh "$image" -eu -c '
    npm install --prefix /tmp/bun --no-save --ignore-scripts @oven/bun-linux-x64@1.4.0
    export PATH="/tmp/bun/node_modules/@oven/bun-linux-x64/bin:$PATH"
    echo "127.0.0.1 resume.lizheng-test.localhost landing.lizheng-test.localhost www.resume.lizheng-test.localhost www.landing.lizheng-test.localhost" >> /etc/hosts
    bun install --frozen-lockfile --ignore-scripts
    CI=1 bun run test:browser --project=chromium --update-snapshots
  '
