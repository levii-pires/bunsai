import BunSai from "../";
import ModuleLoader from "../loaders/module";
import SassLoader from "../loaders/sass";

const init = performance.now();

const { build, setup, writeManifest } = new BunSai({
  loaders: [new ModuleLoader(), new SassLoader()],
});

await setup();

Bun.serve({ fetch: await build() });

const end = performance.now();

console.log("BunSai init took ", ((end - init) / 1000).toFixed(3), "seconds");

await writeManifest("manifest.json");
export {};
