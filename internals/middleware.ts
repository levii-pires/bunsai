import type {
  BunSaiMiddlewareRecord,
  IMiddleware,
  MiddlewareRunnerWithThis,
} from "../types";
import { inject } from "./inject";

export abstract class Middleware<
  Runs extends keyof BunSaiMiddlewareRecord = keyof BunSaiMiddlewareRecord
> implements IMiddleware<Runs>
{
  abstract name: string;
  abstract runsOn: Runs;

  get runner() {
    return this.$runner.bind(this);
  }

  /**
   * This is the internal implementation of the `runner`.
   * Here comes the actual middleware logic.
   */
  protected abstract $runner: MiddlewareRunnerWithThis<
    BunSaiMiddlewareRecord[Runs]
  >;

  static inject = inject;
}
