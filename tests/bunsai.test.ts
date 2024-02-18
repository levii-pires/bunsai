import { describe, it, expect, mock } from "bun:test";
import BunSai from "..";

describe("BunSai", () => {
  const { fetch, middlewares } = new BunSai({
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
    middlewares.request.add("test", () => new Response(null, { status: 300 }));

    expect(() => middlewares.request.add("test", () => {})).toThrow(
      "'test' already exists on this middleware channel"
    );

    expect(
      (await server.fetch(new Request("http://test.bun/html"))).status
    ).toBe(300);

    middlewares.request.remove("test");

    expect(
      (await server.fetch(new Request("http://test.bun/html"))).status
    ).toBe(200);
  });

  it("should comply with the response middleware spec", async () => {
    middlewares.response.add("test", () => new Response(null, { status: 300 }));

    expect(() => middlewares.response.add("test", () => {})).toThrow(
      "'test' already exists on this middleware channel"
    );

    expect(
      (await server.fetch(new Request("http://test.bun/html"))).status
    ).toBe(300);

    middlewares.response.remove("test");

    expect(
      (await server.fetch(new Request("http://test.bun/html"))).status
    ).toBe(200);
  });
});
