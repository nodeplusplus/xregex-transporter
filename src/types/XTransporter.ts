import * as XLogger from "@nodeplusplus/xregex-logger";

import { IDatasourceOpts, IDatasourceContext } from "./Datasource";
import { IStorageOpts } from "./Storage";
import { IPipeline, IPipelineOpts, IPipelineContext } from "./Pipeline";

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

  exec(ctx: Partial<IDatasourceContext>): Promise<IPipelineContext | void>;
  execOnce(ctx: Partial<IDatasourceContext>): Promise<any>;
}

export enum TransporterEvents {
  NEXT = "transporter.next",
}
