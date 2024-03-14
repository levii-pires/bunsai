import { resolve } from "path";

export function resolveModule(id: string, source: string) {
  return import.meta.resolve(
    id.replace(/^\$(\w*)?\//, "bunsai/$1/"),
    resolve(source)
  );
}
