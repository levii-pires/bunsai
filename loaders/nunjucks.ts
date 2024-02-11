import { relative, resolve } from "path";
import { Loader } from "../types";
import { configure, ConfigureOptions, type Environment } from "nunjucks";

/**
 * @param path Default: `./pages`
 */
export default function getNunjucksLoader(
  path = "./pages",
  options?: ConfigureOptions
): { env: Environment; loader: Loader } {
  const env = configure(path, options),
    rootPath = resolve(path);

  return {
    env,
    loader: (filePath, data) => {
      const { promise, reject, resolve } = Promise.withResolvers<Response>();

      env
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
    },
  };
}
