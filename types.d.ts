import type { BuildConfig, BunPlugin, MatchedRoute, Server } from "bun";
import type BunSai from ".";
import type { FSCache, FSCacheOptions } from "./internals";
import type { ParsedPath } from "path";

declare global {
  type Extname = `.${Lowercase<string>}`;

  type WriteInput =
    | string
    | Blob
    | NodeJS.TypedArray
    | ArrayBufferLike
    | Bun.BlobPart[];

  namespace BunSai {
    namespace Events {
      type EventHandler<Payload extends GenericPayload> = (
        payload: Payload
      ) => void | Promise<void>;

      type GetterSetter<Type> = {
        /**
         * Get or set current value
         */
        (override?: Awaited<NonNullable<Type>>): Type;
      };

      interface GenericPayload {
        server: Server | null;
        /**
         * Break event execution chain
         */
        break(): void;
      }

      interface RequestPayload extends GenericPayload {
        request: Request;
        response: GetterSetter<Response>;
      }

      interface RequestLoadPayload extends RequestPayload {
        route: MatchedRoute;
        path: string;
      }

      interface EndedPayload extends RequestPayload {}

      interface LoadedPayload extends EndedPayload {
        route: MatchedRoute;
      }

      interface ErrorPayload extends RequestPayload {
        error: unknown;
      }

      interface LifecyclePayload extends GenericPayload {
        bunsai: BunSai;
      }

      interface CachePayload extends GenericPayload {
        cache: FSCache;
        cachedFilePath?: string;
        originalFilePath?: string;
      }

      type EventMap = {
        "request.init": EventHandler<RequestPayload>;
        "request.loadInit": EventHandler<RequestLoadPayload>;
        "request.notFound": EventHandler<RequestPayload>;
        "request.loadEnd": EventHandler<LoadedPayload>;
        "request.end": EventHandler<EndedPayload>;
        "request.error": EventHandler<ErrorPayload>;

        "lifecycle.init": EventHandler<LifecyclePayload>;
        "lifecycle.reload": EventHandler<LifecyclePayload>;
        "lifecycle.shutdown": EventHandler<LifecyclePayload>;

        "cache.watch.invalidate": EventHandler<Required<CachePayload>>;
        "cache.user.write": EventHandler<Required<CachePayload>>;
        "cache.user.setup": EventHandler<CachePayload>;
        "cache.user.invalidate": EventHandler<Required<CachePayload>>;
      };
    }

    interface LoaderPayload
      extends Omit<Events.RequestLoadPayload, "break" | "response"> {}

    interface LoaderBuildConfig
      extends Pick<
        BuildConfig,
        | "define"
        | "external"
        | "loader"
        | "target"
        | "sourcemap"
        | "plugins"
        | "publicPath"
        | "naming"
      > {
      target: "bun" | "browser";
    }

    interface Loader {
      readonly extensions: readonly Extname[];

      setup(bunsai: BunSai): void | BunPlugin[] | Promise<void | BunPlugin[]>;
      build?(): LoaderBuildConfig | Promise<LoaderBuildConfig>;
      load?(filePath: string): LoaderLoadResult | Promise<LoaderLoadResult>;
    }

    interface LoaderLoadResult {
      input: WriteInput;
      type: OutputType;
      responseInit?: ResponseInit;
    }

    interface ResponseInit {
      headers?: Record<string, string>;
      status?: number;
      statusText?: string;
    }

    type OutputType = "module" | "file";

    type Manifest = Record<
      string,
      {
        path: string;
        type: OutputType;
        responseInit: ResponseInit | null;
      }
    >;

    interface Options {
      /**
       * @default "./pages"
       */
      dir?: string;

      /**
       * @default process.env.NODE_ENV !== "production"
       */
      dev?: boolean;

      /**
       * The options to use when creating the router
       */
      router?: Omit<
        ConstructorParameters<typeof Bun.FileSystemRouter>[0],
        "style" | "fileExtensions" | "dir"
      >;

      cache?: Omit<FSCacheOptions, "events" | "dev">;

      staticFiles?: Extname[];

      loaders?: Loader[];
    }

    interface ModuleResponse {
      result: Response;
      invalidate?: Date;
    }

    export type ModuleHandler = (
      payload: LoaderPayload
    ) => ModuleResponse | Promise<ModuleResponse>;

    type ResolvedOptions = Required<Options>;

    interface BuildRoute {
      path: ParsedPath;
      matcher: string;
      filePath: string;
    }
  }
}
