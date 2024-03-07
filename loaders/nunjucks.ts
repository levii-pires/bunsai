import type { BuildResult, RequestData, ResolvedBunSaiOptions } from "../types";
import type FilenameParser from "../internals/filename";
import { relative, resolve } from "path";
import { configure, type ConfigureOptions, type Environment } from "nunjucks";
import Loader from "../internals/loader";

// Nunjucks has already a cache system. Not implementing FSCache here.

export default class NunjucksLoader extends Loader {
  extensions = [".njk"] as const;

  /**
   * null before setup
   */
  env: Environment | null = null;
  rootPath = "";

  constructor(public options?: ConfigureOptions) {
    super();
  }

  setup(opts: ResolvedBunSaiOptions) {
    this.env = configure(opts.dir, this.options);
    this.rootPath = resolve(opts.dir);
    return super.setup(opts);
  }

  handle(filePath: string, data: RequestData) {
    if (!this.env) throw new Error("null env; run setup first");

    if (data.request.method != "GET")
      return new Response(null, { status: 405 });

    const { promise, reject, resolve } = Promise.withResolvers<Response>();

    this.env
      .getTemplate(relative(this.rootPath, filePath))
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
  }

  build(filePath: string, filenameParser: FilenameParser): BuildResult[] {
    return [
      { type: "static" },
      {
        content: Bun.file(filePath),
        type: "loader",
      },
    ];
  }
}
