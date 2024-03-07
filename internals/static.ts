import type BunSaiDev from "..";
import StaticLoader from "../loaders/static";

/**
 * This function is used by BunSai's constructor to resolve the `staticFiles` option.
 */
export function getStatic(bunsai: BunSaiDev) {
  const { options } = bunsai;

  if (options.staticFiles.length == 0) return;

  options.loaders.unshift(new StaticLoader(options.staticFiles));
}
