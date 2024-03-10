#!/usr/bin/env bun

import BunSaiDev from "..";
import { userConfig } from "../internals/globals";
import { userConf2Options } from "../internals/userConf2Options";
import { name, version } from "../package.json";

console.log(`${name}@${version}\n`);

await BunSaiDev.build(await userConf2Options(userConfig || {}));
