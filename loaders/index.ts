import ModuleLoader from "./module";

export { default as ModuleLoader } from "./module";
export { default as StaticLoader } from "./static";

export const ServerModules = {
  ".ts": ModuleLoader,
  ".tsx": ModuleLoader,
} as const;
