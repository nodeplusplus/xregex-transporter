import fs from "fs";
import _ from "lodash";
import { injectable, inject } from "inversify";
import { ILogger } from "@nodeplusplus/xregex-logger";

import { IStoragePayload, StorageEvents } from "../types";
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

  public async exec(payload: Required<IStoragePayload>) {
    const fields = this.options.fields;

    if (payload.records.length) {
      payload.records.forEach((record) =>
        this.output.write(`${JSON.stringify(record)}\n`)
      );
    }

    const nextPayload: IStoragePayload = {
      ...payload,
      transaction: {
        id: payload.transaction.id,
        steps: [...payload.transaction.steps, this.id],
      },
      records: payload.records.map((r) => _.get(r, fields.id)),
    };
    this.bus.emit(StorageEvents.NEXT, nextPayload);
  }
}
