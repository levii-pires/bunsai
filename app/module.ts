import { watch } from "chokidar";

watch;

const handler: BunSai.ModuleHandler = (payload) => {
  //   throw new Error("oops");
  return {
    result: new Response(payload.route.filePath),
  };
};

export default handler;

//
