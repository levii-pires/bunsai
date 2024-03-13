import type { BuildManifest, Extname } from "../types";
import type BunSaiDev from "..";
import { dirname, extname, relative, resolve, basename } from "path";
import FSCache from "./fsCache";
import FilenameParser from "./filename";
import { rm, cp } from "fs/promises";
import {
  userConfigFilePath,
  manifestFilename,
  outputFolder,
  serverEntrypointFilename,
} from "./globals";
import { parseAsync } from "dree";
import { version } from "../package.json";

const configFilename = userConfigFilePath
  ? "." + basename(userConfigFilePath)
  : void 0;

const indexModule = `
import BunSai from "bunsai/bunsai-core";
import { join } from "path";

${
  userConfigFilePath
    ? `import userConfig from "./${configFilename}";`
    : "const userConfig = {};"
}

const manifest = await Bun.file("${outputFolder}/${manifestFilename}").json();
const dir = "${resolve(outputFolder).replaceAll("\\", "\\\\")}";

global.BunSai = { userConfig, manifest, dir };

const { fetch } = await BunSai.fromUserConfig({ ...userConfig, dir }, "${
  userConfigFilePath || ""
}", manifest);

const server = Bun.serve({
  ...userConfig?.serve,
  fetch,
});

console.log(\`Server on: \${server.hostname}:\${server.port}\`);

`;

export async function build(bunsai: BunSaiDev) {
  console.log("Build init");

  console.time("BunSai build time");

  console.log("\nClear build folder");
  console.time("Clear build folder");

  await rm(outputFolder, { force: true, recursive: true });

  console.timeEnd("Clear build folder");

  const files = Object.values(bunsai.router.routes);

  const browserEntries: string[] = [],
    serverEntries: string[] = [];

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
          if (basename(outPath).startsWith(".")) break;
          buildManifest.files[outPath.replaceAll("\\", "/")] = "asset";
          buildManifest.extensions.push(extname(outPath) as Extname);
          break;
        }
      }
    }
  }

  if (userConfigFilePath) {
    console.log("\nInject user config");
    console.time("Inject user config");

    serverEntries.push(
      await cache.write(
        resolve(outputFolder, configFilename!),
        Bun.file(userConfigFilePath)
      )
    );

    console.timeEnd("Inject user config");
  }

  console.log("\nInject server entrypoint");
  console.time("Inject server entrypoint");

  serverEntries.push(
    await cache.write(
      resolve(outputFolder, serverEntrypointFilename),
      indexModule
    )
  );

  console.timeEnd("Inject server entrypoint");

  if (browserEntries.length > 0) {
    console.log("\nBuild browser files");
    console.time("Build browser files");

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

    console.timeEnd("Build browser files");
  }

  if (serverEntries.length > 0) {
    console.log("\nBuild server files");
    console.time("Build server files");

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
        if (basename(out.path).startsWith(".")) continue;

        const fil = resolve(outputFolder, out.path).replaceAll("\\", "/");

        buildManifest.files[fil] = "server";

        buildManifest.extensions.push(extname(out.path) as Extname);
      }
    }

    console.timeEnd("Build server files");
  }

  console.log("\nBuild manifest");
  console.time("Build manifest");

  buildManifest.extensions = Array.from(
    new Set(buildManifest.extensions)
  ).filter((str) => !!str); // remove duplicated extensions and empty strings

  await Bun.write(
    resolve(outputFolder, manifestFilename),
    JSON.stringify(buildManifest)
  );

  console.timeEnd("Build manifest");

  console.log("\nCopying dot-files");
  console.time("Copying dot-files");

  const glob = new Bun.Glob("**/.*");

  const dots = await Array.fromAsync(
    glob.scan({
      cwd: bunsai.options.dir,
      onlyFiles: false,
      dot: true,
    })
  );

  for (const dot of dots) {
    await cp(resolve(bunsai.options.dir, dot), resolve(outputFolder, dot), {
      recursive: true,
      force: false,
      errorOnExist: true,
    });
  }

  console.timeEnd("Copying dot-files");

  console.log();
  console.timeEnd("BunSai build time");
  console.log();

  console.log(
    await parseAsync(outputFolder, {
      exclude: /node_modules(\\|\/).*?(\\|\/).*?/,
    })
  );

  console.log(`\nNow run 'bun ${outputFolder}/${serverEntrypointFilename}'`);
}
