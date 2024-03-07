import type {
  MiddlewareResult,
  Module,
  ModuleData,
  ModuleHandler,
} from "../types";
import MiddlewareChannel from "../internals/middlewareChannel";

type Methods = typeof methods extends readonly (infer T)[] ? T : never;

export type RouteHandlerData = ModuleData & {
  // internal use
  [RouterMatch]: boolean;
  /**
   * Share information between handlers
   */
  locals: Record<string, any>;
  /**
   * Share response between handlers.
   *
   * Initial value: `null`
   */
  response(): Response | null;

  /**
   * Share response between handlers.
   *
   * Setting a response exempts you from the need to `return new Response()`, since the Router handler has access to the Response passed to this function.
   * In fact, the handler will give preference to this Response over the Response returned by the handlers.
   *
   * @param response set new response
   */
  response(response: Response): void;
};

type RouterChannelRecord = Record<Methods, RouteHandlerData>;

export type RouteHandler = (
  data: RouteHandlerData
) => MiddlewareResult | Promise<MiddlewareResult>;

type RouteMatcherPrimitives =
  | string
  | RegExp
  | ((data: RouteHandlerData) => boolean);

export type RouteMatcher = RouteMatcherPrimitives | RouteMatcherPrimitives[];

type RouteMethod = (
  matcher: RouteMatcher,
  ...handlers: RouteHandler[]
) => Router;

type RouteMethodRecord = Record<
  Lowercase<keyof RouterChannelRecord> | "all",
  RouteMethod
>;

function shouldHandleRequest(
  matcher: RouteMatcher,
  data: RouteHandlerData
): boolean {
  const { pathname } = new URL(data.request.url);

  if (matcher == "*") return true;

  if (matcher instanceof RegExp) return matcher.test(pathname);

  if (typeof matcher == "string") return matcher.endsWith(pathname);

  if (typeof matcher == "function") return matcher(data);

  if (Array.isArray(matcher))
    return matcher.some((m) => shouldHandleRequest(m, data));

  return false;
}

const RouterMatch = Symbol("RouterMatch");

const methods = [
  "GET",
  "HEAD",
  "PUT",
  "PATCH",
  "POST",
  "DELETE",
  "OPTIONS",
] as const;

export default class Router implements RouteMethodRecord {
  record = MiddlewareChannel.createRecord<RouterChannelRecord>(methods);

  get(matcher: RouteMatcher, ...handlers: RouteHandler[]) {
    this.register("GET", matcher, handlers);

    return this;
  }

  post(matcher: RouteMatcher, ...handlers: RouteHandler[]) {
    this.register("POST", matcher, handlers);

    return this;
  }

  put(matcher: RouteMatcher, ...handlers: RouteHandler[]) {
    this.register("PUT", matcher, handlers);

    return this;
  }

  head(matcher: RouteMatcher, ...handlers: RouteHandler[]) {
    this.register("HEAD", matcher, handlers);

    return this;
  }

  patch(matcher: RouteMatcher, ...handlers: RouteHandler[]) {
    this.register("PATCH", matcher, handlers);

    return this;
  }

  delete(matcher: RouteMatcher, ...handlers: RouteHandler[]) {
    this.register("DELETE", matcher, handlers);

    return this;
  }

  options(matcher: RouteMatcher, ...handlers: RouteHandler[]) {
    this.register("OPTIONS", matcher, handlers);

    return this;
  }

  all(matcher: RouteMatcher, ...handlers: RouteHandler[]) {
    for (const method of methods) {
      this.register(method, matcher, handlers);
    }

    return this;
  }

  append(child: Router) {
    for (const method of methods) {
      this.record[method].append(child.record[method]);
    }

    return this;
  }

  protected register(
    key: keyof RouterChannelRecord,
    matcher: RouteMatcher,
    handlers: RouteHandler[]
  ) {
    this.record[key].add(
      (matcher as Function).name ?? matcher.toString(),
      async (data) => {
        if (!shouldHandleRequest(matcher, data)) return;

        data[RouterMatch] = true;

        for (const handler of handlers) {
          const result = await handler(data);

          if (result) return result;
        }

        return (
          data.response() ||
          new Response(null, {
            status: 501,
            statusText: `'${data.route.pathname}' handlers returned nothing`,
          })
        );
      }
    );
  }

  /**
   * Use {@link createHandler} instead.
   * @deprecated
   */
  get handler() {
    console.warn("Router#handler is deprecated. Use Router#getHandler instead");
    return this.createHandler();
  }

  createHandler(): ModuleHandler {
    const that = this;

    return async function RouterHandler({ request, route, server }) {
      const channel = that.record[request.method as Methods];

      if (!channel)
        throw new Error(`could not find channel for '${request.method}'`);

      if (channel.size == 0) return new Response(null, { status: 405 });

      let response: Response | null = null;

      const data: RouteHandlerData = {
        request,
        route,
        server,
        locals: {},
        // @ts-ignore
        response(res) {
          if (res) response = res;
          else return response;
        },
      };

      const channelResponse = await channel.call(data);

      if (!data[RouterMatch]) return new Response(null, { status: 404 });

      return channelResponse!;
    };
  }

  /**
   * v0.4: This function currently does not make assumptions about cache invalidation
   */
  createModule(): Module {
    return {
      handler: this.createHandler(),
    };
  }
}
