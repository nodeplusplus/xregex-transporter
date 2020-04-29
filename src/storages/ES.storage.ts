import _ from "lodash";
import { injectable, inject } from "inversify";
import {
  Client as ESClient,
  ClientOptions as ESClientOptions,
} from "@elastic/elasticsearch";
import { ILogger } from "@nodeplusplus/xregex-logger";

import { IStoragePayload, StorageEvents } from "../types";
import { BaseStorage } from "./Base.storage";

@injectable()
export class ESStorage extends BaseStorage<ESClientOptions> {
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

  public async exec(payload: Required<IStoragePayload>) {
    const fields = this.options.fields;
    const database = this.options.connection.database as string;

    const operators: any[] = payload.records.reduce(
      (o, record) => [
        ...o,
        {
          update: { _id: _.get(record, fields.id), _index: database },
        },
        {
          doc: {
            ...record,
            [fields.updatedAt]: new Date(),
          },
          doc_as_upsert: true,
        },
      ],
      []
    );

    if (operators.length) {
      await this.client.bulk({ body: operators });
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
