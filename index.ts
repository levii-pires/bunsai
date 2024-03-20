/// <reference path="./types.d.ts" />

import type { BunPlugin, Server } from "bun";
import { EventEmitter, FSCache, resolveOptions } from "./internals";
import { parse } from "path";

export default class BunSai {
  private $ready = false;
  private $loaderMap: Map<Extname, BunSaiLoader> = new Map();
  readonly router: InstanceType<typeof Bun.FileSystemRouter>;
  readonly options: ResolvedBunSaiOptions;
  readonly events = new EventEmitter();
  readonly cache: FSCache;

  constructor(options: BunSaiOptions) {
    this.options = resolveOptions(options);

    const fileExtensions = this.options.staticFiles.concat(
      this.options.loaders.flatMap((l) => l.extensions)
    );

    this.router = new Bun.FileSystemRouter({
      ...this.options.router,
      dir: this.options.dir,
      style: "nextjs",
      fileExtensions,
    });

    this.cache = new FSCache({
      ...options.cache,
      dev: this.options.dev,
      events: this.events,
    });

    if (this.options.dev) {
      this.events.on("request.error", ({ error }) => console.error(error));
    }
  }

  protected async $setup() {
    for (const loader of this.options.loaders) {
      await loader.setup(this);
    }

    await this.cache.setup();

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

  protected async $fetch(request: Request, server: Server) {
    if (!this.$ready) throw new Error("run setup first");

    let result = new Response();
    let shouldReturnEarly = false;

    function response(overrid?: Response) {
      if (overrid) {
        result = overrid;
        shouldReturnEarly = true;
      }

      return result;
    }

    await this.events.emit("request.init", {
      request,
      server,
      response,
    });

    if (shouldReturnEarly) return result;

    const route = this.router.match(request);

    if (!route) {
      result = new Response(null, { status: 404 });

      await this.events.emit("request.notFound", { request, response, server });

      return result;
    }

    const path = parse(route.filePath);

    await this.events.emit("request.load", {
      path,
      request,
      response,
      route,
      server,
    });

    if (shouldReturnEarly) return result;

    const build = await Bun.build({
      entrypoints: [route.filePath],
    });

    const loader = this.$loaderMap.get(path.ext as Extname);

    if (loader) {
      const { outputs, logs, success } = await Bun.build({
        ...(await loader.generate({ path, request, route, server })),
        entrypoints: [route.filePath],
        outdir: this.cache.resolve("/@bunsai-build"),
      });

      if (!success) {
        throw new AggregateError(
          logs,
          `Errors were found during the build of "${request.url}"`
        );
      }

      result = new Response(outputs[0]);
    } else {
      result = new Response(Bun.file(route.filePath));
    }

    await this.events.emit("request.loaded", {
      request,
      response,
      route,
      server,
    });

    return result;
  }

  get fetch() {
    const that = this;

    return async function (this: Server, request: Request) {
      if (that.options.dev) console.time("BunSai fetch: " + request.url);

      let result: Response;

      function response(overrid?: Response) {
        if (overrid) result = overrid;

        return result;
      }

      try {
        result = await that.$fetch(request, this);
      } catch (error) {
        result = new Response(null, { status: 500 });

        await that.events.emit("request.error", {
          error,
          request,
          server: this,
          response,
        });
      }

      await that.events.emit("request.end", {
        request,
        response,
        server: this,
      });

      if (that.options.dev) console.timeEnd("BunSai fetch: " + request.url);

      return result;
    };
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
