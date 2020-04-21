import fs from "fs";
import { injectable, inject } from "inversify";
import { parser } from "stream-json";
import { chain } from "stream-chain";
import StreamValues from "stream-json/streamers/StreamValues";
// Temporary fix for @types/stream-json
const Batch = require("stream-json/utils/Batch");
import { ILogger } from "@nodeplusplus/xregex-logger";

import {
  IDatasourcePayload,
  DatasourceEvents,
  IPipelinePayload,
} from "../types";
import { BaseDatasource } from "./Base.datasource";

@injectable()
export class FileDatasource extends BaseDatasource {
  @inject("LOGGER") private logger!: ILogger;

  private input!: fs.ReadStream;

  public async start() {
    const uri = this.options.connection.uri;
    this.input = fs.createReadStream(uri);

    super.start();
    this.logger.info(`DATASOURCE:FILE.STARTED`, { id: this.id });
  }
  public async stop() {
    this.input.destroy();

    super.stop();
    this.logger.info(`DATASOURCE:FILE.STOPPED`, { id: this.id });
  }

  public async exec(payload: IDatasourcePayload) {
    const batchSize = payload.datasource?.limit || 100;

    const pipeline = chain([
      this.input,
      parser({ jsonStreaming: true }),
      new StreamValues(),
      new Batch({ batchSize }),
    ]);

    let total = 0;
    pipeline.on("data", (rows: Array<{ key: number; value: any }>) => {
      total += rows.length;
      const records = rows.map((r) => r.value);

      const nextPayload: IPipelinePayload = { records };
      this.emitter.emit(DatasourceEvents.NEXT, nextPayload);
    });
    pipeline.on("end", () => {
      const donePayload: IPipelinePayload = {
        records: [],
        total,
      };
      this.emitter.emit(DatasourceEvents.DONE, donePayload);
    });
  }
}
