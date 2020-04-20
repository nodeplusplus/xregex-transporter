import { EventEmitter } from "events";
import _ from "lodash";
import { injectable, inject } from "inversify";
import { ILogger } from "@nodeplusplus/xregex-logger";

import {
  IPipeline,
  IPipelineOpts,
  IPipelinePayload,
  DatasourceEvents,
  PipelineEvents,
} from "../types";

@injectable()
export class Pipeline implements IPipeline {
  @inject("EMITTER") private emitter!: EventEmitter;
  @inject("LOGGER") private logger!: ILogger;
  @inject("PIPELINES") private pipelines!: IPipeline[];

  public options!: IPipelineOpts;

  public async start() {
    this.emitter.on(DatasourceEvents.NEXT, this.exec.bind(this));
    await Promise.all(this.pipelines.map((p) => p.start()));
    this.logger.info(`PIPELINE:MAIN.STARTED`);
  }
  public async stop() {
    this.emitter.removeAllListeners(DatasourceEvents.NEXT);
    await Promise.all(this.pipelines.map((p) => p.stop()));
    this.logger.info(`PIPELINE:MAIN.STOPPED`);
  }

  public async exec(payload: IPipelinePayload) {
    let nextPayload: IPipelinePayload | void = _.clone(payload);

    for (let pipeline of this.pipelines) {
      // Undefined value is signal to stop pipline
      if (!nextPayload) break;

      nextPayload = await pipeline.exec(nextPayload);
    }

    this.emitter.emit(PipelineEvents.NEXT, nextPayload);
  }
}
