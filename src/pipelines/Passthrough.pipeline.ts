import { injectable, inject } from "inversify";
import { ILogger } from "@nodeplusplus/xregex-logger";

import { IPipeline, IPipelineOpts, IPipelinePayload } from "../types";

@injectable()
export class PassthroughPipeline implements IPipeline {
  @inject("LOGGER") private logger!: ILogger;

  public options!: IPipelineOpts;

  public async start() {
    this.logger.info(`PIPELINE:PASSTHROUGH.STARTED`);
  }
  public async stop() {
    this.logger.info(`PIPELINE:PASSTHROUGH.STOPPED`);
  }

  public async exec(payload: IPipelinePayload) {
    return payload;
  }
}
