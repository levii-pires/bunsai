import type { LoaderInitiator } from "../types";

const StaticLoaderInit: LoaderInitiator = () => ({
  handle(filePath, { request }) {
    if (request.method != "GET") return new Response(null, { status: 405 });

    return new Response(Bun.file(filePath));
  },
  build(filePath) {
    return [
      {
        content: Bun.file(filePath),
        type: "asset",
      },
    ];
  },
});

export default StaticLoaderInit;
