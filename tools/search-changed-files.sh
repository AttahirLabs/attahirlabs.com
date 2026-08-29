#!/usr/bin/env bash
set -euo pipefail

fail() {
  echo "search changed-file discovery failed: $*" >&2
  exit 1
}

if [[ $# -ne 2 ]]; then
  fail "expected before SHA and after SHA"
fi

before_sha="$1"
after_sha="$2"
zero_sha="0000000000000000000000000000000000000000"

if [[ ! "$before_sha" =~ ^[0-9a-f]{40}$ ]] || [[ ! "$after_sha" =~ ^[0-9a-f]{40}$ ]]; then
  fail "push SHAs must be lowercase 40-character hexadecimal values"
fi

if ! git cat-file -e "${after_sha}^{commit}"; then
  fail "after SHA is not an available commit"
fi

if [[ "$before_sha" == "$zero_sha" ]]; then
  # A branch-creation push has no prior tree. Treat every file in the exact
  # pushed tree as changed so an indexable path cannot be silently skipped.
  if ! changed_files=$(git ls-tree -r --name-only "$after_sha"); then
    fail "unable to enumerate the initial pushed tree"
  fi
else
  if ! git cat-file -e "${before_sha}^{commit}"; then
    fail "before SHA is not an available commit"
  fi
  if ! changed_files=$(git diff --name-only "$before_sha" "$after_sha"); then
    fail "unable to diff the full push range"
  fi
fi

printf '%s\n' "$changed_files"
