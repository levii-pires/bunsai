import type {
  AllMiddlewares,
  BunSaiMiddlewareRecord,
  IMiddleware,
  MiddlewareRunnerWithThis,
} from "../types";
import type { MiddlewareRecord } from "./middlewareChannel";
import { inject } from "./inject";

export default abstract class Middleware<
  Runs extends keyof BunSaiMiddlewareRecord = keyof BunSaiMiddlewareRecord
> implements IMiddleware<Runs>
{
  abstract name: string;
  abstract runsOn: Runs;

  /**
   * Middleware logic.
   */
  abstract runner: MiddlewareRunnerWithThis<BunSaiMiddlewareRecord[Runs]>;

  static inject = inject;
}

export class MiddlewareCollection {
  list: AllMiddlewares[];

  constructor(...items: AllMiddlewares[]) {
    this.list = items;
  }

  static inject = inject;
}
