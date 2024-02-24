import { it, expect } from "bun:test";
import { Server, nanoseconds } from "bun";
import BunSai, { BunSaiOptions } from "..";

interface TestOptions {
  testKey: string;
  contentType: string;
  responseIncludes: string;
  bunsaiOpts: BunSaiOptions;
}

const portList: number[] = [];

export function loaderTest({
  testKey,
  contentType,
  bunsaiOpts,
  responseIncludes,
}: TestOptions) {
  const { server } = getInstance(bunsaiOpts);

  it("should use cache", async () => {
    const firstRunInit = nanoseconds();
    await server.fetch(new Request(`https://bun.test/${testKey}`));
    const firstRunEnd = nanoseconds();

    const secondRunInit = nanoseconds();
    await server.fetch(new Request(`https://bun.test/${testKey}`));
    const secondRunEnd = nanoseconds();

    const firstRunElapsed = firstRunEnd - firstRunInit;
    const secondRunElapsed = secondRunEnd - secondRunInit;

    expect(secondRunElapsed).toBeLessThan(firstRunElapsed);
  });

  it(`should load ${testKey} files`, async () => {
    const response = await server.fetch(
      new Request(`https://bun.test/${testKey}`)
    );

    expect(response.headers.get("content-type")).toStartWith(contentType);

    expect(await response.text()).toInclude(responseIncludes);
  });

  it("should block non 'GET' methods", async () => {
    const response1 = await server.fetch(
      new Request(`https://bun.test/${testKey}`, { method: "POST" })
    );

    const response2 = await server.fetch(
      new Request(`https://bun.test/${testKey}`, { method: "GET" })
    );

    expect(response1.status).toBe(405);
    expect(response2.status).toBe(200);
  });
}

export function getInstance(options: BunSaiOptions) {
  const bunsai = new BunSai(options);

  const server = Bun.serve({
    fetch: bunsai.fetch,
    port: (portList.at(-1) || 2999) + 1,
  });

  portList.push(server.port);

  return {
    bunsai,
    server,
  };
}
