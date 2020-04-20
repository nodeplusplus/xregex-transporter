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
export abstract class BaseDatasource implements IDatasource {
  @inject("EMITTER") protected emitter!: EventEmitter;

  public options!: Required<IPipelineOpts<IDatasourceOpts>>;

  public async start() {
    this.emitter.on(DatasourceEvents.INIT, this.exec.bind(this));
  }
  public async stop() {
    this.emitter.removeAllListeners(DatasourceEvents.NEXT);
  }

  abstract exec(payload: IDatasourcePayload): Promise<IPipelinePayload | void>;
}
