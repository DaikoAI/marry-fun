---
name: Game Over Share OGP
overview: Game Over時の結果（チャット回数・獲得ポイント）を動的OGPに反映し、X共有導線を追加する。結果ページとOG画像APIを新設し、PC/モバイル双方で破綻しない共有フローを実装する。
todos:
  - id: define-share-spec
    content: 共有URL・クエリ仕様（chats/pointsの範囲・丸め・デフォルト値）を確定する
    status: pending
  - id: add-result-page
    content: /[locale]/result ページを追加し generateMetadata で動的 OGP を設定する
    status: pending
  - id: add-og-api
    content: /api/og Route Handler を追加し next/og の ImageResponse で画像生成する
    status: pending
  - id: add-game-over-share-button
    content: game-over-overlay に X共有ボタンとフォールバック導線を実装する
    status: pending
  - id: add-i18n-keys
    content: ja/en の chat.json に share 文言と result 文言を追加する
    status: pending
  - id: add-site-url-config
    content: 絶対URL生成用の SITE_URL 設定（環境変数優先）を追加する
    status: pending
  - id: test-manual-flow
    content: iOS Safari / Android Chrome / Desktop Chrome で共有導線とOGP表示を手動検証する
    status: pending
  - id: validate-cloudflare-build
    content: bun run build:cf で OpenNext Cloudflare ビルド互換性を確認する
    status: pending
  - id: fallback-plan
    content: next/og 非対応時の代替（静的OGPへのフォールバック）手順を文書化する
    status: pending
isProject: false
---

# Game Over 動的 OGP + X 共有機能 改訂プラン

## 目的

- Game Over時の成果をシェアしやすくし、SNS流入を増やす。
- 共有先で「誰でも同じ静的OGP」ではなく、結果値入り画像を表示する。
- 既存のゲーム進行（リトライ導線、i18n、ルーティング）を壊さない。

## スコープ

- 対象:
  - `src/components/game-over-overlay.tsx` に共有ボタン追加
  - `src/app/[locale]/result/page.tsx` 新規作成
  - `src/app/api/og/route.tsx` 新規作成
  - `src/constants/messages/ja/chat.json` / `src/constants/messages/en/chat.json` 更新
  - 必要なら `src/constants/index.ts` に `SITE_URL` 追加
- 非対象:
  - ランキング機能
  - DB永続化（スコア保存）
  - 共有チャネルの拡張（LINE/Instagram等）

## 現状整理

- Game Over オーバーレイは「もう一度遊ぶ」のみ表示。
- スコア情報は Zustand store (`messages`, `points`) に存在。
- locale layout の OGP は静的 `/ogp.png` 固定。
- resultページ・OG画像APIは未実装。

## 機能仕様（確定版）

### 1. 共有URL仕様

- 共有先: `/{locale}/result?chats={chats}&points={points}`
- `chats`: `messages` 内 `role === "user"` の件数
- `points`: store の `points`
- 値の正規化:
  - 数値化できない場合は `0`
  - `chats` は `0..999` に clamp
  - `points` は `0..9999999` に clamp

### 2. Resultページ仕様 `src/app/[locale]/result/page.tsx`

- `generateMetadata({ params, searchParams })` で OGP を動的生成
- `openGraph.images[0].url` は `https://<base>/api/og?chats=...&points=...` の絶対URL
- `twitter.card` は `summary_large_image`
- ページ本文:
  - 結果テキスト（チャット回数、獲得ポイント）
  - 「ゲームへ戻る」CTA（`/{locale}/start`）
- SEO補助:
  - クエリ付き result ページは `robots` を `noindex, nofollow` 推奨

### 3. OGP API仕様 `src/app/api/og/route.tsx`

- `GET /api/og?chats=7&points=450`
- `ImageResponse` で `1200 x 630` 画像を返す
- 表示要素:
  - タイトル（GAME OVER）
  - サブコピー
  - `チャット X 回` と `Y pt` を視認性高く表示
- クエリの不正値は正規化済み値で描画（例外を出さない）
- エラー時フォールバック:
  - 500 を返す代わりに静的 `/ogp.png` へ逃がすか、簡易画像を返す

