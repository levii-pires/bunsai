import type { BunFile, MatchedRoute, Server } from "bun";
import type { ConfigureOptions, Environment } from "nunjucks";
import type { Options } from "sass";
import type { DDOSOptions } from "./middlewares/ddos";
import type { CORSOptions } from "./middlewares/cors";

export type Loader = (
  filePath: string,
  data: RequestData
) => Response | Promise<Response>;

export type LoaderInitiator = (
  bunsaiOpts: ResolvedBunSaiOptions
) => Loader | Promise<Loader>;

export type ModuleContent =
  | BunFile
  | Blob
  | string
  | ArrayBuffer
  | Buffer
  | Response;

export interface RequestData {
  request: Request;
  route: MatchedRoute;
  server: Server;
}

export type ModuleHandler = (
  data: RequestData
) => ModuleContent | Promise<ModuleContent>;

export type CacheInvalidateHandler = (data: RequestData) => boolean;

/**
 * Implemented by the [`ModuleLoader`](./loaders/module.ts)
 */
export interface Module {
  handler: ModuleHandler;
  headers?: Record<string, string>;
  /**
   * If this method is not implemented, the ModuleLoader will always run the {@link handler}.
   *
   * **NOTE:** caching is ignored if {@link ResolvedBunSaiOptions.dev} is true.
   */
  invalidate?: CacheInvalidateHandler;
}

export type Extname = `.${Lowercase<string>}`;

export type LoaderMap = Record<Extname, Loader | Promise<Loader>>;

export type LoaderInitMap = Record<Extname, LoaderInitiator>;

export interface BunSaiOptions {
  /**
   * The root dir.
   * @default "./pages"
   */
  dir?: string;
  /**
   * @default ""
   */
  assetPrefix?: string;
  /**
   * @default ""
   */
  origin?: string;
  /**
   * @default
   * process.env.NODE_ENV !== 'production'
   */
  dev?: boolean;
  /**
   * @default {}
   * 
   * 
   * @example
   * loaders: {
    ".njk": nunjucksLoaderInit,
    ".ts": apiLoaderInit,
    ".tsx": reactLoaderInit,
    ".svelte": svelteLoaderInit,
    ".vue": vueLoaderInit,
    }
   */
  loaders?: LoaderInitMap;
  /**
   * @default []
   *
   * Specify files to be served statically by file extension
   * @example
   * [".html", ".png"]
   */
  staticFiles?: Extname[];
  /**
   * @default []
   */
  middlewares?: AllMiddlewares[];
}

export type ResolvedBunSaiOptions = Required<BunSaiOptions>;

export interface RecommendedOpts {
  nunjucks?: {
    options?: ConfigureOptions;
  };
  sass?: { options?: Options<"sync"> };
  middlewares?: {
    ddos?: DDOSOptions;
    cors?: CORSOptions;
  };
}

/**
 * Recommended loaders and static files
 */
export interface Recommended {
  /**
     * @default
     *  {
     *      ".ts": Loader;
     *      ".tsx": Loader;
            ".njk": Loader;
            ".scss": Loader;
        }
     */
  loaders: LoaderInitMap;
  /**
     * @default
     // web formats
      ".html",
      ".css",
      ".js",
      ".json",
      ".txt",

      // media formats
      ".webp",
      ".gif",
      ".mp4",
      ".mov",
      ".ogg",
      ".mp3",
      ".aac",

      // font formats
      ".ttf",
      ".otf",
      ".woff",
      ".woff2",
     */
  staticFiles: Extname[];

  middlewares: AllMiddlewares[];

  /**
   * Undefined before loader initiation.
   *
   * This property is deprecated and will be removed on v1.
   * Use {@link nunjucks} instead.
   *
   * @deprecated
   */
  readonly nunjucksEnv: Environment | undefined;

  nunjucks: {
    /**
     * Undefined before loader initiation.
     */
    env(): Environment | undefined;
  };
}

export interface IMiddleware<
  Runs extends keyof BunSaiMiddlewareRecord = keyof BunSaiMiddlewareRecord
> {
  name: string;
  runsOn: Runs;
  runner: MiddlewareRunner<BunSaiMiddlewareRecord[Runs]>;
}

export type AllMiddlewares<K = keyof BunSaiMiddlewareRecord> =
  K extends keyof BunSaiMiddlewareRecord ? IMiddleware<K> : never;

export type MiddlewareResult = Response | void;

export type MiddlewareRunner<Data> = (
  data: Data
) => MiddlewareResult | Promise<MiddlewareResult>;

export type MiddlewareRunnerWithThis<Data, This = any> = (
  this: This,
  data: Data
) => MiddlewareResult | Promise<MiddlewareResult>;

export interface BunSaiMiddlewareRecord {
  response: {
    response: Response;
    request: Request;
    server: Server;
    route: MatchedRoute;
  };
  request: {
    request: Request;
    server: Server;
  };
  notFound: {
    request: Request;
    server: Server;
  };
  error: {
    request: Request;
    server: Server;
    error: unknown;
  };
}

export {};
