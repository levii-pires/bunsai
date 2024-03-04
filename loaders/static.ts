import type { BuildResult, Extname, RequestData } from "../types";
import Loader from "../internals/loader";

export default class StaticLoader extends Loader {
  constructor(public extensions: Extname[]) {
    super();
  }

  handle(filePath: string, { request }: RequestData) {
    if (request.method != "GET") return new Response(null, { status: 405 });

    return new Response(Bun.file(filePath));
  }

  build(filePath: string): BuildResult[] {
    return [
      {
        content: Bun.file(filePath),
        serve: "static",
      },
    ];
  }
}
