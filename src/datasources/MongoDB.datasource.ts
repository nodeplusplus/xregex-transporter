import _ from "lodash";
import { injectable, inject } from "inversify";
import {
  MongoClient,
  Collection as MongoCollection,
  MongoClientOptions,
} from "mongodb";
import { ILogger } from "@nodeplusplus/xregex-logger";

import {
  IDatasourcePayload,
  DatasourceEvents,
  IPipelinePayload,
  IDatasourceFields,
} from "../types";
import { BaseDatasource } from "./Base.datasource";

@injectable()
export class MongoDBDatasource extends BaseDatasource<MongoClientOptions> {
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
    this.logger.info(`DATASOURCE:FILE.STARTED`, { id: this.id });
  }
  public async stop() {
    await this.client.close(true);

    super.stop();
    this.logger.info(`DATASOURCE:FILE.STOPPED`, { id: this.id });
  }

  public async exec(payload: IDatasourcePayload) {
    const { filter, limit } = { limit: 100, ...payload.datasource };

    const fields = this.options.fields as IDatasourceFields;

    const records = await this.collection
      .find({ ...filter })
      .limit(limit)
      .sort([
        [fields.updatedAt, -1],
        [fields.createdAt, -1],
      ])
      .toArray();

    const nextPayload: IPipelinePayload = { records };
    this.emitter.emit(DatasourceEvents.NEXT, nextPayload);

    const total = await this.collection.countDocuments({ ...filter }, {});
    const donePayload: IPipelinePayload = {
      total,
      records: records.map((r) => _.get(r, fields.id)),
    };
    this.emitter.emit(DatasourceEvents.DONE, donePayload);
  }
}
