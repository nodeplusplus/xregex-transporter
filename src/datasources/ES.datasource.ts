import _ from "lodash";
import { nanoid } from "nanoid";
import { injectable, inject } from "inversify";
import {
  Client as ESClient,
  ClientOptions as ESClientOptions,
  RequestParams,
} from "@elastic/elasticsearch";
import { ILogger } from "@nodeplusplus/xregex-logger";

import {
  IDatasourcePayload,
  DatasourceEvents,
  IPipelinePayload,
  IDatasourceFields,
  IPipelineTransaction,
} from "../types";
import { BaseDatasource } from "./Base.datasource";

@injectable()
export class ESDatasource extends BaseDatasource<ESClientOptions> {
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
    this.logger.info(`DATASOURCE:FILE.STARTED`, { id: this.id });
  }
  public async stop() {
    await this.client.close();

    super.stop();
    this.logger.info(`DATASOURCE:FILE.STOPPED`, { id: this.id });
  }

  public async exec(payload: IDatasourcePayload) {
    const { filter, limit } = { limit: 100, ...payload.datasource };
    const fields = this.options.fields as IDatasourceFields;
    const database = this.options.connection.database as string;

    const searchParams: RequestParams.Search = {
      size: limit,
      // sort: [`${fields.updatedAt}:desc`, `${fields.createdAt}:desc`],
      body: {
        query: {
          match_all: {},
        },
      },
    };
    if (database) searchParams.index = database;
    if (filter) searchParams.body = filter;
    const response: IESResponse = await this.client.search(searchParams);
    const records = response.body.hits.hits.map((h) => h._source);

    const transaction: IPipelineTransaction = {
      id: nanoid(),
      steps: [this.id],
    };
    const nextPayload: IPipelinePayload = { transaction, records };
    this.bus.emit(DatasourceEvents.NEXT, nextPayload);
  }
}

interface IESResponse<S = any> {
  body: {
    hits: {
      hits: Array<{ _id: string; _index: string; _source: S }>;
    };
  };
}
