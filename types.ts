import type { MatchedRoute, Server } from "bun";
import type BunSai from ".";

export interface BunSaiEventsRecord {
  request: {
    init: {
      request: Request;
      server: Server;
    };
    notFound: {
      request: Request;
      server: Server;
    };
    response: {
      response: Response;
      request: Request;
      server: Server;
      route: MatchedRoute;
    };
    end: {
      response: Response;
      request: Request;
      server: Server;
    };
    error: {
      request: Request;
      server: Server;
      error: unknown;
    };
  };

  lifecycle: {
    init: BunSai;
    reload: BunSai;
    shutdown: BunSai;
  };
}

type _BunSaiEvents<
  K extends keyof BunSaiEventsRecord = keyof BunSaiEventsRecord,
  P extends keyof BunSaiEventsRecord[K] = keyof BunSaiEventsRecord[K]
> = `${K}.${P}`;

type x = _BunSaiEvents;

export {};
