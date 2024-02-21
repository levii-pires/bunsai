import DDOS from "../../middlewares/ddos";
import BunSai from "../..";
import { describe, expect, it, afterAll } from "bun:test";
import { setTimeout } from "timers/promises";

const { middlewares, fetch: $ } = new BunSai({
  loaders: {},
  staticFiles: [".html"],
  dir: "./tests/pages",
});

const server = Bun.serve({ fetch: $, hostname: "127.0.0.1", port: 3000 });

afterAll(() => {
  server.unref();
  server.stop();
});

describe("DDOS Middleware", () => {
  it("should block the request using 'x-forwarded-for' header", async () => {
    const ddos = DDOS(middlewares, {
      limit: 1,
      strategy: "x-forwarded-for",
    });

    const init = {
      headers: { "x-forwarded-for": "1, 2, 3" },
    };

    await server.fetch(new Request("https://127.0.0.1:3000/html", init));
    await server.fetch(new Request("https://127.0.0.1:3000/html", init));
    const response = await server.fetch(
      new Request("https://127.0.0.1:3000/html", init)
    );

    ddos.removeMiddleware();

    expect(response.status).toBe(429);
  });
});
