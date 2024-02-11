import { Module, Loader } from "../types";

const ModuleLoader: Loader = async (filePath, data) => {
  const { handler, headers } = (await import(filePath)) as Module;

  if (typeof handler != "function")
    throw new Error(
      `${filePath}: Should have an export named "handler" of type "function"`
    );

  const result = await handler(data);

  if (result instanceof Response) return result;

  return new Response(result, {
    headers: { "Content-Type": "text/html; charset=utf-8", ...headers },
    status: 200,
  });
};

export default ModuleLoader;
