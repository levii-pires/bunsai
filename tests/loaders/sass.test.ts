import { describe, it, expect, afterAll } from "bun:test";
import BunSai from "../..";
import getSassLoader from "../../loaders/sass";

const { fetch } = new BunSai({
  loaders: { ".scss": getSassLoader() },
  dir: "./tests/pages",
});

const server = Bun.serve({ fetch });

afterAll(() => {
  server.unref();
  server.stop();
});

describe("Sass Loader", () => {
  it("should load sass files", async () => {
    const response = await server.fetch(new Request("https://bun.test/sass"));

    expect(response.headers.get("content-type")).toStartWith("text/css");
    expect(await response.text()).toInclude("margin: 44px;");
  });
});
