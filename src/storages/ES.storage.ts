import _ from "lodash";
import moment from "moment";
import { injectable, inject } from "inversify";
import {
  Client as ESClient,
  ClientOptions as ESClientOptions,
  RequestParams,
} from "@elastic/elasticsearch";
import { ILogger } from "@nodeplusplus/xregex-logger";

import {
  IStorageContext,
  StorageEvents,
  IProgressRecord,
  IPipelineContext,
} from "../types";
import { BaseStorage } from "./Base.storage";

@injectable()
export class ESStorage extends BaseStorage<
  ESClientOptions,
  RequestParams.Bulk
> {
  @inject("LOGGER") private logger!: ILogger;

  private client!: ESClient;

  public async start() {
    const { uri, clientOpts } = this.options.connection;
    const nodes = uri
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean);
    this.client = new ESClient({ nodes, ...clientOpts });

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

    const operators = this.createBulkRequest(ctx.records);
    if (operators.length) {
      await this.client.bulk({ body: operators, ...this.options.execOpts });
    }

    const progress: IProgressRecord = { ...ctx.progress, storage: this.id };
    const nextCtx: IPipelineContext = {
      progress,
      records: ctx.records.map((r) => _.get(r, fields.id)),
    };
    this.bus.emit(StorageEvents.NEXT, nextCtx);
  }

  private createBulkRequest(records?: any[]): any[] {
    if (!Array.isArray(records) || !records.length) return [];

    const database = this.options.connection.database || "es";
    const [timestampField, format = "YYYYMMDD"] = (this.options.connection
      .collection as string).split(",") as [string?, string?];

    const fields = this.options.fields;
    const body: any[] = [];

    for (let record of records) {
      // Only update record with valid id
      const id = _.get(record, fields.id);
      if (!id) continue;

      const timestamp =
        timestampField && (_.get(record, timestampField) as string);
      if (!timestamp || !moment(timestamp).isValid()) continue;

      const index = [database, moment(timestamp).format(format)].join("_");

      // Filter
      body.push({ update: { _id: id, _index: index } });
      // Update
      body.push({
        doc: { ...record, [fields.updatedAt]: new Date() },
        doc_as_upsert: true,
      });
    }

    return body;
  }
}
