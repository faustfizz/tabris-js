import Events from './Events';
import {toValueString} from './Console';
import {listenersStore as storeSym} from './symbols';

const DELEGATE_FIELDS = ['promise', 'addListener', 'removeListener', 'once', 'trigger', 'triggerAsync'];

export default class Listeners {

  static getListenerStore(target) {
    // NOTE: we do not use an instanceof NativeObject check here since
    // importing NativeObject causes circular dependency issues
    if (target.on instanceof Function) {
      return target;
    }
    if (!target[storeSym]) {
      target[storeSym] = Object.assign({$eventTarget: target}, Events);
    }
    return target[storeSym];
  }

  constructor(target, type) {
    if (arguments.length < 1) {
      throw new Error('Missing target instance');
    }
    if (!(target instanceof Object)) {
      throw new Error(`Target ${toValueString(target)} is not an object`);
    }
    if (arguments.length < 2 || !type) {
      throw new Error('Missing event type string');
    }
    if (typeof type !== 'string') {
      throw new Error(`Event type ${toValueString(type)} is not a string`);
    }
    if (/^on[A-Z]/.test(type)) {
      throw new Error(`Invalid event type string, did you mean "${type[2].toLowerCase() + type.slice(3)}"?`);
    }
    this.store = Listeners.getListenerStore(target);
    const delegate = this.addListener.bind(this);
    delegate.target = this.target = target;
    delegate.type = this.type = type;
    delegate.original = this.original;
    for (const key of DELEGATE_FIELDS) {
      delegate[key] = this[key] = this[key].bind(this);
    }
    return delegate;
  }

  get original() {
    return this;
  }

  trigger(eventData) {
    this.store.trigger(this.type, eventData);
    return this.target;
  }

  triggerAsync(eventData) {
    return this.store.triggerAsync(this.type, eventData).then(() => this.target);
  }

  promise() {
    return new Promise(resolve => this.once(resolve));
  }

  once(listener) {
    this.store.once(this.type, listener);
    return this.target;
  }

  addListener(listener) {
    this.store.on(this.type, listener);
    return this.target;
  }

  removeListener(listener) {
    this.store.off(this.type, listener);
    return this.target;
  }

}

export class ChangeListeners extends Listeners {

  constructor(target, property) {
    propertyCheck(target, property);
    super(target, property + 'Changed');
  }

  trigger(eventData) {
    if (!('value' in eventData)) {
      throw new Error('Can not trigger change event without "value" property in event data');
    }
    super.trigger(eventData);
  }

}

function propertyCheck(target, property) {
  if (!(property in target)) {
    throw new Error(`Target has no property "${property}"`);
  }
}
