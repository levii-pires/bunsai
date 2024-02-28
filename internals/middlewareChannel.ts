import type { MiddlewareRunner } from "../types";

export type MiddlewareRecord<MiddlewareMap extends Record<string, any>> = {
  [K in keyof MiddlewareMap]: MiddlewareChannel<MiddlewareMap[K]>;
};

const Middlewares = Symbol("MiddlewareChannel.middlewares");

export class MiddlewareChannel<Data> {
  [Middlewares]: Map<string, MiddlewareRunner<Data>> = new Map();

  /**
   * The maximum amount of middlewares on this channel.
   *
   * Initial value: `100`
   */
  limit = 100;

  /**
   * @returns the number of elements in the MiddlewareChannel
   */
  get size() {
    return this[Middlewares].size;
  }

  /**
   * @returns `limit - size`
   */
  get space() {
    return this.limit - this.size;
  }

  /**
   * @returns boolean indicating whether an element with the specified name exists or not.
   */
  has(name: string) {
    return this[Middlewares].has(name);
  }

  add(name: string, middleware: MiddlewareRunner<Data>) {
    if (typeof middleware != "function")
      throw new TypeError("middleware must be a function");

    if (this.has(name))
      throw new Error(`'${name}' already exists on this middleware channel`);

    if (!this.space) throw new Error("exceeded middleware channel limit");

    this[Middlewares].set(name, middleware);

    return this;
  }

  remove(name: string) {
    this[Middlewares].delete(name);

    return this;
  }

  clear() {
    this[Middlewares].clear();
  }

  /**
   * @param debug Check how long each middleware is taking to run
   */
  async call(data: Data, debug?: boolean) {
    for (const [name, middleware] of this[Middlewares]) {
      if (debug) console.time(`middleware: ${name}`);

      const result = await middleware(data);

      if (debug) console.timeEnd(`middleware: ${name}`);

      if (result) return result;
    }
  }

  keys() {
    return Array.from(this[Middlewares].keys());
  }

  append(child: MiddlewareChannel<Data>) {
    for (const [name, middleware] of child[Middlewares]) {
      if (!this.has(name) && this.space) this.add(name, middleware);
    }
  }

  /**
   * Will be removed on v1. Use {@link keys} instead.
   * @deprecated
   */
  listByName() {
    return this.keys();
  }

  static createRecord<MiddlewareMap extends Record<string, any>>(
    channels: readonly (keyof MiddlewareMap)[]
  ): MiddlewareRecord<MiddlewareMap> {
    return Object.fromEntries(
      channels.map((channel) => [channel, new this()])
    ) as unknown as MiddlewareRecord<MiddlewareMap>;
  }
}
