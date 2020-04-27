import * as XLogger from "@nodeplusplus/xregex-logger";

import { IDatasourceOpts, IDatasourcePayload } from "./Datasource";
import { IStorageOpts } from "./Storage";
import { IPipeline, IPipelineOpts, IPipelinePayload } from "./Pipeline";

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

export interface IXTransporter extends IPipeline {
  start(): Promise<void>;
  stop(): Promise<void>;

  exec(payload: Partial<IDatasourcePayload>): Promise<IPipelinePayload | void>;
  execOnce(payload: Partial<IDatasourcePayload>): Promise<any>;
}

export enum TransporterEvents {
  NEXT = "transporter.next",
}
