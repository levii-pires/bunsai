type Listener = BunSaiTypes.EventHandler<any>;

export class EventEmitter {
  private $listeners: Record<keyof BunSaiTypes.EventMap, Listener[]> = {
    "lifecycle.init": [],
    "lifecycle.reload": [],
    "lifecycle.shutdown": [],
    "request.end": [],
    "request.error": [],
    "request.init": [],
    "request.notFound": [],
    "request.response": [],
  };

  private $onceListeners: Record<keyof BunSaiTypes.EventMap, Listener[]> = {
    "lifecycle.init": [],
    "lifecycle.reload": [],
    "lifecycle.shutdown": [],
    "request.end": [],
    "request.error": [],
    "request.init": [],
    "request.notFound": [],
    "request.response": [],
  };

  addListener<E extends keyof BunSaiTypes.EventMap>(
    event: E,
    listener: BunSaiTypes.EventMap[E]
  ): this {
    this.$listeners[event].push(listener);

    return this;
  }

  on<E extends keyof BunSaiTypes.EventMap>(
    event: E,
    listener: BunSaiTypes.EventMap[E]
  ): this {
    return this.addListener(event, listener);
  }

  once<E extends keyof BunSaiTypes.EventMap>(
    event: E,
    listener: BunSaiTypes.EventMap[E]
  ): this {
    this.$onceListeners[event].push(listener);

    return this;
  }

  prependListener<E extends keyof BunSaiTypes.EventMap>(
    event: E,
    listener: BunSaiTypes.EventMap[E]
  ): this {
    this.$listeners[event].unshift(listener);

    return this;
  }

  prependOnceListener<E extends keyof BunSaiTypes.EventMap>(
    event: E,
    listener: BunSaiTypes.EventMap[E]
  ): this {
    this.$onceListeners[event].unshift(listener);

    return this;
  }

  off<E extends keyof BunSaiTypes.EventMap>(
    event: E,
    listener: BunSaiTypes.EventMap[E],
    once?: boolean
  ): this {
    return this.removeListener(event, listener, once);
  }

  removeAllListeners<E extends keyof BunSaiTypes.EventMap>(event?: E): this {
    if (event) {
      this.$listeners[event] = [];
      this.$onceListeners[event] = [];

      return this;
    }

    for (const key of Object.keys(this.$listeners) as any) {
      this.removeAllListeners(key);
    }

    for (const key of Object.keys(this.$onceListeners) as any) {
      this.removeAllListeners(key);
    }

    return this;
  }

  removeListener<E extends keyof BunSaiTypes.EventMap>(
    event: E,
    listener: BunSaiTypes.EventMap[E],
    once?: boolean
  ): this {
    if (!once)
      this.$listeners[event] = this.$listeners[event].filter(
        (l) => l !== listener
      );

    this.$onceListeners[event] = this.$onceListeners[event].filter(
      (l) => l !== listener
    );

    return this;
  }

  async emit<E extends keyof BunSaiTypes.EventMap>(
    event: E,
    payload: Omit<Parameters<BunSaiTypes.EventMap[E]>[0], "break">
  ) {
    let shouldBreak = false;

    function _break() {
      shouldBreak = true;
    }

    for (const listener of this.$listeners[event]) {
      // @ts-ignore
      await listener({ ...payload, break: _break });

      if (shouldBreak) break;
    }

    for (const listener of this.$onceListeners[event]) {
      // @ts-ignore
      await listener({ ...payload, break: _break });

      this.removeListener(event, listener, true);

      if (shouldBreak) break;
    }
  }

  eventNames(): (string | symbol)[] {
    return Object.keys(this.$listeners);
  }

  listenerCount<E extends keyof BunSaiTypes.EventMap>(event: E): number {
    return this.$listeners[event].length + this.$onceListeners[event].length;
  }
}
