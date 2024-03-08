import type { UserConfig } from "bunsai";
import DDOS from "bunsai/middlewares/ddos";
// import useRecommended from "bunsai/recommended";

// const { bunsai } = await useRecommended();

const options: UserConfig = {
  middlewares: [new DDOS()],
  staticFiles: [".html"],
};

export default options;
