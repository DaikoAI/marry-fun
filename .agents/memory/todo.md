# Repo Review And Refactor

## Plan

- [x] `docs/` と主要コードを読んで構成・責務のズレを洗い出す
- [x] ベースラインとして `lint` / `typecheck` / `test:run` を確認する
- [x] `app/api/chat/route.ts` の副作用処理を interface helper へ寄せて責務を分割する
- [x] 開始画面の初期化フローを reducer + helper へ寄せてコンポーネント責務を軽くする
- [x] 追加した helper / reducer の単体テストを入れる
- [x] `format` / `lint` / `typecheck` / `test:run` を再実行して結果を記録する

## Review

- `src/app/api/chat/route.ts` は HTTP 分岐と副作用永続化が混ざっており、変更点の影響範囲が読みにくかった
- `src/interfaces/api/chat-persistence.ts` を追加し、ポイント保存・背景再試行・メッセージ永続化を route から切り離した
- `src/app/[locale]/start/start-page-client.tsx` の開始フローを reducer と helper に分離し、UI コンポーネント側はイベント配線に集中させた
- `src/lib/start/start-game-flow.ts` と `src/interfaces/api/chat-persistence.ts` に対する単体テストを追加し、状態遷移とフォールバック動作を固定した
- 検証結果: `bun run format` / `bun run lint` / `bun run typecheck` / `bun run test:run` すべて成功
