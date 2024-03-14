import type BunSai from "../core";
import type { AllMiddlewares } from "../types";
import Middleware, { MiddlewareCollection } from "./middleware";

function insert(middleware: AllMiddlewares, bunsai: BunSai) {
  bunsai.middlewares[middleware.runsOn].add(
    middleware.name,
    // @ts-ignore
    (data) => middleware.runner(data)
  );
}

export function initMiddlewares(bunsai: BunSai) {
  for (const middleware of bunsai.options.middlewares) {
    if ("list" in middleware) {
      for (const mid of (<MiddlewareCollection>middleware).list) {
        insert(mid, bunsai);
      }

      continue;
    }

    if (
      "runner" in middleware &&
      "runsOn" in middleware &&
      "name" in middleware
    ) {
      insert(middleware, bunsai);

      continue;
    }

    throw new TypeError(
      "middleware must be an instance of Middleware or MiddlewareCollection"
    );
  }
}
