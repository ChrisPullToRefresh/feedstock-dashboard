#!/usr/bin/env bash
#
# Delete the Neon database branch that Vercel's integration created for a git
# branch's previews.
#
# Vercel creates one per preview deployment as a required step, and deleting
# the git branch does not take it with it — specs/tech-stack.md § Branching &
# pull request workflow, Cleanup. They accumulate silently against the Free
# plan's cap, and the symptom lands on an unrelated pull request: the next new
# branch's first preview fails before the build starts with "Branch limit
# reached" and no build log.
#
# Usage: prune-neon-branch.sh <git-branch-name>
#
# Credentials come from .env.local at the repository root, or from the
# environment if already exported:
#   NEON_API_KEY      project-scoped key for this project (never org-wide)
#   NEON_PROJECT_ID   the Neon project the Vercel integration provisioned
#
# It refuses to delete the default or a protected branch. `main` is
# production — specs/tech-stack.md says never delete it — and that rule is
# enforced here rather than left to whoever is reading.

set -euo pipefail

BRANCH="${1:-}"

if [ -z "$BRANCH" ]; then
  echo "usage: $(basename "$0") <git-branch-name>" >&2
  exit 2
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
ENV_FILE="$REPO_ROOT/.env.local"

# Read one variable out of .env.local, tolerating quotes and CRLF.
readenv() {
  [ -f "$ENV_FILE" ] || return 0
  grep -m1 "^$1=" "$ENV_FILE" 2>/dev/null | cut -d= -f2- | tr -d '"'\''\r' || true
}

NEON_API_KEY="${NEON_API_KEY:-$(readenv NEON_API_KEY)}"
NEON_PROJECT_ID="${NEON_PROJECT_ID:-$(readenv NEON_PROJECT_ID)}"

if [ -z "$NEON_API_KEY" ]; then
  cat >&2 <<'MISSING'
No NEON_API_KEY.

Create a *project-scoped* key (not org-wide) at
https://console.neon.tech → org → Settings → API keys → Create new API key,
scope it to this project, and add it to .env.local as NEON_API_KEY.
MISSING
  exit 1
fi

if [ -z "$NEON_PROJECT_ID" ]; then
  echo "No NEON_PROJECT_ID in $ENV_FILE or the environment." >&2
  exit 1
fi

api() {
  curl -sS -w '\n%{http_code}' \
    -H "Authorization: Bearer $NEON_API_KEY" \
    -H "Accept: application/json" \
    "$@"
}

BASE="https://console.neon.tech/api/v2/projects/$NEON_PROJECT_ID"

response="$(api "$BASE/branches")"
status="$(printf '%s' "$response" | tail -n1)"
body="$(printf '%s' "$response" | sed '$d')"

if [ "$status" != "200" ]; then
  echo "Neon API returned HTTP $status when listing branches." >&2
  printf '%s\n' "$body" >&2
  exit 1
fi

# Find the branch belonging to this git branch. Vercel names it after the git
# branch, sometimes under a `preview/` prefix, so those are the shapes matched
# — never a loose substring, which would let one branch's name swallow
# another's (`3-producers` inside `13-producers`).
match="$(
  BRANCH="$BRANCH" BODY="$body" python3 - <<'PY'
import json, os

branch = os.environ["BRANCH"]
data = json.loads(os.environ["BODY"])

candidates = [
    b for b in data.get("branches", [])
    if b["name"] == branch
    or b["name"] == f"preview/{branch}"
    or b["name"].endswith(f"/{branch}")
]

if not candidates:
    print("NONE")
elif len(candidates) > 1:
    print("AMBIGUOUS " + " ".join(f"{b['id']}={b['name']}" for b in candidates))
else:
    b = candidates[0]
    print(f"ONE {b['id']} {b['name']} {bool(b.get('default'))} {bool(b.get('protected'))}")
PY
)"

case "$match" in
  NONE)
    echo "No Neon branch for '$BRANCH'. Nothing to prune."
    exit 0
    ;;
  AMBIGUOUS*)
    echo "More than one Neon branch matches '$BRANCH'; refusing to guess:" >&2
    echo "  ${match#AMBIGUOUS }" >&2
    exit 1
    ;;
esac

read -r _ branch_id branch_name is_default is_protected <<<"$match"

# Production. specs/tech-stack.md: never delete main.
if [ "$is_default" = "True" ] || [ "$is_protected" = "True" ]; then
  echo "Refusing to delete '$branch_name' — it is the default or a protected branch." >&2
  exit 1
fi

response="$(api -X DELETE "$BASE/branches/$branch_id")"
status="$(printf '%s' "$response" | tail -n1)"

if [ "$status" != "200" ]; then
  echo "Neon API returned HTTP $status deleting '$branch_name' ($branch_id)." >&2
  printf '%s\n' "$response" | sed '$d' >&2
  exit 1
fi

echo "Deleted Neon branch '$branch_name' ($branch_id)."
