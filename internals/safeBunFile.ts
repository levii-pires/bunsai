import type { BunFile } from "bun";

async function callWrapper<T>(
  call: () => Promise<T>
): Promise<FailsafeReturn<T>> {
  try {
    return [await call(), null];
  } catch (error) {
    if ((error as ErrnoException).code == "ENOENT") return [null, null];

    return [null, error as ErrnoException];
  }
}

type FailsafeReturn<T> = [T, null] | [null, null | ErrnoException];
export interface SafeBunFile
  extends Omit<BunFile, "arrayBuffer" | "formData" | "json" | "text"> {
  arrayBuffer(): Promise<FailsafeReturn<ArrayBuffer>>;
  formData(): Promise<FailsafeReturn<FormData>>;
  json(): Promise<FailsafeReturn<any>>;
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
  return Object.assign(file, {
    arrayBuffer() {
      return callWrapper(() => file.arrayBuffer());
    },
    formData() {
      return callWrapper(() => file.formData());
    },
    json() {
      return callWrapper(() => file.json());
    },
    text() {
      return callWrapper(() => file.text());
    },
  });
}
