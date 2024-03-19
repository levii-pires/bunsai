import type BunSai from "..";

function responseInit(
  headers: Record<string, string> | undefined
): ResponseInit {
  return {
    headers: { "Content-Type": "text/html; charset=utf-8", ...headers },
  };
}

export default class ModuleLoader implements BunSaiLoader {
  isDev = false;
  extensions: Extname[] = [".ts", ".tsx"];

  setup(bunsai: BunSai) {
    this.isDev = bunsai.options.dev;
  }

  plugins(payload: BunSaiLoaderPayload): Response | Promise<Response> {
    throw new Error("Method not implemented.");
  }
}
