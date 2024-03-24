import type { BunPlugin } from "bun";
import BunSai from "..";
import { AsyncCompiler, Options, initAsyncCompiler } from "sass-embedded";

export default class SassLoader implements BunSai.Loader {
  compiler: AsyncCompiler | null = null;

  // extensions = [".scss"] as const;
  extensions = [];

  constructor(public options?: Options<"async">) {}

  async setup(bunsai: BunSai): Promise<BunPlugin[]> {
    this.compiler = await initAsyncCompiler();

    return [
      {
        name: "Sass BunSai Loader",
        setup: (build) => {
          build.onLoad({ filter: /\.scss$/ }, async (args) => {
            const { css } = await this.compiler!.compileAsync(
              args.path,
              this.options
            );

            return {
              contents: css,
              loader: "file",
            };
          });
        },
      },
    ];
  }
}
