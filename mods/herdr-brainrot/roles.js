// Every copy of the mod runs the same code; its props say which part it plays.
import { badgeProgram } from "./badge.js";
import { launcherProgram } from "./launcher.js";

/** @typedef {"preview" | "badge" | "launcher"} Role */

/**
 * - preview: no props, as in `herdr-app check`. Draws the badge and touches nothing.
 * - badge: the kept window the launcher opened.
 * - launcher: anything else, such as opening the mod from the palette.
 * @returns {Role}
 */
export const roleOf = (/** @type {any} */ props) =>
  props == null ? "preview" : props.role === "badge" ? "badge" : "launcher";

/**
 * The same program with every effect dropped.
 * @template S
 * @param {import("./adapter.js").Program<S>} program
 * @returns {import("./adapter.js").Program<S>}
 */
export const withoutEffects = (program) => ({
  ...program,
  init: () => [program.init()[0], []],
  update: (state, message) => [program.update(state, message)[0], []],
  close: () => [],
});

/**
 * @param {object} setup
 * @param {any} setup.props This copy's props().
 * @param {unknown} setup.saved The saved mode.
 * @param {string} setup.settingsPath Where settings.json is.
 * @returns {import("./adapter.js").Program<any>}
 */
export const programFor = ({ props, saved, settingsPath }) => {
  const role = roleOf(props);
  if (role === "preview") return withoutEffects(badgeProgram({ saved, overlay: null, settingsPath }));
  if (role === "badge") return badgeProgram({ saved, overlay: props.overlay, settingsPath });
  return launcherProgram(props.overlay);
};
