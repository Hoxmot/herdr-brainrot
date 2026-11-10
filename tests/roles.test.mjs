import { test } from "node:test";
import assert from "node:assert/strict";
import { BADGE_WINDOW, launcherProgram } from "../mods/herdr-brainrot/launcher.js";
import { roleOf, withoutEffects } from "../mods/herdr-brainrot/roles.js";

test("no props is a preview", () => {
  assert.equal(roleOf(null), "preview");
  assert.equal(roleOf(undefined), "preview");
});

test("the badge role is the badge", () => {
  assert.equal(roleOf({ role: "badge", overlay: "o" }), "badge");
});

test("anything else is the launcher", () => {
  assert.equal(roleOf({ overlay: "mod-herdr-brainrot" }), "launcher");
  assert.equal(roleOf({}), "launcher");
});

test("the launcher opens the kept badge window, then closes itself", () => {
  assert.deepEqual(launcherProgram("mod-herdr-brainrot").init(), [
    null,
    [
      { type: "openOverlay", spec: BADGE_WINDOW },
      { type: "closeOverlay", id: "mod-herdr-brainrot" },
    ],
  ]);
  assert.equal(BADGE_WINDOW.keep, true);
  assert.equal(BADGE_WINDOW.kind, "window");
  assert.equal(BADGE_WINDOW.frame, "none");
  assert.equal(BADGE_WINDOW.width, undefined, "no size, so the window fits the emoji");
});

test("withoutEffects keeps the state changes and drops every effect", () => {
  const program = {
    init: () => [1, [{ type: "setShared", key: "a", value: 1 }]],
    update: (state) => [state + 1, [{ type: "setShared", key: "a", value: state + 1 }]],
    view: () => null,
    close: () => [{ type: "closeOverlay", id: "x" }],
  };
  const quiet = withoutEffects(program);
  assert.deepEqual(quiet.init(), [1, []]);
  assert.deepEqual(quiet.update(1, { type: "clicked" }), [2, []]);
  assert.deepEqual(quiet.close(2), []);
});
