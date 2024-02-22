import type BunSai from "..";

export function initMiddlewares(bunsai: BunSai) {
  for (const middleware of bunsai.options.middlewares) {
    bunsai.middlewares[middleware.runsOn].add(
      middleware.name,
      middleware.runner
    );
  }
}
