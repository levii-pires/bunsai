import type { BuildConfig, BunFile, MatchedRoute, Server } from "bun";
import type { ConfigureOptions, Environment } from "nunjucks";
import type { Options } from "sass";
import type { DDOSOptions } from "./middlewares/ddos";
import type { CORSOptions } from "./middlewares/cors";
import type Loader from "./internals/loader";
import type BunSai from ".";

export interface BuildResult {
  /**
   * @default parseFilename("$name$ext")
   */
  filename?: string;
  serve: "module" | "bundle" | "static" | "loader";
  bundleConfig?: Omit<
    BuildConfig,
    "entrypoints" | "target" | "splitting" | "minify"
  >;
  content: Blob | NodeJS.TypedArray | ArrayBufferLike | string | Bun.BlobPart[];
}

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

export interface ModuleData extends RequestData {}

export type ModuleHandler = (
  data: ModuleData
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

export type LoaderMap = Map<Extname, Loader>;

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
   * @default []
   *
   *
   * @example
   * loaders: [new NunjucksLoader(), new SassLoader()]
   */
  loaders?: Loader[];
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
  bunsai?: Omit<BunSaiOptions, "loaders" | "staticFiles" | "middlewares">;
  nunjucks?: ConfigureOptions;
  sass?: Options<"sync">;
  middlewares?: {
    ddos?: DDOSOptions;
    cors?: CORSOptions;
  };
}

/**
 * Create BunSai instance with recommended loaders and static files.
 * 
 * Loaders:
 * - ModuleLoader
 * - NunjucksLoader
 * - SassLoader
 * 
 * Static files:
 *  
 * // web formats
      - ".html",
      - ".css",
      - ".js",
      - ".json",
      - ".txt",

      // media formats
      - ".webp",
      - ".gif",
      - ".mp4",
      - ".mov",
      - ".ogg",
      - ".mp3",
      - ".aac",
      - ".ico",

      // font formats
      - ".ttf",
      - ".otf",
      - ".woff",
      - ".woff2",
 */
export interface Recommended {
  bunsai: BunSai;

  nunjucks: {
    /**
     * null before loader initiation.
     */
    env(): Environment | null;
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
  end: {
    response: Response;
    request: Request;
    server: Server;
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
