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

  constructor(options: BunSai.Options = {}) {
    super(options);

    this.cache = new FSCache({
      ...options.cache,
      dev: this.options.dev,
      events: this.events,
    });

    this.$root = resolve(this.options.dir);

    if (this.options.dev) {
      console.log("loaders:", this.options.loaders);
      console.log("routes:", this.router.routes);
      this.events.on("request.error", ({ error }) => console.error(error));
    }
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
    this.router.reload();

    await this.events.emit("lifecycle.reload", { bunsai: this, server: null });
  }

  protected $getLoaderByExt(ext: Extname) {
    return this.$loaderMap.get(ext);
  }

  protected async $build() {
    if (!this.$ready) throw new Error("run setup first");

    const paths = Object.entries(this.router.routes).map(
      ([matcher, filePath]) => ({ path: parse(filePath), matcher, filePath })
    );

    for (const { path, matcher, filePath } of paths) {
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
          });

          if (!success) {
            throw new AggregateError(
              logs,
              `Errors were found during "${filePath}" build`
            );
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

    console.log(this.$manifest);

    return this.$wrapFetch();
  }

  protected async $writeManifest(path: string) {
    await Bun.write(path, JSON.stringify(this.$manifest));
  }

  get writeManifest() {
    return this.$writeManifest.bind(this);
  }

  get build() {
    return this.$build.bind(this);
  }

  get setup() {
    return this.$setup.bind(this);
  }

  get reload() {
    return this.$reload.bind(this);
  }

  get getLoaderByExt() {
    return this.$getLoaderByExt.bind(this);
  }
}

export type * from "./types";
