import type BunSai from "../bunsai-core";
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
    if (middleware instanceof Middleware) {
      insert(middleware, bunsai);

      continue;
    }

    if (middleware instanceof MiddlewareCollection) {
      for (const mid of middleware.list) {
        insert(mid, bunsai);
      }

      continue;
    }

    console.log(middleware);
    throw new TypeError(
      "middleware must be an instance of Middleware or MiddlewareCollection"
    );
  }
}
