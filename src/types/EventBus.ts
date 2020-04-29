import { IPipelineContext } from "./Pipeline";

export interface IEventBus<P = IPipelineContext> {
  emit(event: string | symbol, ctx: any): boolean;
  on(event: string | symbol, listener: IEventBusListener<P>): this;
  once(event: string | symbol, listener: IEventBusListener<P>): this;
  removeAllListeners(event?: string | symbol): this;
  removeListener(
    event: string | symbol,
    listener: (...args: any[]) => void
  ): this;
}

export interface IEventBusListener<P> {
  (ctx: Required<P>): void;
}

export interface IEventBusTracker {}
