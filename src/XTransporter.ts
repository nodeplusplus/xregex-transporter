import _ from "lodash";
import { injectable, inject } from "inversify";
import { ILogger } from "@nodeplusplus/xregex-logger";

import {
  ISettings,
  IDatasource,
  IStorage,
  IPipeline,
  IDatasourcePayload,
  DatasourceEvents,
  IDatasourceOpts,
  IStorageOpts,
  IPipelineOpts,
  IPipelinePayload,
  PipelineEvents,
  IXTransporter,
  IEventBus,
  TransporterEvents,
  StorageEvents,
  IPipelineTransaction,
} from "./types";

@injectable()
export class XTransporter implements IXTransporter {
  @inject("LOGGER") private logger!: ILogger;
  @inject("BUS") private bus!: IEventBus;

  private id!: string;

  private datasources: IDatasource[];
  private pipelines: IPipeline[];
  private storages: IStorage[];

  constructor(
    @inject("SETTINGS") settings: ISettings,
    @inject("FACTORY<DATASOURCE>")
    createDatasource: (opts: IPipelineOpts<IDatasourceOpts>) => IDatasource,
    @inject("FACTORY<STORAGE>")
    createStorage: (opts: IPipelineOpts<IStorageOpts>) => IStorage,
    @inject("FACTORY<PIPELINE>")
    createPipeline: (opts: IPipelineOpts) => IPipeline
  ) {
    this.datasources = settings.datasources.map(createDatasource);
    this.storages = settings.storages.map(createStorage);
    this.pipelines = settings.pipelines.map(createPipeline);
  }

  public async start() {
    this.bus.on(DatasourceEvents.NEXT, this.execLayers.bind(this));

    await Promise.all(this.storages.map((storage) => storage.start()));
    await Promise.all(this.pipelines.map((pipeline) => pipeline.start()));
    await Promise.all(this.datasources.map((datasource) => datasource.start()));
    this.logger.info("XTRANSPORTER:STARTED");
  }
  public async stop() {
    this.bus.removeAllListeners(DatasourceEvents.NEXT);

    await Promise.all(this.datasources.map((datasource) => datasource.stop()));
    await Promise.all(this.pipelines.map((pipeline) => pipeline.stop()));
    await Promise.all(this.storages.map((storage) => storage.stop()));
    this.logger.info("XTRANSPORTER:STOPPED");
  }

  public async execLayers(payload: IPipelinePayload) {
    let nextPayload: IPipelinePayload | void = payload;

    for (let pipeline of this.pipelines) {
      // Return undefined will break the pipeline
      // and storage process is NOT triggered
      if (typeof nextPayload === "undefined") break;

      nextPayload = await pipeline.exec(nextPayload);
    }

    if (nextPayload) this.bus.emit(PipelineEvents.NEXT, nextPayload);
  }

  public init(options: IPipelineOpts) {
    this.id = options.id;
  }
  public getInfo() {
    return { id: this.id, options: null };
  }

  public async exec(payload: Partial<IDatasourcePayload>) {
    this.logger.info("TRANSPORTER:EXEC");

    const inittPayload: IPipelinePayload = { records: [], ...payload };
    this.bus.emit(TransporterEvents.NEXT, inittPayload);
  }

  public async execOnce(payload: Partial<IDatasourcePayload>) {
    await this.exec(payload);

    return new Promise((resolve) => {
      const datasourceTransactionIds: string[] = [];
      const storageTransactionIds: string[] = [];

      const storageIds = this.storages.map((s) => s.getInfo().id);

      // @TODO: Race condition here with 2 event listener
      this.bus.on(DatasourceEvents.NEXT, (payload) => {
        for (let storageId of storageIds) {
          datasourceTransactionIds.push(
            [
              payload.transaction.id,
              ...payload.transaction.steps,
              storageId,
            ].join("/")
          );
        }
        done();
      });
      this.bus.on(StorageEvents.NEXT, (payload) => {
        storageTransactionIds.push(
          [payload.transaction.id, ...payload.transaction.steps].join("/")
        );
        done();
      });

      function done() {
        if (datasourceTransactionIds.length !== storageTransactionIds.length) {
          return;
        }

        if (
          _.difference(datasourceTransactionIds, storageTransactionIds)
            .length !== 0
        ) {
          return;
        }

        return resolve();
      }
    });
  }
}
