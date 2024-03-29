import { FSCache } from "../internals";
import type { LoaderInitiator } from "../types";
import { compile, Options } from "sass";

const responseInit = {
  headers: { "Content-Type": "text/css; charset=utf-8" },
};

export default function getSassLoader(
  options?: Options<"sync">
): LoaderInitiator {
  return async ({ dev }) => {
    const cache = new FSCache("loader", "sass", dev);

    await cache.setup();

    return async (filePath, { request }) => {
      if (request.method != "GET") return new Response(null, { status: 405 });

      const inCache = cache.file(filePath);

      if (await inCache.exists()) return new Response(inCache, responseInit);

      const result = compile(filePath, options).css;

      await cache.write(filePath, result);

      return new Response(result, responseInit);
    };
  };
}
