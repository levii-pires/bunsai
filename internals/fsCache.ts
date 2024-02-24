import { existsSync } from "fs";
import { mkdir } from "fs/promises";
import { join, basename } from "path";

export class FSCache {
  dir: string;

  constructor(public type: "loader" | "middleware", public name: string) {
    this.dir = join("./.cache", type, name);
  }

  async mkdir() {
    await mkdir(this.dir, { recursive: true });
  }

  file(filename: string, options?: BlobPropertyBag) {
    return Bun.file(join(this.dir, basename(filename)), options);
  }
}
