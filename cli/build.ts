#!/usr/bin/env bun

import BunSaiDev from "..";
import { name, version } from "../package.json";
import { userConfig, userConfigFilePath } from "../internals/globals";

console.log(`${name}@${version}\n`);

const { build } = await BunSaiDev.fromUserConfig(
  userConfig,
  userConfigFilePath
);

await build();
