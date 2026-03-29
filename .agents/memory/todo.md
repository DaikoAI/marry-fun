# Prompt Relocation

## Plan

- [x] 現状の prompt 管理フローと参照箇所を確認する
- [x] `src` 配下へ寄せる配置方針を決める
- [x] prompt source を `src/constants/prompts/` へ移す
- [x] generated file の出力先と import を更新する
- [x] docs の参照先を新構成へ合わせる
- [x] `sync:prompts` / typecheck / test で検証する

## Review

- `src/constants/prompts/` を prompt source of truth に変更
- generated file を `src/constants/prompts/agent-prompts.generated.ts` へ移動
- `bun run typecheck` と `bun run test:run` が通過
