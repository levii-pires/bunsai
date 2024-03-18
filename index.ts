import type { Server } from "bun";

import * as Internals from "./internals";

export default class BunSai {
  private $ready = false;
  private $loaderMap: Map<Extname, BunSaiLoader> = new Map();
  readonly router: InstanceType<typeof Bun.FileSystemRouter>;
  readonly options: ResolvedBunSaiOptions;
  readonly events = new Internals.EventEmitter();

  constructor(options: BunSaiOptions) {
    this.options = Internals.resolveOptions(options);

    const fileExtensions = this.options.staticFiles.concat(
      this.options.loaders.flatMap((l) => l.extensions)
    );

    this.router = new Bun.FileSystemRouter({
      ...this.options.router,
      dir: this.options.dir,
      style: "nextjs",
      fileExtensions,
    });
  }

  protected async $setup() {
    for (const loader of this.options.loaders) {
      await loader.setup(this);

      for (const ext of loader.extensions) this.$loaderMap.set(ext, loader);
    }

    await this.events.emit("lifecycle.init", { bunsai: this, server: null });

    this.$ready = true;
  }

  protected $reloadRouter() {
    this.router.reload();
  }

  protected async $fetch(request: Request, server: Server): Promise<Response> {
    if (!this.$ready) throw new Error("run setup first");

    let result = new Response();
    let shouldReturnEarly = false;

    function response(overrid?: Response) {
      if (overrid) {
        result = overrid;
        shouldReturnEarly = true;
      }

      return result;
    }

    await this.events.emit("request.init", {
      request,
      server,
      response,
    });

    if (shouldReturnEarly) return result;

    // todo: finish implementation
  }

  get fetch() {
    const that = this;

    return function (this: Server, request: Request) {
      return that.$fetch(request, this);
    };
  }

  get setup() {
    return this.$setup.bind(this);
  }

  get reloadRouter() {
    return this.$reloadRouter.bind(this);
  }
}

export type * from "./types";
