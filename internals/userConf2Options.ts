import type { UserConfig, BunSaiOptions, AllMiddlewares } from "../types";
import type { MiddlewareCollection } from "./middleware";
import type Loader from "./loader";
import { resolveModule } from "./resolveModule";

interface EvalDeclArgs {
  path: string;
  target: any[];
  options?: any;
}

async function evalDecl(args: EvalDeclArgs, userConfigFilePath: string) {
  const item = (await import(resolveModule(args.path, userConfigFilePath)))
    .default;

  args.target.push(new item(args.options));
}

export async function userConf2Options(
  config: UserConfig,
  userConfigFilePath: string
): Promise<BunSaiOptions> {
  const loaders: Loader[] = [];
  const middlewares: (AllMiddlewares | MiddlewareCollection)[] = [];

  if (config.loaders) {
    for (const loader of config.loaders) {
      if (typeof loader == "string") {
        await evalDecl({ path: loader, target: loaders }, userConfigFilePath);

        continue;
      }

      const [path, options] = loader;

      await evalDecl({ path, options, target: loaders }, userConfigFilePath);
    }
  }

  if (config.middlewares) {
    for (const middleware of config.middlewares) {
      if (typeof middleware == "string") {
        await evalDecl(
          { path: middleware, target: middlewares },
          userConfigFilePath
        );

        continue;
      }

      const [path, options] = middleware;

      await evalDecl(
        { path, options, target: middlewares },
        userConfigFilePath
      );
    }
  }

  return {
    ...config,
    loaders,
    middlewares,
  };
}
