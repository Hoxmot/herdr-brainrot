import { test } from "node:test";
import assert from "node:assert/strict";
import { callOf, textOf } from "gpui-kit";
import {
  CHECK,
  MODE_KEY,
  emojiFor,
  enabledIn,
  init,
  isBroken,
  modeFrom,
  nextMode,
  update,
  view,
} from "../mods/herdr-brainrot/badge.js";

const SETTINGS = "/home/settings.json";
const READ_SETTINGS = { type: "readFile", path: SETTINGS, reply: "settingsRead" };
const badge = (mode, problems = {}) => ({ mode, problems, overlay: "o1", settingsPath: SETTINGS });
const broken = (mode) => badge(mode, { mpv: true });

test("a saved mode is kept", () => {
  for (const mode of ["off", "small", "medium", "large"]) assert.equal(modeFrom(mode), mode);
});

test("no saved mode, or an unknown one, starts at Medium", () => {
  for (const saved of [undefined, null, "huge", 3, {}]) assert.equal(modeFrom(saved), "medium");
});

test("init starts at the saved mode, then reads settings and checks that mpv can start", () => {
  assert.deepEqual(init({ saved: "small", overlay: "o1", settingsPath: SETTINGS }), [badge("small"), [READ_SETTINGS, CHECK]]);
  assert.deepEqual(CHECK, { type: "exec", command: "mpv", args: ["--version"], reply: "checked" });
});

test("the cycle goes off, Small, Medium, Large and back to off", () => {
  assert.deepEqual(["off", "small", "medium", "large"].map(nextMode), ["small", "medium", "large", "off"]);
});

test("a click moves to the next mode and saves it", () => {
  assert.deepEqual(update(badge("medium"), { type: "clicked" }), [
    badge("large"),
    [{ type: "setShared", key: MODE_KEY, value: "large" }],
  ]);
});

test("the cycle command does what a click does", () => {
  assert.deepEqual(update(badge("large"), { type: "command", name: "cycle" }), update(badge("large"), { type: "clicked" }));
});

test("other commands and messages change nothing", () => {
  assert.deepEqual(update(badge("small"), { type: "command", name: "toggle" }), [badge("small"), []]);
  assert.deepEqual(update(badge("small"), { type: "something" }), [badge("small"), []]);
});

test("a failed mpv check breaks the badge, a passing one mends it", () => {
  assert.deepEqual(update(badge("small"), { type: "checked", ok: false }), [badge("small", { mpv: true }), []]);
  assert.deepEqual(update(broken("small"), { type: "checked", ok: true }), [badge("small", { mpv: false }), []]);
});

test("any failed effect breaks the badge", () => {
  assert.deepEqual(update(badge("small"), { type: "failed", effect: "setShared", error: "x" }), [
    badge("small", { effect: true }),
    [],
  ]);
});

test("one passing check doesn't hide another problem", () => {
  const [state] = update(badge("small", { settings: true }), { type: "checked", ok: true });
  assert.equal(isBroken(state), true);
});

test("while broken, a click or the cycle key forgets failed effects and runs every check again", () => {
  const failed = badge("small", { mpv: true, effect: true });
  const again = [badge("small", { mpv: true, effect: false }), [READ_SETTINGS, CHECK]];
  assert.deepEqual(update(failed, { type: "clicked" }), again);
  assert.deepEqual(update(failed, { type: "command", name: "cycle" }), again);
});

test("settings.json turns the mod off only with enabled: false", () => {
  assert.equal(enabledIn(JSON.stringify({ "herdr-brainrot": { enabled: false } })), false);
  assert.equal(enabledIn(JSON.stringify({ "herdr-brainrot": { enabled: true } })), true);
  assert.equal(enabledIn(JSON.stringify({ zoom: 1 })), true, "no key: on");
  assert.equal(enabledIn(null), true, "no file: on");
  assert.equal(enabledIn("{ not json"), null);
});

test("settings that turn the mod off close the badge window", () => {
  const text = JSON.stringify({ "herdr-brainrot": { enabled: false } });
  assert.deepEqual(update(badge("small"), { type: "settingsRead", text }), [
    badge("small", { settings: false }),
    [{ type: "closeOverlay", id: "o1" }],
  ]);
});

test("settings that leave the mod on change nothing else", () => {
  assert.deepEqual(update(badge("small"), { type: "settingsRead", text: "{}" }), [badge("small", { settings: false }), []]);
});

test("settings.json that isn't JSON breaks the badge", () => {
  assert.deepEqual(update(badge("small"), { type: "settingsRead", text: "{ oops" }), [badge("small", { settings: true }), []]);
});

test("each mode has its emoji", () => {
  assert.deepEqual(
    ["off", "small", "medium", "large"].map((mode) => emojiFor(badge(mode))),
    ["😭", "🙂", "😎", "🤯"],
  );
});

test("broken shows a skull whatever the mode", () => {
  for (const mode of ["off", "small", "medium", "large"]) assert.equal(emojiFor(broken(mode)), "💀");
});

test("the view is a 16px emoji, on a line tall enough not to clip it, that sends clicked", () => {
  const sent = [];
  const el = view(badge("medium"), (message) => () => sent.push(message));
  assert.equal(textOf(el), "😎");
  assert.deepEqual([callOf(el, "text_size"), callOf(el, "line_height")], [[16], ["20px"]]);
  assert.equal(callOf(el, "h"), undefined, "no fixed height to clip the glyph");
  el.handlers.on_click();
  assert.deepEqual(sent, [{ type: "clicked" }]);
});
