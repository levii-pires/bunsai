import { describe, it, expect, afterAll } from "bun:test";
import BunSai from "..";
import getNunjucksLoader from "../loaders/nunjucks";

const njkLoader = getNunjucksLoader();

const { fetch } = new BunSai({
  loaders: { ".njk": njkLoader.loaderInit },
  staticFiles: [".html"],
  dir: "./tests/pages",
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
});
