import type { MatchedRoute, Server } from "bun";
import type BunSai from ".";
import type TypedEventEmitter from "typed-emitter";

declare global {
  namespace BunSaiTypes {
    export namespace Events {
      type EventHandler<Payload extends GenericPayload> = (
        payload: Payload
      ) => void;

      type GetterSetter<Type> = {
        /**
         * Get current
         */
        (): Type;
        /**
         * Override current
         */
        (override: Awaited<NonNullable<Type>>, breakExecution?: boolean): void;
      };

      interface GenericPayload {
        server: Server;
        break(): void;
      }

      interface RequestPayload extends GenericPayload {
        request: Request;
      }

      interface EndedPayload extends RequestPayload {
        response: GetterSetter<Response>;
      }

      interface LoadedPayload extends EndedPayload {
        route: MatchedRoute;
      }

      interface ErrorPayload extends RequestPayload {
        error: unknown;
        response: GetterSetter<Response | null>;
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

      export type EventEmitter = TypedEventEmitter<EventMap>;
    }
  }
}
