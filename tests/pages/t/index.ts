import { Router } from "bunsai/util";

export const { handler } = new Router()
  .get("/router-method", ({ response }) =>
    response(new Response(null, { status: 204 }))
  )
  .get("/router-return", () => new Response(null, { status: 206 }))
  .get("/not-implemented")
  .get(
    [
      "/array-string-matcher",
      /\/array-regex-matcher$/,
      ({ route: { pathname } }) => pathname.endsWith("/array-fn-matcher"),
    ],
    () => new Response("array")
  );
