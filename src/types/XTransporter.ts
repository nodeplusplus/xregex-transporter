import * as XLogger from "@nodeplusplus/xregex-logger";

import { IDatasourceOpts, IDatasourcePayload } from "./Datasource";
import { IStorageOpts } from "./Storage";
import { IPipelineOpts, IPipelinePayload } from "./Pipeline";

export interface ISettings {
  datasources: Array<Required<IPipelineOpts<IDatasourceOpts>>>;
  storages: Array<Required<IPipelineOpts<IStorageOpts>>>;
  pipelines: IPipelineOpts[];
}

export interface ITemplate extends ISettings {
  logger?: {
    type?: XLogger.LoggerType;
    opts: XLogger.ILoggerCreatorOpts;
  };
}

export interface IXTransporter {
  start(): Promise<void>;
  stop(): Promise<void>;

  exec(payload: IPipelinePayload): Promise<void>;
  trigger(payload: Partial<IDatasourcePayload>): void;
}
