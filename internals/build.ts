import type { Extname } from "../types";
import type BunSai from "..";
import { dirname, extname, relative, resolve } from "path";
import FSCache from "./fsCache";
import FilenameParser from "./filename";
import { rm } from "fs/promises";

const buildFolder = "bunsai-build";

export async function build(bunsai: BunSai) {
  console.time("BunSai build");

  console.log("Clearing build folder");

  await rm(buildFolder, { force: true, recursive: true });

  console.log("Done\n");

  const files = Object.values(bunsai.router.routes);

  const bundleEntries: string[] = [];
  const moduleEntries: string[] = [];

  const cache = await FSCache.init("build", "@bunsai");

  console.log("Building files:");

  for (const file of files) {
    const ext = extname(file).toLowerCase();

    const loader = bunsai.loaders.get(ext as Extname);

    if (!loader) throw new Error("BuildError: no loader found for " + ext);

    const relativeOut = relative(resolve(bunsai.options.dir), dirname(file));

    const parser = new FilenameParser(file);

    const result = await loader.build(file, parser);

    for (const res of result) {
      const fln = res.filename || parser.parse("$name$ext");

      const outPath = resolve(buildFolder, relativeOut, fln);

      switch (res.type) {
        case "bundle": {
          bundleEntries.push(await cache.write(outPath, res.content));
          break;
        }
        case "module": {
          moduleEntries.push(await cache.write(outPath, res.content));
          break;
        }
        default: {
          await Bun.write(outPath, res.content);
          console.log("\t", outPath);
          break;
        }
      }
    }
  }

  if (bundleEntries.length > 0) {
    const { logs, outputs } = await Bun.build({
      entrypoints: bundleEntries,
      splitting: true,
      target: "browser",
      outdir: buildFolder,
      minify: true,
    });

    logs.forEach((l) => console.log(l));
    for (const out of outputs) {
      const outPath = resolve(buildFolder, out.path);
      console.log("\t", outPath);
    }
  }

  if (moduleEntries.length > 0) {
    const { logs, outputs } = await Bun.build({
      entrypoints: moduleEntries,
      splitting: true,
      target: "bun",
      outdir: buildFolder,
      naming: { chunk: ".module-[name]-[hash].[ext]" },
    });

    logs.forEach((l) => console.log(l));

    for (const out of outputs) {
      const outPath = resolve(buildFolder, out.path);
      console.log("\t", outPath);
    }
  }

  console.log();
  console.timeEnd("BunSai build");
}
