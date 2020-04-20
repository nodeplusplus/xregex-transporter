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
export abstract class BaseStorage implements IStorage {
  @inject("EMITTER") protected emitter!: EventEmitter;

  public options!: Required<IPipelineOpts<IStorageOpts>>;

  public async start() {
    this.emitter.on(PipelineEvents.NEXT, this.exec.bind(this));
  }
  public async stop() {
    this.emitter.removeAllListeners(PipelineEvents.NEXT);
  }

  abstract exec(payload: IPipelinePayload): Promise<IPipelinePayload | void>;
}
