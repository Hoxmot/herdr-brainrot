// A fake of the parts of `gpui-kit` the mod uses. Elements record every builder call,
// so tests can read what a view would draw and fire its handlers.

const element = (kind) => {
  const record = { kind, calls: [], children: [], handlers: {} };
  const proxy = new Proxy(record, {
    get: (target, name) =>
      name in target || typeof name === "symbol"
        ? target[name]
        : (...args) => {
            target.calls.push([name, args]);
            if (name === "child") target.children.push(args[0]);
            if (name === "children") target.children.push(...args[0]);
            if (name.startsWith("on_")) target.handlers[name] = args.at(-1);
            return proxy;
          },
  });
  return proxy;
};

export const div = () => element("div");

// Herdr requires a class extending View, so the fake has to be one too.
export class View {}

/** All text inside an element, depth first. */
export const textOf = (el) =>
  typeof el === "string" ? el : (el?.children ?? []).map(textOf).join("");

/** The value of the last call to a builder method, e.g. `callOf(el, "text_size")` → [16]. */
export const callOf = (el, name) => el.calls.findLast(([called]) => called === name)?.[1];
