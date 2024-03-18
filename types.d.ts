import type { MatchedRoute, Server } from "bun";
import type BunSai from ".";
import type { FSCache } from "./internals";
import { ParsedPath } from "path";

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
      response: GetterSetter<Response | null>;
    }

    interface RequestLoadPayload extends RequestPayload {
      route: MatchedRoute;
      filePath: ParsedPath;
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

      "cache.system.invalidate": EventHandler<CachePayload>;
      "cache.user.write": EventHandler<CachePayload>;
      "cache.user.setup": EventHandler<CachePayload>;
      "cache.user.invalidate": EventHandler<CachePayload>;
    };
  }

  interface BunSaiLoader {
    extensions: Extname[];
    setup(bunsai: BunSai): void | Promise<void>;
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

    staticFiles?: Extname[];

    loaders?: BunSaiLoader[];
  }

  type ResolvedBunSaiOptions = Required<BunSaiOptions>;
}
