import { Glob } from "bun";
import type { UserConfig } from "../types";
import { resolve } from "path";

const configFileGlob = "bunsai.config.{ts,js}";

let configFilePath: string;

async function getUserConfig() {
  configFilePath = "";

  const path = await getUserConfigFilePath();

  if (!path) {
    console.log(
      `\nno files were found matching the pattern '${configFileGlob}'\n`
    );
    return;
  }

  const options: UserConfig = (await import(resolve(path))).default;

  if (typeof options != "object") {
    console.error(new Error("bunsai config file should have a default export"));
    return;
  }

  return options;
}

export const serverEntrypointFilename = ".server-entrypoint.js";
export const userConfig = await getUserConfig();
export const userConfigFilePath = await getUserConfigFilePath();
export const outputFolder = userConfig?.output || "./bunsai-build";
export const manifestFilename = ".build-manifest.json";

export async function getUserConfigFilePath() {
  if (configFilePath) return configFilePath;

  const glob = new Glob(configFileGlob).scan();

  for await (const path of glob) {
    return (configFilePath = path);
  }
}
