/// <reference path="./types.d.ts" />

import type { Server } from "bun";
import { EventEmitter, resolveOptions } from "./internals";

export default class BunSaiCore {
  protected $manifest: BunSai.Manifest = {};
  readonly options: BunSai.ResolvedOptions;
  readonly router: InstanceType<typeof Bun.FileSystemRouter>;
  readonly events = new EventEmitter();

  protected constructor(options: BunSai.Options = {}) {
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
  }

  protected async $fetch(request: Request, server: Server) {
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

    const onManifest = this.$manifest[route.name];

    if (!onManifest)
      throw new Error(
        `BunSai bug: "${route.name}" should be declared on manifest... please file an issue...`
      );

    await this.events.emit("request.loadInit", {
      path: onManifest.path,
      request,
      response,
      route,
      server,
    });

    if (shouldReturnEarly) return result;

    switch (onManifest.type) {
      case "module": {
        const bunsaiModule = (await import(onManifest.path)) as {
          default: BunSai.ModuleHandler;
        };

        if (typeof bunsaiModule?.default != "function")
          throw new Error(`"${onManifest.path}": not a BunSai module`);

        const { result: res, invalidate } = await bunsaiModule.default({
          path: onManifest.path,
          request,
          route,
          server,
        });

        result = res;

        // todo: implement invalidation

        break;
      }
      case "file": {
        result = new Response(
          Bun.file(onManifest.path),
          onManifest.responseInit || void 0
        );
        break;
      }
      default: {
        throw new Error(`invalid type: "${onManifest.type}"`);
      }
    }

    await this.events.emit("request.loadEnd", {
      request,
      response,
      route,
      server,
    });

    return result;
  }

  protected $wrapFetch() {
    const that = this;

    return async function (this: Server, request: Request) {
      if (that.options.dev) console.time(`BunSai fetch: ${request.url}`);

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

      if (that.options.dev) {
        console.timeEnd(`BunSai fetch: ${request.url}`);
        console.log(`Response status: ${result.status}\n`);
      }

      return result;
    };
  }

  /**
   * This getter should not be used during development
   */
  get fetch() {
    return this.$wrapFetch();
  }

  static async loadFromManifest(path: string, options?: BunSai.Options) {
    const instance = new this(options);

    instance.$manifest = await Bun.file(path).json();

    return instance;
  }
}
