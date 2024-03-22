type Listener = BunSai.Events.EventHandler<any>;

interface ListenerMetadata {
  once: boolean;
}

export type EventPayload<P extends BunSai.Events.GenericPayload> = Omit<
  P,
  "breakChain"
>;

export class EventEmitter {
  private $listeners: Record<
    keyof BunSai.Events.EventMap,
    Map<Listener, ListenerMetadata>
  > = {
    "request.init": new Map(),
    "request.notFound": new Map(),
    "request.end": new Map(),
    "request.error": new Map(),
    "lifecycle.init": new Map(),
    "lifecycle.reload": new Map(),
    "lifecycle.shutdown": new Map(),
    "cache.watch.change": new Map(),
    "cache.user.write": new Map(),
    "cache.user.setup": new Map(),
    "cache.user.invalidate": new Map(),
    "request.loadInit": new Map(),
    "request.loadEnd": new Map(),
  };

  addListener<E extends keyof BunSai.Events.EventMap>(
    event: E,
    listener: BunSai.Events.EventMap[E]
  ) {
    this.$listeners[event].set(listener, { once: false });

    return this;
  }

  on<E extends keyof BunSai.Events.EventMap>(
    event: E,
    listener: BunSai.Events.EventMap[E]
  ) {
    return this.addListener(event, listener);
  }

  once<E extends keyof BunSai.Events.EventMap>(
    event: E,
    listener: BunSai.Events.EventMap[E]
  ) {
    this.$listeners[event].set(listener, { once: true });

    return this;
  }

  off<E extends keyof BunSai.Events.EventMap>(
    event: E,
    listener: BunSai.Events.EventMap[E]
  ) {
    return this.removeListener(event, listener);
  }

  removeAllListeners<E extends keyof BunSai.Events.EventMap>(event?: E) {
    if (event) {
      this.$listeners[event].clear();

      return this;
    }

    for (const key of this.eventNames()) {
      this.$listeners[key].clear();
    }

    return this;
  }

  removeListener<E extends keyof BunSai.Events.EventMap>(
    event: E,
    listener: BunSai.Events.EventMap[E]
  ) {
    this.$listeners[event].delete(listener);

    return this;
  }

  async emit<E extends keyof BunSai.Events.EventMap>(
    event: E,
    payload: EventPayload<Parameters<BunSai.Events.EventMap[E]>[0]>
  ) {
    let shouldBreak = false;

    function breakChain() {
      shouldBreak = true;
    }

    for (const [listener, metadata] of this.$listeners[event]) {
      await listener({ ...payload, breakChain });

      if (metadata.once) this.removeListener(event, listener);

      if (shouldBreak) break;
    }
  }

  eventNames() {
    return Object.keys(this.$listeners) as (keyof BunSai.Events.EventMap)[];
  }

  listenerCount<E extends keyof BunSai.Events.EventMap>(event: E) {
    return this.$listeners[event].size;
  }
}
