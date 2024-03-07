import type { Recommended, RecommendedOpts } from "./types";
import ModuleLoader from "./loaders/module";
import NunjucksLoader from "./loaders/nunjucks";
import SassLoader from "./loaders/sass";
import DDOS from "./middlewares/ddos";
import CORS from "./middlewares/cors";
import WebLoader from "./loaders/web";

export default async function useRecommended(
  opts?: RecommendedOpts
): Promise<Recommended> {
  const nunjucks = new NunjucksLoader(opts?.nunjucks);

  const { preflight, response } = CORS(opts?.middlewares?.cors);

  return {
    nunjucks: {
      env() {
        return nunjucks.env;
      },
    },

    bunsai: {
      loaders: [
        new ModuleLoader(),
        nunjucks,
        new SassLoader(opts?.sass),
        new WebLoader(),
      ],
      staticFiles: [
        ".html",
        ".css",
        ".js",
        ".json",
        ".txt",
        ".webp",
        ".gif",
        ".mp4",
        ".mov",
        ".ogg",
        ".mp3",
        ".aac",
        ".ico",
        ".ttf",
        ".otf",
        ".woff",
        ".woff2",
      ],
      middlewares: [new DDOS(opts?.middlewares?.ddos), preflight, response],
    },
  };
}
