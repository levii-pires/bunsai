import type { UserConfig } from "bunsai";

const options: UserConfig = {
  middlewares: ["$middlewares/ddos"],
  staticFiles: [".html"],
  loaders: ["$loaders/nunjucks"],
};

export default options;
