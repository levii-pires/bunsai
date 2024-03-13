import type { UserConfig } from "bunsai";

const options: UserConfig = {
  middlewares: ["$middlewares/ddos.ts"],
  staticFiles: [".html"],
  loaders: ["$loaders/nunjucks.ts"],
};

export default options;
