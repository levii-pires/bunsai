import type { BuildResult, RequestData, ResolvedBunSaiOptions } from "../types";
import type FilenameParser from "../internals/filename";
import { relative, resolve } from "path";
import { configure, type ConfigureOptions, type Environment } from "nunjucks";
import Loader from "../internals/loader";

const njkFilename = ".[name]-content";

const module = `
  import { configure } from "nunjucks";
  import { relative } from "path";
  import { outputFolder, userConfig } from "bunsai/globals";
  import FilenameParser from "bunsai/internals/filename";

  const env = (global.NunjucksEnv ||= configure(outputFolder, userConfig?.nunjucks)); 

  export default {
    handler(data){
      if (data.request.method != "GET")
        return new Response(null, { status: 405 });

      const { promise, reject, resolve } = Promise.withResolvers();

      const parser = new FilenameParser(data.route.filePath);

      env
        .getTemplate(relative(outputFolder, parser.replace("${njkFilename}")))
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
  }
  `;

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
    const dataFilename = filenameParser.parse(njkFilename);

    return [
      {
        filename: dataFilename,
        content: Bun.file(filePath),
        type: "asset",
      },
      {
        filename: filenameParser.parse("[name].mjs"),
        content: module,
        type: "server",
      },
    ];
  }
}
