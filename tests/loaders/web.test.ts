import { loaderTest } from "../testing";
import { describe } from "bun:test";
import WebLoader from "../../loaders/web";

describe("Web Loader", () => {
  loaderTest({
    bunsaiOpts: {
      loaders: [new WebLoader()],
      dir: "./pages",
      dev: false,
    },
    contentType: "text/javascript",
    testKey: "web",
    responseIncludes: "test",
  });
});
