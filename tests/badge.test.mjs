import { test } from "node:test";
import assert from "node:assert/strict";
import { callOf, textOf } from "gpui-kit";
import { CHECK, MODE_KEY, emojiFor, init, modeFrom, nextMode, update, view } from "../mods/herdr-brainrot/badge.js";

test("a saved mode is kept", () => {
  for (const mode of ["off", "small", "medium", "large"]) assert.equal(modeFrom(mode), mode);
});

test("no saved mode, or an unknown one, starts at Medium", () => {
  for (const saved of [undefined, null, "huge", 3, {}]) assert.equal(modeFrom(saved), "medium");
});

const ok = (mode) => ({ mode, broken: false });
const broken = (mode) => ({ mode, broken: true });

test("init starts at the saved mode and checks that mpv can start", () => {
  assert.deepEqual(init("small"), [ok("small"), [CHECK]]);
  assert.deepEqual(CHECK, { type: "exec", command: "mpv", args: ["--version"], reply: "checked" });
});

test("the cycle goes off, Small, Medium, Large and back to off", () => {
  assert.deepEqual(["off", "small", "medium", "large"].map(nextMode), ["small", "medium", "large", "off"]);
});

test("a click moves to the next mode and saves it", () => {
  assert.deepEqual(update(ok("medium"), { type: "clicked" }), [
    ok("large"),
    [{ type: "setShared", key: MODE_KEY, value: "large" }],
  ]);
});

test("the cycle command does what a click does", () => {
  assert.deepEqual(update(ok("large"), { type: "command", name: "cycle" }), update(ok("large"), { type: "clicked" }));
});

test("other commands and messages change nothing", () => {
  assert.deepEqual(update(ok("small"), { type: "command", name: "toggle" }), [ok("small"), []]);
  assert.deepEqual(update(ok("small"), { type: "something" }), [ok("small"), []]);
});

test("a failed check breaks the badge, a passing one mends it", () => {
  assert.deepEqual(update(ok("small"), { type: "checked", ok: false }), [broken("small"), []]);
  assert.deepEqual(update(broken("small"), { type: "checked", ok: true }), [ok("small"), []]);
});

test("any failed effect breaks the badge", () => {
  assert.deepEqual(update(ok("small"), { type: "failed", effect: "setShared", error: "x" }), [broken("small"), []]);
});

test("while broken, a click or the cycle key checks again instead of cycling", () => {
  assert.deepEqual(update(broken("small"), { type: "clicked" }), [broken("small"), [CHECK]]);
  assert.deepEqual(update(broken("small"), { type: "command", name: "cycle" }), [broken("small"), [CHECK]]);
});

test("each mode has its emoji", () => {
  assert.deepEqual(
    ["off", "small", "medium", "large"].map((mode) => emojiFor(ok(mode))),
    ["😭", "🙂", "😎", "🤯"],
  );
});

test("broken shows a skull whatever the mode", () => {
  for (const mode of ["off", "small", "medium", "large"]) assert.equal(emojiFor(broken(mode)), "💀");
});

test("the view is a 16px emoji, on a line tall enough not to clip it, that sends clicked", () => {
  const sent = [];
  const el = view(ok("medium"), (message) => () => sent.push(message));
  assert.equal(textOf(el), "😎");
  assert.deepEqual([callOf(el, "text_size"), callOf(el, "line_height")], [[16], ["20px"]]);
  assert.equal(callOf(el, "h"), undefined, "no fixed height to clip the glyph");
  el.handlers.on_click();
  assert.deepEqual(sent, [{ type: "clicked" }]);
});
