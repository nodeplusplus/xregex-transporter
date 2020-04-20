import fs from "fs";
import path from "path";
import _ from "lodash";
import { injectable, inject } from "inversify";
import { ILogger } from "@nodeplusplus/xregex-logger";

import {
  IStorageOpts,
  IStoragePayload,
  StorageEvents,
  IPipelinePayload,
  IPipelineOpts,
} from "../types";
import { BaseStorage } from "./Base.storage";

@injectable()
export class FileStorage extends BaseStorage {
  @inject("LOGGER") private logger!: ILogger;

  public options!: Required<IPipelineOpts<IStorageOpts>>;

  private output!: fs.WriteStream;

  public async start() {
    const uri = this.options.opts.connection.uri;
    await this.ensureFileExist(uri);
    this.output = fs.createWriteStream(uri, { flags: "a" });

    super.start();
    this.logger.info(`STORAGE:FILE.STARTED`);
  }
  public async stop() {
    this.output.end();

    super.stop();
    this.logger.info(`STORAGE:FILE.STOPPED`);
  }

  public async exec(payload: IStoragePayload) {
    const fields = this.options.opts.fields;

    const records = payload.records.map((r) => _.get(r, fields.id));

    payload.records.forEach((record) =>
      this.output.write(`${JSON.stringify(record)}\n`)
    );

    this.output.on("finish", () => {
      const doneEventName = [StorageEvents.DONE, this.options.name].join("/");
      const donePayload: IPipelinePayload = { records };
      this.emitter.emit(doneEventName, donePayload);
    });
  }

  private async ensureFileExist(filepath: string) {
    const touch = (filepath: string) => {
      return new Promise((resolve, reject) => {
        const time = new Date();
        fs.utimes(filepath, time, time, (err) => {
          if (err) {
            return fs.open(filepath, "w", (err, fd) => {
              if (err) return reject(err);
              fs.close(fd, (err) => (err ? reject(err) : resolve(fd)));
            });
          }
          resolve();
        });
      });
    };

    const dirname = path.dirname(filepath);
    const dirstats = await fs.promises.stat(dirname).catch(() => null);
    if (!dirstats || !dirstats.isDirectory()) {
      await fs.promises.mkdir(dirname, { recursive: true });
    }

    await touch(filepath);
  }
}
