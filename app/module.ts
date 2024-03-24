import { watch } from "chokidar";

import x from "./sass.scss";

console.log(x);

watch;

const handler: BunSai.ModuleHandler = (payload) => {
  //   throw new Error("oops");
  return {
    result: new Response(payload.route.filePath),
  };
};

export default handler;

//
