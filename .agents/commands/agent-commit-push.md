# Agent Commit Push Command

Commit and push with **agent-only author/committer**. Pre-commit blocks non-agent authors. Each agent must set `GIT_AUTHOR_NAME` and `GIT_AUTHOR_EMAIL` before committing (see check-commit-author allowlist).

## Workflow

### 1. Inspect and plan logical commit groups

1. Run `git status --short`.
2. Split current changes into logical groups by responsibility.
3. Follow commit style from `.cursor/rules/commit-style.mdc`.
4. Use this commit order when applicable: chore → docs → style → refactor → perf → feat → fix → test.

### 2. Commit by logical group (set your agent author first)

For each group, commit with your agent identity:

```bash
git add -A -- ${file1} ${file2} ${fileN}
GIT_AUTHOR_NAME="Cursor" GIT_AUTHOR_EMAIL="noreply@cursor.com" GIT_COMMITTER_NAME="Cursor" GIT_COMMITTER_EMAIL="noreply@cursor.com" git commit -m "${commit_title}" -m "${commit_body}"
```

Other agents: Claude `noreply@anthropic.com`, Devin `devin-ai-integration[bot]@users.noreply.github.com`, CodeRabbit `*@coderabbit.ai`. Must match `scripts/check-commit-author.sh` allowlist.

### 3. Push

```bash
git push -u origin "$(git branch --show-current)"
```

### 4. Verification

```bash
git log -n 5 --pretty=format:'%h %an <%ae> | %s'
git status --short
```

## Required Output

1. Created commits (hash / title / author email)
2. Pushed destination (origin / branch)
3. Any uncommitted changes remaining
