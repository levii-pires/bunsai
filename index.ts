import type { MatchedRoute, Server } from "bun";
import type {
  Extname,
  LoaderMap,
  BunSaiOptions,
  ResolvedBunSaiOptions,
} from "./types";
import { extname } from "path";
import { resolveOptions, getStatic, initLoaders } from "./internals";
import MiddlewareChannel, { MiddlewareRecord } from "./internals/middleware";

/**
 * The marked methods `$method(...)` are `this` dependent,
 * while the non-marked methods `method(...)` are getters that returns a bound `$method`
 */
export default class BunSai {
  protected options: ResolvedBunSaiOptions;
  protected router: InstanceType<typeof Bun.FileSystemRouter>;
  protected routeLoaders: LoaderMap = {};

  readonly middlewares = MiddlewareChannel.createMiddlewareRecord<{
    response: {
      response: Response;
      request: Request;
      server: Server;
      route: MatchedRoute;
    };
    request: { request: Request; server: Server };
    notFound: { request: Request; server: Server };
  }>(["notFound", "request", "response"]);

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

  async $fetch(request: Request, server: Server) {
    const reqResult = await this.middlewares.request.call(
      { request, server },
      this.options.dev
    );

    if (reqResult) return reqResult;

    const route = this.router.match(request);

    if (!route) {
      const nfMidResult = await this.middlewares.notFound.call(
        {
          request,
          server,
        },
        this.options.dev
      );

      return nfMidResult || new Response(null, { status: 404 });
    }

    const loader =
      this.routeLoaders[extname(route.filePath).toLowerCase() as Extname];

    if (!loader)
      return new Response(null, {
        status: 500,
        statusText: `INTERNAL_SERVER_ERROR: '${request.url}' does not have an appropriate loader`,
      });

    const response = await loader(route.filePath, { server, request, route });

    const resResult = await this.middlewares.response.call(
      {
        route,
        response,
        request,
        server,
      },
      this.options.dev
    );

    return resResult || response;
  }

  /**
   * @deprecated Since v0.2.0
   */
  addMiddleware() {
    throw new Error(
      "This method was removed on v0.2.0. Please use `middlewares` instead."
    );
  }

  /**
   * @deprecated Since v0.2.0
   */
  removeMiddleware() {
    throw new Error(
      "This method was removed on v0.2.0. Please use `middlewares` instead."
    );
  }

  get fetch() {
    return this.$fetch.bind(this);
  }

  get reloadRouter() {
    return this.$reloadRouter.bind(this);
  }
}

export type * from "./types";
