import type { UserConfig } from "bunsai";

const options: UserConfig = {
  middlewares: ["bunsai/middlewares/ddos"],
  staticFiles: [".html"],
  loaders: ["bunsai/loaders/nunjucks"],
};

export default options;
