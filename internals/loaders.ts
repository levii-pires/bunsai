import type BunSai from "..";
import type { Extname, LoaderMap } from "../types";

/**
 * This function is used by Bunsai's constructor to initiate the loaders.
 */
export function initLoaders(bunsai: BunSai) {
  const { options, routeLoaders } = bunsai;

  for (const [key, loaderInit] of Object.entries(options.loaders)) {
    routeLoaders[key as Extname] = loaderInit(options);
  }
}
