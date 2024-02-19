import type { BunSaiMiddlewareRecord } from "..";
import type { MiddlewareRecord } from "../internals";

export interface DDOSMiddlewareOptions {
  /**
   * @default 100
   */
  maxRequestsPerSecond?: number;

  /**
   * Cooldown time in milliseconds
   * @default
   * 1000
   */
  cooldown?: number;
}

const middlewareName = "@builtin.ddos";

/**
 * @returns A function to remove this middleware from the record
 */
export default function DDOSMiddleware(
  middlewares: MiddlewareRecord<BunSaiMiddlewareRecord>,
  options: DDOSMiddlewareOptions = {}
) {
  const requestCountTable: Record<string, number> = {};

  middlewares.request.add(middlewareName, ({ request, server }) => {
    const addr = server.requestIP(request);

    if (!addr) {
      console.warn(`${middlewareName}: could not get client IP`);
      return;
    }

    requestCountTable[addr.address] ||= 0;
    const currentCount = (requestCountTable[addr.address] += 1);

    setTimeout(() => {
      if (requestCountTable[addr.address] > currentCount) return; // the client made more requests, block cooldown

      delete requestCountTable[addr.address];
    }, options.cooldown || 1000);

    if (currentCount >= (options.maxRequestsPerSecond || 100))
      return new Response(null, {
        status: 429,
        statusText: "429 Too Many Requests",
      });
  });

  return () => {
    middlewares.request.remove(middlewareName);
  };
}
