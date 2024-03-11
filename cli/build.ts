#!/usr/bin/env bun

import BunSaiDev from "..";
import { name, version } from "../package.json";
import { userConfig } from "../internals/globals";

console.log(`${name}@${version}\n`);

const { build } = await BunSaiDev.fromUserConfig(userConfig);

await build();
