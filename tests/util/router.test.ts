import { describe, expect, it } from "bun:test";
import { getInstance } from "../testing";
import { ModuleLoaderInit } from "../../loaders";

const { server } = getInstance({
  loaders: {
    ".ts": ModuleLoaderInit,
  },
  dev: false,
  dir: "./tests/pages",
});

// warm up
await server.fetch(new Request("http://bun.test/router-method"));

describe("Router", () => {
  it("should get response from 'data.response()'", async () => {
    const response = await server.fetch(
      new Request("http://bun.test/router-method")
    );

    expect(response.status).toBe(204);
  });

  it("should get response from 'return new Response'", async () => {
    const response = await server.fetch(
      new Request("http://bun.test/router-return")
    );

    expect(response.status).toBe(206);
  });

  it("should get 'Method Not Allowed' if 'method' was not configured", async () => {
    const response = await server.fetch(
      new Request("http://bun.test/router-return", { method: "PUT" })
    );

    expect(response.status).toBe(405);
  });

  it("should get 'Not Implemented' on absent handler reponse", async () => {
    const response = await server.fetch(
      new Request("http://bun.test/not-implemented")
    );

    expect(response.status).toBe(501);
    expect(response.statusText).toBe(
      "'/not-implemented' handlers returned nothing"
    );
  });
});
