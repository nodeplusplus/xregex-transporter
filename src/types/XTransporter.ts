import { IDatasourceOpts } from "./Datasource";
import { IStorageOpts } from "./Storage";
import { IPipelineOpts } from "./Pipeline";

export interface ISettings {
  datasources: Array<Required<IPipelineOpts<IDatasourceOpts>>>;
  storages: Array<Required<IPipelineOpts<IStorageOpts>>>;
  pipelines: IPipelineOpts[];
}
