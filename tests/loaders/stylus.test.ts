import getStylusLoader from "../../loaders/stylus";
import { loaderTest } from "../testing";
import { describe } from "bun:test";

describe("Stylus Loader", () => {
  loaderTest({
    bunsaiOpts: {
      loaders: { ".styl": getStylusLoader() },
      dir: "./tests/pages",
    },
    contentType: "text/css",
    testKey: "stylus",
    responseIncludes: "margin: 44px",
  });
});
