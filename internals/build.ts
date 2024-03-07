import type { BuildManifest, Extname } from "../types";
import type BunSai from "..";
import { dirname, extname, relative, resolve, join } from "path";
import FSCache from "./fsCache";
import FilenameParser from "./filename";
import { rm } from "fs/promises";
import { outputFolder } from "../globals";
import { parseAsync } from "dree";

export async function build(bunsai: BunSai) {
  console.time("BunSai build time");

  console.log("Clearing build folder...");

  await rm(outputFolder, { force: true, recursive: true });

  console.log("Done\n");

  const files = Object.values(bunsai.router.routes);

  const browserEntries: string[] = [];
  const serverEntries: string[] = [];

  const cache = await FSCache.init("build", "@bunsai");

  console.log("Building files...");

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
          buildManifest.extensions.push(extname(outPath));
          break;
        }
      }
    }
  }

  if (browserEntries.length > 0) {
    const { logs, outputs } = await Bun.build({
      entrypoints: browserEntries,
      splitting: true,
      target: "browser",
      outdir: outputFolder,
      minify: true,
    });

    logs.forEach((l) => console.log(l));

    for (const out of outputs) {
      if (out.kind == "entry-point") {
        buildManifest.files[resolve(outputFolder, out.path)] = "browser";
        buildManifest.extensions.push(extname(out.path));
      }
    }
  }

  if (serverEntries.length > 0) {
    const { logs, outputs } = await Bun.build({
      entrypoints: serverEntries,
      splitting: true,
      target: "bun",
      outdir: outputFolder,
      minify: true,
      naming: { chunk: ".module-[name]-[hash].[ext]" },
    });

    logs.forEach((l) => console.log(l));

    for (const out of outputs) {
      if (out.kind == "entry-point") {
        buildManifest.files[resolve(outputFolder, out.path)] = "server";
        buildManifest.extensions.push(extname(out.path));
      }
    }
  }

  buildManifest.extensions = Array.from(
    new Set(buildManifest.extensions)
  ).filter((str) => !!str); // remove duplicated extensions and empty strings

  await Bun.write(
    join(outputFolder, ".bunsai-manifest.json"),
    JSON.stringify(buildManifest)
  );

  console.log();
  console.timeEnd("BunSai build time");
  console.log();

  console.log(await parseAsync(outputFolder));
}
