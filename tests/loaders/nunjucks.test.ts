import { describe, expect, it, afterAll } from "bun:test";
import getNunjucksLoader from "../../loaders/nunjucks";
import BunSai from "../..";

const { loaderInit } = getNunjucksLoader();

const { fetch } = new BunSai({
  loaders: { ".njk": loaderInit },
  dir: "./tests/pages",
});

const server = Bun.serve({ fetch });

afterAll(() => {
  server.unref();
  server.stop();
});

describe("Nunjucks Loader", () => {
  it("should load nunjucks files", async () => {
    const response = await server.fetch(
      new Request("https://bun.test/nunjucks")
    );

    expect(response.headers.get("content-type")).toStartWith("text/html");
    expect(await response.text()).toInclude("https://bun.test/nunjucks");
  });
});
