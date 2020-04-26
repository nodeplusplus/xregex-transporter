export interface IPipeline {
  start(): Promise<void>;
  stop(): Promise<void>;

  exec(
    payload: IPipelinePayload,
    prevSteps: string[]
  ): Promise<IPipelineResponse>;
  init(options: IPipelineOpts): void;
}

export interface IPipelinePayload<R = any> {
  total?: number;
  records: R[];
  progress: PiplineProgress;
}

export type IPipelineResponse = void | [IPipelinePayload, string[]];

export enum PiplineProgress {
  START = "START",
  END = "END",
}

export interface IPipelineOpts<O = any> {
  id: string;
  type: string;
  opts?: O;
}

export enum PipelineEvents {
  NEXT = "pipeline.next",
}
