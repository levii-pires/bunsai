#!/usr/bin/env bun

import BunSaiDev from "..";
import { userConfig } from "../internals/globals";
import { name, version } from "../package.json";

console.log(`${name}@${version}\n`);

await BunSaiDev.build(userConfig || {});
