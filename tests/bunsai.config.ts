import type { UserConfig } from "bunsai";
import DDOS from "../middlewares/ddos";
// import useRecommended from "bunsai/recommended";

// const { bunsai } = await useRecommended();

const options: UserConfig = {
  middlewares: [new DDOS({ limit: 1 })],
};

export default options;
