import SassLoader from "../../loaders/sass";
import { loaderTest } from "../testing";
import { describe } from "bun:test";

describe("Sass Loader", () => {
  loaderTest({
    bunsaiOpts: {
      loaders: [new SassLoader()],
      dir: "./pages",
    },
    contentType: "text/css",
    testKey: "sass",
    responseIncludes: "margin: 44px",
  });
});
