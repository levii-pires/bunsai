import { resolve } from "path";

export function resolveModule(id: string): string {
  return id
    .replace(/^\$(\w*)?\//, resolve("node_modules/bunsai/$1/") + "/")
    .replace(/^module:(\w*)?\//, resolve("node_modules/$1/") + "/");
}
