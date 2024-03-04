import type BunSai from "..";

/**
 * This function is used by Bunsai's constructor to initiate the loaders.
 */
export function initLoaders(bunsai: BunSai) {
  const { options, loaders: routeLoaders } = bunsai;

  for (const loader of options.loaders) {
    for (const key of loader.extensions) {
      routeLoaders.set(key, loader);
    }
  }
}
