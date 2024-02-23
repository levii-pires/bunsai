import { MatchedRoute, Server } from "bun";
import { Middleware } from "../internals";
import { MiddlewareRunnerWithThis } from "../types";

export interface CORSOptions {
  /**
   * @default "*"
   */
  origin?:
    | boolean
    | string
    | RegExp
    | Array<string | RegExp>
    | ((request: Request) => string | false);

  /**
   * @default "GET,HEAD,PUT,PATCH,POST,DELETE"
   */
  methods?: string | string[];

  /**
   * @default // reflect 'Access-Control-Request-Headers'
   */
  allowedHeaders?: string | string[];

  exposedHeaders?: string | string[];

  credentials?: boolean;

  maxAge?: number;

  /**
   * @default 204
   */
  optionsSuccessStatus?: number;
}

function parseStringOrArray(input: string | string[]) {
  if (Array.isArray(input)) return input.join(",");

  return input;
}

function resolveOrigin(
  options: CORSOptions,
  requestOrigin: string,
  request: Request
) {
  switch (typeof options.origin) {
    case "undefined": {
      return "*";
    }
    case "boolean": {
      return requestOrigin;
    }
    case "object": {
      if (Array.isArray(options.origin)) {
        const match = options.origin.some((v) => {
          if (v instanceof RegExp) {
            return v.test(requestOrigin);
          } else return v == requestOrigin;
        });

        if (match) return requestOrigin;
        else return false;
      }

      if (
        options.origin instanceof RegExp &&
        options.origin.test(requestOrigin)
      )
        return requestOrigin;
      else return false;
    }
    case "function": {
      return options.origin(request);
    }
    case "string": {
      return options.origin;
    }
    default: {
      return false;
    }
  }
}

export class CORSPreflight extends Middleware<"request"> {
  name = "@builtin.cors.preflight";
  runsOn = "request" as const;

  constructor(public readonly options: CORSOptions = {}) {
    super();
  }

  protected $runner: MiddlewareRunnerWithThis<
    {
      request: Request;
      server: Server;
    },
    CORSPreflight
  > = function ({ request }) {
    const requestOrigin = request.headers.get("Origin");

    if (
      request.method != "OPTIONS" ||
      !requestOrigin ||
      this.options.origin === false
    )
      return;

    const allowOrigin = resolveOrigin(this.options, requestOrigin, request);

    if (!allowOrigin) return new Response(null, { status: 403 });

    const response = new Response(null, {
      status: this.options.optionsSuccessStatus || 204,
    });

    request.headers.set("Access-Control-Allow-Origin", allowOrigin);

    request.headers.set(
      "Access-Control-Allow-Methods",
      parseStringOrArray(
        this.options.methods || "GET,HEAD,PUT,PATCH,POST,DELETE"
      )
    );

    const allowHeaders =
      this.options.allowedHeaders ||
      request.headers.get("Access-Control-Request-Headers");

    if (allowHeaders)
      request.headers.set(
        "Access-Control-Allow-Headers",
        parseStringOrArray(allowHeaders)
      );

    if (this.options.credentials)
      request.headers.set("Access-Control-Allow-Credentials", "true");

    if (this.options.maxAge)
      request.headers.set(
        "Access-Control-Max-Age",
        String(this.options.maxAge)
      );

    return response;
  };
}

export class CORSResponse extends Middleware<"response"> {
  name = "@builtin.cors.response";
  runsOn = "response" as const;

  constructor(public readonly options: CORSOptions = {}) {
    super();
  }

  protected $runner: MiddlewareRunnerWithThis<{
    response: Response;
    request: Request;
    server: Server;
    route: MatchedRoute;
  }> = function ({ response, request }) {
    const requestOrigin = request.headers.get("Origin");

    if (!requestOrigin || this.options.origin === false) return;

    // todo: finish implementation
  };
}

export default function getCORS(options: CORSOptions = {}) {
  return [new CORSPreflight(options), new CORSResponse(options)] as const;
}
