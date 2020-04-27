import { injectable, inject } from "inversify";
import { ILogger } from "@nodeplusplus/xregex-logger";
import { IXParser, IXParserExecOpts } from "@nodeplusplus/xregex-parser";

import {
  IPipelinePayload,
  IPipelineResponse,
  PiplineProgress,
  IPipelineTracker,
} from "../types";
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

  public async exec(payload: IPipelinePayload, tracker: IPipelineTracker) {
    tracker.steps.push(this.id);

    if (payload.progress === PiplineProgress.END) {
      return [payload, tracker] as IPipelineResponse;
    }

    const records = await this.parser.exec(payload.records, this.options);
    return [{ ...payload, records }, tracker] as IPipelineResponse;
  }
}
