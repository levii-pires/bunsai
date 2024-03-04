import type { Server } from "bun";
import type { MiddlewareRunnerWithThis } from "../types";
import Middleware from "../internals/middleware";

export interface DDOSOptions {
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

export default class DDOS extends Middleware<"request"> {
  name = "@builtin.ddos";
  runsOn = "request" as const;

  readonly requestCountTable: Record<string, number> = {};

  constructor(public readonly options: DDOSOptions = {}) {
    super();
  }

  runner: MiddlewareRunnerWithThis<{ request: Request; server: Server }, DDOS> =
    function ({ request, server }) {
      let addr = "";

      switch (this.options.strategy) {
        case "x-forwarded-for":
        case "x-real-ip": {
          const header = request.headers.get(this.options.strategy);

          if (header) addr = header.trim();

          if (this.options.strategy == "x-real-ip") break;
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

      if (!addr) return;

      this.requestCountTable[addr] ||= 0;
      const currentCount = (this.requestCountTable[addr] += 1);

      setTimeout(() => {
        if (this.requestCountTable[addr] > currentCount) return; // the client made more requests, block cooldown
        delete this.requestCountTable[addr];
      }, this.options.cooldown || 1000);

      if (currentCount > (this.options.limit || 20))
        return new Response(null, {
          status: 429,
          statusText: "429 Too Many Requests",
        });
    };
}
