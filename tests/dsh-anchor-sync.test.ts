// The dsh version anchor lives in three places that must move together: the
// CI e2e install (#4545), the runtime cap (DSH_BUILD_CHECK.defaultMaxTested)
// and the config-docs seed default. Nothing else pins them to each other, so a
// bump that misses one silently ships a cap nobody tests or a doc that lies.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { DSH_BUILD_CHECK } from "../src/agent/client-build-note.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const WORKFLOW = path.join(ROOT, ".github/workflows/ci-e2e-dsh-native.yml");
const SEED = path.join(ROOT, "website/config-reference/env-only.yaml");

function workflowAnchor(): string {
    const src = readFileSync(WORKFLOW, "utf8");
    const m = /npm i -g @deepseek-ai\/dsh@([0-9A-Za-z.\-]+)/.exec(src);
    assert.ok(m, `${WORKFLOW} must install @deepseek-ai/dsh@<version>`);
    return m[1]!;
}

function seedAnchor(): string {
    const src = readFileSync(SEED, "utf8");
    const m = /key: BILI_DSH_MAX_TESTED_VERSION[\s\S]*?default: "([^"]+)"/.exec(src);
    assert.ok(m, `${SEED} must carry a BILI_DSH_MAX_TESTED_VERSION default`);
    return m[1]!.replace(/\s*\(CI e2e anchor\)\s*$/, "").trim();
}

test("the CI dsh anchor, the runtime cap and the docs seed default are the same version", () => {
    const workflow = workflowAnchor();
    assert.equal(workflow, DSH_BUILD_CHECK.defaultMaxTested, "ci-e2e-dsh-native.yml and defaultMaxTested must agree");
    assert.equal(seedAnchor(), workflow, "env-only.yaml default must match the CI anchor");
});
