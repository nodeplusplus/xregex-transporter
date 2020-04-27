import { Record } from "immutable";

export interface IPipeline {
  start(): Promise<void>;
  stop(): Promise<void>;

  exec(
    payload: IPipelinePayload,
    tracker: IPipelineTracker
  ): Promise<IPipelineResponse>;

  init(options: IPipelineOpts): void;
  getInfo(): { id: string; options: any };
}

export interface IPipelinePayload<R = any> {
  total?: number;
  records: R[];
  progress: PiplineProgress;
}

export type IPipelineResponse = void | [IPipelinePayload, IPipelineTracker];

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

export type IPipelineTracker = Record<IPipelineTrackerRecord> &
  Readonly<IPipelineTrackerRecord>;

export interface IPipelineTrackerRecord {
  id: string;
  steps: string[];
}
