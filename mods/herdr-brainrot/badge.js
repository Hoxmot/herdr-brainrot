// The badge: a 16px emoji that shows the mod's mode and cycles it on click or key.
// 💀 means the mod can't do its job; clicking it checks again.
// `"herdr-brainrot": { "enabled": false }` in settings.json closes the badge when it starts.
import { div } from "gpui-kit";

/** @typedef {import("./effects.js").Effect} Effect */
/** @typedef {import("./effects.js").Message} Message */
/** @typedef {"off" | "small" | "medium" | "large"} Mode */
/**
 * What's stopping the mod: mpv can't start, settings.json isn't valid JSON, or an effect failed.
 * @typedef {{ mpv?: boolean, settings?: boolean, effect?: boolean }} Problems
 */
/**
 * @typedef {object} BadgeState
 * @property {Mode} mode
 * @property {Problems} problems
 * @property {string | null} overlay The badge window's own overlay id, to close it with.
 * @property {string} settingsPath
 */

/** Where the mode is saved, so it survives a restart. */
export const MODE_KEY = "herdr-brainrot.mode";

/** The mod's own object in settings.json. */
export const SETTINGS_KEY = "herdr-brainrot";

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

export const isBroken = (/** @type {BadgeState} */ { problems }) => Object.values(problems).some(Boolean);

export const emojiFor = (/** @type {BadgeState} */ state) => (isBroken(state) ? BROKEN : EMOJI[state.mode]);

/**
 * Checks that `mpv`, which plays the video, can start. Replies with `{ type: "checked", ok }`.
 * @type {Effect}
 */
export const CHECK = { type: "exec", command: "mpv", args: ["--version"], reply: "checked" };

/**
 * Whether settings.json leaves the mod on: true unless it says `"enabled": false`.
 * A missing file counts as on; text that isn't JSON gives null.
 * @returns {boolean | null}
 */
export const enabledIn = (/** @type {string | null} */ text) => {
  if (text == null) return true;
  try {
    return JSON.parse(text)?.[SETTINGS_KEY]?.enabled !== false;
  } catch {
    return null;
  }
};

/** @returns {[BadgeState, Effect[]]} */
const cycle = (/** @type {BadgeState} */ state) => {
  const mode = nextMode(state.mode);
  return [{ ...state, mode }, [{ type: "setShared", key: MODE_KEY, value: mode }]];
};

const isCycle = (/** @type {Message} */ message) =>
  message.type === "clicked" || (message.type === "command" && message.name === "cycle");

/**
 * @typedef {object} BadgeSetup
 * @property {unknown} saved The mode saved in shared state, if any.
 * @property {string | null} overlay The badge window's own overlay id.
 * @property {string} settingsPath Where settings.json is.
 */

/** Everything the badge checks: settings.json, then whether mpv can start. */
const checks = (/** @type {BadgeState} */ state) => [
  /** @type {Effect} */ ({ type: "readFile", path: state.settingsPath, reply: "settingsRead" }),
  CHECK,
];

/** @returns {BadgeState} */
const withProblem = (/** @type {BadgeState} */ state, /** @type {keyof Problems} */ name, /** @type {boolean} */ on) => ({
  ...state,
  problems: { ...state.problems, [name]: on },
});

/**
 * Starts at the saved mode, then runs the checks.
 * @param {BadgeSetup} setup
 * @returns {[BadgeState, Effect[]]}
 */
export const init = ({ saved, overlay, settingsPath }) => {
  /** @type {BadgeState} */
  const state = { mode: modeFrom(saved), problems: {}, overlay, settingsPath };
  return [state, checks(state)];
};

/** @returns {[BadgeState, Effect[]]} */
const settingsRead = (/** @type {BadgeState} */ state, /** @type {string | null} */ text) => {
  const enabled = enabledIn(text);
  const next = withProblem(state, "settings", enabled === null);
  return enabled === false ? [next, [{ type: "closeOverlay", id: state.overlay }]] : [next, []];
};

/**
 * A click or the cycle key moves to the next mode. While broken, it forgets failed effects
 * and runs the checks again instead. Each check sets or clears its own problem, and
 * settings that turn the mod off close the badge window.
 * @returns {[BadgeState, Effect[]]}
 */
export const update = (/** @type {BadgeState} */ state, /** @type {Message} */ message) => {
  if (isCycle(message)) return isBroken(state) ? [withProblem(state, "effect", false), checks(state)] : cycle(state);
  if (message.type === "settingsRead") return settingsRead(state, /** @type {string | null} */ (message.text));
  if (message.type === "checked") return [withProblem(state, "mpv", !message.ok), []];
  if (message.type === "failed") return [withProblem(state, "effect", true), []];
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
 * @param {BadgeSetup} setup
 * @returns {import("./adapter.js").Program<BadgeState>}
 */
export const badgeProgram = (setup) => ({ init: () => init(setup), update, view });
