import DDOS from "../../middlewares/ddos";
import BunSai from "../..";
import { describe, expect, it, afterAll } from "bun:test";

const { middlewares, fetch: $ } = new BunSai({
  loaders: {},
  staticFiles: [".html"],
  dir: "./tests/pages",
});

DDOS(middlewares, { limit: 1 });

const server = Bun.serve({ fetch: $, hostname: "127.0.0.1", port: 3000 });

afterAll(() => {
  server.unref();
  server.stop();
});

describe("DDOS Middleware", () => {
  it("should block the request", async () => {
    await server.fetch(new Request("https://127.0.0.1:3000/html"));
    await server.fetch(new Request("https://127.0.0.1:3000/html"));
    const response = await server.fetch(
      new Request("https://127.0.0.1:3000/html")
    );

    expect(response.status).toBe(429);
  });
});
