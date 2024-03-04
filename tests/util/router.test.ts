import { describe, expect, it } from "bun:test";
import { getInstance } from "../testing";
import ModuleLoader from "../../loaders/module";

const {
  server,
  bunsai: { setup },
} = getInstance({
  loaders: [new ModuleLoader()],
  dev: false,
  dir: "./pages",
});

await setup();

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

  it("should get response from array matcher", async () => {
    const responseString = await server.fetch(
      new Request("http://bun.test/array-string-matcher")
    );

    const responseRegex = await server.fetch(
      new Request("http://bun.test/array-regex-matcher")
    );

    const responseFn = await server.fetch(
      new Request("http://bun.test/array-fn-matcher")
    );

    expect(await responseString.text()).toBe("array");
    expect(await responseRegex.text()).toBe("array");
    expect(await responseFn.text()).toBe("array");
  });
});
