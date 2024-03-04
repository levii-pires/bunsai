import NunjucksLoader from "../../loaders/nunjucks";
import { loaderTest } from "../testing";
import { describe } from "bun:test";

describe("Nunjucks Loader", () => {
  loaderTest({
    bunsaiOpts: {
      loaders: [new NunjucksLoader()],
      dir: "./pages",
    },
    contentType: "text/html",
    testKey: "nunjucks",
    responseIncludes: "https://bun.test/nunjucks",
  });
});
