import type { EventEmitter } from "../internals";

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

export default class DDOS implements BunSai.Middleware {
  unsubscribe = () => {};

  readonly requestCountTable: Record<string, number> = {};

  constructor(public readonly options: DDOSOptions = {}) {}

  subscribe(events: EventEmitter) {
    const request = (payload: BunSai.Events.RequestPayload) =>
      this.$runner(payload);

    events.addListener("request.init", request);

    this.unsubscribe = () => {
      events.removeListener("request.init", request);
    };
  }

  protected $runner({
    request,
    server,
    response,
  }: BunSai.Events.RequestPayload) {
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
        const { address } = server?.requestIP(request) || {};

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
      response(
        new Response(null, {
          status: 429,
          statusText: "429 Too Many Requests",
        })
      );
  }
}
