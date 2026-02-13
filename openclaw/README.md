# OpenClaw インフラ設定

marry.fun で使用する OpenClaw (Moltworker) のセットアップ手順です。

## 前提条件

- Cloudflare アカウント（Workers Paid プラン: $5/月）
- OpenAI API キー
- `wrangler` CLI（`bunx` で使用可能）

## セットアップ手順

```bash
# 1. Moltworker をクローン & インストール
git clone https://github.com/cloudflare/moltworker.git .moltworker
cd .moltworker && bun install

# 2. シークレット設定（CLOUDFLARE_ACCOUNT_ID が必要な場合は export しておく）
bunx wrangler secret put OPENAI_API_KEY
bunx wrangler secret put MOLTBOT_GATEWAY_TOKEN   # openssl rand -hex 32 で生成
echo "true" | bunx wrangler secret put E2E_TEST_MODE  # CF Access不要にする場合

# 3. デプロイ
bun run deploy

# 4. ブラウザでデバイスペアリング
#    https://moltbot-sandbox.<subdomain>.workers.dev/?token=<GATEWAY_TOKEN>

# 5. 環境変数を .encrypted.local に追加して暗号化
bunx dotenvx encrypt -f .encrypted.local
```

## アーキテクチャ

```
marry.fun (Next.js / Vercel)
    │  OpenAI SDK (model: "openclaw:main")
    ▼
Moltworker (Cloudflare Worker)  ← APIゲートウェイ
    │  Sandbox Durable Object
    ▼
OpenClaw (コンテナ内)  ← /v1/chat/completions
    │
    ▼
OpenAI API (GPT-4o)
```

## エージェント構成

デフォルトエージェント（`main`）を使用。システムプロンプトはAPI呼び出し時に渡す。

### チャット用プロンプト (`SOUL.md`)

- ビルド時に `openclaw/SOUL.md` を `src/lib/soul-prompt.generated.ts` に同期（`bun run sync:soul`）
- 5種のキャラタイプ（tsundere, tennen, cool, amaenbou, genki）で応答
- JSON形式: `{ "message": "セリフ", "score": 1-10, "emotion": "..." }`
- 日英バイリンガル対応

### NGワード生成用プロンプト (`NGWORD_AGENT.md`)

- キャラタイプに応じた「地雷ワード」3つを生成
- JSON配列: `["word1", "word2", "word3"]`

## 環境変数

### Moltworker シークレット（Cloudflare Workers）

| 変数名                  | 説明                                            |
| ----------------------- | ----------------------------------------------- |
| `OPENAI_API_KEY`        | OpenAI API キー（LLMバックエンド）              |
| `MOLTBOT_GATEWAY_TOKEN` | Gateway Token（API認証用、自動生成）            |
| `SANDBOX_SLEEP_AFTER`   | コンテナスリープまでの時間（デフォルト: `30m`） |
| `E2E_TEST_MODE`         | `true` で CF Access 認証をスキップ              |

### marry.fun 環境変数（`.encrypted.local`）

| 変数名                  | 説明                                                  |
| ----------------------- | ----------------------------------------------------- |
| `OPENCLAW_API_BASE_URL` | Moltworker の URL (`https://<worker>.workers.dev/v1`) |
| `OPENCLAW_API_KEY`      | Gateway Token（Bearer認証）                           |

## コスト

| リソース                       | 月額       |
| ------------------------------ | ---------- |
| Workers Paid                   | $5         |
| コンテナ（30分スリープ設定時） | ~$10-11    |
| コンテナ（24/7稼働）           | ~$34.50    |
| R2ストレージ（オプション）     | ~$0.015/GB |
| OpenAI API                     | 従量課金   |

## トラブルシューティング

- **コールドスタートが遅い**: 初回起動に1-2分かかる。`SANDBOX_SLEEP_AFTER` を長めに設定
- **セッションが消える**: R2永続ストレージを設定していない場合、コンテナ再起動でデータ消失
- **JSON パースエラー**: エージェントのプロンプトでJSON出力を徹底させること
- **OpenAI API エラー**: `OPENAI_API_KEY` が正しく設定されているか確認。`bunx wrangler secret list` で確認可能
