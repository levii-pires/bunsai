import type { UserConfig, BunSaiOptions, AllMiddlewares } from "../types";
import type { MiddlewareCollection } from "./middleware";
import type Loader from "./loader";

interface EvalDeclArgs {
  path: string;
  target: any[];
  options?: any;
}

async function evalDecl(args: EvalDeclArgs) {
  const loader = (await import(args.path)).default;

  args.target.push(new loader(args.options));
}

export async function userConf2Options(
  config: UserConfig
): Promise<BunSaiOptions> {
  const loaders: Loader[] = [];
  const middlewares: (AllMiddlewares | MiddlewareCollection)[] = [];

  if (config.loaders) {
    for (const loader of config.loaders) {
      if (typeof loader == "string") {
        await evalDecl({ path: loader, target: loaders });

        continue;
      }

      const [path, options] = loader;

      await evalDecl({
        path,
        options,
        target: loaders,
      });
    }
  }

  if (config.middlewares) {
    for (const middleware of config.middlewares) {
      if (typeof middleware == "string") {
        await evalDecl({ path: middleware, target: middlewares });

        continue;
      }

      const [path, options] = middleware;

      await evalDecl({ path, options, target: middlewares });
    }
  }

  return {
    ...config,
    loaders,
    middlewares,
  };
}
