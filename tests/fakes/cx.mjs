// A fake gpui context: counts redraws and runs spawned tasks straight away.

export const fakeCx = () => {
  const cx = {
    notified: 0,
    notify: () => {
      cx.notified += 1;
    },
    spawn: (body) => {
      body(cx);
    },
  };
  return cx;
};

/** Lets pending promises (effects, replies) settle. */
export const flush = () => new Promise((resolve) => setImmediate(resolve));
