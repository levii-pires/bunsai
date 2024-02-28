<p align="center">
<img src="./assets/logo.png" width="200px" height="200px">
</p>

<h1 align="center">BunSai</h1>

> Bonsai is a japanese art of growing and shaping miniature trees in containers

## **BIG NOTE**

As the version implies (v0.x.x), this API is not yet stable and can be breaking changed without warnings.

## Quick start

BunSai is a full-stack, zero dependency, agnostic framework for the web, built upon [Bun](https://bun.sh) (in fact, it has Nunjucks, Sass and Stylus as optional dependencies). You can install it:

```sh
bun add bunsai
```

And use it as a handler:

```js
import BunSai from "bunsai";

const { fetch } = new BunSai({
  /* ... */
});

Bun.serve({
  fetch,
});
```

## How it works?

Powered by [`Bun.FileSystemRouter`](https://bun.sh/docs/api/file-system-router) and some fancy tricks, BunSai takes an approach where you declare the files you want to become "routes"

```js
new BunSai({
  loaders: {
    ".ext": loaderInitiator,
  },
});
```

And all files with that file extension will be served as routes.

### Example

Lets say you have the following files:

```txt
pages
├── index.njk
├── settings.tsx
├── blog
│   ├── [slug].svelte
│   └── index.ts
└── [[...catchall]].vue
```

You can configure BunSai to serve those files:

```js
new BunSai({
  loaders: {
    ".njk": nunjucksLoaderInit,
    ".ts": apiLoaderInit,
    ".tsx": reactLoaderInit,
    ".svelte": svelteLoaderInit,
    ".vue": vueLoaderInit,
  },
});
```

> Check the [`LoaderInitiator`](./types.ts#L12) interface

You can also specify file extensions that will be served staticly (`return new Response(Bun.file(filePath))`), like so:

```js
staticFiles: [".jpg", ".css", ".aac"];
```

> There is a caveat around `staticFiles`: as all files are served using the FileSystemRouter, `pages/pic.jpeg` will be served as `/pic`

## Built-in loaders

BunSai is 100% flexible, but this does not mean that it cannot be opinionated. BunSai ships with built-in (optional) loaders:

### [Nunjucks](https://mozilla.github.io/nunjucks/)

> Since v0.1.0. Last change v0.2.0

Nunjucks is a rich powerful templating language with block inheritance, autoescaping, macros, asynchronous control, and more. Heavily inspired by jinja2.

```sh
bun add nunjucks @types/nunjucks
```

```js
import getNunjucksLoader from "bunsai/loaders/nunjucks";

const nunjucksLoader =
  getNunjucksLoader(/* (optional) root path and nunjucks configure options */);

nunjucksLoader.env;
// you can make changes on the nunjucks Environment object (the 'nunjucksLoader.env' object).
// See https://mozilla.github.io/nunjucks/api.html#environment

new BunSai({
  loaders: {
    ".njk": nunjucksLoader.loaderInit,
  },
});
```

```html
<body>
  {# 'server', 'route' and 'request' #}

  <p>
    All those objects are passed to the Nunjucks renderer to be available
    globally
  </p>
</body>
```

### [Sass](https://sass-lang.com/)

> Since v0.1.0. Last change v0.2.0

Sass is the most mature, stable, and powerful professional grade CSS extension language in the world.

```sh
bun add sass
```

```js
import getSassLoader from "bunsai/loaders/sass";

const loaderInit = getSassLoader(/* (optional) sass compiler options */);

new BunSai({
  loaders: {
    ".scss": loaderInit,
  },
});
```

### [Stylus](https://stylus-lang.com/)

> Since v0.3.0

Stylus is an expressive, robust, feature-rich CSS language. It's compiler is a bit less performant than [Sass](#sass), but I thought it was a nice feature to add.

```sh
bun add stylus
```

```js
import getStylusLoader from "bunsai/loaders/stylus";

const loaderInit = getStylusLoader(/* (optional) stylus compiler options */);

new BunSai({
  loaders: {
    ".styl": loaderInit,
  },
});
```

### Module

> Since v0.1.0. Last change v0.3.0

BunSai offers a simple module implementation to handle `.ts`, `.tsx`, `.js` and `.node` files:

```js
import { ModuleLoaderInit } from "bunsai/loaders";

new BunSai({
  loaders: {
    ".ts": ModuleLoaderInit,
  },
});
```

A server module is a regular TS/TSX/JS/NAPI (anything that Bun can import) file that have the following structure:

```ts
// optional
export const headers = {
  // All reponse headers go here.
  // The default Content-Type header is "text/html; charset=utf-8", but you can override it.
};

// optional
export function invalidate(data: ModuleData) {
  /**
   * Returning true will invalidate the cached result, deleting it from the disk and running the handler again.
   *
   * If this method is not implemented, the ModuleLoader will always run the handler.
   *
   * **NOTE:** caching is ignored if dev is true.
   */
}

// required
export function handler(data: ModuleData) {
  // data.server => Server
  // data.route => MatchedRoute
  // data.request => Request
  // The handler must return a BodyInit or an instance of Response, whether synchronously or asynchronously.
  // If Response is returned, the loader will send it and the "headers" export will be ignored.
}
```

### Recommended

> Since v0.1.0. Last change v0.3.0

If you liked BunSai's opinion and want to enjoy all this beauty, you can use the recommended configuration:

```js
import getRecommended from "bunsai/recommended";

const { loaders, staticFiles, middlewares } =
  getRecommended(/* (optional) nunjucks and sass options */);

new BunSai({
  loaders,
  staticFiles,
  middlewares,
});
```

> Check the [`Recommended`](./types.ts#L121) interface.

## Middlewares

### Response Middlewares

> Since v0.1.0. Last change v0.2.0

You can use response middlewares to override or customize the response given by the loader.

```js
const { middlewares } = new BunSai(/* ... */);

middlewares.response
  .add("name", (data) => {
    // you can stop the middleware execution chain by returning a Response

    // if you want to stop the chain and override the response, return a new Response object
    return new Response();

    // if you want to just stop the chain, return the same Response object
    return data.response;
  })
  .add(/* can be chained */);

middlewares.response.remove("name").remove(/* can be chained */);
```

### Request Middlewares

> Since v0.1.0. Last change v0.2.0

You can use request middlewares to do things before anything else, like sending an early response (e.g. 429 Too Many Requests).

```js
const { middlewares } = new BunSai(/* ... */);

middlewares.request
  .add("name", (data) => {
    // returning a response on the 'request' phase will stop both the middleware execution chain and all other operations,
    // sending the given response to the client.
    return new Response();
  })
  .add(/* can be chained */);

middlewares.request.remove("name").remove(/* can be chained */);
```

### "Not Found" Middlewares

> Since v0.1.0. Last change v0.2.0

"Not Found" middlewares are only called when the router did not found the asset. The main purpose of the NF middleware is to override the default behavior (sending an empty 404 response).

```js
const { middlewares } = new BunSai(/* ... */);

middlewares.notFound
  .add("name", (data) => {
    /* ... */
  })
  .add(/* can be chained */);

middlewares.notFound.remove("name").remove(/* can be chained */);
```

### Error Middlewares

> Since v0.3.0

"Error" middlewares are only called when something went really wrong. The main purpose of the error middleware is to override the default behavior (let Bun handle it).

```js
const { middlewares } = new BunSai(/* ... */);

middlewares.error
  .add("name", (data) => {
    /* ... */
  })
  .add(/* can be chained */);

middlewares.error.remove("name").remove(/* can be chained */);
```

## Utils

### Router

> Since v0.3.0

Router was designed to be a facilitator in building APIs that use [Module](#module) loader.

It makes more sense to use Router on files that use the following filename syntaxes: `"catch-all" | "optional-catch-all" | "dynamic"`

The Router is a simple utility that abstracts the workflow of an HTTP API.
HTTP methods are classified as class methods.

The Router has some rules for implementing handlers:

- If you did not declare any 'POST' handler and the client made a POST request, the Router will automatically return `405 Method Not Allowed`;
- If none of the matchers returned `true` for the given path, the Router returns `404 Not Found`;
- If the handler call chain has ended, but no response was given, `501 Not Implemented` is returned;

The matchers can be:

- String: Router will use the `String.endsWith` approach, except if the string is `'*'` which has the default wildcard behavior;
- RegExp: `regex.test(route.pathname)` will be used;
- Function: return `true` if the request should be accepted.
- Array: todo: terminar

```ts
// pages/[...fun].ts

import { Router } from "bunsai/util";
// or
import Router from "bunsai/util/router";

export const { handler } = new Router()
  .get("/a", ({ response }) =>
    // You can set the response using the 'response' method, thus not breaking the call chain
    // and also allowing other handlers to access the response by calling 'response(/* no parameters */)'
    response(new Response(null, { status: 204 }))
  )
  .post(
    /\/b/,
    () => {
      // Or you can return a response and break the call chain.
      // This way is the fastest, but you must have in mind that this will be the last called handler
      return new Response(null, { status: 206 });
    },
    () => {
      // This handler will never be called
    }
  )
  .put(({ pathname }) => pathname == "/c" /* ... */)
  .delete(/* ... */);
```
