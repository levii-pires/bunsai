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
  const module = await resolveModule(args.path, userConfigFilePath);
  const item = (await import(module)).default;

  args.target.push(new item(args.options));

  return module;
}

export interface UserConfigEval {
  options: BunSaiOptions;
  modules: string[];
}

export async function evalUserConfig(
  config: UserConfig,
  userConfigFilePath: string
): Promise<UserConfigEval> {
  const loaders: Loader[] = [];
  const middlewares: (AllMiddlewares | MiddlewareCollection)[] = [];
  const modules: string[] = [];

  if (config.loaders) {
    for (const loader of config.loaders) {
      if (typeof loader == "string") {
        modules.push(
          await evalDecl({ path: loader, target: loaders }, userConfigFilePath)
        );

        continue;
      }

      const [path, options] = loader;

      modules.push(
        await evalDecl({ path, options, target: loaders }, userConfigFilePath)
      );
    }
  }

  if (config.middlewares) {
    for (const middleware of config.middlewares) {
      if (typeof middleware == "string") {
        modules.push(
          await evalDecl(
            { path: middleware, target: middlewares },
            userConfigFilePath
          )
        );

        continue;
      }

      const [path, options] = middleware;

      modules.push(
        await evalDecl(
          { path, options, target: middlewares },
          userConfigFilePath
        )
      );
    }
  }

  return {
    options: {
      ...config,
      loaders,
      middlewares,
    },
    modules,
  };
}
