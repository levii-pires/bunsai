import type BunSai from "..";
import { StaticLoaderInit } from "../loaders";

/**
 * This function is used by BunSai's constructor to resolve the `staticFiles` option.
 */
export function getStatic(bunsai: BunSai) {
  const { options, routeLoaders } = bunsai;

  if (options.staticFiles.length == 0) return;

  const loader = StaticLoaderInit(options);

  for (const file of options.staticFiles) {
    routeLoaders[file] = loader;
  }
}
