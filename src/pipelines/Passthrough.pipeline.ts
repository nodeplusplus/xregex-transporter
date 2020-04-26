import { injectable, inject } from "inversify";
import { ILogger } from "@nodeplusplus/xregex-logger";

import { IPipelinePayload, IPipelineResponse } from "../types";
import { BasePipeline } from "./Base.pipeline";

@injectable()
export class PassthroughPipeline extends BasePipeline {
  @inject("LOGGER") private logger!: ILogger;

  public async start() {
    this.logger.info(`PIPELINE:PASSTHROUGH.STARTED`, { id: this.id });
  }
  public async stop() {
    this.logger.info(`PIPELINE:PASSTHROUGH.STOPPED`, { id: this.id });
  }

  public async exec(payload: IPipelinePayload, prevSteps: string[]) {
    return [{ ...payload }, [...prevSteps, this.id]] as IPipelineResponse;
  }
}
