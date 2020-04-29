import _ from "lodash";
import { injectable, inject } from "inversify";
import { ILogger } from "@nodeplusplus/xregex-logger";

import {
  ISettings,
  IDatasource,
  IStorage,
  IPipeline,
  IDatasourceContext,
  DatasourceEvents,
  IDatasourceOpts,
  IStorageOpts,
  IPipelineOpts,
  IPipelineContext,
  PipelineEvents,
  IXTransporter,
  IEventBus,
  TransporterEvents,
  IProgress,
} from "./types";

@injectable()
export class XTransporter implements IXTransporter {
  @inject("LOGGER") private logger!: ILogger;
  @inject("BUS") private bus!: IEventBus;
  @inject("PROGRESS") private progress!: IProgress;

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

  public async execLayers(ctx: IPipelineContext) {
    let nextCtx: IPipelineContext | void = ctx;

    for (let pipeline of this.pipelines) {
      // Return undefined will break the pipeline
      // and storage process is NOT triggered
      if (typeof nextCtx === "undefined") break;

      nextCtx = await pipeline.exec(nextCtx);
    }

    if (nextCtx) this.bus.emit(PipelineEvents.NEXT, nextCtx);
  }

  public init(options: IPipelineOpts) {
    this.id = options.id;
  }
  public getInfo() {
    return { id: this.id, options: null };
  }

  public async exec(ctx: Partial<IDatasourceContext>) {
    this.logger.info("TRANSPORTER:EXEC");

    const initCtx: IPipelineContext = { records: [], ...ctx };
    this.bus.emit(TransporterEvents.NEXT, initCtx);
  }

  public async execOnce(ctx: Partial<IDatasourceContext>) {
    await this.exec(ctx);
    await this.progress.done();
  }
}
