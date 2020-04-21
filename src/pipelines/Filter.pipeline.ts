import { injectable, inject } from "inversify";
import { ILogger } from "@nodeplusplus/xregex-logger";
import { IXFilter, IXFilterExecOpts } from "@nodeplusplus/xregex-filter";

import { IPipeline, IPipelineOpts, IPipelinePayload } from "../types";

@injectable()
export class FilterPipeline implements IPipeline {
  @inject("LOGGER") private logger!: ILogger;
  @inject("XFILTER") private filter!: IXFilter;

  public options!: Required<IPipelineOpts<IXFilterExecOpts>>;

  public async start() {
    await this.filter.start();
    this.logger.info(`PIPELINE:PARSER.STARTED`);
  }
  public async stop() {
    await this.filter.stop();
    this.logger.info(`PIPELINE:PARSER.STOPPED`);
  }

  public async exec(payload: IPipelinePayload) {
    const records = await this.filter.exec(payload.records, this.options.opts);
    return { ...payload, records };
  }
}
