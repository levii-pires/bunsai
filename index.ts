/// <reference path="./types.d.ts" />

import type { BunPlugin, Server } from "bun";
import { FSCache } from "./internals";
import { parse, resolve } from "path";
import BunSaiCore from "./core";
import { readdir } from "fs/promises";

export default class BunSai extends BunSaiCore {
  private $shouldReload = false;
  private $ready = false;
  private $root: string;
  private $loaderMap: Map<Extname, BunSai.Loader> = new Map();
  private $loaderBuildMap: Map<BunSai.Loader, BunSai.LoaderBuildConfig> =
    new Map();
  private $sharedPlugins: BunPlugin[] = [];
  readonly cache: FSCache;

  constructor(options: BunSai.Options = {}) {
    super(options);

    this.cache = new FSCache({
      ...options.cache,
      dev: this.options.dev,
      events: this.events,
      base: this.options.dir,
    });

    this.$root = resolve(this.options.dir);

    if (this.options.dev) {
      this.events.on("request.error", ({ error }) => console.error(error));
    }
  }

  protected async $setup() {
    await this.cache.setup();

    if (this.options.dev)
      this.events.on(
        "cache.watch.change",
        async ({ originalFilePath, type }) => {
          switch (type) {
            case "change":
              break;

            case "unlink":
            case "add": {
              this.$shouldReload = true;
              return;
            }

            default: {
              throw new Error(`Invalid type: "${type}"`);
            }
          }

          const [matcher] =
            Object.entries(this.router.routes).find(
              ([, filePath]) => resolve(filePath) == resolve(originalFilePath)
            ) || [];

          if (!matcher)
            throw new Error(
              `BunSai bug: matcher not found for "${originalFilePath}"`
            );

          const input = {
            filePath: originalFilePath,
            path: parse(originalFilePath),
            matcher,
          };

          return this.$build([input]);
        }
      );

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
    console.log("Reloading BunSai...");
    console.time("BunSai Reload");

    this.cache.reset();

    this.$recreateRouter();

    this.$manifest = {};

    await this.$build();

    await this.events.emit("lifecycle.reload", { bunsai: this, server: null });

    console.timeEnd("BunSai Reload");
  }

  protected $getLoaderByExt(ext: Extname) {
    return this.$loaderMap.get(ext);
  }

  protected async $build(input?: BunSai.BuildInput[]) {
    if (!this.$ready) throw new Error("run setup first");

    if (!input)
      input = Object.entries(this.router.routes).map(([matcher, filePath]) => ({
        path: parse(filePath),
        matcher,
        filePath,
      }));

    console.log(
      `\nBuilding: \n\t=> ${input
        .map(({ filePath }) => filePath)
        .join("\n\t=> ")}`
    );

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
          const { outputs, logs, success } = await Bun.build({
            ...buildConfig,
            entrypoints: [filePath],
            plugins: this.$sharedPlugins.concat(buildConfig.plugins || []),
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
            filePath,
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
  }

  protected async $writeManifest(path: string) {
    await Bun.write(path, JSON.stringify(this.$manifest));
  }

  protected override async $fetch(request: Request, server: Server) {
    try {
      if (this.$shouldReload) await this.$reload();

      this.$shouldReload = false;
    } catch (error) {
      throw new AggregateError(["Reload failed:", error]);
    }

    return super.$fetch(request, server);
  }

  get writeManifest() {
    return (path: string) => {
      return this.$writeManifest(path);
    };
  }

  get build() {
    return async () => {
      await this.$build();
      return this.$wrapFetch();
    };
  }

  get setup() {
    return () => this.$setup();
  }

  get reload() {
    return () => this.$reload();
  }

  get getLoaderByExt() {
    return (ext: Extname) => this.$getLoaderByExt(ext);
  }
}

export type * from "./types";
