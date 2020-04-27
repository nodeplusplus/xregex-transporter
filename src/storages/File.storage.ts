import fs from "fs";
import _ from "lodash";
import { injectable, inject } from "inversify";
import { ILogger } from "@nodeplusplus/xregex-logger";

import {
  IStoragePayload,
  StorageEvents,
  PiplineProgress,
  IPipelineTracker,
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

    super.start();
    this.logger.info(`STORAGE:FILE.STARTED`, { id: this.id });
  }
  public async stop() {
    this.output.end();

    super.stop();
    this.logger.info(`STORAGE:FILE.STOPPED`, { id: this.id });
  }

  public async exec(payload: IStoragePayload, tracker: IPipelineTracker) {
    const fields = this.options.fields;
    tracker.steps.push(this.id);

    if (payload.progress === PiplineProgress.START) {
      payload.records.forEach((record) =>
        this.output.write(`${JSON.stringify(record)}\n`)
      );

      const nextPayload = {
        progress: payload.progress,
        records: payload.records.map((r) => _.get(r, fields.id)),
      };
      this.bus.emit(StorageEvents.NEXT, nextPayload, tracker);
    } else {
      const donePayload = { ...payload, progress: PiplineProgress.END };
      this.bus.emit(StorageEvents.DONE, donePayload, tracker);
    }
  }
}
