export function resolveOptions(
  options: BunSai.Options
): BunSai.ResolvedOptions {
  return {
    dev: options.dev ?? process.env.NODE_ENV !== "production",
    root: options.root || "./app",
    outdir: options.outdir || "./dist",
    staticFiles: options.staticFiles || [],
    router: options.router || {},
    loaders: options.loaders || [],
    cache: options.cache || {},
    middlewares: options.middlewares || [],
    build: options.build || {},
  };
}
