export interface IPipeline {
  start(): Promise<void>;
  stop(): Promise<void>;

  exec(payload: IPipelinePayload): Promise<IPipelinePayload | void>;

  init(options: IPipelineOpts): void;
  getInfo(): { id: string; options: any };
}

export interface IPipelinePayload<R = any> {
  id: string;
  records: R[];
  total?: number;
}

export interface IPipelineOpts<O = any> {
  id: string;
  type: string;
  opts?: O;
}

export enum PipelineEvents {
  NEXT = "pipeline.next",
}
