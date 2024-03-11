import type { Server } from "bun";
import type { Extname, LoaderMap, BunSaiOptions, UserConfig } from "./types";
import { extname } from "path";
import { getStatic } from "./internals/static";
import { initLoaders } from "./internals/loaders";
import { LoaderNotFoundError } from "./internals/errors";
import { build } from "./internals/build";
import BunSai from "./bunsai-core";
import { userConf2Options } from "./internals/userConf2Options";

export default class BunSaiDev extends BunSai {
  readonly loaders: LoaderMap = new Map();
  protected $ready = Promise.withResolvers<void>();

  constructor(options: BunSaiOptions) {
    super(options);

    getStatic(this);
    initLoaders(this);
  }

  protected async $build() {
    await this.$ready.promise;
    await build(this);
  }

  protected async $setup() {
    for (const loader of this.options.loaders) {
      await loader.setup(this.options);
    }

    this.$ready.resolve();
  }

  protected override async $fetch(request: Request, server: Server) {
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

  get setup() {
    return this.$setup.bind(this);
  }

  get ready() {
    return this.$ready.promise;
  }

  get build() {
    return this.$build.bind(this);
  }

  static async init(options: BunSaiOptions) {
    const instance = new this(options);
    await instance.$setup();
    return instance;
  }

  static async build(options: BunSaiOptions) {
    const instance = await this.init(options);
    await instance.$build();
  }

  static override async fromUserConfig(userConfig?: UserConfig) {
    const options = await userConf2Options(userConfig || {});

    return this.init(options);
  }
}

export type * from "./types";
