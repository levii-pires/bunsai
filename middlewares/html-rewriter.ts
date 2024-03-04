import type { MiddlewareRunnerWithThis } from "../types";
import type { Server, MatchedRoute } from "bun";
import Middleware from "../internals/middleware";

export default class Rewriter extends Middleware<"response"> {
  name = "@builtin.html-rewriter";
  runsOn = "response" as const;

  constructor(public rewriter: HTMLRewriter) {
    super();
  }

  runner: MiddlewareRunnerWithThis<
    {
      response: Response;
      request: Request;
      server: Server;
      route: MatchedRoute;
    },
    this
  > = function ({ response }) {
    if (!response.headers.get("content-type")?.startsWith("text/html")) return;

    return this.rewriter.transform(response);
  };
}
