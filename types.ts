import type { BunFile, BunPlugin, MatchedRoute, Serve, Server } from "bun";
import type { ConfigureOptions, Environment } from "nunjucks";
import type { Options } from "sass";
import type { DDOSOptions } from "./middlewares/ddos";
import type { CORSOptions } from "./middlewares/cors";
import type Loader from "./internals/loader";
import type FilenameParser from "./internals/filename";
import type { MiddlewareCollection } from "./internals/middleware";

export interface BuildResult {
  /**
   * Output filename
   */
  filename: string;
  /**
   * {@link content} type:
   * - `server`: must be a {@link Module} compliant JS/TS code
   * - `browser`: must be a browser targeted JS/TS code
   * - `asset`: content will be served statically
   */
  type: "server" | "browser" | "asset";
  plugins?: BunPlugin[];
  /**
   * Which dependencies should not be bundled?
   *
   * It is not recommended to declare external deps when `type: 'browser'`,
   * as BunSai does not serve files from node_modules.
   *
   * Assets are not bundled.
   */
  external?: string[];
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

export interface Module {
  handler: ModuleHandler;
  headers?: Record<string, string>;
  /**
   * If this method is not implemented, the ModuleLoader will always run the {@link handler}.
   *
   * **NOTE:** caching is ignored in dev mode.
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
  middlewares?: (AllMiddlewares | MiddlewareCollection)[];
}

export type ResolvedBunSaiOptions = Required<BunSaiOptions>;

export interface RecommendedOpts {
  nunjucks?: ConfigureOptions;
  sass?: Options<"sync">;
  middlewares?: {
    ddos?: DDOSOptions;
    cors?: CORSOptions;
  };
}

export interface Recommended {
  /**
 * Loaders:
 * - ModuleLoader
 * - NunjucksLoader
 * - SassLoader
 * - WebLoader
 * 
 * Middlewares:
 * - DDOS
 * - CORS
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
  bunsai: Pick<
    ResolvedBunSaiOptions,
    "loaders" | "middlewares" | "staticFiles"
  >;

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

export interface BuildManifest {
  files: Record<string, BuildResult["type"]>;
  extensions: Extname[];
  version: string;
}

export type DependencyDecl = string | [string, object];

export interface UserConfig
  extends Omit<BunSaiOptions, "loaders" | "middlewares"> {
  loaders?: DependencyDecl[];
  middlewares?: DependencyDecl[];

  /**
   * @default "./pages"
   */
  output?: string;
  serve?: Omit<Serve<any>, "fetch">;
}

export interface GenericBuildArgs {
  filePath: string;
  filenameParser: FilenameParser;
}

export type BuildArgs = {};

export {};
