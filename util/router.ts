import { MiddlewareChannel } from "../internals";
import type { MatchedRoute } from "bun";
import type { MiddlewareResult, ModuleData, ModuleHandler } from "../types";

type Methods = typeof methods extends readonly (infer T)[] ? T : never;

export type RouteHandlerData = ModuleData & {
  locals: Record<string, any>;
};

type RouterChannelRecord = Record<Methods, RouteHandlerData>;

export type RouteHandler = (
  data: RouteHandlerData
) => MiddlewareResult | Promise<MiddlewareResult>;

type RouteMatcher = string | RegExp | ((route: MatchedRoute) => boolean);

type RouteMethod = (
  matcher: RouteMatcher,
  ...handlers: RouteHandler[]
) => Router;

type RouteMethodRecord = Record<
  Lowercase<keyof RouterChannelRecord> | "all",
  RouteMethod
>;

function shouldHandleRequest(matcher: RouteMatcher, route: MatchedRoute) {
  const normalizedPathname = new URL(route.pathname, "http://a.b/").pathname;

  if (typeof matcher == "string") {
    if (matcher === "*") return true;

    return matcher.endsWith(normalizedPathname);
  }

  if (matcher instanceof RegExp) return matcher.test(normalizedPathname);

  if (typeof matcher == "function") return matcher(route);

  return false;
}

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
  childRoutes: Router[] = [];

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

  protected register(
    key: keyof RouterChannelRecord,
    matcher: RouteMatcher,
    handlers: RouteHandler[]
  ) {
    this.record[key].add(
      (matcher as Function).name || matcher.toString(),
      async (data) => {
        if (!shouldHandleRequest(matcher, data.route)) return;

        for (const handler of handlers) {
          const response = await handler(data);

          if (response) return response;
        }
      }
    );
  }

  get handler(): ModuleHandler {
    const that = this;

    return async ({ request, route, server }) => {
      const channel = that.record[request.method as Methods];

      if (!channel)
        throw new Error(`could not find channel for '${request.method}'`);

      if (channel.keys().length == 0) return;

      const result = await channel.call({
        request,
        route,
        server,
        locals: {},
      });

      if (!result) throw new Error(`channel call must return Response`);

      return result;
    };
  }
}
