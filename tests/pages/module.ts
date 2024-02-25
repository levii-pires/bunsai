import type { ModuleHandler, CacheInvalidateHandler } from "../../types";
import { setTimeout } from "timers/promises";

export const handler: ModuleHandler = async () => {
  await setTimeout(200);

  return "test!";
};

export const invalidate: CacheInvalidateHandler = () => false;
