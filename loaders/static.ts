import type { LoaderInitiator } from "../types";

const StaticLoaderInit: LoaderInitiator =
  () =>
  (filePath, { request }) => {
    if (request.method != "GET") return new Response(null, { status: 405 });

    return new Response(Bun.file(filePath));
  };

export default StaticLoaderInit;
