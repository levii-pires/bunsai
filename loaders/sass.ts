import { FSCache } from "../internals";
import type { LoaderInitiator } from "../types";
import { compile, Options } from "sass";

export default function getSassLoader(
  options?: Options<"sync">
): LoaderInitiator {
  return () => {
    // const cache = new FSCache("loader", "sass");

    // await cache.mkdir();

    return async (filePath, { request }) => {
      // if (request.method != "GET") return new Response(null, { status: 405 });

      // const inCache = cache.file(filePath);

      // if (await inCache.exists())
      //   return new Response(inCache, {
      //     headers: { "Content-Type": "text/css; charset=utf-8" },
      //   });

      return new Response(compile(filePath, options).css, {
        headers: { "Content-Type": "text/css; charset=utf-8" },
      });
    };
  };
}
