import type { ResolvedBunSaiOptions, BunSaiOptions } from "../types";

export function resolveOptions(options: BunSaiOptions): ResolvedBunSaiOptions {
  return {
    assetPrefix: options.assetPrefix || "",
    dev: options.dev || false,
    dir: options.dir || "./pages",
    loaders: options.loaders || {},
    origin: options.origin || "",
    staticFiles: options.staticFiles || [],
    middlewares: options.middlewares || [],
  };
}
