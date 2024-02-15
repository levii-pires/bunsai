import type { Server } from "bun";
import type {
  Extname,
  LoaderMap,
  ResponseMiddleware,
  BunSaiOptions,
  RequestMiddleware,
  BunSaiInstance,
  ResolvedBunSaiOptions,
  LoaderInitMap,
} from "./types";
import { StaticLoader } from "./loaders";
import { extname } from "path";

function getStatic(
  staticFiles: Extname[],
  resolvedOpts: ResolvedBunSaiOptions
) {
  const loader = StaticLoader(resolvedOpts);

  return Object.fromEntries(staticFiles.map((file) => [file, loader]));
}

async function runMiddlewares(
  record: Record<string, RequestMiddleware | ResponseMiddleware>,
  data: [Response, Request, Server] | [Request, Server]
) {
  for (const mid of Object.values(record)) {
    // @ts-ignore
    const result = await mid(...data);

    if (result) return result;
  }
}

function resolveOptions(options: BunSaiOptions): ResolvedBunSaiOptions {
  return {
    assetPrefix: options.assetPrefix || "",
    dev: options.dev || false,
    dir: options.dir || "./pages",
    loaders: options.loaders,
    origin: options.origin || "",
    staticFiles: options.staticFiles || [],
  };
}

function initLoaders(
  loadersInit: LoaderInitMap,
  resolvedOpts: ResolvedBunSaiOptions
) {
  const result: LoaderMap = {};

  for (const key in loadersInit) {
    result[key as Extname] = loadersInit[key as Extname](resolvedOpts);
  }

  return result;
}

export default function BunSai(opts: BunSaiOptions) {
  const resolvedOpts = resolveOptions(opts);

  const router = new Bun.FileSystemRouter({
    dir: resolvedOpts.dir,
    style: "nextjs",
    assetPrefix: resolvedOpts.assetPrefix,
    origin: resolvedOpts.origin,
    fileExtensions: resolvedOpts.staticFiles.concat(
      Object.keys(resolvedOpts.loaders) as Extname[]
    ),
  });

  const routeLoaders: LoaderMap = {};

  if (opts.staticFiles)
    Object.assign(routeLoaders, getStatic(opts.staticFiles, resolvedOpts));

  Object.assign(routeLoaders, initLoaders(opts.loaders, resolvedOpts));

  const responseMiddlewares: Record<string, ResponseMiddleware> = {};
  const requestMiddlewares: Record<string, RequestMiddleware> = {};

  const instance: BunSaiInstance = {
    reloadRouter() {
      router.reload();
    },

    /**
     * @returns `this` for chaining
     */
    addMiddleware(name, type, middleware) {
      if (typeof middleware != "function")
        throw new TypeError("middleware must be a function");

      switch (type) {
        case "request": {
          if (name in requestMiddlewares) {
            throw new Error(`'${name}' middleware already exists`);
          }

          requestMiddlewares[name] = middleware as RequestMiddleware;

          break;
        }
        case "response": {
          if (name in responseMiddlewares) {
            throw new Error(`'${name}' middleware already exists`);
          }

          responseMiddlewares[name] = middleware as ResponseMiddleware;

          break;
        }
        default: {
          throw new Error(`unknown type '${type}'`);
        }
      }

      return instance;
    },

    /**
     * @returns `this` for chaining
     */
    removeMiddleware(name, type) {
      switch (type) {
        case "response": {
          delete responseMiddlewares[name];
          break;
        }
        case "request": {
          delete requestMiddlewares[name];
          break;
        }
        default: {
          throw new Error(`unknown type '${type}'`);
        }
      }

      return instance;
    },

    async fetch(request: Request, server: Server) {
      const reqResult = await runMiddlewares(requestMiddlewares, [
        request,
        server,
      ]);

      if (reqResult) return reqResult;

      const route = router.match(request);

      if (!route) return new Response(null, { status: 404 });

      const loader =
        routeLoaders[extname(route.filePath).toLowerCase() as Extname];

      if (!loader)
        return new Response(null, {
          status: 500,
          statusText: `INTERNAL_SERVER_ERROR: '${request.url}' does not have an appropriate loader`,
        });

      const response = await loader(route.filePath, { server, request, route });

      const resResult = await runMiddlewares(responseMiddlewares, [
        response,
        request,
        server,
      ]);

      return resResult || response;
    },
  };

  return instance;
}

export type * from "./types";
