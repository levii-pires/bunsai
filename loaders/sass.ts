import type { LoaderInitiator } from "../types";
import { compile, Options } from "sass";

export default function getSassLoader(
  options?: Options<"sync">
): LoaderInitiator {
  return () => {
    return async (filePath, { request }) => {
      if (request.method != "GET") return new Response(null, { status: 405 });

      return new Response(compile(filePath, options).css, {
        headers: { "Content-Type": "text/css; charset=utf-8" },
      });
    };
  };
}
