import type { ModuleHandler, CacheInvalidateHandler, Module } from "bunsai";

const module: Module = {
  handler: async () => {
    return "test!";
  },
  invalidate: () => false,
};

export default module;
