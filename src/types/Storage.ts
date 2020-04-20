import { IPipeline, IPipelineOpts, IPipelinePayload } from "./Pipeline";

export interface IStorage extends IPipeline {
  options: Required<IPipelineOpts<IStorageOpts>>;
}

export interface IStoragePayload extends IPipelinePayload {
  storage?: {
    upsert?: boolean;
  };
}

export interface IStorageOpts<CCO = any> {
  connection: IStorageConnection<CCO>;
  fields: IStorageFields;
}

export interface IStorageConnection<CO = any> {
  uri: string;
  database?: string;
  collection?: string;
  clientOpts?: CO;
}

export interface IStorageFields {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export enum StorageEvents {
  DONE = "storage.done",
}
