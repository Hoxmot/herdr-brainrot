// Surface tests: the real main.js, adapter, roles, badge and runner together. Only Herdr's
// runtime (gpui-kit, herdr) is faked.
import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { textOf } from "gpui-kit";
import { reset, sendCommand, world } from "herdr";
import Mod from "../mods/herdr-brainrot/main.js";
import { fakeCx, flush } from "./fakes/cx.mjs";

const MODE_KEY = "herdr-brainrot.mode";

const start = async (props) => {
  world.props = props;
  const mod = new Mod();
  const cx = fakeCx();
  mod.init(undefined, cx);
  await flush();
  return { mod, cx, click: async () => (mod.render(cx).handlers.on_click({}, cx), flush()) };
};

beforeEach(reset);

test("opening the mod opens the kept badge window and closes the launcher", async () => {
  await start({ overlay: "mod-herdr-brainrot" });
  assert.deepEqual(world.calls, [
    [
      "openOverlay",
      {
        mod: "herdr-brainrot",
        props: { role: "badge" },
        kind: "window",
        key: "herdr-brainrot-badge",
        keep: true,
        frame: "none",
      },
    ],
    ["closeOverlay", "mod-herdr-brainrot"],
  ]);
});

test("a fresh badge starts at Medium", async () => {
  const { mod, cx } = await start({ role: "badge", overlay: "b" });
  assert.equal(textOf(mod.render(cx)), "😎");
});

test("the badge starts at the saved mode", async () => {
  world.shared.set(MODE_KEY, "off");
  const { mod, cx } = await start({ role: "badge", overlay: "b" });
  assert.equal(textOf(mod.render(cx)), "😭");
});

test("clicking the badge cycles, saves and redraws", async () => {
  const { mod, cx, click } = await start({ role: "badge", overlay: "b" });
  await click();
  assert.equal(world.shared.get(MODE_KEY), "large");
  assert.equal(textOf(mod.render(cx)), "🤯");
  await click();
  assert.equal(world.shared.get(MODE_KEY), "off");
  assert.equal(textOf(mod.render(cx)), "😭");
});

test("the cycle key command cycles like a click", async () => {
  const { mod, cx } = await start({ role: "badge", overlay: "b" });
  sendCommand("cycle");
  await flush();
  assert.equal(world.shared.get(MODE_KEY), "large");
  assert.equal(textOf(mod.render(cx)), "🤯");
});

test("a preview with no props draws the badge and touches nothing", async () => {
  const { mod, cx, click } = await start(null);
  assert.equal(textOf(mod.render(cx)), "😎");
  await click();
  assert.equal(textOf(mod.render(cx)), "🤯");
  assert.deepEqual(world.calls, []);
});
