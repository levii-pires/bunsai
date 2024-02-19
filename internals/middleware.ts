import type { Middleware } from "../types";

export type MiddlewareRecord<MiddlewareMap extends Record<string, any>> = {
  [K in keyof MiddlewareMap]: MiddlewareChannel<MiddlewareMap[K]>;
};

export default class MiddlewareChannel<Data> {
  protected middlewares: Record<string, Middleware<Data>> = {};

  /**
   * The maximum amount of middlewares on this channel.
   *
   * Initial value: `100`
   */
  limit = 100;

  add(name: string, middleware: Middleware<Data>) {
    if (typeof middleware != "function")
      throw new TypeError("middleware must be a function");

    if (name in this.middlewares)
      throw new Error(`'${name}' already exists on this middleware channel`);

    if (Object.keys(this.middlewares).length + 1 > this.limit)
      throw new Error("exceeded middleware channel limit");

    this.middlewares[name] = middleware;

    return this;
  }

  remove(name: string) {
    delete this.middlewares[name];

    return this;
  }

  /**
   * @param debug Check how long each middleware is taking to run
   */
  async call(data: Data, debug?: boolean) {
    for (const [name, middleware] of Object.entries(this.middlewares)) {
      if (debug) console.time(`middleware: ${name}`);

      const result = await middleware(data);

      if (debug) console.timeEnd(`middleware: ${name}`);

      if (result) return result;
    }
  }

  listByName() {
    return Object.keys(this.middlewares);
  }

  static createMiddlewareRecord<MiddlewareMap extends Record<string, any>>(
    channels: Array<keyof MiddlewareMap>
  ): MiddlewareRecord<MiddlewareMap> {
    return Object.fromEntries(
      channels.map((channel) => [channel, new this()])
    ) as unknown as MiddlewareRecord<MiddlewareMap>;
  }
}
