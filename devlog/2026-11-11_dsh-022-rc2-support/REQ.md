# REQ - dsh 兼容锚点升至 0.2.2-rc.2

- Task ID: `2026-11-11_dsh-022-rc2-support`
- Home Repo: `billion-context`
- Created: 2026-11-11
- Status: InProgress
- Priority: P1
- Owner: agent
- References: #4545（cap 机制）、#6104（0.2.2 auto-review 失配）、#6110（修复 PR，本分支继承其提交）、#6122（0.2.2 fork 继承，明确不在本 scope）

## 1. Background & Problem Statement

- **Context**: `dsh-v0.2.2-rc.2` 已发 GitHub Release（2026-11-11T11:33Z）。本分支把 CI 锚点、运行时 cap、文档种子默认值从 `0.2.0-rc.2` 直接升到 `0.2.2-rc.2`，并用测试钉死三者一致。npm 在实施时尚未发布该版本，本地验证改用 `~/projects/deepseek-harness` 的 rc.2 源码构建。
- **Current behavior (symptom)**: 在 0.2.2-rc.2 上，auto-review 请求形态变化使 `isDshAutoReviewRequest` 两道判据同时失效，评审流量走完整管线并把折叠账本 tombstone 成 DEAD（#6104，p1）；同时运行时会弹「高于已测版本」提示，建议回滚。
- **Expected behavior**: 干净 headless profile 在 0.2.2-rc.2 上完成压缩链路；CI 锚点、运行时 cap、文档默认值三处一致；auto-review 流量回到 side passthrough。
- **Impact**: 不修则 0.2.2-rc.2 用户（含启用 auto-review 的桌面版）会遭遇不可逆的压缩底稿损坏。

## 2. Reproduction

- **Environment**: Node 22；linux-x64；`dsh 0.2.2-rc.2`（由 `~/projects/deepseek-harness` 的 `dsh-v0.2.2-rc.2` 源码构建，npm 尚未发布该版本）。
- **Minimal reproduction steps**:
  1) 在干净 `DSH_HOME` 下建 headless profile，bundles 为 `@deepseek-ai/dsh-base` + `@deepseek-ai/dsh-headless` + `billion-context`；
  2) `npm run build` 后运行 `tests/e2e/e2e-native-dsh.test.ts`。
- **Relevant configuration**: `E2E_DSH_BIN=dsh`、`ACP_TEST_E2E_DSH_NATIVE=1`。

## 3. Constraints & Non-Goals

- **Constraints**:
  - 不改 `package.json` 的 `version`（内容分支纪律）。
  - 不新增配置键、不改 wire 形态。
  - 三个锚点必须同时移动，并由测试钉死。
- **Non-Goals**:
  - 不新增 web profile 测试车道（仅在干净 web 实际出错时才做）。
  - 不纳入 #5962（dsh fork 子会话继承）与 #4639（auto-review 默认拦截）。
  - 不声明 `engines.dsh`。
  - 不安装到宿主、不向上游开 issue/PR。

## 4. Acceptance Criteria

- **Correctness**:
  - [ ] `npm run build`、`npm run typecheck` 退出码 0。
  - [ ] `client-build-note`、`dsh-anchor-sync`、`issue6104`、`issue4438`、`side-lane-invariants` 全绿。
  - [ ] `node tools/gen-config-docs.mjs generate` 后工作树无 diff；`check-coverage` 通过。
  - [ ] `e2e-native-dsh` 与 `e2e-native-dsh-persona` 在 0.2.2-rc.2 上全绿，跳过项与基线一致。
  - [ ] fork 上 `CI` 与 `e2e-native-dsh` 在分支 head 全绿。
- **Diff scope**: 只含继承的 #6110 提交与锚点/文档/断言改动；`package.json` 无改动。

## 5. References

- [ci-e2e-dsh-native.yml](../../.github/workflows/ci-e2e-dsh-native.yml) — CI 锚点
- [client-build-note.ts](../../src/agent/client-build-note.ts) — 运行时 cap
- [env-only.yaml](../../website/config-reference/env-only.yaml) — 文档种子
