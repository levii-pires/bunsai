import { describe, it, expect, mock } from "bun:test";
import BunSai from "..";

describe("BunSai", () => {
  const { fetch, addMiddleware, removeMiddleware } = new BunSai({
    loaders: {},
    staticFiles: [".html"],
    dir: "./tests/pages",
  });

  const server = Bun.serve({ fetch });

  it("should serve static html", async () => {
    const response = await server.fetch(new Request("http://test.bun/html"));

    expect(await response.text()).toInclude("<title>Document</title>");
  });

  it("should comply with the request middleware spec", async () => {
    addMiddleware("test", "request", () => new Response(null, { status: 300 }));

    expect(() => addMiddleware("test", "request", () => {})).toThrow(
      "'test' already exists on the 'request' middleware record"
    );

    expect(
      (await server.fetch(new Request("http://test.bun/html"))).status
    ).toBe(300);

    removeMiddleware("test", "request");

    expect(
      (await server.fetch(new Request("http://test.bun/html"))).status
    ).toBe(200);
  });

  it("should comply with the response middleware spec", async () => {
    addMiddleware(
      "test",
      "response",
      () => new Response(null, { status: 300 })
    );

    expect(() => addMiddleware("test", "response", () => {})).toThrow(
      "'test' already exists on the 'request' middleware record"
    );

    expect(
      (await server.fetch(new Request("http://test.bun/html"))).status
    ).toBe(300);

    removeMiddleware("test", "response");

    expect(
      (await server.fetch(new Request("http://test.bun/html"))).status
    ).toBe(200);
  });
});
