import type { UserConfig } from "bunsai";
import useRecommended from "bunsai/recommended";

const { bunsai } = await useRecommended();

const options: UserConfig = bunsai;

export default options;