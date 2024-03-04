import type { Server } from "bun";
import type {
  Extname,
  LoaderMap,
  BunSaiOptions,
  ResolvedBunSaiOptions,
  BunSaiMiddlewareRecord,
} from "./types";
import { extname } from "path";
import MiddlewareChannel from "./internals/middlewareChannel";
import { resolveOptions } from "./internals/options";
import { getStatic } from "./internals/static";
import { initLoaders } from "./internals/loaders";
import { initMiddlewares } from "./internals/middlewares";
import { LoaderNotFoundError } from "./internals/errors";
import { build } from "./internals/build";

export default class BunSai {
  readonly router: InstanceType<typeof Bun.FileSystemRouter>;
  readonly loaders: LoaderMap = new Map();
  readonly options: ResolvedBunSaiOptions;
  readonly middlewares = MiddlewareChannel.createRecord<BunSaiMiddlewareRecord>(
    ["notFound", "request", "response", "error", "end"]
  );
  protected $ready = Promise.withResolvers<void>();

  constructor(options: BunSaiOptions) {
    this.options = resolveOptions(options);

    const fileExtensions = this.options.staticFiles.concat(
      this.options.loaders.map((l) => l.extensions).flat()
    );

    this.router = new Bun.FileSystemRouter({
      ...this.options,
      style: "nextjs",
      fileExtensions,
    });

    getStatic(this);
    initLoaders(this);
    initMiddlewares(this);
  }

  protected async $build() {
    // const options: BunSaiOptions = (
    //   await import(join(process.cwd(), "bunsai.config.ts"))
    // ).default;

    // if (!options)
    //   throw new Error("bunsai.config.ts must have a default export");

    // const instance = await this.init(options);

    await this.ready;

    await build(this);
  }

  protected async $setup() {
    for (const loader of this.options.loaders) {
      await loader.setup(this.options);
    }

    this.$ready.resolve();
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

      const loader = this.loaders.get(
        extname(route.filePath).toLowerCase() as Extname
      );

      if (!loader) throw new LoaderNotFoundError(request);

      const response = await loader.handle(route.filePath, {
        server,
        request,
        route,
      });

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

  get fetch() {
    const that = this;

    return async function (this: Server, request: Request) {
      const response = await that.$fetch(request, this);

      const endRes = await that.middlewares.end.call(
        { response, request, server: this },
        that.options.dev
      );

      return endRes || response;
    };
  }

  get setup() {
    return this.$setup.bind(this);
  }

  get ready() {
    return this.$ready.promise;
  }

  static async init(...args: ConstructorParameters<typeof BunSai>) {
    const instance = new this(...args);

    await instance.setup();

    return instance;
  }

  get build() {
    return this.$build.bind(this);
  }
}

export type * from "./types";
