import { join, parse, ParsedPath } from "path";

export default class FilenameParser {
  path: ParsedPath;
  hash: string;
  time: string;

  constructor(public from: string) {
    this.path = parse(from);
    this.hash = Bun.hash(from).toString(16);
    this.time = Date.now().toString();
  }

  /**
   * Parse filename to provide a custom filename. Special characters:
   * - `[name]`: original file name
   * - `[ext]` : original file extension
   * - `[hash]`: original absolute file path hash
   * - `[time]`: FilenameParser instance creation timestamp
   */
  parse(filename: string) {
    return filename
      .replaceAll("[name]", this.path.name)
      .replaceAll("[ext]", this.path.ext)
      .replaceAll("[hash]", this.hash)
      .replaceAll("[time]", this.time);
  }

  /**
   * Parse and replace given filename with {@link from} filename.
   *
   * @example
   * const parser = new FilenameParser("/path/to/file.ext");
   *
   * parser.replace("_foo_$ext.js") // => /path/to/_foo_.ext.js
   */
  replace(filename: string) {
    return join(this.path.dir, this.parse(filename));
  }
}
