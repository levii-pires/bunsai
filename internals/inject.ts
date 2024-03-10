import type { AllMiddlewares, BunSaiMiddlewareRecord } from "..";
import type { MiddlewareRecord } from "./middlewareChannel";
import Middleware from "./middleware";
import { MiddlewareCollection } from "./middleware";

function insert(
  middlewares: MiddlewareRecord<BunSaiMiddlewareRecord>,
  instance: AllMiddlewares
) {
  middlewares[instance.runsOn].add(
    instance.name,
    // @ts-ignore
    (data) => instance.runner(data)
  );
}

/**
 * Inject the {@link Host} into the BunSai MiddlewareRecord
 *
 * @param this The Host. Must extend {@link Middleware}
 */
export function inject<
  Host extends new (...args: any[]) => AllMiddlewares | MiddlewareCollection
>(
  this: Host,
  middlewares: MiddlewareRecord<BunSaiMiddlewareRecord>,
  ...args: ConstructorParameters<Host>
) {
  const instance = new this(...args);

  if (instance instanceof MiddlewareCollection) {
    const onRemove: (() => void)[] = [];

    for (const mid of instance.list) {
      insert(middlewares, mid);
      onRemove.push(() => middlewares[mid.runsOn].remove(mid.name));
    }

    return {
      instance: instance as InstanceType<Host>,
      remove() {
        onRemove.forEach((fn) => fn());
      },
    };
  }

  if (instance instanceof Middleware) {
    insert(middlewares, instance);

    return {
      instance: instance as InstanceType<Host>,
      remove() {
        middlewares[instance.runsOn].remove(instance.name);
      },
    };
  }

  throw new TypeError(
    "middleware must be an instance of Middleware or MiddlewareCollection"
  );
}
