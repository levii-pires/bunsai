import { Router } from "../../util";

export const { handler } = new Router()
  .get("/router-method", ({ response }) =>
    response(new Response(null, { status: 204 }))
  )
  .get("/router-return", () => new Response(null, { status: 206 }))
  .get("/not-implemented");
