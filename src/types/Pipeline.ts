export interface IPipeline {
  start(): Promise<void>;
  stop(): Promise<void>;

  exec(payload: IPipelinePayload): Promise<IPipelinePayload | void>;

  init(options: IPipelineOpts): void;
  getInfo(): { id: string; options: any };
}

export interface IPipelinePayload<R = any> {
  records: R[];
  transaction?: IPipelineTransaction;
}

export interface IPipelineTransaction {
  id: string;
  steps: string[];
}

export interface IPipelineOpts<O = any> {
  id: string;
  type: string;
  opts?: O;
}

export enum PipelineEvents {
  NEXT = "pipeline.next",
}
