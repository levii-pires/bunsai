import type {
  Module,
  ResolvedBunSaiOptions,
  RequestData,
  BuildResult,
} from "../types";
import type FilenameParser from "../internals/filename";
import FSCache from "../internals/fsCache";
import Loader from "../internals/loader";

function responseInit(
  headers: Record<string, string> | undefined
): ResponseInit {
  return {
    headers: { "Content-Type": "text/html; charset=utf-8", ...headers },
  };
}

export default class ModuleLoader extends Loader {
  extensions = [".ts", ".tsx"] as const;
  cache: FSCache | null = null;
  dev = false;

  override async setup(opts: ResolvedBunSaiOptions) {
    this.cache = await FSCache.init("loader", "module", opts.dev);
    this.dev = opts.dev;
  }

  async handle(filePath: string, data: RequestData) {
    if (!this.cache) throw new Error("null cache; run setup first");

    const { handler, headers, invalidate } = (await import(filePath))
      .default as Module;

    if (typeof handler != "function")
      throw new Error(
        `${filePath}: Should have an export named "handler" of type "function"`
      );

    const shouldCache = typeof invalidate == "function" && !this.dev;

    if (shouldCache) {
      if (invalidate(data)) {
        await this.cache.invalidate(filePath);
      } else {
        const inCache = await this.cache.loadResponse(
          filePath,
          responseInit(headers)
        );

        if (inCache) return inCache;
      }
    }

    const result = await handler(data);

    if (shouldCache) {
      await this.cache.write(
        filePath,
        result instanceof Response ? await result.arrayBuffer() : result
      );
    }

    if (result instanceof Response) return result;

    return new Response(result, responseInit(headers));
  }

  build(filePath: string, filenameParser: FilenameParser): BuildResult[] {
    return [
      {
        filename: filenameParser.parse("[name][ext]"),
        type: "server",
        content: Bun.file(filePath),
      },
    ];
  }
}
