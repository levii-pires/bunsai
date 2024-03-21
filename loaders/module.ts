import type BunSai from "..";

export default class ModuleLoader implements BunSaiLoader {
  isDev = false;
  extensions = [".ts", ".tsx"] as const;

  setup(bunsai: BunSai) {
    this.isDev = bunsai.options.dev;
  }

  build(): BunSaiLoaderBuildConfig {
    return {
      target: "bun",
    };
  }

  async load(filePath: string, payload: BunSaiLoaderPayload) {
    const mod = (await import(filePath)).default as BunSaiModuleHandler;

    // todo: implement invalidation

    return (await mod(payload)).result;
  }
}
