import { loaderTest } from "../testing";
import { describe } from "bun:test";
import { ModuleLoaderInit } from "../../loaders";

describe("Module Loader", () => {
  loaderTest({
    bunsaiOpts: {
      loaders: { ".ts": ModuleLoaderInit },
      dir: "./tests/pages",
      dev: false,
    },
    contentType: "text/html",
    testKey: "module",
    responseIncludes: "test!",
    ignoreGET: true,
  });
});
