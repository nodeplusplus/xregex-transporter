import { injectable, inject } from "inversify";

import {
  IDatasource,
  IDatasourceOpts,
  DatasourceEvents,
  IDatasourceContext,
  IPipelineOpts,
  IEventBus,
  TransporterEvents,
  IPipelineContext,
} from "../types";

@injectable()
export abstract class BaseDatasource<CCO = any, EO = IDatasourceOptsExecOpts>
  implements IDatasource {
  @inject("BUS") protected bus!: IEventBus<IDatasourceContext>;

  protected id!: string;
  protected options!: IDatasourceOpts<CCO, EO>;

  constructor() {
    this.handleError = this.handleError.bind(this);
  }

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

  abstract exec(ctx: IDatasourceContext): Promise<IPipelineContext | void>;
  abstract handleError(error: any): any;
}

export interface IDatasourceOptsExecOpts {
  ids?: string;
  filter?: any;
  limit?: number;
}
