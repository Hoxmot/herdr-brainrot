// Effects are plain data that `update` returns; the runner here is the only code that carries
// them out. Herdr's functions are passed in, so tests can hand it fakes.

/**
 * @typedef {{ type: "openOverlay", spec: import("herdr").OverlaySpec }
 *   | { type: "closeOverlay", id: string }
 *   | { type: "setShared", key: string, value: unknown }
 *   | { type: "exec", command: string, args: string[], reply: string }} Effect
 */

/** @typedef {{ type: string, [field: string]: unknown }} Message */

/**
 * @typedef {object} Deps
 * @property {(spec: import("herdr").OverlaySpec) => unknown} openOverlay
 * @property {(id: string) => unknown} closeOverlay
 * @property {(key: string, value: unknown) => unknown} setShared
 * @property {(command: string, args?: string[]) => Promise<import("herdr").ExecResult>} exec
 */

/**
 * Builds the runner. Running an effect resolves with the message to send back, or null.
 * An effect that throws comes back as `{ type: "failed" }`; `exec` replies with whether the
 * program ran and exited 0.
 * @param {Deps} deps
 * @returns {(effect: Effect) => Promise<Message | null>}
 */
export const makeRunner = ({ openOverlay, closeOverlay, setShared, exec }) => {
  /** @type {Record<string, (effect: any) => unknown>} */
  const handlers = {
    openOverlay: ({ spec }) => void openOverlay(spec),
    closeOverlay: ({ id }) => void closeOverlay(id),
    setShared: ({ key, value }) => void setShared(key, value),
    exec: ({ command, args, reply }) =>
      exec(command, args).then(
        (result) => ({ type: reply, ok: result.code === 0 }),
        () => ({ type: reply, ok: false }),
      ),
  };

  return async (effect) => {
    try {
      return /** @type {Message | null} */ ((await handlers[effect.type](effect)) ?? null);
    } catch (error) {
      return { type: "failed", effect: effect.type, error: String(error) };
    }
  };
};
