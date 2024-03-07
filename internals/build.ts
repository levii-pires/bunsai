import type { BuildManifest, Extname } from "../types";
import type BunSaiDev from "..";
import { dirname, extname, relative, resolve, join } from "path";
import FSCache from "./fsCache";
import FilenameParser from "./filename";
import { rm } from "fs/promises";
import { manifestFilename, outputFolder } from "../globals";
import { parseAsync } from "dree";

const indexModule = `
import BunSai from "bunsai/bunsai-core";
import { outputFolder, manifestFilename, userConfig } from "bunsai/globals";
import { join } from "path";

const { fetch } = new BunSai(userConfig || {}, await Bun.file(join(outputFolder, manifestFilename)).json());

const server = Bun.serve({
  ...userConfig?.serve,
  fetch,
});

console.log(\`Server on: \${server.hostname}:\${server.port}\`);

`;

export async function build(bunsai: BunSaiDev) {
  console.time("BunSai build time");

  console.log("Clearing build folder...");

  await rm(outputFolder, { force: true, recursive: true });

  console.log("Done\n");

  const files = Object.values(bunsai.router.routes);

  const browserEntries: string[] = [];
  const serverEntries: string[] = [];

  const cache = await FSCache.init("build", "@bunsai");

  const buildManifest: BuildManifest = { extensions: [], files: {} };

  for (const file of files) {
    const ext = extname(file).toLowerCase();

    const loader = bunsai.loaders.get(ext as Extname);

    if (!loader) throw new Error("BuildError: no loader found for " + ext);

    const relativeOut = relative(resolve(bunsai.options.dir), dirname(file));

    const parser = new FilenameParser(file);

    const result = await loader.build(file, parser);

    for (const res of result) {
      const outPath = resolve(outputFolder, relativeOut, res.filename);

      switch (res.type) {
        case "browser": {
          browserEntries.push(await cache.write(outPath, res.content));
          break;
        }
        case "server": {
          serverEntries.push(await cache.write(outPath, res.content));
          break;
        }
        default: {
          await Bun.write(outPath, res.content);
          buildManifest.files[outPath] = "asset";
          buildManifest.extensions.push(extname(outPath) as Extname);
          break;
        }
      }
    }
  }

  console.log("Injecting server entrypoint...");

  serverEntries.push(
    await cache.write(
      resolve(join(outputFolder, ".server-entrypoint.ts")),
      indexModule
    )
  );

  console.log("Building files...");

  if (browserEntries.length > 0) {
    const { logs, outputs, success } = await Bun.build({
      entrypoints: browserEntries,
      splitting: true,
      target: "browser",
      outdir: outputFolder,
      minify: true,
    });

    if (!success) {
      throw new AggregateError(logs, "BunSai build error");
    }

    for (const out of outputs) {
      if (out.kind == "entry-point") {
        buildManifest.files[resolve(outputFolder, out.path)] = "browser";
        buildManifest.extensions.push(extname(out.path) as Extname);
      }
    }
  }

  if (serverEntries.length > 0) {
    const { logs, outputs, success } = await Bun.build({
      entrypoints: serverEntries,
      splitting: true,
      target: "bun",
      outdir: outputFolder,
      minify: true,
      naming: { chunk: ".server-[name]-[hash].[ext]" },
    });

    if (!success) {
      throw new AggregateError(logs, "BunSai build error");
    }

    for (const out of outputs) {
      if (out.kind == "entry-point") {
        buildManifest.files[resolve(outputFolder, out.path)] = "server";
        buildManifest.extensions.push(extname(out.path) as Extname);
      }
    }
  }

  buildManifest.extensions = Array.from(
    new Set(buildManifest.extensions)
  ).filter((str) => !!str); // remove duplicated extensions and empty strings

  await Bun.write(
    join(outputFolder, manifestFilename),
    JSON.stringify(buildManifest)
  );

  console.log();
  console.timeEnd("BunSai build time");
  console.log();

  console.log(await parseAsync(outputFolder));
}
