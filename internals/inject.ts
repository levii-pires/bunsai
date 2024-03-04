import type { AllMiddlewares, BunSaiMiddlewareRecord } from "..";
import type Middleware from "./middleware";
import type { MiddlewareRecord } from "./middlewareChannel";

/**
 * Inject the {@link Host} into the BunSai MiddlewareRecord
 *
 * @param this The Host. Must extend {@link Middleware}
 */

export function inject<Host extends new (...args: any[]) => AllMiddlewares>(
  this: Host,
  middlewares: MiddlewareRecord<BunSaiMiddlewareRecord>,
  ...args: ConstructorParameters<Host>
) {
  const instance = new this(...args);

  // @ts-ignore
  middlewares[instance.runsOn].add(
    instance.name,
    // @ts-ignore
    (data) => instance.runner(data)
  );

  return {
    instance: instance as InstanceType<Host>,
    remove() {
      middlewares[instance.runsOn].remove(instance.name);
    },
  };
}
