import { test } from "node:test";
import assert from "node:assert/strict";
import { makeRunner } from "../mods/herdr-brainrot/effects.js";

const recordingDeps = (overrides = {}) => {
  const calls = [];
  const deps = {
    openOverlay: (spec) => (calls.push(["openOverlay", spec]), "overlay-1"),
    closeOverlay: (id) => (calls.push(["closeOverlay", id]), null),
    setShared: (key, value) => (calls.push(["setShared", key, value]), null),
    exec: async (command, args) => (calls.push(["exec", command, args]), { code: 0, stdout: "", stderr: "" }),
    ...overrides,
  };
  return { calls, run: makeRunner(deps) };
};

test("openOverlay passes the spec to Herdr and replies with nothing", async () => {
  const { calls, run } = recordingDeps();
  const spec = { kind: "window", key: "k" };
  assert.equal(await run({ type: "openOverlay", spec }), null);
  assert.deepEqual(calls, [["openOverlay", spec]]);
});

test("closeOverlay passes the id to Herdr", async () => {
  const { calls, run } = recordingDeps();
  assert.equal(await run({ type: "closeOverlay", id: "o1" }), null);
  assert.deepEqual(calls, [["closeOverlay", "o1"]]);
});

test("setShared passes the key and value to Herdr", async () => {
  const { calls, run } = recordingDeps();
  assert.equal(await run({ type: "setShared", key: "k", value: "large" }), null);
  assert.deepEqual(calls, [["setShared", "k", "large"]]);
});

test("exec replies ok when the program exits 0", async () => {
  const { calls, run } = recordingDeps();
  const reply = await run({ type: "exec", command: "mpv", args: ["--version"], reply: "checked" });
  assert.deepEqual(reply, { type: "checked", ok: true });
  assert.deepEqual(calls, [["exec", "mpv", ["--version"]]]);
});

test("exec replies not ok when the program exits non-zero", async () => {
  const { run } = recordingDeps({ exec: async () => ({ code: 1, stdout: "", stderr: "" }) });
  assert.deepEqual(await run({ type: "exec", command: "mpv", args: [], reply: "checked" }), { type: "checked", ok: false });
});

test("exec replies not ok when the program can't start", async () => {
  const { run } = recordingDeps({ exec: async () => Promise.reject(new Error("not found")) });
  assert.deepEqual(await run({ type: "exec", command: "mpv", args: [], reply: "checked" }), { type: "checked", ok: false });
});

test("an effect that throws comes back as failed", async () => {
  const { run } = recordingDeps({
    openOverlay: () => {
      throw new Error("boom");
    },
  });
  assert.deepEqual(await run({ type: "openOverlay", spec: {} }), { type: "failed", effect: "openOverlay", error: "Error: boom" });
});

test("an unknown effect comes back as failed", async () => {
  const { run } = recordingDeps();
  const reply = await run(/** @type {any} */ ({ type: "teleport" }));
  assert.equal(reply.type, "failed");
  assert.equal(reply.effect, "teleport");
});
