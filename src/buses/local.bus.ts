import { EventEmitter } from "events";
import { injectable } from "inversify";

import { IEventBus, IEventBusListener, IPipelinePayload } from "../types";

@injectable()
export class LocalBus<P = IPipelinePayload> implements IEventBus<P> {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
  }

  emit(event: string | symbol, payload: IPipelinePayload): boolean {
    this.emitter.emit(event, payload);
    return true;
  }

  on(event: string | symbol, listener: IEventBusListener<P>) {
    this.emitter.on(event, listener);
    return this;
  }

  once(event: string | symbol, listener: IEventBusListener<P>) {
    this.emitter.once(event, listener);
    return this;
  }

  removeAllListeners(event?: string | symbol) {
    this.emitter.removeAllListeners(event);
    return this;
  }

  removeListener(event: string | symbol, listener: (...args: any[]) => void) {
    this.emitter.removeListener(event, listener);
    return this;
  }
}
