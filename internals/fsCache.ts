import { RmOptions, watch } from "fs";
import { mkdir, rm } from "fs/promises";
import { join, parse } from "path";

type WriteInput =
  | string
  | Blob
  | NodeJS.TypedArray
  | ArrayBufferLike
  | Bun.BlobPart[];

const rootFolder = process.env.CACHE_FOLDER || "./.cache";

if (process.env.PRESERVE_CACHE != "true")
  await rm(rootFolder, { force: true, recursive: true });

export default class FSCache {
  dir: string;

  /**
   * @param dev If `true`, the cache will watch the source file for changes,
   * removing the corresponding cache file when any change occurs and allowing
   * any re-render logic that relies on `FSCache#file(...).exists()`
   * @param type **NOTE:** "build" and "server" are meant for internal usage
   */
  constructor(
    public type: "loader" | "middleware" | "build" | "server",
    public name: string,
    public dev?: boolean
  ) {
    this.dir = join(rootFolder, type, name);
  }

  private getCachePath(filename: string) {
    const { dir, root, base } = parse(filename);
    return join(this.dir, dir.replace(root, ""), base);
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
   * @returns cached filename
   */
  async write(filename: string, input: WriteInput) {
    const cachePath = this.getCachePath(filename);

    await Bun.write(cachePath, input);

    if (this.dev) {
      watch(filename, { persistent: true }, () =>
        rm(cachePath, { force: true })
      );
    }

    return cachePath;
  }

  /**
   * Load the file as an ArrayBuffer.
   *
   * @param filename Absolute original file path
   * @returns Possible return values:
   * - `[arrayBuffer, null]` => No problems here
   * - `[null, null]` => File not found
   * - `[null, error]` => Something went wrong
   */
  async load(
    filename: string,
    options?: BlobPropertyBag
  ): Promise<[ArrayBuffer, null] | [null, ErrnoException | null]> {
    const file = this.file(filename, options);

    try {
      return [await file.arrayBuffer(), null];
    } catch (error) {
      if ((error as ErrnoException).code == "ENOENT") return [null, null];

      return [null, error as ErrnoException];
    }
  }

  /**
   * {@link load} as {@link Response}
   */
  async loadResponse(
    filename: string,
    init?: ResponseInit,
    options?: BlobPropertyBag
  ) {
    const [inCache, error] = await this.load(filename, options);

    if (inCache) return new Response(inCache, init);
    else if (error) throw error;
    else return null;
  }

  /**
   * @param filename Absolute original file path
   */
  invalidate(filename: string, options?: Omit<RmOptions, "force">) {
    const cachePath = this.getCachePath(filename);

    return rm(cachePath, { ...options, force: true });
  }

  static async init(...args: ConstructorParameters<typeof FSCache>) {
    const instance = new this(...args);

    await instance.setup();

    return instance;
  }
}
