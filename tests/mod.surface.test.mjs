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

test("a fresh badge starts at Medium and checks mpv", async () => {
  const { mod, cx } = await start({ role: "badge", overlay: "b" });
  assert.equal(textOf(mod.render(cx)), "😎");
  assert.deepEqual(world.calls, [["exec", "mpv", ["--version"]]]);
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

test("with mpv missing the badge shows a skull, and a click after installing it mends it", async () => {
  world.exec = async () => Promise.reject(new Error("mpv: not found"));
  const { mod, cx, click } = await start({ role: "badge", overlay: "b" });
  assert.equal(textOf(mod.render(cx)), "💀");
  await click();
  assert.equal(textOf(mod.render(cx)), "💀", "still missing");
  assert.equal(world.shared.get(MODE_KEY), undefined, "a click while broken doesn't cycle");
  world.exec = async () => ({ code: 0, stdout: "mpv 0.42.0", stderr: "" });
  await click();
  assert.equal(textOf(mod.render(cx)), "😎");
});

test("a badge whose saving fails shows a skull", async () => {
  const { mod, cx, click } = await start({ role: "badge", overlay: "b" });
  world.shared = {
    get: () => undefined,
    set: () => {
      throw new Error("disk full");
    },
  };
  await click();
  assert.equal(textOf(mod.render(cx)), "💀");
});
