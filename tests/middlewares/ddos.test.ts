import DDOS from "../../middlewares/ddos";
import { describe, expect, it } from "bun:test";
import { setTimeout } from "timers/promises";
import { getInstance } from "../testing";

const {
  bunsai: { middlewares },
  server,
} = getInstance({
  loaders: {},
  staticFiles: [".html"],
  dir: "./tests/pages",
  dev: false,
});

describe("DDOS Middleware", () => {
  it("should block the request using 'x-forwarded-for' strategy", async () => {
    const { remove } = DDOS.inject(middlewares, {
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

    await setTimeout(10);

    const response2 = await server.fetch(
      new Request("https://127.0.0.1:3000/html", init)
    );

    expect(response1.status).toBe(429);
    expect(response2.status).toBe(200);

    remove();
  });

  it("should block the request using 'x-real-ip' strategy", async () => {
    const { remove } = DDOS.inject(middlewares, {
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

    await setTimeout(10);

    const response2 = await server.fetch(
      new Request("https://127.0.0.1:3000/html", init)
    );

    expect(response1.status).toBe(429);
    expect(response2.status).toBe(200);

    remove();
  });

  it("should block the request using 'server.requestIP' strategy", async () => {
    // todo: mock socket connection
  });

  it("should block cooldown when client made more requests", async () => {
    const { instance, remove } = DDOS.inject(middlewares, {
      strategy: "x-forwarded-for",
      cooldown: 20,
    });

    const init = {
      headers: { "x-forwarded-for": "1, 2, 3" },
    };

    await server.fetch(new Request("https://127.0.0.1:3000/html", init));
    await server.fetch(new Request("https://127.0.0.1:3000/html", init));
    await server.fetch(new Request("https://127.0.0.1:3000/html", init));

    await setTimeout(10);

    await server.fetch(new Request("https://127.0.0.1:3000/html", init));

    await setTimeout(10);

    expect(instance.requestCountTable["1"]).toBe(4);

    await setTimeout(10);

    expect(instance.requestCountTable["1"]).toBeUndefined();

    remove();
  });
});
