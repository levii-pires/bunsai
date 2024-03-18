import type { EventEmitter } from "./eventEmitter";
import { RmOptions, watch, rmSync } from "fs";
import { mkdir, rm } from "fs/promises";
import { join, parse } from "path";

type WriteInput =
  | string
  | Blob
  | NodeJS.TypedArray
  | ArrayBufferLike
  | Bun.BlobPart[];

export class FSCache {
  /**
   * @param dev If `true`, the cache will watch the source file for changes,
   * removing the corresponding cache file when any change occurs and allowing
   * any re-render logic that relies on `FSCache#file(...).exists()`
   * @param root Default: `process.env.CACHE_FOLDER || "./.bunsai"`
   * @param preserveCache Default: `process.env.PRESERVE_CACHE == "true"`
   */
  constructor(
    public events: EventEmitter,
    public dev?: boolean,
    public root = process.env.CACHE_FOLDER || "./.bunsai",
    preserveCache = process.env.PRESERVE_CACHE == "true"
  ) {
    if (!preserveCache) rmSync(root, { force: true, recursive: true });
  }

  private getCachePath(filename: string) {
    const { base, dir, root } = parse(filename);
    return join(this.root, dir.replace(root, ""), base);
  }

  /**
   * Should be called before all other operations
   */
  async setup() {
    await this.events.emit("cache.user.setup", { cache: this, server: null });
    await mkdir(this.root, { recursive: true });
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

    await this.events.emit("cache.user.write", {
      cache: this,
      server: null,
      cachedFilePath: cachePath,
      originalFilePath: filename,
    });

    if (this.dev) {
      watch(filename, { persistent: true }, async () => {
        await rm(cachePath, { force: true });
        await this.events.emit("cache.user.write", {
          cache: this,
          server: null,
          cachedFilePath: cachePath,
          originalFilePath: filename,
        });
      });
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
