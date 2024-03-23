import type { EventEmitter, FSCache } from "../internals";
import { watch } from "chokidar";
import type BunSai from "..";

export default class Watch implements BunSai.Middleware {
  cache: FSCache | null = null;
  build: BunSai["build"] | null = null;
  dir = "";
  ready = false;
  unsubscribe = () => {};

  watcher = watch([], {
    awaitWriteFinish: true,
    ignoreInitial: true,
    persistent: true,
  });

  subscribe(events: EventEmitter) {
    events.once("lifecycle.init", ({ bunsai }) => {
      this.dir = bunsai.options.dir;
      this.cache = bunsai.cache;
      this.build = bunsai.build;

      this.watcher.add(this.dir);

      this.ready = true;
    });
  }
}
