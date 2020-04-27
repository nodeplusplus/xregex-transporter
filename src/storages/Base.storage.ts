import _ from "lodash";
import { injectable, inject } from "inversify";

import {
  IStorage,
  IStorageOpts,
  PipelineEvents,
  IPipelinePayload,
  IPipelineOpts,
  IEventBus,
  IStoragePayload,
} from "../types";

@injectable()
export abstract class BaseStorage<CCO = any> implements IStorage {
  @inject("BUS") protected bus!: IEventBus;

  protected id!: string;
  protected options!: IStorageOpts<CCO>;

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
  public getInfo() {
    return { id: this.id, options: this.options };
  }

  abstract exec(payload: IStoragePayload): Promise<IPipelinePayload | void>;
}
