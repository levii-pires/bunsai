import { CompileOptions, compile } from "svelte/compiler";
import { LoaderInitiator } from "../types";
import { FSCache } from "../internals/fsCache";

const responseInit = {
  headers: { "Content-Type": "text/html; charset=utf-8" },
};

function compileString(str: string, filename: string) {
  return compile(str, {
    filename,
    css: "injected",
    generate: "ssr",
    hydratable: true,
    dev: process.env.NODE_ENV !== "production",
  });
}

export default function getSvelteLoader(): LoaderInitiator {
  return async ({ dev }) => {
    const cache = new FSCache("loader", "svelte", dev);

    await cache.setup();

    return async (filePath, data) => {
      if (data.request.method != "GET")
        return new Response(null, { status: 405 });

      const inCache = await cache.loadResponse(filePath, responseInit);

      if (inCache) return inCache;

      const Component = (await import(filePath)).default as {
        render(props: any): { html: any };
      };

      const { html } = Component.render(data);

      await cache.write(filePath, html);

      return new Response(html, responseInit);
    };
  };
}

Bun.plugin({
  name: "Svelte Plugin",
  setup(build) {
    build.onLoad({ filter: /\.svelte$/ }, async (args) => {
      const { js, warnings } = compileString(
        await Bun.file(args.path).text(),
        args.path
      );

      warnings.forEach((warn) => console.warn(warn));

      return {
        contents: js.code,
        loader: "js",
      };
    });
  },
});
