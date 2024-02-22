import type { Server } from "bun";
import type {
  Extname,
  LoaderMap,
  BunSaiOptions,
  ResolvedBunSaiOptions,
  BunSaiMiddlewareRecord,
} from "./types";
import { extname } from "path";
import * as Internals from "./internals";

export default class BunSai {
  readonly router: InstanceType<typeof Bun.FileSystemRouter>;
  readonly routeLoaders: LoaderMap = {};
  readonly options: ResolvedBunSaiOptions;
  readonly middlewares =
    Internals.MiddlewareChannel.createRecord<BunSaiMiddlewareRecord>([
      "notFound",
      "request",
      "response",
      "error",
    ]);

  constructor(options: BunSaiOptions) {
    this.options = Internals.resolveOptions(options);

    const fileExtensions = this.options.staticFiles.concat(
      Object.keys(this.options.loaders) as Extname[]
    );

    this.router = new Bun.FileSystemRouter({
      ...this.options,
      style: "nextjs",
      fileExtensions,
    });

    Internals.getStatic(this);
    Internals.initLoaders(this);
    Internals.initMiddlewares(this);
  }

  protected $reloadRouter() {
    this.router.reload();
  }

  protected async $fetch(request: Request, server: Server) {
    try {
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

      if (!loader) throw new Internals.LoaderNotFoundError(request);

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
    } catch (error) {
      const errResult = await this.middlewares.error.call(
        {
          error,
          request,
          server,
        },
        this.options.dev
      );

      if (errResult) return errResult;

      throw error;
    }
  }

  /**
   * @deprecated Since v0.2.0
   */
  addMiddleware(): never {
    throw new Error(
      "This method was removed on v0.2.0. Please use `middlewares` instead."
    );
  }

  /**
   * @deprecated Since v0.2.0
   */
  removeMiddleware(): never {
    throw new Error(
      "This method was removed on v0.2.0. Please use `middlewares` instead."
    );
  }

  get fetch() {
    const that = this;

    return function (this: Server, request: Request) {
      return that.$fetch(request, this);
    };
  }

  get reloadRouter() {
    return this.$reloadRouter.bind(this);
  }
}

export type * from "./types";
