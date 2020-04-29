import fs from "fs";
import _ from "lodash";
import { nanoid } from "nanoid";
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
  IPipelineTransaction,
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

    this.logger.info("DATASOURCE:FILE.EXEC", { id: this.id });

    const pipeline = chain([
      this.input,
      parser({ jsonStreaming: true }),
      new StreamValues(),
      new Batch({ batchSize }),
    ]);

    pipeline.on("data", (rows: Array<{ key: number; value: any }>) => {
      const records = rows.map((r) => r.value);
      const transaction: IPipelineTransaction = {
        id: nanoid(),
        steps: [this.id],
      };

      const nextPayload: IPipelinePayload = { transaction, records };
      this.bus.emit(DatasourceEvents.NEXT, nextPayload);
    });
  }
}
