# WORKLOG - dsh 兼容锚点升至 0.2.2-rc.2

- Task ID: `2026-11-11_dsh-022-rc2-support`
- Home Repo: `billion-context`
- Status: InProgress
- Updated: 2026-11-11

## 1. Summary

- **What was done**: 把 dsh 锚点（CI 安装版本、`DSH_BUILD_CHECK.defaultMaxTested`、配置文档种子默认值）从 `0.2.0-rc.2` 升到 `0.2.2-rc.2`，新增三者一致性的回归测试；并 cherry-pick 在途 PR #6110 的三个补丁提交，修复 0.2.2 上 auto-review sidecar 的识别失配（#6104）。
- **Why**: `dsh-v0.2.2-rc.2` 已发 GitHub Release（npm 尚未发布），它是当前最新候选构建；0.2.2 线上 auto-review 请求形态变化会让评审流量走完整管线、把折叠账本 tombstone 成 DEAD（不可逆），#6110 的修复必须随之纳入。
- **Behavior / compatibility changes**: 有。运行时「高于已测版本」提示的 cap 上移到 0.2.2-rc.2；auto-review 流量在 0.2.2 上重新被识别为 side request。
- **Risk level**: Medium（触及 side-request 归属判定与版本锚点，不涉 kernel、wire 形态与配置 schema）。

## 2. Change Log

### Commits

| Commit | Description |
|--------|-------------|
| `f683cfb3b` | fix: recognize dsh 0.2.2's auto-review sidecar shape (#6104)（继承 #6110） |
| `0c266e64f` | test: pin the #6104 review shape in the side-lane invariants suite（继承 #6110） |
| `5241fbe8b` | test: pin both ends of the #6104 head window（继承 #6110） |
| `feat(dsh): raise the tested dsh build to 0.2.2-rc.2` | 锚点/文档/断言同步（本提交，作者 C2） |

### Key Files

- `.github/workflows/ci-e2e-dsh-native.yml` — 安装版本与版本理由注释
- `src/agent/client-build-note.ts` — 运行时 cap 默认值
- `tests/client-build-note.test.ts` — cap 断言与「更新版本」fixture 重定基
- `tests/dsh-anchor-sync.test.ts` — 新增：CI 锚点 / cap / 文档种子三者一致
- `website/config-reference/env-only.yaml` + `docs/configuration.md` / `.zh-CN.md` — 文档种子与生成物
- `docs/lifecycle.md`、`scripts/release-gate-local.mjs`、`tests/e2e/e2e-native-dsh-persona.test.ts` — 版本文案同步
- `CHANGELOG.md` — Unreleased/Changed 条目

## 3. Design & Implementation Notes

- **锚点三处同源**: CI workflow、`DSH_BUILD_CHECK.defaultMaxTested`、`env-only.yaml` 的 `default`。此前只有注释约定，本次用一条读文件断言把它们钉在一起。
- **persona auto-review 用例**: 复核 `dsh-experimental-auto-review@0.2.2-rc.2` 源码，`permissionPresets.current(agent.session) !== "auto"` 的 gate 仍在，且无 `process.env` 覆盖入口，故保持跳过，仅更新版本文案。
- **版本纪律**: `package.json` 的 `version` 未改。

## 4. Testing & Verification

### Build & Test Commands

```sh
npm run build          # BUILD_EXIT=0
npm run typecheck      # TYPECHECK_EXIT=0
node tools/gen-config-docs.mjs generate      # 幂等（重复生成 md5 不变）
node tools/gen-config-docs.mjs check-coverage # coverage ok: 203 env names + 63 top-level keys
node --import ./tests/preload-storage-baseline.mjs --import ./tests/preload-test-env.mjs --import tsx --test \
  tests/client-build-note.test.ts tests/dsh-anchor-sync.test.ts \
  tests/issue6104-dsh-review-sidecar-shape.test.ts tests/issue4438-dsh-review-lane-isolation.test.ts \
  tests/side-lane-invariants.test.ts          # 39 pass / 0 fail
E2E_DSH_BIN=/home/ecs-user/projects/billion-context/.harness-rc2/apps/cli/lib/bin.js \
  ACP_TEST_E2E_DSH_NATIVE=1 node --import tsx --test tests/e2e/e2e-native-dsh.test.ts
  # pass 2 / skip 1（Docker attach）
E2E_DSH_BIN=/home/ecs-user/projects/billion-context/.harness-rc2/apps/cli/lib/bin.js \
  ACP_TEST_E2E_DSH_NATIVE=1 node --import tsx --test tests/e2e/e2e-native-dsh-persona.test.ts
  # pass 2 / skip 1（auto-review headless 无法开启）
```

### Baseline vs after

| 项 | 基线（dc041dd1a） | 改动后 |
|----|------------------|--------|
| headless e2e | 2 pass / 1 skip | 2 pass / 1 skip（rc.2 源码构建） |
| persona e2e | 2 pass / 1 skip | 2 pass / 1 skip（rc.2 源码构建） |
| 目标单测 | — | 39 pass |

### fork CI（`daacb34f3`，npm 发布 rc.2 之后）

| 车道 | 结果 | 链接 |
|------|------|------|
| `CI`（core matrix，28 job） | 23 success / 5 skipped / 0 failure | run 43153340121 |
| `e2e-native-dsh`（安装 `0.2.2-rc.2`） | success（gate + 车道两 job） | run 43153428053 |

两个 run 由推送探测分支触发（fork token 无 `actions: write`，无法 `workflow_dispatch`）；探测分支已删除。本 WORKLOG 更新是其后的 docs-only 提交，CI 证据对应父提交 `daacb34f3`。

## 5. Notes / Lessons

- 上游 master 在开工时已从 `58a879622` 前进到 `dc041dd1a`；本分支基于最新 master，基线在改动前重跑确认。
- #6110 的 PR 分支含 4 个 upstream 合并提交，只 cherry-pick 其 3 个补丁提交，作者信息保留。
- **rc.2 的验证来源**: 初验用 `~/projects/deepseek-harness`（checkout `dsh-v0.2.2-rc.2`）源码构建的 `apps/cli/lib/bin.js`（`--version` = `0.2.2-rc.2`，构建需 `DSH_CLIENT_COMMIT_HASH=<sha>` 供无 `.git` 副本使用）；npm 发布后用侧装 npm 包复验，两次结果一致。
- **npm 发布**: `0.2.2-rc.2` 于 2026-11-12 出现在 npm（dist-tag `next`）。用 `npm i --prefix .dsh-npm @deepseek-ai/dsh@0.2.2-rc.2` 侧装后重跑两条 e2e，结果与源码构建一致（2 pass / 1 skip ×2）。
- 已知残余风险：web 车道（客户端插件 slot、preset 内嵌套压缩行、`internal/config` overlay 运行时 latch）不在 headless 覆盖内，本次仅以 `--dump-config` 做过静态组合验证。
