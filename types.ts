import type { MatchedRoute, Server } from "bun";
import type { ConfigureOptions, Environment } from "nunjucks";
import type { Options } from "sass";

export type Loader = (
  filePath: string,
  data: ModuleData
) => Response | Promise<Response>;

export type LoaderInitiator = (bunsaiOpts: ResolvedBunSaiOptions) => Loader;

export type ModuleContent = BodyInit | Response;

export interface ModuleData {
  request: Request;
  route: MatchedRoute;
  server: Server;
}

export type ModuleHandler = (
  data: ModuleData
) => ModuleContent | Promise<ModuleContent>;

/**
 * Implemented by the [`ModuleLoader`](./loaders/module.ts)
 */
export interface Module {
  handler: ModuleHandler;
  headers?: Record<string, string>;
}

export type Extname = `.${Lowercase<string>}`;

export type LoaderMap = Record<Extname, Loader>;

export type LoaderInitMap = Record<Extname, LoaderInitiator>;

export interface BunSaiOptions {
  /**
   * The root dir.
   * @default "./pages"
   */
  dir?: string;
  assetPrefix?: string;
  origin?: string;
  dev?: boolean;
  /**
   * @example
   * loaders: {
    ".njk": nunjucksLoaderInit,
    ".ts": apiLoaderInit,
    ".tsx": reactLoaderInit,
    ".svelte": svelteLoaderInit,
    ".vue": vueLoaderInit,
    }
   */
  loaders: LoaderInitMap;
  /**
   * Specify files to be served statically by file extension
   * @example
   * [".html", ".png"]
   */
  staticFiles?: Extname[];
}

export type ResolvedBunSaiOptions = Required<BunSaiOptions>;

export interface RecommendedOpts {
  nunjucks?: {
    options?: ConfigureOptions;
  };
  sass?: { options?: Options<"sync"> };
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
  /**
   * Undefined before loader initiation
   */
  readonly nunjucksEnv: Environment | undefined;
}

export type MiddlewareResult = Response | void;

export type Middleware<Data> = (
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
