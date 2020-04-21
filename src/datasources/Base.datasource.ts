import { EventEmitter } from "events";
import { injectable, inject } from "inversify";

import {
  IDatasource,
  IDatasourceOpts,
  DatasourceEvents,
  IDatasourcePayload,
  IPipelinePayload,
  IPipelineOpts,
} from "../types";

@injectable()
export abstract class BaseDatasource<CCO = any> implements IDatasource {
  @inject("EMITTER") protected emitter!: EventEmitter;

  protected id!: string;
  protected options!: IDatasourceOpts<CCO>;

  public async start() {
    this.emitter.on(DatasourceEvents.INIT, this.exec.bind(this));
  }
  public async stop() {
    this.emitter.removeAllListeners(DatasourceEvents.NEXT);
  }

  public init(options: Required<IPipelineOpts<IDatasourceOpts>>) {
    this.id = options.id;
    this.options = options.opts;
  }

  abstract exec(payload: IDatasourcePayload): Promise<IPipelinePayload | void>;
}
