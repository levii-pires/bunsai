import stylus from "stylus";
import type { LoaderInitiator } from "../types";
import { FSCache } from "../internals";

const responseInit = {
  headers: { "Content-Type": "text/css; charset=utf-8" },
};

export default function getStylusLoader(
  options: Omit<stylus.RenderOptions, "filename"> = {}
): LoaderInitiator {
  return async ({ dev }) => {
    const cache = new FSCache("loader", "stylus", dev);

    await cache.setup();

    return async (filePath, { request }) => {
      if (request.method != "GET") return new Response(null, { status: 405 });

      const inCache = cache.file(filePath);

      if (await inCache.exists()) return new Response(inCache, responseInit);

      const { promise, reject, resolve } = Promise.withResolvers<Response>();

      stylus(await Bun.file(filePath).text(), options)
        .set("filename", filePath)
        .set("compress", !dev)
        .render(async (err, css) => {
          if (err) {
            reject(err);
            return;
          }

          await cache.write(filePath, css);

          resolve(new Response(css, responseInit));
        });

      return promise;
    };
  };
}
