import type { ResolvedBunSaiOptions, RequestData, BuildResult } from "../types";
import type FilenameParser from "../internals/filename";
import FSCache from "../internals/fsCache";
import Loader from "../internals/loader";

const responseInit = {
  headers: { "Content-Type": "text/javascript; charset=utf-8" },
};

const loader = { ".wts": "ts", ".wtsx": "tsx" } as const;

export default class WebLoader extends Loader {
  extensions = [".wts", ".wtsx"] as const;
  cache: FSCache | null = null;
  dev = false;

  async setup(opts: ResolvedBunSaiOptions) {
    this.cache = await FSCache.init("loader", "web", opts.dev);
    this.dev = opts.dev;
    return super.setup(opts);
  }

  async handle(filePath: string, data: RequestData) {
    if (!this.cache) throw new Error("null cache; run setup first");

    if (data.request.method != "GET")
      return new Response(null, { status: 405 });

    const inCache = await this.cache.loadResponse(filePath, responseInit);

    if (inCache) return inCache;

    const {
      logs,
      outputs: [out],
      success,
    } = await Bun.build({
      loader,
      entrypoints: [filePath],
      target: "browser",
    });

    logs.forEach((l) => console.log(l));

    if (success) {
      await this.cache.write(filePath, out);
      return new Response(out, responseInit);
    }

    return new Response(null, { status: 500 });
  }

  build(filePath: string, filenameParser: FilenameParser): BuildResult[] {
    return [
      {
        type: "browser",
        content: Bun.file(filePath),
        filename: filenameParser.parse("[name].ts"),
      },
    ];
  }
}
