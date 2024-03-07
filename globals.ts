import { Glob } from "bun";
import type { UserConfig } from "./types";
import { resolve } from "path";

const configFileGlob = "bunsai.config.{ts,js}";

let configFilePath: string;

async function getUserConfig() {
  configFilePath = "";

  try {
    const path = await getUserConfigFilePath();

    if (!path)
      throw new Error(
        `no files were found mathing the pattern '${configFileGlob}'`
      );

    const options: UserConfig = (await import(resolve(path))).default;

    if (!options)
      throw new Error("bunsai config file should have a default export");

    return options;
  } catch (err) {
    console.error(err);
  }
}

export const userConfig = await getUserConfig();
export const outputFolder = userConfig?.output || "./bunsai-build";

export async function getUserConfigFilePath() {
  if (configFilePath) return configFilePath;

  const glob = new Glob(configFileGlob).scan();

  for await (const path of glob) {
    return (configFilePath = path);
  }
}
