import type BunSai from "..";
import { StaticLoaderInit } from "../loaders";

export function getStatic(bunsai: BunSai) {
  const { options, routeLoaders } = bunsai;

  if (options.staticFiles.length == 0) return {};

  const loader = StaticLoaderInit(options);

  for (const file of options.staticFiles) {
    routeLoaders[file] = loader;
  }
}
