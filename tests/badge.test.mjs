import { test } from "node:test";
import assert from "node:assert/strict";
import { callOf, textOf } from "gpui-kit";
import { MODE_KEY, emojiFor, init, modeFrom, nextMode, update, view } from "../mods/herdr-brainrot/badge.js";

test("a saved mode is kept", () => {
  for (const mode of ["off", "small", "medium", "large"]) assert.equal(modeFrom(mode), mode);
});

test("no saved mode, or an unknown one, starts at Medium", () => {
  for (const saved of [undefined, null, "huge", 3, {}]) assert.equal(modeFrom(saved), "medium");
});

test("init starts at the saved mode with no effects", () => {
  assert.deepEqual(init("small"), [{ mode: "small" }, []]);
});

test("the cycle goes off, Small, Medium, Large and back to off", () => {
  assert.deepEqual(["off", "small", "medium", "large"].map(nextMode), ["small", "medium", "large", "off"]);
});

test("a click moves to the next mode and saves it", () => {
  assert.deepEqual(update({ mode: "medium" }, { type: "clicked" }), [
    { mode: "large" },
    [{ type: "setShared", key: MODE_KEY, value: "large" }],
  ]);
});

test("the cycle command does what a click does", () => {
  assert.deepEqual(update({ mode: "large" }, { type: "command", name: "cycle" }), update({ mode: "large" }, { type: "clicked" }));
});

test("other commands and messages change nothing", () => {
  assert.deepEqual(update({ mode: "small" }, { type: "command", name: "toggle" }), [{ mode: "small" }, []]);
  assert.deepEqual(update({ mode: "small" }, { type: "something" }), [{ mode: "small" }, []]);
});

test("each mode has its emoji", () => {
  assert.deepEqual(
    ["off", "small", "medium", "large"].map((mode) => emojiFor({ mode })),
    ["😭", "🙂", "😎", "🤯"],
  );
});

test("the view is a 16px emoji, on a line tall enough not to clip it, that sends clicked", () => {
  const sent = [];
  const el = view({ mode: "medium" }, (message) => () => sent.push(message));
  assert.equal(textOf(el), "😎");
  assert.deepEqual([callOf(el, "text_size"), callOf(el, "line_height")], [[16], ["20px"]]);
  assert.equal(callOf(el, "h"), undefined, "no fixed height to clip the glyph");
  el.handlers.on_click();
  assert.deepEqual(sent, [{ type: "clicked" }]);
});
