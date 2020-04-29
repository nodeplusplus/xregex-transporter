import fs from "fs";
import _ from "lodash";
import { injectable, inject } from "inversify";
import { ILogger } from "@nodeplusplus/xregex-logger";

import {
  IStorageContext,
  StorageEvents,
  IProgressRecord,
  IPipelineContext,
} from "../types";
import { BaseStorage } from "./Base.storage";
import * as helpers from "../helpers";

@injectable()
export class FileStorage extends BaseStorage {
  @inject("LOGGER") private logger!: ILogger;

  private output!: fs.WriteStream;

  public async start() {
    const uri = this.options.connection.uri;
    await helpers.file.ensureExist(uri);
    this.output = fs.createWriteStream(uri, { flags: "a" });
    this.output.on("error", this.handleError);

    super.start();
    this.logger.info(`STORAGE:FILE.STARTED`, { id: this.id });
  }
  public async stop() {
    this.output.end();

    super.stop();
    this.logger.info(`STORAGE:FILE.STOPPED`, { id: this.id });
  }

  public async exec(ctx: Required<IStorageContext>) {
    const fields = this.options.fields;

    if (ctx.records.length) {
      ctx.records.forEach((record) =>
        this.output.write(`${JSON.stringify(record)}\n`)
      );
    }

    const progress: IProgressRecord = { ...ctx.progress, storage: this.id };
    const nextCtx: IPipelineContext = {
      progress,
      records: ctx.records.map((r) => _.get(r, fields.id)),
    };
    this.bus.emit(StorageEvents.NEXT, nextCtx);
  }

  public handleError(error: Error) {
    this.logger.error(`STORAGE:FILE.ERROR: ${error.stack || error.message}`);
  }
}
