import type { BuildManifest, Extname } from "../types";
import type BunSaiDev from "..";
import { dirname, extname, relative, resolve, basename } from "path";
import FSCache from "./fsCache";
import FilenameParser from "./filename";
import { rm } from "fs/promises";
import {
  getUserConfigFilePath,
  manifestFilename,
  outputFolder,
  serverEntrypointFilename,
} from "./globals";
import { parseAsync } from "dree";
import { version } from "../package.json";

const configFilePath = await getUserConfigFilePath();

const configFilename = configFilePath ? "." + basename(configFilePath) : void 0;

const indexModule = `
import BunSai from "bunsai/bunsai-core";
import { join } from "path";

${
  configFilePath
    ? `import userConfig from "./${configFilename}";`
    : "const userConfig = {};"
}

const manifestFilename = "${manifestFilename}";
const outputFolder = "${outputFolder}";

global.BunSai = { userConfig, manifestFilename, outputFolder };

const { fetch } = new BunSai({ ...userConfig, dir: outputFolder }, await Bun.file(join(outputFolder, manifestFilename)).json());

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

  const files = Object.values(bunsai.router.routes);

  const browserEntries: string[] = [];
  const serverEntries: string[] = [];

  const cache = await FSCache.init("build", "@bunsai");

  const buildManifest: BuildManifest = { extensions: [], files: {}, version };

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
          buildManifest.files[outPath.replaceAll("\\", "/")] = "asset";
          buildManifest.extensions.push(extname(outPath) as Extname);
          break;
        }
      }
    }
  }

  if (configFilePath) {
    console.log("Injecting user config...");

    serverEntries.push(
      await cache.write(
        resolve(outputFolder, configFilename!),
        Bun.file(configFilePath)
      )
    );
  }

  console.log("Injecting server entrypoint...");

  serverEntries.push(
    await cache.write(
      resolve(outputFolder, serverEntrypointFilename),
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
        buildManifest.files[
          resolve(outputFolder, out.path).replaceAll("\\", "/")
        ] = "browser";
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

    const tsExt = /\.ts$/;

    for (const out of outputs) {
      if (out.kind == "entry-point") {
        if (
          (configFilename &&
            out.path.endsWith(configFilename.replace(tsExt, ".js"))) ||
          out.path.endsWith(serverEntrypointFilename)
        )
          continue;

        const fil = resolve(outputFolder, out.path).replaceAll("\\", "/");

        buildManifest.files[fil] = "server";

        buildManifest.extensions.push(extname(out.path) as Extname);
      }
    }
  }

  buildManifest.extensions = Array.from(
    new Set(buildManifest.extensions)
  ).filter((str) => !!str); // remove duplicated extensions and empty strings

  await Bun.write(
    resolve(outputFolder, manifestFilename),
    JSON.stringify(buildManifest)
  );

  console.log();
  console.timeEnd("BunSai build time");
  console.log();

  console.log(await parseAsync(outputFolder));

  console.log(`\nNow run 'bun ${outputFolder}/.server-entrypoint.js'`);
}
