#!/usr/bin/env bun

import BunSaiDev from "..";
import { userConfig, userConfigFilePath } from "../internals/globals";
import { name, version } from "../package.json";

console.log(`${name}@${version}\n`);

async function main() {
  const { fetch, middlewares, loaders } = await BunSaiDev.fromUserConfig(
    userConfig,
    userConfigFilePath
  );

  const server = Bun.serve({
    ...userConfig?.serve,
    fetch,
  });

  console.log(`Server on: ${server.hostname}:${server.port}`);

  console.log("\nUsing middlewares:");

  console.log(
    Object.entries(middlewares)
      .map(([key, value]) => {
        return `\ton ${key}: '${value.keys().join("', '") || "%empty%"}'`;
      })
      .join("\n")
  );

  const ll: Record<string, string[]> = {};

  for (const [key, value] of loaders.entries()) {
    ll[value.constructor.name] ||= [];
    ll[value.constructor.name].push(key);
  }

  console.log("\nUsing loaders:");
  console.log(
    Object.entries(ll)
      .map(([key, value]) => {
        return `\t${key}: '${value.join("', '")}'`;
      })
      .join("\n")
  );

  return server;
}

const server = await main();
