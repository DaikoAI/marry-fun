# PR Follow-up Fixes

## Plan

- [x] 現在ブランチの PR、CI 状態、レビュー thread を収集する
- [x] 未解決かつ妥当な指摘をコード上で検証し、修正方針を決める
- [x] `start-page-client.tsx` の identity 切替と多重完了ハンドラを安全化する
- [x] `api/chat/route.ts` の background task defer と NG-word validator / production 設定 / AGENTS 文書を修正する
- [x] 追加・更新した挙動をテストで固定し、`format` / `lint` / `typecheck` / `test:run` を実行する
- [ ] commit / push 後に PR の CI と review 状態を再確認する

## Review

- 収集時点では PR #10 の GitHub Actions は success
- 未解決レビューのうち、`after(task())` の eager 実行、開始フローの auth identity 切替耐性、`handlePrologueComplete` の多重起動、NG-word validator の長さ不一致、production `LOG_LEVEL` は妥当
- `gpt-4.1-mini` は現行 OpenAI モデル ID として扱えるため変更不要
- `start-page-client.tsx` は auth identity 変更時に reducer を `RESET` し、pending init promise と sequence を無効化するようにした
- `handlePrologueComplete` は init promise を consume-once にして二重 attach を防いだ
- `api/chat/route.ts` は background task に thunk をそのまま渡すよう修正し、integration test で `after` に関数が渡ることを確認した
- `src/infrastructure/ai/claw-agents.ts` の NG-word schema を 30 件固定に合わせ、`.env.production` の `LOG_LEVEL` を `INFO` に下げた
- `AGENTS.md` は `PRODUCT.md` 参照へ修正し、workflow/runtime agent の catalog を追加した。参照先として `.agents/memory/lessons.md` も新規作成した
- 検証結果: `bun run format` / `bun run lint` / `bun run typecheck` / `bun run test:run` すべて成功
