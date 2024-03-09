import { describe, it, expect } from "bun:test";
import MiddlewareChannel from "bunsai/internals/middlewareChannel";

const middleware = new MiddlewareChannel();

describe("MiddlewareChannel", () => {
  it("should limit the number of middlewares", () => {
    middleware.limit = 1;

    middleware.add("test", () => {});

    try {
      expect(() => middleware.add("test2", () => {})).toThrow(
        "exceeded middleware channel limit"
      );
    } finally {
      middleware.remove("test").remove("test2");
    }
  });

  it("should comply with the spec", async () => {
    middleware.add("test", () => new Response(null, { status: 300 }));

    try {
      expect(() => middleware.add("test", () => {})).toThrow(
        "'test' already exists on this middleware channel"
      );

      expect(await middleware.call({})).toHaveProperty("status", 300);
      middleware.remove("test");

      expect(await middleware.call({})).toBeUndefined();
    } catch (error) {
      middleware.clear();
      throw error;
    }
  });

  it("should append other MiddlewareChannel", async () => {
    const other = new MiddlewareChannel<any>();

    other.add("test", () => new Response("test"));

    middleware.append(other);

    try {
      expect(await (await middleware.call({}))?.text()).toBe("test");
    } finally {
      middleware.clear();
    }
  });
});
