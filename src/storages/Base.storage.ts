import { EventEmitter } from "events";
import _ from "lodash";
import { injectable, inject } from "inversify";

import {
  IStorage,
  IStorageOpts,
  PipelineEvents,
  IPipelinePayload,
  IPipelineOpts,
} from "../types";

@injectable()
export abstract class BaseStorage<CCO = any> implements IStorage {
  @inject("EMITTER") protected emitter!: EventEmitter;

  protected id!: string;
  protected options!: IStorageOpts<CCO>;

  public async start() {
    this.emitter.on(PipelineEvents.NEXT, this.exec.bind(this));
  }
  public async stop() {
    this.emitter.removeAllListeners(PipelineEvents.NEXT);
  }

  public init(options: Required<IPipelineOpts<IStorageOpts>>) {
    this.id = options.id;
    this.options = options.opts;
  }

  abstract exec(payload: IPipelinePayload): Promise<IPipelinePayload | void>;
}
