#!/usr/bin/env bun

import { userConfig } from "../globals";
import useRecommended from "../recommended";

const {
  bunsai: { fetch },
} = await useRecommended(userConfig);

const server = Bun.serve({
  ...userConfig?.serveOptions,
  fetch,
});

console.log(`Server on: ${server.hostname}:${server.port}`);
