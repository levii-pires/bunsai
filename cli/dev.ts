#!/usr/bin/env bun

import BunSaiDev from "..";
import { userConfig } from "../internals/globals";
import { userConf2Options } from "../internals/userConf2Options";
import { name, version } from "../package.json";

console.log(`${name}@${version}\n`);

const { fetch } = await BunSaiDev.init(
  await userConf2Options(userConfig || {})
);

const server = Bun.serve({
  ...userConfig?.serve,
  fetch,
});

console.log(`Server on: ${server.hostname}:${server.port}`);
