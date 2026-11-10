import { test } from "node:test";
import assert from "node:assert/strict";
import { div } from "gpui-kit";
import { defineMod } from "../mods/herdr-brainrot/adapter.js";
import { fakeCx, flush } from "./fakes/cx.mjs";

// A counter program: enough to watch the adapter route state, messages and effects.
const counter = (log) => ({
  init: () => [0, [{ type: "setShared", key: "start", value: 0 }]],
  update: (state, message) => {
    log.push(message);
    return message.type === "add" ? [state + 1, [{ type: "setShared", key: "n", value: state + 1 }]] : [state, []];
  },
  view: (state, send) => div().id("counter").child(String(state)).on_click(send({ type: "add" })),
  close: (state) => [{ type: "setShared", key: "closed", value: state }],
});

const start = ({ reply = async () => null, commands = [] } = {}) => {
  const log = [];
  const ran = [];
  const pending = [...commands];
  const Mod = defineMod({
    select: () => counter(log),
    run: async (effect) => (ran.push(effect), reply(effect)),
    nextCommand: () => (pending.length ? Promise.resolve(pending.shift()) : new Promise(() => {})),
  });
  const mod = new Mod();
  const cx = fakeCx();
  mod.init(undefined, cx);
  return { mod, cx, log, ran };
};

test("init runs the program's first effects", async () => {
  const { ran } = start();
  await flush();
  assert.deepEqual(ran, [{ type: "setShared", key: "start", value: 0 }]);
});

test("render shows the program's view of the state", () => {
  const { mod, cx } = start();
  assert.deepEqual(mod.render(cx).children, ["0"]);
});

test("a click sends its message through update, runs the effects and redraws", async () => {
  const { mod, cx, ran } = start();
  mod.render(cx).handlers.on_click({}, cx);
  await flush();
  assert.deepEqual(mod.render(cx).children, ["1"]);
  assert.deepEqual(ran.at(-1), { type: "setShared", key: "n", value: 1 });
  assert.ok(cx.notified >= 1);
});

test("a reply from an effect goes back into update", async () => {
  const { log } = start({ reply: async (effect) => (effect.key === "start" ? { type: "add" } : null) });
  await flush();
  assert.deepEqual(log[0], { type: "add" });
});

test("key commands arrive as command messages", async () => {
  const { log } = start({ commands: ["cycle"] });
  await flush();
  assert.deepEqual(log[0], { type: "command", name: "cycle" });
});

test("close runs the program's closing effects", async () => {
  const { mod, ran } = start();
  await mod.close();
  assert.deepEqual(ran.at(-1), { type: "setShared", key: "closed", value: 0 });
});
