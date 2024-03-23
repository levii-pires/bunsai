import type { BuildConfig, BunPlugin, MatchedRoute, Server } from "bun";
import type BunSai from ".";
import type { EventEmitter, FSCache, FSCacheOptions } from "./internals";
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
        (newValue?: Awaited<NonNullable<Type>>): Type;
      };

      interface GenericPayload {
        server: Server | null;
        /**
         * Break event execution chain
         */
        breakChain(): void;
      }

      interface RequestPayload extends GenericPayload {
        request: Request;
        response: GetterSetter<Response>;
      }

      interface LoadInitPayload extends RequestPayload {
        route: MatchedRoute;
        path: string;
      }

      interface EndedPayload extends RequestPayload {}

      interface LoadEndPayload extends EndedPayload {
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
        /**
         * On watch change, if `type == 'add'`, cachedFilePath will be an empty string
         * because the file was recently added and thus not cached.
         */
        cachedFilePath: string;
        originalFilePath: string;
      }

      interface WatchChangePayload extends CachePayload {
        type: "change" | "unlink" | "add";
      }

      type EventMap = {
        "request.init": EventHandler<RequestPayload>;
        "request.loadInit": EventHandler<LoadInitPayload>;
        "request.notFound": EventHandler<RequestPayload>;
        "request.loadEnd": EventHandler<LoadEndPayload>;
        "request.end": EventHandler<EndedPayload>;
        "request.error": EventHandler<ErrorPayload>;

        "lifecycle.init": EventHandler<LifecyclePayload>;
        "lifecycle.reload": EventHandler<LifecyclePayload>;
        "lifecycle.shutdown": EventHandler<LifecyclePayload>;

        "watch.change": EventHandler<WatchChangePayload>;

        "cache.write": EventHandler<CachePayload>;
        "cache.setup": EventHandler<
          Omit<CachePayload, "cachedFilePath" | "originalFilePath">
        >;
        "cache.invalidate": EventHandler<CachePayload>;
      };
    }

    interface Middleware {
      subscribe(events: EventEmitter): void;
      unsubscribe(): void;
    }

    interface LoaderPayload
      extends Omit<Events.LoadInitPayload, "breakChain" | "response"> {}

    interface LoaderBuildConfig
      extends Pick<BuildConfig, "define" | "external" | "loader" | "plugins"> {
      target: "bun" | "browser";
    }

    type BuildTarget = Required<LoaderBuildConfig> & { entries: string[] };

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

    interface Manifest {
      [x: string]: {
        path: string;
        type: OutputType;
        responseInit: ResponseInit | null;
      };
    }

    interface BuildInput {
      path: ParsedPath;
      matcher: string;
      filePath: string;
    }

    interface Options {
      /**
       * @default "./app"
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

      middlewares?: Middleware[];
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
