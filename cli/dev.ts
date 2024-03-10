#!/usr/bin/env bun

import BunSaiDev from "..";
import { userConfig } from "../internals/globals";
import { userConf2Options } from "../internals/userConf2Options";
import { name, version } from "../package.json";

console.log(`${name}@${version}\n`);

const options = await userConf2Options(userConfig || {});

const { fetch } = await BunSaiDev.init(options);

const server = Bun.serve({
  ...userConfig?.serve,
  fetch,
});

console.log(`Server on: ${server.hostname}:${server.port}`);
