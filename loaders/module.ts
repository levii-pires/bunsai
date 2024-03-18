import { FSCache } from "../internals";
import type { Module, LoaderInitiator } from "../types";

function responseInit(
  headers: Record<string, string> | undefined
): ResponseInit {
  return {
    headers: { "Content-Type": "text/html; charset=utf-8", ...headers },
  };
}
