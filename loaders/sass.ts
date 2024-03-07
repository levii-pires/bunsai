import type { BuildResult, RequestData, ResolvedBunSaiOptions } from "../types";
import type FilenameParser from "../internals/filename";
import FSCache from "../internals/fsCache";
import { compile, Options } from "sass";
import Loader from "../internals/loader";

const responseInit = {
  headers: { "Content-Type": "text/css; charset=utf-8" },
};

export default class SassLoader extends Loader {
  extensions = [".scss"] as const;
  cache: FSCache | null = null;

  constructor(public options?: Options<"sync">) {
    super();
  }

  async setup(opts: ResolvedBunSaiOptions) {
    this.cache = await FSCache.init("loader", "sass", opts.dev);
    return super.setup(opts);
  }

  async handle(filePath: string, { request }: RequestData) {
    if (!this.cache) throw new Error("null cache; run setup first");

    if (request.method != "GET") return new Response(null, { status: 405 });

    const inCache = await this.cache.loadResponse(filePath, responseInit);

    if (inCache) return inCache;

    const { css } = compile(filePath, this.options);

    await this.cache.write(filePath, css);

    return new Response(css, responseInit);
  }

  build(filePath: string, filenameParser: FilenameParser): BuildResult[] {
    const { css } = compile(filePath, this.options);

    return [
      {
        content: css,
        type: "static",
        filename: filenameParser.parse("$name.css"),
      },
    ];
  }
}
