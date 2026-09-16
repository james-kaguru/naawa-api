export function bindAll(instance: object): void {
  let proto = Object.getPrototypeOf(instance);

  while (proto && proto !== Object.prototype) {
    for (const key of Reflect.ownKeys(proto)) {
      if (key === "constructor" || Object.hasOwn(instance, key)) continue;

      const descriptor = Object.getOwnPropertyDescriptor(proto, key);
      if (typeof descriptor?.value !== "function") continue;

      Object.defineProperty(instance, key, {
        value: descriptor.value.bind(instance),
        writable: true,
        configurable: true,
      });
    }
    proto = Object.getPrototypeOf(proto);
  }
}
