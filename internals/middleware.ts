import type { Middleware } from "../types";

export type MiddlewareRecord<MiddlewareMap extends Record<string, any>> = {
  [K in keyof MiddlewareMap]: MiddlewareChannel<MiddlewareMap[K]>;
};

export default class MiddlewareChannel<Data> {
  protected middlewares: Record<string, Middleware<Data>> = {};

  /**
   * The maximum amount of middlewares on this channel
   * @default 100
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

  async call(data: Data) {
    for (const middleware of Object.values(this.middlewares)) {
      const result = await middleware(data);

      if (result) return result;
    }
  }

  listByName() {
    return Object.keys(this.middlewares);
  }

  static createMiddlewareRecord<MiddlewareMap extends Record<string, any>>(
    channels: (keyof MiddlewareMap)[]
  ): MiddlewareRecord<MiddlewareMap> {
    return Object.fromEntries(
      channels.map((channel) => [channel, new this()])
    ) as unknown as MiddlewareRecord<MiddlewareMap>;
  }
}
