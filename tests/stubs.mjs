// Points the Herdr-only modules at in-memory fakes, so the mod's code loads in Node.
// Run the tests with: node --import ./tests/stubs.mjs --test tests/
import { registerHooks } from "node:module";

const fakes = {
  "gpui-kit": new URL("./fakes/gpui-kit.mjs", import.meta.url).href,
  herdr: new URL("./fakes/herdr.mjs", import.meta.url).href,
};

registerHooks({
  resolve: (specifier, context, nextResolve) =>
    specifier in fakes ? { url: fakes[specifier], shortCircuit: true } : nextResolve(specifier, context),
});
