import getSvelteLoader from "../../loaders/svelte";
import { loaderTest } from "../testing";
import { describe } from "bun:test";

describe("Svelte Loader", () => {
  loaderTest({
    bunsaiOpts: {
      loaders: { ".svelte": getSvelteLoader() },
      dir: "./tests/pages",
    },
    contentType: "text/html",
    testKey: "svelte",
    responseIncludes: "testes",
  });
});
