// A fake of the `herdr` module: one in-memory world that tests set up and inspect.

export const world = {
  props: null,
  shared: new Map(),
  calls: [],
  exec: async () => ({ code: 0, stdout: "", stderr: "" }),
  files: new Map(),
  waiting: [],
};

export const HOME = "/fake/.config/herdr-app";

export const reset = () => {
  world.props = null;
  world.shared = new Map();
  world.calls = [];
  world.exec = async () => ({ code: 0, stdout: "", stderr: "" });
  world.files = new Map();
  world.waiting = [];
};

export const props = () => world.props;

export const shared = (key) => world.shared.get(key);

export const setShared = (key, value) => {
  world.calls.push(["setShared", key, value]);
  world.shared.set(key, value);
  return null;
};

export const openOverlay = (spec) => {
  world.calls.push(["openOverlay", spec]);
  return spec.key ?? "overlay";
};

export const closeOverlay = (id) => {
  world.calls.push(["closeOverlay", id]);
  return null;
};

export const exec = (command, args) => {
  world.calls.push(["exec", command, args]);
  return world.exec(command, args);
};

export const appHome = () => HOME;

export const readTextFile = async (path) => {
  world.calls.push(["readTextFile", path]);
  const text = world.files.get(path);
  if (text instanceof Error) throw text;
  return text ?? null;
};

export const nextCommand = () => new Promise((resolve) => world.waiting.push(resolve));

/** Delivers a key command to the copy waiting in nextCommand(). */
export const sendCommand = (name) => world.waiting.shift()?.(name);
