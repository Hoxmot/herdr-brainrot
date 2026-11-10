// The badge: a 16px emoji that shows the mod's mode and cycles it on click or key.
// 💀 means the mod can't do its job; clicking it checks again.
import { div } from "gpui-kit";

/** @typedef {import("./effects.js").Effect} Effect */
/** @typedef {import("./effects.js").Message} Message */
/** @typedef {"off" | "small" | "medium" | "large"} Mode */
/** @typedef {{ mode: Mode, broken: boolean }} BadgeState */

/** Where the mode is saved, so it survives a restart. */
export const MODE_KEY = "herdr-brainrot.mode";

/** @type {readonly Mode[]} */
const MODES = ["off", "small", "medium", "large"];
const DEFAULT_MODE = "medium";
/** @type {Record<Mode, string>} */
const EMOJI = { off: "😭", small: "🙂", medium: "😎", large: "🤯" };
const BROKEN = "💀";
const SIZE = 16;
// Emoji glyphs are taller than their text size, so a 16px line clips them (🤯 lost its top).
const LINE = "20px";

/** A saved mode, or Medium if there's none or it's not one we know. */
export const modeFrom = (/** @type {unknown} */ saved) =>
  /** @type {Mode} */ (MODES.includes(/** @type {Mode} */ (saved)) ? saved : DEFAULT_MODE);

export const nextMode = (/** @type {Mode} */ mode) => MODES[(MODES.indexOf(mode) + 1) % MODES.length];

export const emojiFor = (/** @type {BadgeState} */ { mode, broken }) => (broken ? BROKEN : EMOJI[mode]);

/**
 * Checks that `mpv`, which plays the video, can start. Replies with `{ type: "checked", ok }`.
 * @type {Effect}
 */
export const CHECK = { type: "exec", command: "mpv", args: ["--version"], reply: "checked" };

/** @returns {[BadgeState, Effect[]]} */
const cycle = (/** @type {BadgeState} */ state) => {
  const mode = nextMode(state.mode);
  return [{ ...state, mode }, [{ type: "setShared", key: MODE_KEY, value: mode }]];
};

const isCycle = (/** @type {Message} */ message) =>
  message.type === "clicked" || (message.type === "command" && message.name === "cycle");

/** @returns {[BadgeState, Effect[]]} */
export const init = (/** @type {unknown} */ saved) => [{ mode: modeFrom(saved), broken: false }, [CHECK]];

/**
 * A click or the cycle key moves to the next mode, or checks again while broken.
 * A failed check or effect breaks the badge; a passing check mends it.
 * @returns {[BadgeState, Effect[]]}
 */
export const update = (/** @type {BadgeState} */ state, /** @type {Message} */ message) => {
  if (isCycle(message)) return state.broken ? [state, [CHECK]] : cycle(state);
  if (message.type === "checked") return [{ ...state, broken: !message.ok }, []];
  if (message.type === "failed") return [{ ...state, broken: true }, []];
  return [state, []];
};

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
