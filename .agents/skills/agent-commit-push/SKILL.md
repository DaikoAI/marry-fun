---
name: agent-commit-push
description: Commit and push with agent-only author/committer, using logical commit grouping and verification
---

Use this skill when the user asks to run `.claude/commands/agent-commit-push.md` or requests commit+push with agent attribution.

Follow these exact steps:

## 1) Inspect and plan logical commit groups

1. Run `git status --short`.
2. Split current changes into logical groups by responsibility.
3. Follow commit style from `.cursor/rules/commit-style.mdc`.
4. Use this commit order when applicable:
   `chore -> docs -> style -> refactor -> perf -> feat -> fix -> test`.

## 2) Commit by logical group (agent author required)

For each group:

```bash
git add -A -- ${file1} ${file2} ${fileN}
GIT_AUTHOR_NAME="Cursor Agent" GIT_AUTHOR_EMAIL="cursoragent@cursor.com" GIT_COMMITTER_NAME="Cursor Agent" GIT_COMMITTER_EMAIL="cursoragent@cursor.com" git commit -m "${commit_title}" -m "${commit_body}"
```

Other agents:
- Claude: `noreply@anthropic.com`
- Devin: `devin-ai-integration[bot]@users.noreply.github.com`
- CodeRabbit: `*@coderabbit.ai`

Important:
- Cursor agent email must be `cursoragent@cursor.com` (not `noreply@cursor.com`).
- If the latest commit is already created but author is wrong, use amend with `--reset-author`.

## 3) Push

```bash
git push -u origin "$(git branch --show-current)"
```

If history was rewritten, use:

```bash
git push --force-with-lease origin "$(git branch --show-current)"
```

## 4) Verification

Run:

```bash
git log -n 5 --pretty=format:'%h %an <%ae> | %s'
git status --short
```

## Required output to user

1. Created commits (hash / title / author email)
2. Pushed destination (origin / branch)
3. Any uncommitted changes remaining
