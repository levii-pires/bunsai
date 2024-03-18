import type { MatchedRoute, Server } from "bun";
import type BunSai from ".";

declare global {
  namespace BunSaiTypes {
    type EventHandler<Payload extends GenericPayload> = (
      payload: Payload
    ) => void | Promise<void>;

    type GetterSetter<Type, This> = {
      /**
       * Get or set current
       * @param breakExecution Only takes effect if `override` is set.
       */
      (
        this: This,
        override?: Awaited<NonNullable<Type>>,
        breakExecution?: undefined
      ): Type;
    };

    interface GenericPayload {
      server: Server;
      break(): void;
    }

    interface RequestPayload extends GenericPayload {
      request: Request;
    }

    interface EndedPayload extends RequestPayload {
      response: GetterSetter<Response, EndedPayload>;
    }

    interface LoadedPayload extends EndedPayload {
      route: MatchedRoute;
    }

    interface ErrorPayload extends RequestPayload {
      error: unknown;
      response: GetterSetter<Response | null, ErrorPayload>;
    }

    interface LifecyclePayload extends GenericPayload {
      bunsai: BunSai;
    }

    type EventMap = {
      "request.init": EventHandler<RequestPayload>;
      "request.notFound": EventHandler<RequestPayload>;
      "request.response": EventHandler<LoadedPayload>;
      "request.end": EventHandler<EndedPayload>;
      "request.error": EventHandler<ErrorPayload>;

      "lifecycle.init": EventHandler<LifecyclePayload>;
      "lifecycle.reload": EventHandler<LifecyclePayload>;
      "lifecycle.shutdown": EventHandler<LifecyclePayload>;
    };
  }
}
