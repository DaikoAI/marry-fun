# Agent Commit Push Command

Commit and push with **agent-only author/committer** (no human co-author). Each coding agent uses its own identity; do not use git config user.name/email.

## Steps

Do exactly this, non-interactively, from repo root.

### 1. Inspect and plan logical commit groups

1. Run `git status --short`.
2. Split current changes into logical groups by responsibility.
3. Follow commit style from `.cursor/rules/commit-style.mdc`.
4. Use this commit order when applicable: chore → docs → style → refactor → perf → feat → fix → test.

### 2. Commit by logical group (author + committer = your agent identity only)

For each group:

```bash
git add -A -- ${file1} ${file2} ${fileN}
git commit -m "${commit_title}" -m "${commit_body}"
```

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
