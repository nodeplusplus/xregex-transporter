import { injectable, inject } from "inversify";
import { ILogger } from "@nodeplusplus/xregex-logger";
import { IXFilter, IXFilterExecOpts } from "@nodeplusplus/xregex-filter";

import { IPipelinePayload, IPipelineResponse } from "../types";
import { BasePipeline } from "./Base.pipeline";

@injectable()
export class FilterPipeline extends BasePipeline<IXFilterExecOpts> {
  @inject("LOGGER") private logger!: ILogger;
  @inject("XFILTER") private filter!: IXFilter;

  public async start() {
    await this.filter.start();
    this.logger.info(`PIPELINE:PARSER.STARTED`, { id: this.id });
  }
  public async stop() {
    await this.filter.stop();
    this.logger.info(`PIPELINE:PARSER.STOPPED`, { id: this.id });
  }

  public async exec(payload: IPipelinePayload, prevSteps: string[]) {
    const records = await this.filter.exec(payload.records, this.options);
    return [
      { ...payload, records },
      [...prevSteps, this.id],
    ] as IPipelineResponse;
  }
}
