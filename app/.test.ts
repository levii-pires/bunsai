import BunSai from "../";
import ModuleLoader from "../loaders/module";
import SassLoader from "../loaders/sass";
import Watch from "../middlewares/watch";

const init = performance.now();

const { start, writeManifest, events } = new BunSai({
  loaders: [new ModuleLoader(), new SassLoader()],
  staticFiles: [".txt"],
  middlewares: [new Watch()],
});

Bun.serve({ fetch: await start() });

const end = performance.now();

console.log("BunSai init took ", ((end - init) / 1000).toFixed(3), "seconds");

await writeManifest("manifest.json");
export {};
