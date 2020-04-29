import _ from "lodash";
import { injectable, inject } from "inversify";

import {
  IStorage,
  IStorageOpts,
  PipelineEvents,
  IPipelineOpts,
  IEventBus,
  IPipelineContext,
} from "../types";

@injectable()
export abstract class BaseStorage<CCO = any, EO = any> implements IStorage {
  @inject("BUS") protected bus!: IEventBus;

  protected id!: string;
  protected options!: IStorageOpts<CCO, EO>;

  public async start() {
    this.bus.on(PipelineEvents.NEXT, this.exec.bind(this));
  }
  public async stop() {
    this.bus.removeAllListeners(PipelineEvents.NEXT);
  }

  public init(options: Required<IPipelineOpts<IStorageOpts>>) {
    this.id = options.id;
    this.options = options.opts;
  }
  abstract exec(ctx: IPipelineContext): Promise<IPipelineContext | void>;
}
