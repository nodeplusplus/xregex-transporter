import fs from "fs";
import _ from "lodash";
import { injectable, inject } from "inversify";
import { ILogger } from "@nodeplusplus/xregex-logger";

import { IStoragePayload, StorageEvents, PiplineProgress } from "../types";
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

  public async exec(payload: IStoragePayload, prevSteps: string[]) {
    const fields = this.options.fields;
    const steps = [...prevSteps, this.id];

    const records = payload.records.map((r) => _.get(r, fields.id));

    payload.records.forEach((record) =>
      this.output.write(`${JSON.stringify(record)}\n`)
    );

    if (payload.progress === PiplineProgress.START) {
      this.bus.emit(
        StorageEvents.NEXT,
        {
          progress: payload.progress,
          records,
        },
        steps
      );
    } else {
      this.bus.emit(
        StorageEvents.DONE,
        {
          progress: PiplineProgress.END,
          records,
        },
        steps
      );
    }
  }
}
