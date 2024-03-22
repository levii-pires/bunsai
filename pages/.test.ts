import BunSai from "../";
import ModuleLoader from "../loaders/module";
import SassLoader from "../loaders/sass";

const init = performance.now();

const { build, setup } = new BunSai({
  loaders: [new ModuleLoader(), new SassLoader()],
});

await setup();

const end = performance.now();

console.log("BunSai init took ", ((end - init) / 1000).toFixed(3), "seconds");

Bun.serve({ fetch: await build() });

export {};
