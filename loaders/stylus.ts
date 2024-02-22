import stylus from "stylus";
import type { LoaderInitiator } from "../types";

export default function getStylusLoader(
  options: Omit<stylus.RenderOptions, "filename"> = {}
): LoaderInitiator {
  return ({ dev }) =>
    async (filePath) => {
      const { promise, reject, resolve } = Promise.withResolvers<Response>();

      stylus(await Bun.file(filePath).text(), options)
        .set("filename", filePath)
        .set("compress", !dev)
        .render((err, css) => {
          if (err) {
            reject(err);
            return;
          }

          resolve(
            new Response(css, {
              headers: { "Content-Type": "text/css; charset=utf-8" },
            })
          );
        });

      return promise;
    };
}
