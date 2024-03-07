import type {
  BuildResult,
  Extname,
  RequestData,
  ResolvedBunSaiOptions,
} from "../types";
import type FilenameParser from "./filename";

export default abstract class Loader {
  /**
   * File extensions this loader recognizes.
   * @example [".vue"]
   */
  abstract extensions: readonly Extname[];

  setup(opts: ResolvedBunSaiOptions): Promise<void> | void {}

  abstract handle(
    filePath: string,
    data: RequestData
  ): Response | Promise<Response>;

  /**
   * @param filePath Absolute file location
   */
  abstract build(
    filePath: string,
    filenameParser: FilenameParser
  ): BuildResult[] | Promise<BuildResult[]>;
}
