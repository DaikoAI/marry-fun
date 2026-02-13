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

## Documentation-First Rules

インフラ設定や OpenClaw 関連の作業では、実装や変更前に必ず既存ドキュメントを参照すること。

- インフラ設定: `openclaw/README.md` を一次参照として扱う
- Moltworker / コンテナ関連: `.moltworker/README.md` と `.moltworker/AGENTS.md` を参照する
