import { IPipelinePayload } from "./Pipeline";

export interface IEventBus<P = IPipelinePayload> {
  emit(event: string | symbol, payload: any, steps: string[]): boolean;
  on(event: string | symbol, listener: IEventBusListener<P>): this;
  once(event: string | symbol, listener: IEventBusListener<P>): this;
  removeAllListeners(event?: string | symbol): this;
  removeListener(
    event: string | symbol,
    listener: (...args: any[]) => void
  ): this;
}

export interface IEventBusListener<P> {
  (payload: P, steps: string[]): void;
}

export interface IEventBusTracker {}
