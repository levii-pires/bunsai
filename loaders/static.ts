import type { LoaderInitiator } from "../types";

const StaticLoaderInit: LoaderInitiator = () => (filePath) =>
  new Response(Bun.file(filePath));

export default StaticLoaderInit;
