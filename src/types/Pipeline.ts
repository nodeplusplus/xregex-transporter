import { IProgressRecord } from "./Progress";

export interface IPipeline {
  start(): Promise<void>;
  stop(): Promise<void>;

  exec(ctx: IPipelineContext): Promise<IPipelineContext | void>;

  init(options: IPipelineOpts): void;
}

export interface IPipelineContext<R = any> {
  records: R[];
  progress?: IProgressRecord;
}

export interface IPipelineOpts<O = any> {
  id: string;
  type: string;
  opts?: O;
}

export enum PipelineEvents {
  NEXT = "pipeline.next",
}
