import { IDatasourceOpts, IDatasourcePayload } from "./Datasource";
import { IStorageOpts } from "./Storage";
import { IPipelineOpts } from "./Pipeline";

export interface ISettings {
  datasources: Array<Required<IPipelineOpts<IDatasourceOpts>>>;
  storages: Array<Required<IPipelineOpts<IStorageOpts>>>;
  pipelines: IPipelineOpts[];
}

export interface IXTransporter {
  start(): Promise<void>;
  stop(): Promise<void>;

  exec(payload?: Partial<IDatasourcePayload>): Promise<void>;
}
