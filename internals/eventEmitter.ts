type Listener = BunSaiEvents.EventHandler<any>;

interface ListenerMetadata {
  once: boolean;
}

export class EventEmitter {
  private $listeners: Record<
    keyof BunSaiEvents.EventMap,
    Map<Listener, ListenerMetadata>
  > = {
    "request.init": new Map(),
    "request.load": new Map(),
    "request.notFound": new Map(),
    "request.loaded": new Map(),
    "request.end": new Map(),
    "request.error": new Map(),
    "lifecycle.init": new Map(),
    "lifecycle.reload": new Map(),
    "lifecycle.shutdown": new Map(),
    "cache.system.invalidate": new Map(),
    "cache.user.write": new Map(),
    "cache.user.setup": new Map(),
    "cache.user.invalidate": new Map(),
  };

  addListener<E extends keyof BunSaiEvents.EventMap>(
    event: E,
    listener: BunSaiEvents.EventMap[E]
  ) {
    this.$listeners[event].set(listener, { once: false });

    return this;
  }

  on<E extends keyof BunSaiEvents.EventMap>(
    event: E,
    listener: BunSaiEvents.EventMap[E]
  ) {
    return this.addListener(event, listener);
  }

  once<E extends keyof BunSaiEvents.EventMap>(
    event: E,
    listener: BunSaiEvents.EventMap[E]
  ) {
    this.$listeners[event].set(listener, { once: true });

    return this;
  }

  off<E extends keyof BunSaiEvents.EventMap>(
    event: E,
    listener: BunSaiEvents.EventMap[E]
  ) {
    return this.removeListener(event, listener);
  }

  removeAllListeners<E extends keyof BunSaiEvents.EventMap>(event?: E) {
    if (event) {
      this.$listeners[event].clear();

      return this;
    }

    for (const key of this.eventNames()) {
      this.$listeners[key].clear();
    }

    return this;
  }

  removeListener<E extends keyof BunSaiEvents.EventMap>(
    event: E,
    listener: BunSaiEvents.EventMap[E]
  ) {
    this.$listeners[event].delete(listener);

    return this;
  }

  async emit<E extends keyof BunSaiEvents.EventMap>(
    event: E,
    payload: Omit<Parameters<BunSaiEvents.EventMap[E]>[0], "break">
  ) {
    let shouldBreak = false;

    function _break() {
      shouldBreak = true;
    }

    for (const [listener, metadata] of this.$listeners[event]) {
      await listener({ ...payload, break: _break });

      if (metadata.once) this.removeListener(event, listener);

      if (shouldBreak) break;
    }
  }

  eventNames() {
    return Object.keys(this.$listeners) as (keyof BunSaiEvents.EventMap)[];
  }

  listenerCount<E extends keyof BunSaiEvents.EventMap>(event: E) {
    return this.$listeners[event].size;
  }
}
