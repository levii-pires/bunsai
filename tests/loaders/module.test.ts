import { loaderTest } from "../testing";
import { describe } from "bun:test";
import ModuleLoader from "bunsai/loaders/module";

describe("Module Loader", () => {
  loaderTest({
    bunsaiOpts: {
      loaders: [new ModuleLoader()],
      dir: "./pages",
      dev: false,
    },
    contentType: "text/html",
    testKey: "module",
    responseIncludes: "test!",
    ignoreGET: true,
  });
});
