/// <reference path="./types.d.ts" />

import type { BunPlugin, FileSystemRouter } from "bun";
import { resolve } from "path";
import BunSaiCore from "./core";
import { mkdirSync, existsSync, rmSync } from "fs";

export default class BunSai extends BunSaiCore {
  override readonly router: FileSystemRouter;
  private $ready = false;
  private $root: string;
  private $plugins: BunPlugin[] = [];

  constructor(options?: BunSai.Options) {
    super(options);

    this.$root = resolve(this.options.root);

    if (existsSync(this.options.outdir))
      rmSync(this.options.outdir, { force: true, recursive: true });

    mkdirSync(this.options.outdir);

    this.router = new Bun.FileSystemRouter({
      ...this.options.router,
      dir: this.options.outdir,
      style: "nextjs",
      fileExtensions: this.fileExtensions as string[],
    });

    if (this.options.dev) {
      this.events.on("request.error", ({ error }) =>
        console.error(error, "\n")
      );
    }
  }

  protected async $setup() {
    for (const loader of this.options.loaders) {
      this.$plugins.push(...(await loader.setup(this)));
    }

    await this.events.emit("lifecycle.init", { bunsai: this, server: null });

    this.$ready = true;
  }

  protected async $reload() {
    console.log("\nReloading BunSai...");
    console.time("BunSai Reload");

    this.$manifest = {};
    this.router.reload();
    await this.$build();
    await this.events.emit("lifecycle.reload", { bunsai: this, server: null });

    console.timeEnd("BunSai Reload");
  }

  protected async $build() {
    if (!this.$ready) throw new Error("run setup first");

    const entrypointsGlob = new Bun.Glob(
      `./**/*{${this.fileExtensions.join()}}`
    );

    const entrypoints = await Array.fromAsync(
      entrypointsGlob.scan({ cwd: this.$root, absolute: true })
    );

    const { logs, outputs, success } = await Bun.build({
      ...this.options.build,
      entrypoints,
      naming: {
        chunk: ".[name]-[hash].[ext]",
        asset: "[name].[ext]",
      },
      minify: true,
      outdir: this.options.outdir,
      plugins: this.$plugins,
      root: this.$root,
      splitting: true,
      target: "bun",
    });

    if (!success) throw new AggregateError(logs);

    console.log("entrypoints:", entrypoints, "\n\n", "outputs:", outputs);
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
      await this.$build();
      return this.$wrapFetch();
    };
  }

  get setup() {
    return () => this.$setup();
  }

  get build() {
    return () => this.$build();
  }

  get reload() {
    return () => this.$reload();
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
