import DDOS from "../../middlewares/ddos";
import BunSai from "../..";
import { describe, expect, it, afterAll } from "bun:test";

const { middlewares, fetch } = new BunSai({
  loaders: {},
  dir: "./tests/pages",
});

DDOS(middlewares, { limit: 1 });

const server = Bun.serve({ fetch });

afterAll(() => {
  server.unref();
  server.stop();
});

describe("DDOS Middleware", () => {
  it("should block the request", async () => {
    await server.fetch(new Request("https://bun.test/html"));
    await server.fetch(new Request("https://bun.test/html"));

    const response = await server.fetch(new Request("https://bun.test/html"));

    expect(response.status).toBe(429);
  });
});
