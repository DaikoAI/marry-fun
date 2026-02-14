#!/usr/bin/env bash
# Check commit author before commit.
# Detects when author is NOT in the allowed coding-agent list and warns/blocks.
# Allowed: Cursor, Claude, Devin, CodeRabbit, GitHub bots, etc.
# Usage: Run from repo root (e.g. via lefthook pre-commit).
#
# Env:
#   COMMIT_AUTHOR_CHECK=0       Skip check
#   COMMIT_AUTHOR_CHECK_MODE   warn|block (default: block)

set -euo pipefail

[[ "${COMMIT_AUTHOR_CHECK:-1}" == "0" ]] && exit 0

# Allowed coding agent emails (exact match or suffix *suffix)
# cursor: *@cursor.com | claude: *@anthropic.com | devin: *[bot]@users.noreply.github.com | coderabbit: *@coderabbit.ai
readonly AGENT_EMAILS=(
  noreply@anthropic.com
  noreply@cursor.com
  cursoragent@cursor.com
  agent@cursor.com
  "*devin-ai-integration[bot]@users.noreply.github.com"
  "*[bot]@users.noreply.github.com"
  "*cursoragent@users.noreply.github.com"
  "*@cursor.com"
  "*@anthropic.com"
  "*@coderabbit.ai"
)

MODE="${COMMIT_AUTHOR_CHECK_MODE:-block}"

AUTHOR_NAME="${GIT_AUTHOR_NAME:-$(git config user.name 2>/dev/null || true)}"
AUTHOR_EMAIL="${GIT_AUTHOR_EMAIL:-$(git config user.email 2>/dev/null || true)}"

if [[ -z "$AUTHOR_EMAIL" ]]; then
  echo "check-commit-author: ERROR: No commit author email configured"
  exit 1
fi

AUTHOR_EMAIL_LC="$(echo "$AUTHOR_EMAIL" | tr '[:upper:]' '[:lower:]')"

is_agent_author() {
  local pattern
  for pattern in "${AGENT_EMAILS[@]}"; do
    pattern="$(echo "$pattern" | tr '[:upper:]' '[:lower:]')"
    if [[ "$pattern" == *@* ]] && [[ "$pattern" == *"*"* ]]; then
      local suffix="${pattern#\*}"
      [[ "$AUTHOR_EMAIL_LC" == *"$suffix" ]] && return 0
    elif [[ "$AUTHOR_EMAIL_LC" == "$pattern" ]]; then
      return 0
    fi
  done
  return 1
}

if is_agent_author; then
  exit 0
fi

echo ""
echo "check-commit-author: Non-agent commit author detected"
echo "  Name:  $AUTHOR_NAME"
echo "  Email: $AUTHOR_EMAIL"
echo ""
echo "  Allowed: Cursor, Claude, Devin, CodeRabbit, GitHub bots, etc."
echo "  Example: GIT_AUTHOR_NAME=\"Claude\" GIT_AUTHOR_EMAIL=\"noreply@anthropic.com\" git commit ..."
echo ""

if [[ "$MODE" == "block" ]]; then
  echo "  Blocked. Set COMMIT_AUTHOR_CHECK_MODE=warn to allow."
  exit 1
else
  exit 0
fi
