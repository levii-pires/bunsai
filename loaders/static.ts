import type { BuildResult, Extname, RequestData } from "../types";
import type FilenameParser from "../internals/filename";
import Loader from "../internals/loader";

export default class StaticLoader extends Loader {
  constructor(public extensions: Extname[]) {
    super();
  }

  handle(filePath: string, { request }: RequestData) {
    if (request.method != "GET") return new Response(null, { status: 405 });

    return new Response(Bun.file(filePath));
  }

  build(filePath: string, filenameParser: FilenameParser): BuildResult[] {
    return [
      {
        content: Bun.file(filePath),
        type: "asset",
        filename: filenameParser.parse("[name][ext]"),
      },
    ];
  }
}
