import type { BunPlugin } from "bun";
import type { FSCache } from "../internals";
import BunSai from "..";
import { AsyncCompiler, Options, initAsyncCompiler } from "sass-embedded";

export default class SassLoader implements BunSai.Loader {
  compiler: AsyncCompiler | null = null;
  cache: FSCache | null = null;

  extensions = [".scss"] as const;

  constructor(public options?: Options<"async">) {}

  async setup(bunsai: BunSai): Promise<BunPlugin[]> {
    this.compiler = await initAsyncCompiler();
    this.cache = bunsai.cache;

    return [
      {
        name: "Sass BunSai Loader",
        setup: (build) => {
          build.onLoad({ filter: /\.scss$/ }, async (args) => {
            const [inCache, error] = await this.cache!.load(args.path);

            if (inCache)
              return {
                contents: inCache.contents,
                loader: "file",
              };

            if (error) throw error;

            const { css } = await this.compiler!.compileAsync(
              args.path,
              this.options
            );

            await this.cache!.write(args.path, css);

            return {
              contents: css,
              loader: "file",
            };
          });
        },
      },
    ];
  }

  async load(filePath: string): Promise<BunSai.LoaderLoadResult> {
    if (!this.compiler || !this.cache) throw new Error("run setup first");

    const [inCache, error] = await this.cache.load(filePath);

    if (inCache)
      return {
        input: inCache.contents,
        type: "file",
        responseInit: {
          headers: { "content-type": "text/css; charset=utf-8" },
        },
      };

    if (error) throw error;

    const { css } = await this.compiler.compileAsync(filePath, this.options);

    await this.cache.write(filePath, css);

    return {
      input: css,
      type: "file",
      responseInit: {
        headers: { "content-type": "text/css; charset=utf-8" },
      },
    };
  }
}
