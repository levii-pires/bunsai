import { resolve } from "path";

export function resolveModule(id: string, source: string): string {
  return import.meta.resolveSync(
    id.replace(/^\$(\w*)?\//, "bunsai/$1/"),
    resolve(source)
  );
}
