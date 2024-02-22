import { describe, it, expect, afterAll } from "bun:test";
import BunSai from "../..";
import getStylusLoader from "../../loaders/stylus";

const { fetch } = new BunSai({
  loaders: { ".styl": getStylusLoader() },
  dir: "./tests/pages",
});

const server = Bun.serve({ fetch });

afterAll(() => {
  server.unref();
  server.stop();
});

describe("Stylus Loader", () => {
  it("should load stylus files", async () => {
    const response = await server.fetch(new Request("https://bun.test/stylus"));

    expect(response.headers.get("content-type")).toStartWith("text/css");
    expect(await response.text()).toInclude("margin: 44px;");
  });
});
