import type { Server } from "bun";
import type {
  BunSaiOptions,
  ResolvedBunSaiOptions,
  BunSaiMiddlewareRecord,
  BuildManifest,
  UserConfig,
} from "./types";
import MiddlewareChannel from "./internals/middlewareChannel";
import { resolveOptions } from "./internals/options";
import { initMiddlewares } from "./internals/middlewares";
import ModuleLoader from "./loaders/module";
import { evalUserConfig } from "./internals/evalUserConfig";

let serverLoader: ModuleLoader | null = null;

async function getServerLoader(opts: ResolvedBunSaiOptions) {
  if (serverLoader) return serverLoader;

  serverLoader = new ModuleLoader();

  await serverLoader.setup(opts);

  return serverLoader;
}

export default class BunSai {
  readonly router: InstanceType<typeof Bun.FileSystemRouter>;
  readonly options: ResolvedBunSaiOptions;
  readonly middlewares = MiddlewareChannel.createRecord<BunSaiMiddlewareRecord>(
    ["notFound", "request", "response", "error", "end"]
  );

  constructor(
    options: BunSaiOptions,
    public readonly manifest: BuildManifest | null = null
  ) {
    this.options = resolveOptions(options);

    this.options.dev = false; // this function is meant to run on production

    const fileExtensions = manifest
      ? manifest.extensions
      : this.options.staticFiles.concat(
          this.options.loaders.map((l) => l.extensions).flat()
        );

    this.router = new Bun.FileSystemRouter({
      ...this.options,
      style: "nextjs",
      fileExtensions,
    });

    initMiddlewares(this);
  }

  protected async $fetch(request: Request, server: Server) {
    try {
      if (!this.manifest)
        throw new Error(
          "Must provide a manifest object or override this function"
        );

      const reqResult = await this.middlewares.request.call({
        request,
        server,
      });

      if (reqResult) return reqResult;

      const route = this.router.match(request);

      if (!route) {
        const nfMidResult = await this.middlewares.notFound.call({
          request,
          server,
        });

        return nfMidResult || new Response(null, { status: 404 });
      }

      const routeType = this.manifest.files[route.filePath];

      if (!routeType)
        return new Response(null, {
          status: 500,
          statusText: `'${route.filePath}' is not declared in the manifest`,
        });

      switch (routeType) {
        case "server": {
          const serverLoader = await getServerLoader(this.options);
          return await serverLoader.handle(route.filePath, {
            request,
            route,
            server,
          });
        }
        default: {
          return new Response(Bun.file(route.filePath));
        }
      }
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

  get fetch() {
    const that = this;

    return async function (this: Server, request: Request) {
      try {
        const response = await that.$fetch(request, this);

        const endRes = await that.middlewares.end.call(
          { response, request, server: this },
          that.options.dev
        );

        return endRes || response;
      } catch (error) {
        const errResult = await that.middlewares.error.call(
          {
            error,
            request,
            server: this,
          },
          that.options.dev
        );

        if (errResult) return errResult;

        throw error;
      }
    };
  }

  static async fromUserConfig(
    userConfig: UserConfig = {},
    userConfigFilePath = "",
    manifest?: BuildManifest
  ) {
    const { options } = await evalUserConfig(userConfig, userConfigFilePath);

    return new this(options, manifest);
  }
}
