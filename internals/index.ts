import { StaticLoaderInit } from "../loaders";
import type {
  Extname,
  ResolvedBunSaiOptions,
  BunSaiOptions,
  LoaderInitMap,
  LoaderMap,
} from "../types";

export function getStatic(
  staticFiles: Extname[],
  resolvedOpts: ResolvedBunSaiOptions
) {
  if (staticFiles.length == 0) return {};

  const loader = StaticLoaderInit(resolvedOpts);

  return Object.fromEntries(staticFiles.map((file) => [file, loader]));
}

export function resolveOptions(options: BunSaiOptions): ResolvedBunSaiOptions {
  return {
    assetPrefix: options.assetPrefix || "",
    dev: options.dev || false,
    dir: options.dir || "./pages",
    loaders: options.loaders,
    origin: options.origin || "",
    staticFiles: options.staticFiles || [],
  };
}

export function initLoaders(
  loadersInit: LoaderInitMap,
  resolvedOpts: ResolvedBunSaiOptions
) {
  const result: LoaderMap = {};

  for (const key in loadersInit) {
    result[key as Extname] = loadersInit[key as Extname](resolvedOpts);
  }

  return result;
}

export { default as MiddlewareChannel } from "./middleware";
export type { MiddlewareRecord } from "./middleware";
export * from "./errors";
