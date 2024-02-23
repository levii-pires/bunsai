import type { LoaderInitiator } from "../types";
import { relative, resolve } from "path";
import { configure, type ConfigureOptions, type Environment } from "nunjucks";

export interface NunjucksLoader {
  /**
   * Undefined before loader initiation
   */
  readonly env: Environment | undefined;
  loaderInit: LoaderInitiator;
}

export default function getNunjucksLoader(
  options?: ConfigureOptions
): NunjucksLoader {
  let env: Environment | undefined;

  return {
    get env() {
      return env;
    },

    loaderInit: (opts) => {
      env = configure(opts.dir, options);

      const rootPath = resolve(opts.dir);

      return (filePath, data) => {
        if (data.request.method != "GET")
          return new Response(null, { status: 405 });

        const { promise, reject, resolve } = Promise.withResolvers<Response>();

        env!
          .getTemplate(relative(rootPath, filePath))
          .render(data, (err, result) => {
            if (err) {
              reject(err);
              return;
            }

            resolve(
              new Response(result, {
                headers: { "Content-Type": "text/html; charset=utf-8" },
              })
            );
          });

        return promise;
      };
    },
  };
}
