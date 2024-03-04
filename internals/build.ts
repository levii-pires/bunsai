import type { Extname } from "../types";
import type BunSai from "..";
import type { BuildConfig } from "bun";
import { dirname, extname, relative, resolve } from "path";
import FSCache from "./fsCache";
import FilenameParser from "./filename";
import { rm } from "fs/promises";

const buildFolder = "bunsai-build";

export async function build(bunsai: BunSai) {
  console.log("Clearing build folder");

  await rm(buildFolder, { force: true, recursive: true });

  console.log("Done\n");

  const files = Object.values(bunsai.router.routes);

  const bundleEntries: string[] = [];

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

      switch (res.serve) {
        case "bundle": {
          const cacheOut = await cache.write(outPath, res.content);

          const { logs, outputs, success } = await Bun.build({
            ...res.bundleConfig,
            target: "browser",
            splitting: false,
            minify: true,
            outdir: undefined,
            entrypoints: [cacheOut],
          });

          logs.forEach((l) => console.log(l));

          if (success) {
            bundleEntries.push(await cache.write(outPath, outputs[0]));
          }

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
      outdir: buildFolder,
    });

    logs.forEach((l) => console.log(l));

    for (const out of outputs) {
      const outPath = resolve(buildFolder, out.path);
      await Bun.write(outPath, out);
      console.log("\t", outPath);
    }
  }
}
