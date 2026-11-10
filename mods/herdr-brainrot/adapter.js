// The only class in the mod: a generic adapter from a program of plain functions to the
// View class Herdr expects. It holds the state, runs effects and turns key commands into
// messages; everything it runs is passed in.
import { View } from "gpui-kit";

/** @typedef {import("./effects.js").Effect} Effect */
/** @typedef {import("./effects.js").Message} Message */
/** @typedef {(event: unknown, cx: import("gpui-kit").Context) => void} Handler */

/**
 * @template S
 * @typedef {object} Program
 * @property {() => [S, Effect[]]} init
 * @property {(state: S, message: Message) => [S, Effect[]]} update
 * @property {(state: S, send: (message: Message) => Handler) => import("gpui-kit").Element} view
 * @property {(state: S) => Effect[]} [close] Effects to run when the copy goes away.
 */

/**
 * @param {object} options
 * @param {() => Program<any>} options.select Picks the program when a copy starts.
 * @param {(effect: Effect) => Promise<Message | null>} options.run Carries out one effect.
 * @param {() => Promise<string>} options.nextCommand Waits for the next key command.
 */
export const defineMod = ({ select, run, nextCommand }) =>
  class extends View {
    /** @param {unknown} _props @param {import("gpui-kit").AsyncContext} cx */
    init(_props, cx) {
      const program = select();
      const [state, effects] = program.init();
      this.program = program;
      this.state = state;

      /** @type {(effects: Effect[], cx: import("gpui-kit").Context) => void} */
      this.perform = (effects, cx) => {
        if (effects.length === 0) return;
        cx.spawn(async (cx) => {
          for (const effect of effects) {
            const reply = await run(effect);
            if (reply) this.dispatch(reply, cx);
          }
        });
      };

      /** @type {(message: Message, cx: import("gpui-kit").Context) => void} */
      this.dispatch = (message, cx) => {
        const [next, effects] = this.program.update(this.state, message);
        this.state = next;
        this.perform(effects, cx);
        cx.notify();
      };

      this.perform(effects, cx);
      cx.spawn(async (cx) => {
        for (;;) this.dispatch({ type: "command", name: await nextCommand() }, cx);
      });
    }

    render() {
      return this.program.view(this.state, (message) => (_event, cx) => this.dispatch(message, cx));
    }

    async close() {
      for (const effect of this.program.close?.(this.state) ?? []) await run(effect);
    }
  };
