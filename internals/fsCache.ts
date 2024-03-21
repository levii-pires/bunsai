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

export interface FSCacheOptions {
  events: EventEmitter;
  /**
   * If `true`, the cache will watch the source file for changes,
   * removing the corresponding cache file when any change occurs and allowing
   * any re-render logic that relies on `FSCache#file(...).exists()`
   */
  dev: boolean;
  /**
   * @default process.env.CACHE_FOLDER || "./.bunsai"
   */
  root?: string;
  /**
   * @default process.env.PRESERVE_CACHE == "true"
   */
  preserveCache?: boolean;
}

export class FSCache {
  events: EventEmitter;
  dev: boolean;
  root: string;
  preserveCache: boolean;
  /**
   * @param options.dev If `true`, the cache will watch the source file for changes,
   * removing the corresponding cache file when any change occurs and allowing
   * any re-render logic that relies on `FSCache#file(...).exists()`
   * @param root Default: `process.env.CACHE_FOLDER || "./.bunsai"`
   * @param preserveCache Default: `process.env.PRESERVE_CACHE == "true"`
   */
  constructor(options: FSCacheOptions) {
    this.events = options.events;
    this.dev = options.dev;
    this.root = options.root || process.env.CACHE_FOLDER || "./.bunsai";
    this.preserveCache =
      options.preserveCache ?? process.env.PRESERVE_CACHE == "true";

    if (!this.preserveCache)
      rmSync(this.root, { force: true, recursive: true });
  }

  /**
   * @param filename Absolute original file path
   */
  resolve(filename: string) {
    const { base, dir, root } = parse(filename);
    return join(this.root, dir.replace(root, ""), base);
  }

  /**
   * Should be called before all other operations
   */
  async setup() {
    await mkdir(this.root, { recursive: true });
    await this.events.emit("cache.user.setup", { cache: this, server: null });
  }

  /**
   * @param filename Absolute original file path
   */
  file(filename: string, options?: BlobPropertyBag) {
    return Bun.file(this.resolve(filename), options);
  }

  /**
   * @param filename Absolute original file path
   * @returns Cached file path
   */
  async write(filename: string, input: WriteInput) {
    const cachePath = this.resolve(filename);

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
        await this.events.emit("cache.watch.invalidate", {
          cache: this,
          server: null,
          cachedFilePath: cachePath,
          originalFilePath: filename,
        });
      });
    }

    return cachePath;
  }

  /**
   * @param filename Absolute original file path
   */
  async invalidate(filename: string, options?: Omit<RmOptions, "force">) {
    const cachePath = this.resolve(filename);

    await rm(cachePath, { ...options, force: true });

    await this.events.emit("cache.user.invalidate", {
      cache: this,
      server: null,
      cachedFilePath: cachePath,
      originalFilePath: filename,
    });
  }

  /**
   * @param filename Absolute original file path
   */
  async load(
    filename: string,
    options?: BlobPropertyBag
  ): Promise<
    | [{ contents: ArrayBuffer; type: string }, null]
    | [null, null | ErrnoException]
  > {
    const file = this.file(filename, options);

    try {
      return [{ contents: await file.arrayBuffer(), type: file.type }, null];
    } catch (error) {
      if ((error as ErrnoException).code == "ENOENT") return [null, null];

      return [null, error as ErrnoException];
    }
  }

  async response(filename: string, options?: BlobPropertyBag) {
    const [result, error] = await this.load(filename, options);

    if (result)
      return new Response(result.contents, {
        headers: { "content-type": result.type },
      });

    if (error) throw error;

    return null;
  }
}
