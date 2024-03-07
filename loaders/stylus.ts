import type { BuildResult, RequestData, ResolvedBunSaiOptions } from "../types";
import type FilenameParser from "../internals/filename";
import stylus from "stylus";
import FSCache from "../internals/fsCache";
import Loader from "../internals/loader";

const responseInit = {
  headers: { "Content-Type": "text/css; charset=utf-8" },
};

export default class StylusLoader extends Loader {
  extensions = [".styl"] as const;
  cache: FSCache | null = null;
  dev = false;

  constructor(public options: Omit<stylus.RenderOptions, "filename"> = {}) {
    super();
  }

  override async setup(opts: ResolvedBunSaiOptions) {
    this.cache = await FSCache.init("loader", "stylus", opts.dev);
    this.dev = opts.dev;
  }

  async handle(filePath: string, { request }: RequestData) {
    if (!this.cache) throw new Error("null cache; run setup first");

    if (request.method != "GET") return new Response(null, { status: 405 });

    const inCache = await this.cache.loadResponse(filePath, responseInit);

    if (inCache) return inCache;

    const { promise, reject, resolve } = Promise.withResolvers<Response>();

    stylus(await Bun.file(filePath).text(), this.options)
      .set("filename", filePath)
      .set("compress", !this.dev)
      .render(async (err, css) => {
        if (err) {
          reject(err);
          return;
        }

        await this.cache!.write(filePath, css);

        resolve(new Response(css, responseInit));
      });

    return promise;
  }

  async build(
    filePath: string,
    filenameParser: FilenameParser
  ): Promise<BuildResult[]> {
    const { promise, reject, resolve } = Promise.withResolvers<string>();

    stylus(await Bun.file(filePath).text(), this.options)
      .set("filename", filePath)
      .set("compress", true)
      .render(async (err, css) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(css);
      });

    return [
      {
        content: await promise,
        type: "asset",
        filename: filenameParser.parse("[name].css"),
      },
    ];
  }
}
