// Wires the mod's plain functions to Herdr. The only file that imports Herdr's functions.
import { closeOverlay, exec, nextCommand, openOverlay, props, setShared, shared } from "herdr";
import { defineMod } from "./adapter.js";
import { MODE_KEY } from "./badge.js";
import { makeRunner } from "./effects.js";
import { programFor } from "./roles.js";

export default defineMod({
  select: () => programFor(props(), shared(MODE_KEY)),
  run: makeRunner({ openOverlay, closeOverlay, setShared, exec }),
  nextCommand,
});
