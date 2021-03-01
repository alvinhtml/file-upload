/* @flow */

function storageAvailable(type) {
  try {
    const storage = window[type];
    const x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return false;
  }
}

class FakeStorage {
  storage: {[key: string]: any};

  constructor() {
    this.storage = {};
  }

  setItem(key: string, value: ?string) {
    this.storage[key] = value;
  }

  getItem(key: string): string | null {
    if (key in this.storage) {
      return this.storage[key];
    }

    return null;
  }

  removeItem(key: string) {
    if (key in this.storage) {
      // Reflect 是一个内置的对象，它提供拦截 JavaScript 操作的方法。
      // Reflect.deleteProperty(target, propertyKey) 作为函数的 delete 操作符，相当于执行 delete target[name]
      Reflect.deleteProperty(this.storage, key);
    }
  }
}

// 判断是否支持 storage, 如果否，用 FakeStorage 代替
const storage = storageAvailable('localStorage') ?
  window.localStorage : new FakeStorage();

export default class Storage<T> {
  key: string;

  constructor(key: string) {
    this.key = key;
  }

  set(value: T): void {
    return storage.setItem(this.key, JSON.stringify(value));
  }

  get(): ?T {
    try {
      const item = storage.getItem(this.key);
      if (item === null) {
        return item;
      }
      return JSON.parse(item);
    } catch (err) {
      return null;
    }
  }

  remove(): void {
    return storage.removeItem(this.key);
  }
}
