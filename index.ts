/// <reference path="./types.d.ts" />

import type { BunPlugin } from "bun";
import { FSCache } from "./internals";
import { parse, resolve } from "path";
import BunSaiCore from "./core";

export default class BunSai extends BunSaiCore {
  private $ready = false;
  private $root: string;
  private $loaderMap: Map<Extname, BunSai.Loader> = new Map();
  private $loaderBuildMap: Map<BunSai.Loader, BunSai.LoaderBuildConfig> =
    new Map();
  private $sharedPlugins: BunPlugin[] = [];
  readonly cache: FSCache;

  constructor(options?: BunSai.Options) {
    super(options);

    this.cache = new FSCache({
      ...this.options.cache,
      events: this.events,
    });

    this.$root = resolve(this.options.dir);

    if (this.options.dev) {
      this.events.on("request.error", ({ error }) => console.error(error));
    }
  }

  protected $getBuildInput() {
    return Object.entries(this.router.routes).map(([matcher, filePath]) => ({
      path: parse(filePath),
      matcher,
      filePath,
    })) as BunSai.BuildInput[];
  }

  protected async $setup() {
    await this.cache.setup();

    for (const loader of this.options.loaders) {
      const plugins = (await loader.setup(this)) || [];

      this.$sharedPlugins.push(...plugins);

      for (const ext of loader.extensions) {
        this.$loaderMap.set(ext, loader);
      }

      if (loader.build) this.$loaderBuildMap.set(loader, await loader.build());
    }

    await this.events.emit("lifecycle.init", { bunsai: this, server: null });

    this.$ready = true;
  }

  protected async $reload() {
    console.log("\nReloading BunSai...");
    console.time("BunSai Reload");

    this.$manifest = {};
    this.cache.reset();
    this.router.reload();

    await this.$build(this.$getBuildInput());

    await this.events.emit("lifecycle.reload", { bunsai: this, server: null });

    console.timeEnd("BunSai Reload");
  }

  protected $getLoaderByExt(ext: Extname) {
    return this.$loaderMap.get(ext);
  }

  protected async $build(input: BunSai.BuildInput[]) {
    if (!this.$ready) throw new Error("run setup first");

    console.log(
      `\nBuilding: \n\t=> ${input
        .map(({ filePath }) => filePath)
        .join("\n\t=> ")}`
    );

    const buildConfigByTarget: Record<
      BunSai.LoaderBuildConfig["target"],
      BunSai.BuildTarget
    > = {
      bun: {
        target: "bun",
        define: {},
        external: [],
        loader: {},
        entries: [],
        plugins: [],
      },

      browser: {
        target: "browser",
        define: {},
        external: [],
        loader: {},
        entries: [],
        plugins: [],
      },
    };

    for (const { path, matcher, filePath } of input) {
      const loader = this.$loaderMap.get(path.ext as Extname);

      if (loader) {
        const buildConfig = this.$loaderBuildMap.get(loader);

        if (!buildConfig) {
          if (!loader.load)
            throw new Error("The loader must have 'build()' or 'load()'");

          const { input, type, responseInit } = await loader.load(filePath);

          const cachedPath = await this.cache.write(filePath, input);

          this.$manifest[matcher] = {
            path: cachedPath,
            type,
            responseInit: responseInit || null,
          };
        } else {
          const config = buildConfigByTarget[buildConfig.target];

          if (!config)
            throw new Error(`invalid build target: "${buildConfig.target}"`);

          config.entries.push(filePath);
          config.external.push(...(buildConfig.external || []));
          config.plugins.push(...(buildConfig.plugins || []));
          Object.assign(config.define, buildConfig.define || {});
          Object.assign(config.loader, buildConfig.loader || {});
        }
      } else {
        const cachedPath = await this.cache.write(filePath, Bun.file(filePath));

        this.$manifest[matcher] = {
          path: cachedPath,
          type: "file",
          responseInit: null,
        };
      }
    }

    const { browser, bun } = buildConfigByTarget;

    if (bun.entries.length > 0) await this.$bunBuild(bun);
    if (browser.entries.length > 0) await this.$bunBuild(browser);
  }

  protected async $bunBuild(build: BunSai.BuildTarget) {
    const { logs, outputs, success } = await Bun.build({
      entrypoints: build.entries,
      define: build.define,
      external: Array.from(new Set(build.external)),
      loader: build.loader,
      minify: true,
      naming: {
        chunk: `.${build.target}-[name]-[hash].[ext]`,
      },
      plugins: this.$sharedPlugins.concat(Array.from(new Set(build.plugins))),
      root: this.$root,
      splitting: true,
      target: build.target,
    });

    if (!success)
      throw new AggregateError([
        `Found errors while building "${build.target}" target:`,
        ...logs,
      ]);

    const result = await this.cache.writeBuildOutputs(outputs, this.$root);

    console.log(build.entries, result);
  }

  protected async $writeManifest(path: string) {
    await Bun.write(path, JSON.stringify(this.$manifest));
  }

  get writeManifest() {
    return (path: string) => {
      return this.$writeManifest(path);
    };
  }

  get start() {
    return async () => {
      await this.$setup();
      await this.$build(this.$getBuildInput());
      return this.$wrapFetch();
    };
  }

  get build() {
    return (input: BunSai.BuildInput[]) => this.$build(input);
  }

  get reload() {
    return () => this.$reload();
  }

  get getLoaderByExt() {
    return (ext: Extname) => this.$getLoaderByExt(ext);
  }
}

export type * from "./types";

/**
 * 
 * 
          const { outputs, logs, success } = await Bun.build({
            ...buildConfig,
            entrypoints: [filePath],
            plugins: this.$sharedPlugins,
            root: this.$root,
            outdir: undefined,
          });

          if (!success) {
            throw new AggregateError([
              `Errors were found during "${filePath}" build:`,
              ...logs,
            ]);
          }

          const [{ cachedPath, output }] = await this.cache.writeBuildOutputs(
            outputs,
            this.$root
          );

          switch (output.loader) {
            case "ts":
            case "tsx": {
              this.$manifest[matcher] = {
                path: cachedPath,
                type: "module",
                responseInit: null,
              };

              break;
            }
            default: {
              this.$manifest[matcher] = {
                path: cachedPath,
                type: "file",
                responseInit: null,
              };
            }
          }
        
 */
