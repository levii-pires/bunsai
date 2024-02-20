import type { Server } from "bun";
import type {
  Extname,
  LoaderMap,
  BunSaiOptions,
  ResolvedBunSaiOptions,
  BunSaiMiddlewareRecord,
} from "./types";
import { extname } from "path";
import {
  resolveOptions,
  getStatic,
  initLoaders,
  MiddlewareChannel,
  LoaderNotFoundError,
} from "./internals";

export default class BunSai {
  protected options: ResolvedBunSaiOptions;
  protected router: InstanceType<typeof Bun.FileSystemRouter>;
  protected routeLoaders: LoaderMap = {};

  readonly middlewares =
    MiddlewareChannel.createMiddlewareRecord<BunSaiMiddlewareRecord>([
      "notFound",
      "request",
      "response",
      "error",
    ]);

  constructor(options: BunSaiOptions) {
    this.options = resolveOptions(options);

    const fileExtensions = this.options.staticFiles.concat(
      Object.keys(this.options.loaders) as Extname[]
    );

    this.router = new Bun.FileSystemRouter({
      ...this.options,
      style: "nextjs",
      fileExtensions,
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

      if (!loader) throw new LoaderNotFoundError(request);

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
      const errResult = await this.middlewares.error.call({
        error,
        request,
        server,
      });

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
