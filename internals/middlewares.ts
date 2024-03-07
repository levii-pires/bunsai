import type BunSai from "../bunsai-core";

export function initMiddlewares(bunsai: BunSai) {
  for (const middleware of bunsai.options.middlewares) {
    bunsai.middlewares[middleware.runsOn].add(
      middleware.name,
      // @ts-ignore
      (data) => middleware.runner(data)
    );
  }
}
