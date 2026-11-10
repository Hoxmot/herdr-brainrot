// The badge: a 16px emoji that shows the mod's mode and cycles it on click or key.
import { div } from "gpui-kit";

/** @typedef {import("./effects.js").Effect} Effect */
/** @typedef {import("./effects.js").Message} Message */
/** @typedef {"off" | "small" | "medium" | "large"} Mode */
/** @typedef {{ mode: Mode }} BadgeState */

/** Where the mode is saved, so it survives a restart. */
export const MODE_KEY = "herdr-brainrot.mode";

/** @type {readonly Mode[]} */
const MODES = ["off", "small", "medium", "large"];
const DEFAULT_MODE = "medium";
/** @type {Record<Mode, string>} */
const EMOJI = { off: "😭", small: "🙂", medium: "😎", large: "🤯" };
const SIZE = 16;
// Emoji glyphs are taller than their text size, so a 16px line clips them (🤯 lost its top).
const LINE = "20px";

/** A saved mode, or Medium if there's none or it's not one we know. */
export const modeFrom = (/** @type {unknown} */ saved) =>
  /** @type {Mode} */ (MODES.includes(/** @type {Mode} */ (saved)) ? saved : DEFAULT_MODE);

export const nextMode = (/** @type {Mode} */ mode) => MODES[(MODES.indexOf(mode) + 1) % MODES.length];

export const emojiFor = (/** @type {BadgeState} */ { mode }) => EMOJI[mode];

/** @returns {[BadgeState, Effect[]]} */
const cycle = (/** @type {BadgeState} */ state) => {
  const mode = nextMode(state.mode);
  return [{ ...state, mode }, [{ type: "setShared", key: MODE_KEY, value: mode }]];
};

const isCycle = (/** @type {Message} */ message) =>
  message.type === "clicked" || (message.type === "command" && message.name === "cycle");

/** @returns {[BadgeState, Effect[]]} */
export const init = (/** @type {unknown} */ saved) => [{ mode: modeFrom(saved) }, []];

/** @returns {[BadgeState, Effect[]]} */
export const update = (/** @type {BadgeState} */ state, /** @type {Message} */ message) =>
  isCycle(message) ? cycle(state) : [state, []];

/**
 * @param {BadgeState} state
 * @param {(message: Message) => import("./adapter.js").Handler} send
 */
export const view = (state, send) =>
  div()
    .id("badge")
    .text_size(SIZE)
    .line_height(LINE)
    .child(emojiFor(state))
    .on_click(send({ type: "clicked" }));

/**
 * The badge as a program for the adapter.
 * @param {unknown} saved The mode saved in shared state, if any.
 * @returns {import("./adapter.js").Program<BadgeState>}
 */
export const badgeProgram = (saved) => ({ init: () => init(saved), update, view });
