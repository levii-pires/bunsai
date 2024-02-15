import type { Server } from "bun";
import type {
  Extname,
  LoaderMap,
  ResponseMiddleware,
  BunSaiOptions,
  RequestMiddleware,
  BunSaiInstance,
} from "./types";
import { StaticLoader } from "./loaders";
import { extname } from "path";

function getStatic(staticFiles: Extname[]) {
  return Object.fromEntries(staticFiles.map((file) => [file, StaticLoader]));
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

export default function BunSai(opts: BunSaiOptions) {
  const router = new Bun.FileSystemRouter({
    dir: opts.dir || "./pages",
    style: "nextjs",
    assetPrefix: opts.assetPrefix,
    origin: opts.origin || "",
    fileExtensions: (opts.staticFiles || []).concat(
      Object.keys(opts.loaders) as Extname[]
    ),
  });

  const routeLoaders: LoaderMap = {};

  if (opts.staticFiles)
    Object.assign(routeLoaders, getStatic(opts.staticFiles));

  Object.assign(routeLoaders, opts.loaders);

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
