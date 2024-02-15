import type { LoaderInitiator } from "../types";

const StaticLoader: LoaderInitiator = () => (filePath) =>
  new Response(Bun.file(filePath));

export default StaticLoader;
