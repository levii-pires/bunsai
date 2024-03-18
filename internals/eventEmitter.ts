type Listener = BunSaiTypes.Events.EventHandler<any>;

export class EventEmitter implements BunSaiTypes.Events.EventEmitter {
  private $listeners: Record<keyof BunSaiTypes.Events.EventMap, Listener[]> = {
    "lifecycle.init": [],
    "lifecycle.reload": [],
    "lifecycle.shutdown": [],
    "request.end": [],
    "request.error": [],
    "request.init": [],
    "request.notFound": [],
    "request.response": [],
  };

  private $onceListeners: Record<
    keyof BunSaiTypes.Events.EventMap,
    Listener[]
  > = {
    "lifecycle.init": [],
    "lifecycle.reload": [],
    "lifecycle.shutdown": [],
    "request.end": [],
    "request.error": [],
    "request.init": [],
    "request.notFound": [],
    "request.response": [],
  };

  addListener<E extends keyof BunSaiTypes.Events.EventMap>(
    event: E,
    listener: BunSaiTypes.Events.EventMap[E]
  ): this {
    this.$listeners[event].push(listener);

    return this;
  }

  on<E extends keyof BunSaiTypes.Events.EventMap>(
    event: E,
    listener: BunSaiTypes.Events.EventMap[E]
  ): this {
    return this.addListener(event, listener);
  }

  once<E extends keyof BunSaiTypes.Events.EventMap>(
    event: E,
    listener: BunSaiTypes.Events.EventMap[E]
  ): this {
    this.$onceListeners[event].push(listener);

    return this;
  }

  prependListener<E extends keyof BunSaiTypes.Events.EventMap>(
    event: E,
    listener: BunSaiTypes.Events.EventMap[E]
  ): this {
    this.$listeners[event].unshift(listener);

    return this;
  }

  prependOnceListener<E extends keyof BunSaiTypes.Events.EventMap>(
    event: E,
    listener: BunSaiTypes.Events.EventMap[E]
  ): this {
    this.$onceListeners[event].unshift(listener);

    return this;
  }

  off<E extends keyof BunSaiTypes.Events.EventMap>(
    event: E,
    listener: BunSaiTypes.Events.EventMap[E],
    once?: boolean
  ): this {
    return this.removeListener(event, listener, once);
  }

  removeAllListeners<E extends keyof BunSaiTypes.Events.EventMap>(
    event?: E | undefined
  ): this {
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

  removeListener<E extends keyof BunSaiTypes.Events.EventMap>(
    event: E,
    listener: BunSaiTypes.Events.EventMap[E],
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

  // @ts-ignore
  emit<E extends keyof BunSaiTypes.Events.EventMap>(
    event: E,
    payload: Omit<Parameters<BunSaiTypes.Events.EventMap[E]>[0], "break">
  ): boolean {
    let shouldBreak = false;

    function _break() {
      shouldBreak = true;
    }

    const listeners = [
      ...this.$onceListeners[event],
      ...this.$listeners[event],
    ];

    for (const listener of listeners) {
      // @ts-ignore
      listener({ ...payload, break: _break });

      this.removeListener(event, listener, true);

      if (shouldBreak) break;
    }

    return true;
  }

  eventNames(): (string | symbol)[] {
    return Object.keys(this.$listeners);
  }

  rawListeners<E extends keyof BunSaiTypes.Events.EventMap>(
    event: E
  ): BunSaiTypes.Events.EventMap[E][] {
    throw new Error("Method not implemented.");
  }

  listeners<E extends keyof BunSaiTypes.Events.EventMap>(
    event: E
  ): BunSaiTypes.Events.EventMap[E][] {
    throw new Error("Method not implemented.");
  }

  listenerCount<E extends keyof BunSaiTypes.Events.EventMap>(event: E): number {
    return this.$listeners[event].length + this.$onceListeners[event].length;
  }

  getMaxListeners(): number {
    throw new Error("Method not implemented.");
  }

  setMaxListeners(maxListeners: number): this {
    throw new Error("Method not implemented.");
  }
}
