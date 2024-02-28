import getNunjucksLoader from "../../loaders/nunjucks";
import { loaderTest } from "../testing";
import { describe } from "bun:test";

const { loaderInit } = getNunjucksLoader();

describe("Nunjucks Loader", () => {
  loaderTest({
    bunsaiOpts: {
      loaders: { ".njk": loaderInit },
      dir: "./tests/pages",
    },
    contentType: "text/html",

    testKey: "nunjucks",
    responseIncludes: "https://bun.test/nunjucks",
  });
});
