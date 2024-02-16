import type { Server } from "bun";
import type {
  Extname,
  LoaderMap,
  ResponseMiddleware,
  BunSaiOptions,
  RequestMiddleware,
  ResolvedBunSaiOptions,
  MiddlewareTypes,
} from "./types";
import { extname } from "path";
import {
  resolveOptions,
  getStatic,
  initLoaders,
  runMiddlewares,
} from "./internals";

/**
 * The marked methods `$method(...)` are `this` dependent,
 * while the non-marked methods `method(...)` are getters that returns a bound `$method`
 */
export default class BunSai {
  protected options: ResolvedBunSaiOptions;
  protected router: InstanceType<typeof Bun.FileSystemRouter>;
  protected routeLoaders: LoaderMap = {};
  protected middlewareRecord = {
    response: {} as Record<string, ResponseMiddleware>,
    request: {} as Record<string, RequestMiddleware>,
    ["not-found"]: {} as Record<string, ResponseMiddleware>,
  };

  constructor(options: BunSaiOptions) {
    this.options = resolveOptions(options);

    this.router = new Bun.FileSystemRouter({
      ...this.options,
      style: "nextjs",
      fileExtensions: this.options.staticFiles.concat(
        Object.keys(this.options.loaders) as Extname[]
      ),
    });

    Object.assign(
      this.routeLoaders,
      getStatic(this.options.staticFiles, this.options)
    );

    Object.assign(
      this.routeLoaders,
      initLoaders(this.options.loaders, this.options)
    );
  }

  $reloadRouter() {
    this.router.reload();
  }

  $addMiddleware(
    name: string,
    type: Exclude<MiddlewareTypes, "request">,
    middleware: ResponseMiddleware
  ): this;
  $addMiddleware(
    name: string,
    type: Extract<MiddlewareTypes, "request">,
    middleware: RequestMiddleware
  ): this;

  /**
   * @returns `this` for chaining
   */
  $addMiddleware(
    name: string,
    type: MiddlewareTypes,
    middleware: RequestMiddleware | ResponseMiddleware
  ) {
    if (typeof middleware != "function")
      throw new TypeError("middleware must be a function");

    if (!(type in this.middlewareRecord))
      throw new Error(`unknown type '${type}'`);

    this.middlewareRecord[type][name] = middleware;

    return this;
  }

  /**
   * @returns `this` for chaining
   */
  $removeMiddleware(name: string, type: MiddlewareTypes) {
    if (!(type in this.middlewareRecord))
      throw new Error(`unknown type '${type}'`);

    delete this.middlewareRecord[type][name];

    return this;
  }

  async $fetch(request: Request, server: Server) {
    const reqResult = await runMiddlewares(this.middlewareRecord.request, [
      request,
      server,
    ]);

    if (reqResult) return reqResult;

    const route = this.router.match(request);

    if (!route) {
      const nfResult = new Response(null, { status: 404 });

      const nfMidResult = await runMiddlewares(
        this.middlewareRecord["not-found"],
        [route, nfResult, request, server]
      );

      return nfMidResult || nfResult;
    }

    const loader =
      this.routeLoaders[extname(route.filePath).toLowerCase() as Extname];

    if (!loader)
      return new Response(null, {
        status: 500,
        statusText: `INTERNAL_SERVER_ERROR: '${request.url}' does not have an appropriate loader`,
      });

    const response = await loader(route.filePath, { server, request, route });

    const resResult = await runMiddlewares(this.middlewareRecord.response, [
      route,
      response,
      request,
      server,
    ]);

    return resResult || response;
  }

  get addMiddleware(): typeof this.$addMiddleware {
    return this.$addMiddleware.bind(this);
  }

  get removeMiddleware() {
    return this.$removeMiddleware.bind(this);
  }

  get fetch() {
    return this.$fetch.bind(this);
  }

  get reloadRouter() {
    return this.$reloadRouter.bind(this);
  }
}

export type * from "./types";
