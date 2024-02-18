<p align="center">
<img src="./assets/logo.png" width="200px" height="200px">
</p>

<h1 align="center">BunSai</h1>

> Bonsai is a japanese art of growing and shaping miniature trees in containers

## **BIG NOTE**

As the version implies (v0.x.x), this API is not yet stable and can be breaking changed without warnings.

## Quick start

BunSai is a full-stack agnostic framework for the web, built upon [Bun](https://bun.sh) (in fact, it has Nunjucks and Sass as optional dependencies). You can install it:

```sh
bun add bunsai
```

And use it as a handler:

```js
import BunSai from "bunsai";

const { fetch } = new BunSai({
  /*
    "loaders" is the only required property, as it configures BunSai's behavior
  */
  loaders,
});

Bun.serve({
  fetch,
});
```

## How it works?

Powered by [`Bun.FileSystemRouter`](https://bun.sh/docs/api/file-system-router) and some fancy tricks, BunSai takes an approach where you declare the files you want to become "routes"

```js
loaders: {
  ".ext": loaderInitiator
}
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

> Check the [`LoaderInitiator`](./types.ts#L10) interface

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
bun add sass @types/sass
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

### Module

> Since v0.1.0. Last change v0.2.0

BonSai offers a simple module implementation to handle `.ts`, `.tsx`, `.js` and `.node` files:

```js
import { ModuleLoader } from "bunsai/loaders";

new BunSai({
  loaders: {
    ".ts": ModuleLoader,
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

> Since v0.1.0. Last change v0.2.0

If you liked BunSai's opinion and want to enjoy all this beauty, you can use the recommended configuration:

```js
import getRecommended from "bunsai/recommended";

const { loaders, staticFiles } =
  getRecommended(/* (optional) nunjucks and sass options */);

new BunSai({
  loaders,
  staticFiles,
});
```

> Check the [`Recommended`](./types.ts#L67) interface.

## Middlewares

> Since v0.1.0. Last change v0.2.0

### Response Middlewares

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
