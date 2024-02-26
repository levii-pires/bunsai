import { Router } from "../../util";

export const { handler } = new Router()
  .get("*", () => Response.redirect("/new", 308))
  .get("/bun");
