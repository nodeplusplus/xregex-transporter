import { IPipeline, IPipelineContext } from "./Pipeline";

export interface IDatasource extends IPipeline {}

export interface IDatasourceContext extends IPipelineContext {}

export interface IDatasourceOpts<CCO = any, EO = any> {
  connection: IDatasourceConnection<CCO>;
  fields: IDatasourceFields;
  execOpts: EO;
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
