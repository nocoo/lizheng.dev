# L1 + G1 on the Git index snapshot (not the working tree). Check-only; any failure blocks commit.
set -e
command -v git >/dev/null 2>&1 || {
	echo "pre-commit: git is required" >&2
	exit 1
}
command -v bun >/dev/null 2>&1 || {
	echo "pre-commit: bun is required" >&2
	exit 1
}
command -v gitleaks >/dev/null 2>&1 || {
	echo "pre-commit: gitleaks is required" >&2
	exit 1
}
command -v actionlint >/dev/null 2>&1 || {
	echo "pre-commit: actionlint is required" >&2
	exit 1
}
repo=$(git rev-parse --show-toplevel)
if [ -f "$repo/.fixture-fail-gate" ]; then
	fail_gate=$(tr -d '\n' <"$repo/.fixture-fail-gate")
	case "$fail_gate" in
		gitleaks | check:static | lint | typecheck | types:check | check:deps | check:docs | check:workflows | dependencies | test:coverage | build)
			echo "pre-commit: fixture rejected $fail_gate" >&2
			exit 1
			;;
	esac
fi

snapshot=
cleanup() {
	status=$?
	trap - EXIT INT TERM HUP
	if [ -n "$snapshot" ]; then
		rm -rf "$snapshot" || :
		snapshot=
	fi
	exit "$status"
}
trap cleanup EXIT
trap "exit 130" INT
trap "exit 143" TERM
trap "exit 129" HUP

gitleaks protect --staged --no-banner --redact
snapshot=$(mktemp -d "${TMPDIR:-/tmp}/lizheng-index-XXXXXX")
git checkout-index --all --prefix="$snapshot/"

if [ ! -d "$repo/node_modules" ]; then
	echo "pre-commit: node_modules is required" >&2
	exit 1
fi
if [ ! -f "$snapshot/package.json" ] || [ ! -f "$snapshot/bun.lock" ]; then
	echo "pre-commit: staged package.json and bun.lock are required" >&2
	exit 1
fi
if ! cmp -s "$snapshot/package.json" "$repo/package.json" || ! cmp -s "$snapshot/bun.lock" "$repo/bun.lock"; then
	echo "pre-commit: staged package.json/bun.lock must match the installed worktree copies" >&2
	exit 1
fi

if [ -L "$snapshot/node_modules" ] || [ -f "$snapshot/node_modules" ]; then
	rm -f "$snapshot/node_modules"
fi
if [ -d "$snapshot/node_modules" ] && [ ! -e "$snapshot/node_modules/.bin" ]; then
	rm -rf "$snapshot/node_modules"
fi
if [ ! -d "$snapshot/node_modules" ]; then
	mkdir "$snapshot/node_modules"
	for entry in "$repo/node_modules"/*; do
		[ -e "$entry" ] || continue
		ln -s "$entry" "$snapshot/node_modules/${entry##*/}"
	done
fi
if [ ! -e "$snapshot/node_modules/.bin" ]; then
	ln -s "$repo/node_modules/.bin" "$snapshot/node_modules/.bin"
fi
mkdir -p "$snapshot/node_modules/.vite" "$snapshot/node_modules/.vitest" "$snapshot/.cache"
unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE GIT_PREFIX
unset GIT_OBJECT_DIRECTORY GIT_ALTERNATE_OBJECT_DIRECTORIES
if [ -f "$repo/.fixture-fail-gate" ]; then
	cp "$repo/.fixture-fail-gate" "$snapshot/.fixture-fail-gate"
fi
export XDG_CACHE_HOME="$snapshot/.cache"
export XDG_STATE_HOME="$snapshot/.cache"
PATH="$snapshot/node_modules/.bin:$PATH"
cd "$snapshot"

if ! grep -Fq -- '--coverage' package.json; then
	echo "pre-commit: test:coverage must run vitest with --coverage" >&2
	exit 1
fi

bun "$snapshot/scripts/verify-dependencies.ts" "$repo/node_modules"
bun scripts/gates.ts static
bun run test:coverage
if [ ! -d coverage ]; then
	echo "pre-commit: coverage output directory missing" >&2
	exit 1
fi
bun run build
