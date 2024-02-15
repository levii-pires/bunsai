import type { Extname, LoaderMap, Recommended, RecommendedOpts } from "./types";
import { ServerModules } from "./loaders";
import getNunjucksLoader from "./loaders/nunjucks";
import getSassLoader from "./loaders/sass";

export default function getRecommended(opts?: RecommendedOpts): Recommended {
  const nunjucks = getNunjucksLoader(opts?.nunjucks?.options);

  return {
    get nunjucksEnv() {
      return nunjucks.env;
    },

    loaders: {
      ...ServerModules,
      ".njk": nunjucks.loaderInit,
      ".scss": getSassLoader(opts?.sass?.options),
    },

    // prettier-ignore
    staticFiles: [
      ".html", ".css", ".js", ".json", ".txt",
      ".webp", ".gif", ".mp4", ".mov", ".ogg",
      ".mp3", ".aac", ".ttf", ".otf", ".woff",
      ".woff2",
    ] as Extname[],
  };
}
