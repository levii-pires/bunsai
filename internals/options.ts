export function resolveOptions(options: BunSaiOptions): ResolvedBunSaiOptions {
  return {
    dev: options.dev ?? process.env.NODE_ENV !== "production",
    dir: options.dir || "./pages",
    staticFiles: options.staticFiles || [],
    router: options.router || {},
    loaders: options.loaders || [],
    cache: options.cache || {},
  };
}
