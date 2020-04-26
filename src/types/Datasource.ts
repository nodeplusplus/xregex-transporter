import { IPipeline, IPipelinePayload } from "./Pipeline";

export interface IDatasource extends IPipeline {}

export interface IDatasourcePayload extends IPipelinePayload {
  datasource: {
    ids?: string[];
    filter?: any;
    limit?: number;
  };
}

export interface IDatasourceOpts<CCO = any> {
  connection: IDatasourceConnection<CCO>;
  fields: IDatasourceFields;
}

export interface IDatasourceConnection<CO = any> {
  uri: string;
  database?: string;
  collection?: string;
  clientOpts?: CO;
}

export interface IDatasourceFields {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export enum DatasourceEvents {
  NEXT = "dattasource.next",
  DONE = "dattasource.done",
}
