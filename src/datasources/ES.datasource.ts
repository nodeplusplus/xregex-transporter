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
  IDatasourceContext,
  DatasourceEvents,
  IPipelineContext,
  IDatasourceFields,
  IProgressRecord,
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

  public async exec(ctx: IDatasourceContext) {
    const { filter, limit } = { limit: 100, ...this.options.query };
    const fields = this.options.fields as IDatasourceFields;
    const database = this.options.connection.database as string;

    const searchParams: RequestParams.Search = {
      size: limit,
      sort: [`${fields.updatedAt}:desc`],
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

    const progress: IProgressRecord = { id: nanoid(), datasource: this.id };
    const nextCtx: IPipelineContext = { records, progress };
    this.bus.emit(DatasourceEvents.NEXT, nextCtx);
  }
}

interface IESResponse<S = any> {
  body: {
    hits: {
      hits: Array<{ _id: string; _index: string; _source: S }>;
    };
  };
}
