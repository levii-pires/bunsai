import getSassLoader from "../../loaders/sass";
import { loaderTest } from "../testing";
import { describe } from "bun:test";

describe("Sass Loader", () => {
  loaderTest({
    bunsaiOpts: {
      loaders: { ".scss": getSassLoader() },
      dir: "./tests/pages",
    },
    contentType: "text/css",
    testKey: "sass",
    responseIncludes: "margin: 44px",
  });
});
