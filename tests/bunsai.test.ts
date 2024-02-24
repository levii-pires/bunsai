import { describe, it, expect } from "bun:test";
import { MiddlewareRunnerWithThis } from "..";
import getNunjucksLoader from "../loaders/nunjucks";
import { Server } from "bun";
import { Middleware } from "../internals";
import { getInstance } from "./testing";

const njkLoader = getNunjucksLoader();

const testStr = "mocked";

class MockMiddleware extends Middleware<"request"> {
  name = "mock";
  runsOn = "request" as const;

  test = testStr;

  $runner: MiddlewareRunnerWithThis<
    { request: Request; server: Server },
    MockMiddleware
  > = function ({ request }) {
    if (request.headers.has("x-mock"))
      return new Response(this.test, { status: 418 });
  };
}

const { server } = getInstance({
  loaders: { ".njk": njkLoader.loaderInit },
  staticFiles: [".html"],
  dev: false,
  dir: "./tests/pages",
  middlewares: [new MockMiddleware()],
});

describe("BunSai", () => {
  it("should serve static html", async () => {
    const response = await server.fetch(new Request("http://test.bun/html"));

    expect(await response.text()).toInclude("<title>Document</title>");
  });

  it("should return 404", async () => {
    const response = await server.fetch(new Request("http://test.bun/nf"));

    expect(response).toHaveProperty("status", 404);
  });

  it("should use loaders", async () => {
    const response = await server.fetch(
      new Request("http://test.bun/nunjucks")
    );

    expect(await response.text()).toInclude("http://test.bun/nunjucks");
  });

  it("should use middlewares", async () => {
    const response = await server.fetch(
      new Request("http://test.bun/nunjucks", { headers: { "x-mock": "1" } })
    );

    expect(response.status).toBe(418);
    expect(await response.text()).toBe(testStr);
  });
});
