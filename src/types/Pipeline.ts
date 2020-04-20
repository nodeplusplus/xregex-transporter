export interface IPipeline {
  options: IPipelineOpts;

  start(): Promise<void>;
  stop(): Promise<void>;

  exec(payload: IPipelinePayload): Promise<IPipelinePayload | void>;
}

export interface IPipelinePayload<R = any> {
  total?: number;
  records: R[];
}

export interface IPipelineOpts<O = any> {
  name: string;
  type: string;
  opts?: O;
}

export enum PipelineEvents {
  NEXT = "pipeline.next",
}
