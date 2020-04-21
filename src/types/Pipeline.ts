export interface IPipeline {
  start(): Promise<void>;
  stop(): Promise<void>;

  exec(payload: IPipelinePayload): Promise<IPipelinePayload | void>;
  init(options: IPipelineOpts): void;
}

export interface IPipelinePayload<R = any> {
  total?: number;
  records: R[];
}

export interface IPipelineOpts<O = any> {
  id: string;
  type: string;
  opts?: O;
}

export enum PipelineEvents {
  NEXT = "pipeline.next",
}
