import _ from "lodash";
import { injectable, inject } from "inversify";
import {
  MongoClient,
  Collection as MongoCollection,
  MongoClientOptions,
} from "mongodb";
import { ILogger } from "@nodeplusplus/xregex-logger";

import { IStoragePayload, StorageEvents } from "../types";
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

  public async exec(payload: Required<IStoragePayload>) {
    const fields = this.options.fields;

    const operators: any[] = payload.records.reduce(
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

    if (operators.length) {
      // See https://docs.mongodb.com/manual/core/bulk-write-operations/#ordered-vs-unordered-operations
      await this.collection.bulkWrite(operators, { ordered: false });
    }

    const nextPayload = {
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
