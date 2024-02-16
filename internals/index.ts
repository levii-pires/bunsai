import { StaticLoader } from "../loaders";
import type {
  Extname,
  ResolvedBunSaiOptions,
  RequestMiddleware,
  ResponseMiddleware,
  BunSaiOptions,
  LoaderInitMap,
  LoaderMap,
} from "../types";

export function getStatic(
  staticFiles: Extname[],
  resolvedOpts: ResolvedBunSaiOptions
) {
  if (staticFiles.length == 0) return {};

  const loader = StaticLoader(resolvedOpts);

  return Object.fromEntries(staticFiles.map((file) => [file, loader]));
}

export async function runMiddlewares<
  M extends RequestMiddleware | ResponseMiddleware
>(record: Record<string, M>, data: Parameters<M>) {
  for (const mid of Object.values(record)) {
    // @ts-ignore
    const result = await mid(...data);

    if (result) return result;
  }
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
