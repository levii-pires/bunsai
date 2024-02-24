import { FSCache } from "../internals";
import type {
  Module,
  LoaderInitiator,
  CacheInvalidateHandler,
  RequestData,
} from "../types";

const invalidationDict: Record<string, boolean> = {};

function responseInit(
  headers: Record<string, string> | undefined
): ResponseInit {
  return {
    headers: { "Content-Type": "text/html; charset=utf-8", ...headers },
  };
}

async function invalidation(
  filePath: string,
  data: RequestData,
  headers: Record<string, string> | undefined,
  invalidate: CacheInvalidateHandler,
  cache: FSCache
) {
  const invalid = invalidate(data);

  if (invalid === true) {
    await cache.invalidate(filePath, { force: true });
    return;
  } else if (typeof invalid == "number") {
    setTimeout(() => cache.invalidate(filePath, { force: true }), invalid);
  }

  const inCache = cache.file(filePath);
  if (await inCache.exists())
    return new Response(inCache, responseInit(headers));
}

const ModuleLoaderInit: LoaderInitiator = async ({ dev }) => {
  const cache = new FSCache("loader", "module", dev);

  await cache.setup();

  return async (filePath, data) => {
    const { handler, headers, invalidate } = (await import(filePath)) as Module;

    if (typeof handler != "function")
      throw new Error(
        `${filePath}: Should have an export named "handler" of type "function"`
      );

    const shouldCache = typeof invalidate == "function" && !dev;

    if (shouldCache) {
      const invResult = await invalidation(
        filePath,
        data,
        headers,
        invalidate,
        cache
      );

      if (invResult) return invResult;
    }

    const result = await handler(data);

    if (shouldCache) {
      await cache.write(
        filePath,
        result instanceof Response ? await result.arrayBuffer() : result
      );
    }

    if (result instanceof Response) return result;

    return new Response(result, responseInit(headers));
  };
};

export default ModuleLoaderInit;
