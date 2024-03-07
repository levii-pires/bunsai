import type {
  BuildResult,
  Extname,
  RequestData,
  ResolvedBunSaiOptions,
} from "../types";

export default abstract class Loader {
  /**
   * File extensions this loader recognizes.
   * @example [".vue"]
   */
  abstract extensions: readonly Extname[];

  async setup(opts: ResolvedBunSaiOptions) {
    return this;
  }

  abstract handle(
    filePath: string,
    data: RequestData
  ): Response | Promise<Response>;

  /**
   * @param filePath Absolute file location
   */
  abstract build(filePath: string): BuildResult[] | Promise<BuildResult[]>;
}
