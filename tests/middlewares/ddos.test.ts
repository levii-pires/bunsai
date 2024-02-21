import DDOS from "../../middlewares/ddos";
import BunSai from "../..";
import { describe, expect, it, afterAll } from "bun:test";
import { setTimeout } from "timers/promises";

const { middlewares, fetch } = new BunSai({
  loaders: {},
  staticFiles: [".html"],
  dir: "./tests/pages",
});

const server = Bun.serve({ fetch });

afterAll(() => {
  server.unref();
  server.stop();
});

describe("DDOS Middleware", () => {
  it("should block the request using 'x-forwarded-for' strategy", async () => {
    const ddos = DDOS(middlewares, {
      limit: 1,
      strategy: "x-forwarded-for",
      cooldown: 10,
    });

    const init = {
      headers: { "x-forwarded-for": "1, 2, 3" },
    };

    await server.fetch(new Request("https://127.0.0.1:3000/html", init));
    await server.fetch(new Request("https://127.0.0.1:3000/html", init));
    const response1 = await server.fetch(
      new Request("https://127.0.0.1:3000/html", init)
    );

    await setTimeout(50);

    const response2 = await server.fetch(
      new Request("https://127.0.0.1:3000/html", init)
    );

    expect(response1.status).toBe(429);
    expect(response2.status).toBe(200);

    ddos.removeMiddleware();
  });

  it("should block the request using 'x-real-ip' strategy", async () => {
    const ddos = DDOS(middlewares, {
      limit: 1,
      strategy: "x-real-ip",
      cooldown: 10,
    });

    const init = {
      headers: { "x-real-ip": "3" },
    };

    await server.fetch(new Request("https://127.0.0.1:3000/html", init));
    await server.fetch(new Request("https://127.0.0.1:3000/html", init));
    const response1 = await server.fetch(
      new Request("https://127.0.0.1:3000/html", init)
    );

    await setTimeout(50);

    const response2 = await server.fetch(
      new Request("https://127.0.0.1:3000/html", init)
    );

    expect(response1.status).toBe(429);
    expect(response2.status).toBe(200);

    ddos.removeMiddleware();
  });

  it("should block the request using 'server.requestIP' strategy", async () => {
    // todo: mock socket connection
  });

  it("should block cooldown when client made more requests", async () => {
    const ddos = DDOS(middlewares, {
      strategy: "x-forwarded-for",
      cooldown: 50,
    });

    const init = {
      headers: { "x-forwarded-for": "1, 2, 3" },
    };

    await server.fetch(new Request("https://127.0.0.1:3000/html", init));
    await server.fetch(new Request("https://127.0.0.1:3000/html", init));
    await server.fetch(new Request("https://127.0.0.1:3000/html", init));

    await setTimeout(40);

    await server.fetch(new Request("https://127.0.0.1:3000/html", init));

    expect(ddos.requestCountTable["1"]).toBe(4);

    await setTimeout(50);

    expect(ddos.requestCountTable["1"]).toBeUndefined();

    ddos.removeMiddleware();
  });
});
