import _ from "lodash";
import { injectable, inject } from "inversify";
import {
  MongoClient,
  Collection as MongoCollection,
  MongoClientOptions,
} from "mongodb";
import { ILogger } from "@nodeplusplus/xregex-logger";

import {
  IStorageContext,
  StorageEvents,
  IProgressRecord,
  IPipelineContext,
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

  public async exec(ctx: Required<IStorageContext>) {
    const fields = this.options.fields;

    const operators = this.createBulkOperators(ctx.records);
    if (operators.length) {
      // See https://docs.mongodb.com/manual/core/bulk-write-operations/#ordered-vs-unordered-operations
      await this.collection
        .bulkWrite(operators, { ordered: false })
        .catch(this.handleError);
    }

    const progress: IProgressRecord = { ...ctx.progress, storage: this.id };
    const nextCtx: IPipelineContext = {
      progress,
      records: ctx.records.map((r) => _.get(r, fields.id)),
    };
    this.bus.emit(StorageEvents.NEXT, nextCtx);
  }

  public handleError(error: IMongoDBResponseError) {
    error.result.result.writeErrors.forEach(({ err }) => {
      this.logger.error(`STORAGE:MONGODB.ERROR.${err.code}: ${err.errmsg}`);
    });
  }

  private createBulkOperators(records: any[]) {
    const fields = this.options.fields;
    const operators: any[] = [];

    for (let record of records) {
      const id = _.get(record, fields.id);
      if (!id) continue;

      operators.push({
        updateOne: {
          filter: { id },
          update: {
            $set: { ...record, [fields.updatedAt]: new Date() },
            $setOnInsert: { [fields.createdAt]: new Date() },
          },
          upsert: true,
        },
      });
    }

    return operators;
  }
}

export interface IMongoDBResponseError extends Error {
  result: {
    result: {
      writeErrors: Array<{ err: { code: number; errmsg: string } }>;
    };
  };
}
