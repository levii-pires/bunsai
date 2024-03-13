#!/usr/bin/env bun

import BunSaiDev from "..";
import { userConfig, userConfigFilePath } from "../internals/globals";
import { name, version } from "../package.json";

console.log(`${name}@${version}\n`);

const { fetch } = await BunSaiDev.fromUserConfig(
  userConfig,
  userConfigFilePath
);

const server = Bun.serve({
  ...userConfig?.serve,
  fetch,
});

console.log(`Server on: ${server.hostname}:${server.port}`);
