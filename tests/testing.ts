import { it, expect } from "bun:test";
import { Server, nanoseconds } from "bun";
import BunSaiDev, { BunSaiOptions } from "bunsai";

interface TestOptions {
  testKey: string;
  contentType: string;
  responseIncludes: string;
  bunsaiOpts: BunSaiOptions;
  ignoreGET?: boolean;
}

const portList: number[] = [];

export function loaderTest({
  testKey,
  contentType,
  bunsaiOpts,
  responseIncludes,
  ignoreGET,
}: TestOptions) {
  const {
    server,
    bunsai: { ready },
  } = getInstance(bunsaiOpts);

  it("should use cache", async () => {
    await ready;

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
    await ready;

    const response = await server.fetch(
      new Request(`https://bun.test/${testKey}`)
    );

    expect(response.headers.get("content-type")).toStartWith(contentType);

    expect(await response.text()).toInclude(responseIncludes);
  });

  if (ignoreGET) return;

  it("should block non 'GET' methods", async () => {
    await ready;

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
  const bunsai = new BunSaiDev(options);

  bunsai.setup();

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
