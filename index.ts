import type { Server } from "bun";
import type { Extname, LoaderMap, BunSaiOptions, UserConfig } from "./types";
import { extname } from "path";
import { getStatic } from "./internals/static";
import { initLoaders } from "./internals/loaders";
import { LoaderNotFoundError } from "./internals/errors";
import { build } from "./internals/build";
import BunSai from "./bunsai-core";
import { evalUserConfig } from "./internals/evalUserConfig";

export default class BunSaiDev extends BunSai {
  readonly loaders: LoaderMap = new Map();
  protected $ready = Promise.withResolvers<void>();
  override manifest: null = null;

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

  static override async fromUserConfig(
    userConfig: UserConfig = {},
    userConfigFilePath = ""
  ) {
    const { options } = await evalUserConfig(userConfig, userConfigFilePath);

    return this.init(options);
  }
}

export type * from "./types";
