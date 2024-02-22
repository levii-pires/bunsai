import type BunSai from "..";
import type { Middleware } from "./middleware";

/**
 * Inject the {@link Host} into the BunSai MiddlewareRecord
 *
 * @param this The Host. Must extend {@link Middleware}
 */

export function inject<Host extends new (...args: any[]) => Middleware>(
  this: Host,
  middlewares: BunSai["middlewares"],
  ...args: ConstructorParameters<Host>
) {
  const instance = new this(...args);

  middlewares[instance.runsOn].add(instance.name, instance.runner);

  return {
    instance: instance as InstanceType<Host>,
    remove() {
      middlewares[instance.runsOn].remove(instance.name);
    },
  };
}
