import { describe, it, expect, afterAll } from "bun:test";
import BunSai, { MiddlewareFn } from "..";
import getNunjucksLoader from "../loaders/nunjucks";
import { Server } from "bun";
import { Middleware } from "../internals";

const njkLoader = getNunjucksLoader();

const testStr = "mocked";

class MockMiddleware extends Middleware<"request"> {
  name = "mock";
  runsOn = "request" as const;

  test = testStr;

  runner: MiddlewareFn<{ request: Request; server: Server }> = function (
    this: MockMiddleware,
    { request }
  ) {
    if (request.headers.get("x-mock"))
      return new Response(this.test, { status: 418 });
  };
}

const { fetch } = new BunSai({
  loaders: { ".njk": njkLoader.loaderInit },
  staticFiles: [".html"],
  dir: "./tests/pages",
  middlewares: [new MockMiddleware()],
});

const server = Bun.serve({ fetch });

afterAll(() => {
  server.unref();
  server.stop();
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

  it("should use binded middlewares", async () => {
    const response = await server.fetch(
      new Request("http://test.bun/nunjucks", { headers: { "x-mock": "1" } })
    );

    expect(response.status).toBe(418);
    expect(await response.text()).toBe(testStr);
  });
});
