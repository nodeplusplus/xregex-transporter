import _ from "lodash";
import { injectable, inject } from "inversify";
import {
  MongoClient,
  Collection as MongoCollection,
  MongoClientOptions,
} from "mongodb";
import { ILogger } from "@nodeplusplus/xregex-logger";

import {
  IStoragePayload,
  StorageEvents,
  PiplineProgress,
  IPipelineTracker,
} from "../types";
import { BaseStorage } from "./Base.storage";

@injectable()
export class MongoDBStorage extends BaseStorage<MongoClientOptions> {
  @inject("LOGGER") private logger!: ILogger;

  private client!: MongoClient;
  private collection!: MongoCollection;

  public async start() {
    const { uri, database, collection, clientOpts } = this.options.connection;
    this.client = await MongoClient.connect(uri, clientOpts);
    this.collection = this.client
      .db(database as string)
      .collection(collection as string);

    super.start();
    this.logger.info(`STORAGE:MONGODB.STARTED`, { id: this.id });
  }
  public async stop() {
    await this.client.close();

    super.stop();
    this.logger.info(`STORAGE:MONGODB.STOPPED`, { id: this.id });
  }

  public async exec(payload: IStoragePayload, tracker: IPipelineTracker) {
    const fields = this.options.fields;
    tracker.steps.push(this.id);

    if (payload.progress === PiplineProgress.START) {
      const operators = payload.records.reduce(
        (o, record) => [
          ...o,
          {
            updateOne: {
              filter: { id: _.get(record, fields.id) },
              update: {
                $set: { ...record, [fields.updatedAt]: new Date() },
                $setOnInsert: { [fields.createdAt]: new Date() },
              },
              upsert: true,
            },
          },
        ],
        []
      );

      // See https://docs.mongodb.com/manual/core/bulk-write-operations/#ordered-vs-unordered-operations
      await this.collection.bulkWrite(operators, {
        ordered: false,
      });

      const nextPayload = {
        progress: payload.progress,
        records: payload.records.map((r) => _.get(r, fields.id)),
      };
      this.bus.emit(StorageEvents.NEXT, nextPayload, tracker);
    } else {
      const donePayload = { ...payload, progress: PiplineProgress.END };
      // this.bus.emit(StorageEvents.DONE, donePayload, tracker);
    }
  }
}
