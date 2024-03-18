import type { MatchedRoute, Server } from "bun";
import type BunSai from ".";
import type { FSCache, FSCacheOptions } from "./internals";
import type { ParsedPath } from "path";

declare global {
  type Extname = `.${Lowercase<string>}`;

  namespace BunSaiEvents {
    type EventHandler<Payload extends GenericPayload> = (
      payload: Payload
    ) => void | Promise<void>;

    type GetterSetter<Type> = {
      /**
       * Get or set current
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
      path: ParsedPath;
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
      "request.load": EventHandler<RequestLoadPayload>;
      "request.notFound": EventHandler<RequestPayload>;
      "request.loaded": EventHandler<LoadedPayload>;
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

  interface BunSaiLoader {
    extensions: Extname[];
    setup(bunsai: BunSai): void | Promise<void>;
    load(
      payload: Omit<BunSaiEvents.RequestLoadPayload, "break" | "response">
    ): Response | Promise<Response>;
  }

  interface BunSaiOptions {
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

    loaders?: BunSaiLoader[];
  }

  type ResolvedBunSaiOptions = Required<BunSaiOptions>;
}
