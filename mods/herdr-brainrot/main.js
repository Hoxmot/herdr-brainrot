// Wires the mod's plain functions to Herdr. The only file that imports Herdr's functions.
import {
  appHome,
  closeOverlay,
  exec,
  nextCommand,
  openOverlay,
  props,
  readTextFile,
  setShared,
  shared,
} from "herdr";
import { defineMod } from "./adapter.js";
import { MODE_KEY } from "./badge.js";
import { makeRunner } from "./effects.js";
import { programFor } from "./roles.js";

export default defineMod({
  select: () => programFor({ props: props(), saved: shared(MODE_KEY), settingsPath: `${appHome()}/settings.json` }),
  run: makeRunner({ openOverlay, closeOverlay, setShared, exec, readTextFile }),
  nextCommand,
});
