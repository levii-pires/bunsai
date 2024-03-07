#!/usr/bin/env bun

import { program } from "commander";
import { userConfig } from "./globals";
import useRecommended from "./recommended";
import { version, name } from "./package.json";

const {
  bunsai: { build, fetch },
} = await useRecommended(userConfig);

program.version(version);
program.name(name);

program.command("build").action(build);

program.command("dev").action(async () => {
  Bun.serve({
    ...userConfig?.serveOptions,
    fetch,
  });
});

await program.parseAsync();
