import type { UserConfig } from "bunsai";

const options: UserConfig = {
  middlewares: ["$middlewares/ddos.ts"],
  staticFiles: [".html", ".txt"],
  loaders: [
    "$loaders/nunjucks",
    "$loaders/sass",
    "$loaders/web",
    "$loaders/stylus",
    "$loaders/module",
  ],
};

export default options;
