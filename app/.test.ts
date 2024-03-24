import BunSai from "../";
import SassLoader from "../loaders/sass";
import Watch from "../middlewares/watch";

// const init = performance.now();

const { start, writeManifest, events, setup, build } = new BunSai({
  loaders: [new SassLoader()],
  // staticFiles: [".txt", ".bip"],
  middlewares: [new Watch()],
});

await setup();

await build();

// Bun.serve({ fetch: await start() });

// const end = performance.now();

// console.log("BunSai init took ", ((end - init) / 1000).toFixed(3), "seconds");

// await writeManifest("manifest.json");
export {};
