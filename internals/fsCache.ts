import type { BuildArtifact } from "bun";
import type { EventEmitter } from "./eventEmitter";
import { RmOptions, rmSync } from "fs";
import { mkdir, rm } from "fs/promises";
import { join, parse, resolve } from "path";
import { watch as fsWatch, FSWatcher } from "chokidar";

export interface CachedBuildArtifact {
  output: BuildArtifact;
  cachedPath: string;
}

export interface FSCacheOptions {
  /**
   * Base directory where all files come from
   */
  base: string;
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
  protected $watcher: FSWatcher;
  protected $watchedFiles: string[] = [];

  events: EventEmitter;
  dev: boolean;
  root: string;
  preserveCache: boolean;
  base: string;

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
    this.base = options.base;

    if (!this.preserveCache) this.reset();

    this.$watcher = fsWatch(join(this.base, "./**/*"), {
      persistent: true,
      awaitWriteFinish: true,
      ignoreInitial: true,
    }).on("add", (path) => {
      return this.events.emit("cache.watch.change", {
        cache: this,
        cachedFilePath: "",
        originalFilePath: path,
        server: null,
        type: "add",
      });
    });
  }

  reset() {
    rmSync(this.root, { force: true, recursive: true });
  }

  /**
   * @param filename Absolute original file path
   */
  resolve(filename: string) {
    const { base, dir, root } = parse(filename);
    return resolve(this.root, dir.replace(root, ""), base);
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
  async write(filename: string, input: WriteInput, watch?: string | false) {
    const cachePath = this.resolve(filename);

    await Bun.write(cachePath, input);

    await this.events.emit("cache.user.write", {
      cache: this,
      server: null,
      cachedFilePath: cachePath,
      originalFilePath: filename,
    });

    if (this.dev && watch !== false) {
      this.watch(typeof watch == "string" ? watch : filename, cachePath);
    }

    return cachePath;
  }

  /**
   * @param filename Absolute original file path
   * @param cachePath Cached file path
   */
  watch(filename: string, cachePath: string) {
    if (this.$watchedFiles.includes(filename)) return;

    this.$watchedFiles.push(filename);

    this.$watcher.on("all", async (type, path) => {
      switch (type) {
        case "change":
        case "unlink":
          break;
        default: {
          return;
        }
      }

      if (resolve(filename) != resolve(path)) return;

      await this.events.emit("cache.watch.change", {
        cache: this,
        cachedFilePath: cachePath,
        originalFilePath: filename,
        server: null,
        type,
      });

      // await rm(cachePath, { force: true });
    });
  }

  async writeBuildOutputs(
    entrypoint: string,
    outputs: BuildArtifact[],
    basedir: string
  ) {
    const paths: CachedBuildArtifact[] = [];

    for (const output of outputs) {
      paths.push({
        output,
        cachedPath: await this.write(join(basedir, output.path), output, false),
      });
    }

    if (this.dev) this.watch(entrypoint, paths[0].cachedPath);

    return paths;
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
