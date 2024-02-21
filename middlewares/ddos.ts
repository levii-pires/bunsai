import type { BunSaiMiddlewareRecord } from "..";
import type { MiddlewareRecord } from "../internals";

export interface DDOSMiddlewareOptions {
  /**
   * @default 20
   */
  limit?: number;

  /**
   * Cooldown time in milliseconds
   * @default
   * 1000
   */
  cooldown?: number;

  /**
   * @default
   * 'server.requestIP'
   */
  strategy?: "x-forwarded-for" | "x-real-ip" | "server.requestIP";
}

const middlewareName = "@builtin.ddos";

export default function DDOS(
  middlewares: MiddlewareRecord<BunSaiMiddlewareRecord>,
  options: DDOSMiddlewareOptions = {}
) {
  const requestCountTable: Record<string, number> = {};

  middlewares.request.add(middlewareName, ({ request, server }) => {
    let addr = "";

    switch (options.strategy) {
      case "x-forwarded-for":
      case "x-real-ip": {
        const header = request.headers.get(options.strategy);

        if (header) addr = header;

        if (options.strategy == "x-real-ip") break;
      }

      case "x-forwarded-for": {
        if (addr) {
          addr = addr.split(",").shift()?.trim() || addr;
        }

        break;
      }

      case "server.requestIP":
      default: {
        const { address } = server.requestIP(request) || {};

        if (address) addr = address;

        break;
      }
    }

    if (!addr) {
      console.warn(`${middlewareName}: could not get client IP`);
      return;
    }

    requestCountTable[addr] ||= 0;
    const currentCount = (requestCountTable[addr] += 1);

    setTimeout(() => {
      if (requestCountTable[addr] > currentCount) return; // the client made more requests, block cooldown
      delete requestCountTable[addr];
    }, options.cooldown || 1000);

    if (currentCount > (options.limit || 20))
      return new Response(null, {
        status: 429,
        statusText: "429 Too Many Requests",
      });
  });

  return {
    removeMiddleware() {
      middlewares.request.remove(middlewareName);
    },
    get requestCountTable() {
      return structuredClone(requestCountTable);
    },
  };
}
