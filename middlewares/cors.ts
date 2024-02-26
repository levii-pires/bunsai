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

function parseList(input: string | string[]) {
  if (Array.isArray(input)) return input.join();

  return input;
}

function applyHeaders(
  options: CORSOptions,
  allowOrigin: string,
  response: Response,
  request: Request
) {
  response.headers.set("Access-Control-Allow-Origin", allowOrigin);

  response.headers.set(
    "Access-Control-Allow-Methods",
    parseList(options.methods || "GET,HEAD,PUT,PATCH,POST,DELETE")
  );

  const allowHeaders =
    options.allowedHeaders ||
    request.headers.get("Access-Control-Request-Headers");

  if (allowHeaders)
    response.headers.set(
      "Access-Control-Allow-Headers",
      parseList(allowHeaders)
    );

  if (options.exposedHeaders)
    response.headers.set(
      "Access-Control-Expose-Headers",
      parseList(options.exposedHeaders)
    );

  if (options.credentials)
    response.headers.set("Access-Control-Allow-Credentials", "true");

  if (options.maxAge)
    response.headers.set("Access-Control-Max-Age", String(options.maxAge));
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

      if (options.origin.test(requestOrigin)) return requestOrigin;
      else return false;
    }
    case "function": {
      return options.origin(request);
    }
    case "string": {
      return options.origin.includes(requestOrigin) ? options.origin : false;
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
    this
  > = function ({ request }) {
    const requestOrigin = request.headers.get("Origin");

    if (
      request.method != "OPTIONS" ||
      !requestOrigin ||
      this.options.origin === false
    )
      return;

    const allowOrigin = resolveOrigin(this.options, requestOrigin, request);

    if (!allowOrigin)
      return new Response(null, {
        status: 403,
        statusText: "Blocked by CORS policy",
      });

    const response = new Response(null, {
      status: this.options.optionsSuccessStatus || 204,
    });

    applyHeaders(this.options, allowOrigin, response, request);

    return response;
  };
}

export class CORSResponse extends Middleware<"response"> {
  name = "@builtin.cors.response";
  runsOn = "response" as const;

  constructor(public readonly options: CORSOptions = {}) {
    super();
  }

  protected $runner: MiddlewareRunnerWithThis<
    {
      response: Response;
      request: Request;
      server: Server;
      route: MatchedRoute;
    },
    this
  > = function ({ response, request }) {
    const requestOrigin = request.headers.get("Origin");

    if (!requestOrigin || this.options.origin === false) return;

    const allowOrigin = resolveOrigin(this.options, requestOrigin, request);

    if (!allowOrigin)
      return new Response(null, {
        status: 403,
        statusText: "Blocked by CORS policy",
      });

    applyHeaders(this.options, allowOrigin, response, request);
  };
}

export default function getCORS(options: CORSOptions = {}) {
  return {
    preflight: new CORSPreflight(options),
    response: new CORSResponse(options),
  };
}
