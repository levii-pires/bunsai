import type { Server } from "bun";
import type { Extname, LoaderMap, Middleware, BunSaiOptions } from "./types";
import { StaticLoader } from "./loaders";
import { extname } from "path";

function getStatic(staticFiles: Extname[]) {
  return Object.fromEntries(staticFiles.map((file) => [file, StaticLoader]));
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

  const middlewares: Record<string, Middleware> = {};

  const instance = {
    reloadRouter() {
      router.reload();
    },

    /**
     * @returns `this` for chaining
     */
    addMiddleware(name: string, middleware: Middleware) {
      if (typeof middleware != "function")
        throw new TypeError("middleware must be a function");

      if (name in middlewares) {
        throw new Error(`'${name}' middleware already exists`);
      }

      middlewares[name] = middleware;

      return instance;
    },

    /**
     * @returns `this` for chaining
     */
    removeMiddleware(name: string) {
      delete middlewares[name];
      return instance;
    },

    async fetch(request: Request, server: Server) {
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

      for (const mid of Object.values(middlewares)) {
        const result = await mid(response, request, server);

        if (result) return result;
      }

      return response;
    },
  };

  return instance;
}

export type * from "./types";
