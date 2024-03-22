import type BunSai from "..";

export default class ModuleLoader implements BunSai.Loader {
  extensions = [".ts", ".tsx"] as const;

  setup(bunsai: BunSai) {}

  build(): BunSai.LoaderBuildConfig {
    return {
      target: "bun",
    };
  }
}
