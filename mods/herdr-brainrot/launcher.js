// The launcher: the copy that opening the mod starts. It opens the badge window, which
// Herdr keeps and reopens on the next start, then closes itself.
import { div } from "gpui-kit";

/** @type {import("herdr").OverlaySpec} */
export const BADGE_WINDOW = {
  mod: "herdr-brainrot",
  props: { role: "badge" },
  kind: "window",
  key: "herdr-brainrot-badge",
  keep: true,
  frame: "none",
};

/**
 * @param {string} overlay This copy's own overlay id, to close itself with.
 * @returns {import("./adapter.js").Program<null>}
 */
export const launcherProgram = (overlay) => ({
  init: () => [
    null,
    [
      { type: "openOverlay", spec: BADGE_WINDOW },
      { type: "closeOverlay", id: overlay },
    ],
  ],
  update: (state) => [state, []],
  view: () => div(),
});
