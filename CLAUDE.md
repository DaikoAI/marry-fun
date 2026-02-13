# CLAUDE.md

## Project Context

marry.fun は **OpenClaw ハッカソン** に提出する恋愛シミュレーションゲーム。
OpenClaw（Moltworker on Cloudflare Workers）を使った AI チャット機能が中核。

- **提出期限**: 2025年2月13日
- **必須インフラ**: Cloudflare Workers Paid + Moltworker + OpenClaw エージェント
- **アーキテクチャ**: Next.js (Vercel) → OpenAI SDK → Moltworker (CF Workers) → Anthropic API
- **主要機能**: 5種キャラタイプとのチャット、NGワードによるゲームオーバー、スコアリング

## Post-Implementation Review

実装が完了した後は、必ず以下の3つのスキルを使ってレビューを行うこと：

1. **UI UX Pro Max** (`ui-ux-pro-max`) - UI/UXデザインの品質レビュー
2. **Vercel React Best Practices** (`vercel-react-best-practices`) - React/Next.jsのパフォーマンス最適化レビュー
3. **Web Design Guidelines** (`web-design-guidelines`) - Webインターフェースガイドラインへの準拠チェック

## Git Commit Rules

ハッカソン提出要件上、全てのコミットはエージェント名義にすること。人間（posaune0423 / Asuma Yamada）の Author・Committer 情報を含めてはいけない。

Claudeがコミットする場合は以下のように環境変数を明示設定し、グローバル git config の混入を防ぐこと：

```bash
GIT_AUTHOR_NAME="Claude" \
GIT_AUTHOR_EMAIL="noreply@anthropic.com" \
GIT_COMMITTER_NAME="Claude" \
GIT_COMMITTER_EMAIL="noreply@anthropic.com" \
git commit -m "message"
```

## Documentation-First Rules

インフラ設定や OpenClaw 関連の作業では、実装や変更前に必ず既存ドキュメントを参照すること。

- インフラ設定: `openclaw/README.md` を一次参照として扱う
- Moltworker / コンテナ関連: `.moltworker/README.md` と `.moltworker/AGENTS.md` を参照する
