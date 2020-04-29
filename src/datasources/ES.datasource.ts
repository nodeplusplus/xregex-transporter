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
    const { limit, filter } = { limit: 100, ...this.options.execOpts };
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
    const response: IESResponse = await this.client
      .search(searchParams)
      .catch(this.handleError);
    const records = response.body.hits.hits.map((h) => h._source);

    const progress: IProgressRecord = { id: nanoid(), datasource: this.id };
    const nextCtx: IPipelineContext = { records, progress };
    this.bus.emit(DatasourceEvents.NEXT, nextCtx);
  }

  public handleError(error: IESResponseError) {
    const errors: string[] = Array.isArray(error.meta.body?.error?.root_cause)
      ? error.meta.body.error.root_cause.map(
          (e: { type: string; reason: string }) =>
            `DATASOURCE:ES:ERROR.${e.type.toUpperCase()}: ${e.reason}`
        )
      : ["DATASOURCE:ES:ERROR.INVALID_SEARCH_PARAMS"];

    errors.map(this.logger.error.bind(this.logger));
    return { body: { hits: { hits: [] } } };
  }
}

interface IESResponse<S = any> {
  body: {
    hits: {
      hits: Array<{ _id: string; _index: string; _source: S }>;
    };
  };
}

interface IESResponseError extends Error {
  meta: {
    body: {
      error: {
        root_cause: Array<{ type: string; reason: string }>;
      };
    };
  };
}
