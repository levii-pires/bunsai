import type { Server } from "bun";
import type { Extname, LoaderMap, ServerOptions } from "./types";
import { StaticLoader } from "./loaders";
import { extname } from "path";

function getStatic(staticFiles: Extname[]) {
  return Object.fromEntries(staticFiles.map((file) => [file, StaticLoader]));
}

export default function BonSai(opts: ServerOptions) {
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

  return {
    reloadRouter() {
      router.reload();
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

      return loader(route.filePath, { server, request, route });
    },
  };
}
