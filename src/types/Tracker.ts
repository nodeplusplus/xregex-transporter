export interface ITrackerPayload {
  id: string;
  status: TrackerStatus;
  steps: string[];
}

export enum TrackerStatus {
  PROCESSING = "PROCESSING",
  DONE = "DONE",
}
