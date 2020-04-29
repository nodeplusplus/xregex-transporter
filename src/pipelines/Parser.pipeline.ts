import { injectable, inject } from "inversify";
import { ILogger } from "@nodeplusplus/xregex-logger";
import { IXParser, IXParserExecOpts } from "@nodeplusplus/xregex-parser";

import { IPipelineContext } from "../types";
import { BasePipeline } from "./Base.pipeline";

@injectable()
export class ParserPipeline extends BasePipeline<IXParserExecOpts> {
  @inject("LOGGER") private logger!: ILogger;
  @inject("XPARSER") private parser!: IXParser;

  public async start() {
    await this.parser.start();
    this.logger.info(`PIPELINE:PARSER.STARTED`, { id: this.id });
  }
  public async stop() {
    await this.parser.stop();
    this.logger.info(`PIPELINE:PARSER.STOPPED`, { id: this.id });
  }

  public async exec(ctx: IPipelineContext) {
    const records = await this.parser.exec(ctx.records, this.options);
    return { ...ctx, records };
  }
}
