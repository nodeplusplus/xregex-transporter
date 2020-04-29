import fs from "fs";
import _ from "lodash";
import sift from "sift";
import { nanoid } from "nanoid";
import { injectable, inject } from "inversify";
import { parser } from "stream-json";
import { chain } from "stream-chain";
import StreamValues from "stream-json/streamers/StreamValues";
// Temporary fix for @types/stream-json
const Batch = require("stream-json/utils/Batch");
import { ILogger } from "@nodeplusplus/xregex-logger";

import {
  IDatasourceContext,
  DatasourceEvents,
  IPipelineContext,
  IProgressRecord,
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

  public async exec(ctx: IDatasourceContext) {
    const { limit, filter } = { limit: 100, ...this.options.execOpts };

    const pipeline = chain([
      this.input,
      parser({ jsonStreaming: true }),
      new StreamValues(),
      new Batch({ batchSize: limit }),
    ]);

    pipeline.on("data", (rows: Array<{ key: number; value: any }>) => {
      let records = rows.map((r) => r.value);
      if (filter && !_.isEmpty(filter)) records = records.filter(sift(filter));

      const progress: IProgressRecord = { id: nanoid(), datasource: this.id };
      const nextCtx: IPipelineContext = { records, progress };
      this.bus.emit(DatasourceEvents.NEXT, nextCtx);
    });
  }
}
