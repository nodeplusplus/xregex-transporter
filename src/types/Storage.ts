import { IPipeline, IPipelineContext } from "./Pipeline";

export interface IStorage extends IPipeline {}

export interface IStorageContext extends IPipelineContext {}

export interface IStorageOpts<CCO = any, EO = any> {
  connection: IStorageConnection<CCO>;
  fields: IStorageFields;
  execOpts?: EO;
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
  NEXT = "storage.next",
}
