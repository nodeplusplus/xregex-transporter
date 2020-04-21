import { injectable, inject } from "inversify";
import { ILogger } from "@nodeplusplus/xregex-logger";
import { IXParser, IXParserExecOpts } from "@nodeplusplus/xregex-parser";

import { IPipeline, IPipelineOpts, IPipelinePayload } from "../types";

@injectable()
export class ParserPipeline implements IPipeline {
  @inject("LOGGER") private logger!: ILogger;
  @inject("XPARSER") private parser!: IXParser;

  public options!: Required<IPipelineOpts<IXParserExecOpts>>;

  public async start() {
    await this.parser.start();
    this.logger.info(`PIPELINE:PARSER.STARTED`);
  }
  public async stop() {
    await this.parser.stop();
    this.logger.info(`PIPELINE:PARSER.STOPPED`);
  }

  public async exec(payload: IPipelinePayload) {
    const records = await this.parser.exec(payload.records, this.options.opts);
    return { ...payload, records };
  }
}
