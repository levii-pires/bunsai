import type {
  BunSaiMiddlewareRecord,
  IMiddleware,
  MiddlewareRunnerWithThis,
} from "../types";
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
