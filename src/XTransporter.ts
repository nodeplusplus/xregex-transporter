import { EventEmitter } from "events";
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
} from "./types";

@injectable()
export class XTransporter {
  @inject("LOGGER") private logger!: ILogger;
  @inject("EMITTER") private emitter!: EventEmitter;

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
    this.emitter.on(DatasourceEvents.NEXT, this.exec.bind(this));

    await Promise.all(this.storages.map((storage) => storage.start()));
    await Promise.all(this.pipelines.map((pipeline) => pipeline.start()));
    await Promise.all(this.datasources.map((datasource) => datasource.start()));
    this.logger.info("XTRANSPORTER:STARTED");
  }
  public async stop() {
    this.emitter.removeAllListeners(DatasourceEvents.NEXT);

    await Promise.all(this.datasources.map((datasource) => datasource.stop()));
    await Promise.all(this.pipelines.map((pipeline) => pipeline.stop()));
    await Promise.all(this.storages.map((storage) => storage.stop()));
    this.logger.info("XTRANSPORTER:STOPPED");
  }

  public async exec(payload: IDatasourcePayload) {
    let nextPayload: IPipelinePayload | void = payload;

    for (let pipeline of this.pipelines) {
      // Return undefined mean stop the pipeline
      if (typeof nextPayload === "undefined") break;

      nextPayload = await pipeline.exec(nextPayload);
    }

    this.emitter.emit(PipelineEvents.NEXT, nextPayload);
  }
}
