import BunSai from "..";
import { AsyncCompiler, Options, initAsyncCompiler } from "sass-embedded";

export default class SassLoader implements BunSaiLoader {
  compiler: AsyncCompiler | null = null;

  extensions = [".scss"] as const;

  constructor(public options?: Options<"async">) {}

  async setup(bunsai: BunSai) {
    this.compiler = await initAsyncCompiler();
  }

  generate(): BunSaiLoaderGenerate {
    return {
      target: "browser",
      plugins: [
        {
          name: "Sass BunSai Loader",
          setup: (build) => {
            build.onLoad({ filter: /\.scss$/ }, async (args) => {
              if (!this.compiler) throw new Error("run setup first");

              return {
                contents: (
                  await this.compiler.compileAsync(args.path, this.options)
                ).css,
                loader: "file",
              };
            });
          },
        },
      ],
    };
  }
}
