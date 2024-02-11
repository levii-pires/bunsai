import type { Extname, LoaderMap, Recommended, RecommendedOpts } from "./types";
import { ServerModules } from "./loaders";
import getNunjucksLoader from "./loaders/nunjucks";
import getSassLoader from "./loaders/sass";

export default function getRecommended(opts?: RecommendedOpts): Recommended {
  const { loader: njkLoader, env: nunjucksEnv } = getNunjucksLoader(
    opts?.nunjucks?.path,
    opts?.nunjucks?.options
  );

  return {
    nunjucksEnv,
    loaders: {
      ...ServerModules,
      ".njk": njkLoader,
      ".scss": getSassLoader(opts?.sass?.options),
    } as LoaderMap,

    // prettier-ignore
    staticFiles: [
      ".html", ".css", ".js", ".json", ".txt",
      ".webp", ".gif", ".mp4", ".mov", ".ogg",
      ".mp3", ".aac", ".ttf", ".otf", ".woff",
      ".woff2",
    ] as Extname[],
  };
}
