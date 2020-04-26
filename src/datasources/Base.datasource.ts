import { injectable, inject } from "inversify";

import {
  IDatasource,
  IDatasourceOpts,
  DatasourceEvents,
  IDatasourcePayload,
  IPipelineResponse,
  IPipelineOpts,
  IEventBus,
  TransporterEvents,
} from "../types";

@injectable()
export abstract class BaseDatasource<CCO = any> implements IDatasource {
  @inject("BUS") protected bus!: IEventBus<IDatasourcePayload>;

  protected id!: string;
  protected options!: IDatasourceOpts<CCO>;

  public async start() {
    this.bus.on(TransporterEvents.NEXT, this.exec.bind(this));
  }
  public async stop() {
    this.bus.removeAllListeners(DatasourceEvents.NEXT);
  }

  public init(options: Required<IPipelineOpts<IDatasourceOpts>>) {
    this.id = options.id;
    this.options = options.opts;
  }

  abstract exec(
    payload: IDatasourcePayload,
    prevSteps: string[]
  ): Promise<IPipelineResponse>;
}
