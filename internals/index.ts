import type BunSai from "..";
import { StaticLoaderInit } from "../loaders";
import type {
  Extname,
  ResolvedBunSaiOptions,
  BunSaiOptions,
  LoaderMap,
} from "../types";
import type { Middleware } from "./middleware";

export function getStatic(bunsai: BunSai) {
  const { options } = bunsai;

  if (options.staticFiles.length == 0) return {};

  const loader = StaticLoaderInit(options);

  return Object.fromEntries(options.staticFiles.map((file) => [file, loader]));
}

export function resolveOptions(options: BunSaiOptions): ResolvedBunSaiOptions {
  return {
    assetPrefix: options.assetPrefix || "",
    dev: options.dev || false,
    dir: options.dir || "./pages",
    loaders: options.loaders,
    origin: options.origin || "",
    staticFiles: options.staticFiles || [],
    middlewares: options.middlewares || [],
  };
}

export function initMiddlewares(bunsai: BunSai) {
  for (const middleware of bunsai.options.middlewares) {
    bunsai.middlewares[middleware.runsOn].add(
      middleware.name,
      middleware.runner
    );
  }
}

export function initLoaders(bunsai: BunSai) {
  const { options } = bunsai;

  const result: LoaderMap = {};

  for (const [key, loaderInit] of Object.entries(options.loaders)) {
    result[key as Extname] = loaderInit(options);
  }

  return result;
}

/**
 * Inject the {@link Host} into the BunSai MiddlewareRecord
 *
 * @param this The Host. Must extend {@link Middleware}
 */
export function inject<Host extends new (...args: any[]) => Middleware>(
  this: Host,
  middlewares: BunSai["middlewares"],
  ...args: ConstructorParameters<Host>
) {
  const instance = new this(...args);

  middlewares[instance.runsOn].add(instance.name, instance.runner);

  return {
    instance: instance as InstanceType<Host>,
    remove() {
      middlewares[instance.runsOn].remove(instance.name);
    },
  };
}

export * from "./middleware";
export * from "./errors";
