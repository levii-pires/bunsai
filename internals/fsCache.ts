import { RmOptions, watch } from "fs";
import { mkdir, rm } from "fs/promises";
import { join, basename } from "path";

type WriteInput =
  | string
  | Blob
  | NodeJS.TypedArray
  | ArrayBufferLike
  | Bun.BlobPart[];

const rootFolder = process.env.CACHE_FOLDER || "./.cache";

if (process.env.PRESERVE_CACHE != "true")
  await rm(rootFolder, { force: true, recursive: true });

export class FSCache {
  dir: string;

  /**
   * @param dev If `true`, the cache will watch the source file for changes,
   * removing the corresponding cache file when any change occurs and allowing
   * any re-render logic that relies on `FSCache#file(...).exists()`
   */
  constructor(
    public type: "loader" | "middleware",
    public name: string,
    public dev?: boolean
  ) {
    this.dir = join(rootFolder, type, name);
  }

  private getCachePath(filename: string) {
    return join(this.dir, basename(filename));
  }

  /**
   * Should be called before all other operations
   */
  async setup() {
    await mkdir(this.dir, { recursive: true });
  }

  /**
   * @param filename Absolute original file path
   */
  file(filename: string, options?: BlobPropertyBag) {
    return Bun.file(this.getCachePath(filename), options);
  }

  /**
   * @param filename Absolute original file path
   */
  async write(filename: string, input: WriteInput) {
    const cachePath = this.getCachePath(filename);

    await Bun.write(cachePath, input);

    if (this.dev) {
      watch(filename, { persistent: true }, () =>
        rm(cachePath, { force: true })
      );
    }
  }

  /**
   * @param filename Absolute original file path
   */
  invalidate(filename: string, options?: Omit<RmOptions, "force">) {
    const cachePath = this.getCachePath(filename);

    return rm(cachePath, { ...options, force: true });
  }
}
