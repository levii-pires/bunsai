import { describe, it, expect, afterAll } from "bun:test";
import BunSai from "../..";
import getSassLoader from "../../loaders/sass";

const { fetch } = new BunSai({
  loaders: { ".scss": getSassLoader() },
  dir: "./tests/pages",
});

const server = Bun.serve({ fetch });

afterAll(() => {
  server.unref();
  server.stop();
});

// ver isso
// describe("Sass Loader", () => {
//   it("should load sass files", async () => {
//     // console.time("1st run");
//     // await server.fetch(new Request("https://bun.test/sass"));
//     // console.timeEnd("1st run");

//     // console.time("2nd run");
//     const response = await server.fetch(new Request("https://bun.test/sass"));
//     // console.timeEnd("2nd run");

//     expect(response.headers.get("content-type")).toStartWith("text/css");
//     expect(await response.text()).toInclude("margin: 44px;");
//   });
// });
