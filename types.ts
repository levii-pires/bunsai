import type { MatchedRoute, Server } from "bun";
import type { ConfigureOptions, Environment } from "nunjucks";
import type { Options } from "sass";

export type Loader = (
  filePath: string,
  data: ModuleData
) => Response | Promise<Response>;

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

export interface BunSaiOptions {
  /**
   * This option only applies to the `Bun.FileSystemRouter`.
   * All loaders that use a root folder must use the same configuration.
   * @default "./pages"
   */
  dir?: string;
  assetPrefix?: string;
  origin?: string;
  dev?: boolean;
  loaders: LoaderMap;
  /**
   * Specify files to be served statically by file extension
   * @example
   * [".html", ".png"]
   */
  staticFiles?: Extname[];
}

export interface RecommendedOpts {
  nunjucks?: {
    /**
     * @default "./pages"
     */
    path?: string;
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
  loaders: LoaderMap;
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
  nunjucksEnv: Environment;
}

export interface BunSaiInstance {
  reloadRouter(): void;

  addMiddleware(
    name: string,
    type: "response",
    middleware: ResponseMiddleware
  ): this;
  addMiddleware(
    name: string,
    type: "request",
    middleware: RequestMiddleware
  ): this;

  removeMiddleware(name: string, type: "response" | "request"): this;

  fetch(request: Request, server: Server): Promise<Response>;
}

export type MiddlewareResult = Response | void;

export type RequestMiddleware = (
  request: Request,
  server: Server
) => MiddlewareResult | Promise<MiddlewareResult>;

export type ResponseMiddleware = (
  response: Response,
  request: Request,
  server: Server
) => MiddlewareResult | Promise<MiddlewareResult>;

export {};
