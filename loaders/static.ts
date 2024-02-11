import type { Loader } from "../types";

const StaticLoader: Loader = (filePath) => new Response(Bun.file(filePath));

export default StaticLoader;
