import { describe, it, expect } from "bun:test";
import { MiddlewareChannel } from "../../internals";

const middleware = new MiddlewareChannel();

describe("MiddlewareChannel", () => {
  it("should limit the number of middlewares", () => {
    middleware.limit = 1;

    middleware.add("test", () => {});

    expect(() => middleware.add("test2", () => {})).toThrow(
      "exceeded middleware channel limit"
    );

    middleware.remove("test").remove("test2");
  });

  it("should comply with the spec", async () => {
    middleware.add("test", () => new Response(null, { status: 300 }));

    expect(() => middleware.add("test", () => {})).toThrow(
      "'test' already exists on this middleware channel"
    );

    expect(await middleware.call({})).toHaveProperty("status", 300);

    middleware.remove("test");

    expect(await middleware.call({})).toBeUndefined();
  });
});
