export function resolveOptions(
  options: BunSai.Options
): BunSai.ResolvedOptions {
  return {
    dev: options.dev ?? process.env.NODE_ENV !== "production",
    dir: options.dir || "./app",
    staticFiles: options.staticFiles || [],
    router: options.router || {},
    loaders: options.loaders || [],
    cache: options.cache || {},
    middlewares: options.middlewares || [],
  };
}
