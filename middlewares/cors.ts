import { MatchedRoute, Server } from "bun";
import { Middleware } from "../internals";
import { MiddlewareRunnerWithThis } from "../types";

export interface CORSOptions {}

export class CORSPreflight extends Middleware<"request"> {
  name = "@builtin.cors.preflight";
  runsOn = "request" as const;

  constructor(public readonly options: CORSOptions) {
    super();
  }

  protected $runner: MiddlewareRunnerWithThis<{
    request: Request;
    server: Server;
  }> = function ({ request }) {};
}

export class CORSResponse extends Middleware<"response"> {
  name = "@builtin.cors.preflight";
  runsOn = "response" as const;

  protected $runner: MiddlewareRunnerWithThis<{
    response: Response;
    request: Request;
    server: Server;
    route: MatchedRoute;
  }> = function ({ response }) {};

  constructor(public readonly options: CORSOptions) {
    super();
  }
}

export default function getCORS(options: CORSOptions) {
  return [new CORSPreflight(options), new CORSResponse(options)] as const;
}
