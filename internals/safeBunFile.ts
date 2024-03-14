import type { BunFile } from "bun";

function wrapSafe<T>(call: () => Promise<T>): () => Promise<FailsafeReturn<T>> {
  return async () => {
    try {
      return [await call(), null];
    } catch (error) {
      if ((error as ErrnoException).code == "ENOENT") return [null, null];

      return [null, error as ErrnoException];
    }
  };
}

type FailsafeReturn<T> = [T, null] | [null, null | ErrnoException];
export interface SafeBunFile {
  /**
   * The underlying BunFile object
   */
  file: BunFile;
  /**
   * @returns
   * Possible return values:
   *
   * - `[ArrayBuffer, null]` => No problems here
   * - `[null, null]` => File not found
   * - `[null, error]` => Something went wrong
   */
  arrayBuffer(): Promise<FailsafeReturn<ArrayBuffer>>;
  /**
   * @returns
   * Possible return values:
   *
   * - `[FormData, null]` => No problems here
   * - `[null, null]` => File not found
   * - `[null, error]` => Something went wrong
   */
  formData(): Promise<FailsafeReturn<FormData>>;
  /**
   * @returns
   * Possible return values:
   *
   * - `[JSON, null]` => No problems here
   * - `[null, null]` => File not found
   * - `[null, error]` => Something went wrong
   */
  json<T = any>(): Promise<FailsafeReturn<T>>;
  /**
   * @returns
   * Possible return values:
   *
   * - `[String, null]` => No problems here
   * - `[null, null]` => File not found
   * - `[null, error]` => Something went wrong
   */
  text(): Promise<FailsafeReturn<string>>;
}

export function SafeBunFile(
  path: string | URL,
  options?: BlobPropertyBag
): SafeBunFile;
export function SafeBunFile(
  path: ArrayBufferLike | Uint8Array,
  options?: BlobPropertyBag
): SafeBunFile;
export function SafeBunFile(
  fileDescriptor: number,
  options?: BlobPropertyBag
): SafeBunFile;
export function SafeBunFile(path: any, options?: BlobPropertyBag): SafeBunFile {
  const file = Bun.file(path, options);
  return {
    file,
    arrayBuffer: wrapSafe(() => file.arrayBuffer()),
    formData: wrapSafe(() => file.formData()),
    json: wrapSafe(() => file.json()),
    text: wrapSafe(() => file.text()),
  };
}