### 4. Game Over 共有導線 `src/components/game-over-overlay.tsx`

- 「X でシェア」ボタンを追加
- 共有文言は i18n テンプレートで生成（`{chats}`, `{points}` 埋め込み）
- 共有手段の優先順位:
  1. `navigator.share` 利用可能かつモバイル主体なら Web Share API
  2. それ以外は `https://twitter.com/intent/tweet` を新規タブで開く
- 失敗時:
  - 共有処理例外は握りつぶさず `console.warn` で記録
  - UI操作不能にしない（リトライ導線は常時有効）

### 5. i18n仕様

- 追加キー（`chat.gameOver`）
  - `share`: ボタンラベル
  - `shareText`: 共有文面
- 追加キー（`chat.result` など）
  - `title`, `description`, `playAgain`
- `ja` / `en` のキー整合を必須にする

## 実装フェーズ

### Phase 1: 共通ユーティリティと定数

- クエリ正規化関数を共通化（ResultページとOG APIの両方で再利用）
- `baseUrl` 解決ルール:
  - `NEXT_PUBLIC_SITE_URL` があれば最優先
  - なければ request origin（サーバ側で取得可能な範囲）

### Phase 2: Resultページ

- `page.tsx` 追加
- `generateMetadata` 実装
- noindex 設定
- 画面表示実装（値0でも破綻しない）

### Phase 3: OGP API

- `route.tsx` 追加
- `ImageResponse` 実装
- 不正クエリ耐性（NaN/負数/巨大値）
- 最低限の可読性（色コントラスト・余白）担保

### Phase 4: Game Over Overlay

- store から `messages`, `points` を参照
- 共有URL生成 + エンコード
- Shareボタン追加
- Web Share / X intent フォールバック

### Phase 5: i18n + 仕上げ

- ja/en 文言追加
- lint/typecheck
- 共有手動検証

## 受け入れ基準

- Game Over画面に共有ボタンが表示される。
- 共有後に開くURLが `/{locale}/result?...` で、値が正しく反映される。
- Xカードで動的OGP画像（値入り）が表示される。
- `chats/points` が欠損・不正でもページ/画像生成が落ちない。
- `bun run lint` と `bun run typecheck` が通る。
- `bun run build:cf` が通る（next/og互換性確認）。

## 検証チェックリスト

- Desktop Chrome:
  - X intent で新規タブ遷移する
  - URLパラメータが正しい
- iOS Safari:
  - Web Share シートが開く
  - キャンセル後もUIが壊れない
- Android Chrome:
  - Web Share または intent フォールバックが機能する
- OGP確認:
  - `https://cards-dev.twitter.com/validator` で画像が取得できる
  - 値0 / 通常値 / 上限超え入力の3パターンで崩れない

## リスクと対策

- `next/og` が Cloudflare Workers で制約を受ける可能性
  - 対策: `build:cf` と preview/deploy で早期検証し、失敗時は静的OGPにフォールバック
- クエリ依存のOGPでキャッシュが意図せず効く可能性
  - 対策: クエリ込みURLを明示し、必要なら cache-control を調整
- 共有文面が長すぎてX投稿で切れる
  - 対策: shareText は短文テンプレートに固定

## 変更対象ファイル（予定）

| ファイル                               | 操作           |
| -------------------------------------- | -------------- |
| `src/app/[locale]/result/page.tsx`     | 新規           |
| `src/app/api/og/route.tsx`             | 新規           |
| `src/components/game-over-overlay.tsx` | 修正           |
| `src/constants/messages/ja/chat.json`  | 修正           |
| `src/constants/messages/en/chat.json`  | 修正           |
| `src/constants/index.ts`               | 必要時のみ修正 |

## 完了定義 (DoD)

- 実装、型チェック、Lint、Cloudflareビルド確認まで完了。
- iOS/Android/Desktop の共有導線を手動検証済み。
- 想定外クエリでもページとOGPが安全に動作。
- 既存の Game Over リトライ導線に回帰がない。
