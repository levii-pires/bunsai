const handler: BunSaiModuleHandler = (payload) => {
  //   throw new Error("oops");
  return {
    result: new Response(payload.route.filePath),
  };
};

export default handler;
