export interface IProgress {
  from(record: IProgressRecord): void;
  to(record: IProgressRecord): void;
  done(): Promise<any>;
}

export interface IProgressRecord {
  id: string;
  datasource: string;
  storage?: string;
}
