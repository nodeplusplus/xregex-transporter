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
  IXTransporter,
  PiplineProgress,
  IEventBus,
  IPipelineResponse,
  TransporterEvents,
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

  public async execLayers(payload: IPipelinePayload, prevSteps: string[]) {
    let nextArgs: IPipelineResponse = [payload, prevSteps];

    for (let pipeline of this.pipelines) {
      // Return undefined will break the pipeline
      // and storage process is NOT triggered
      if (typeof nextArgs === "undefined") break;

      nextArgs = await pipeline.exec(nextArgs[0], [...nextArgs[1]]);
    }

    if (nextArgs) this.bus.emit(PipelineEvents.NEXT, ...nextArgs);
  }

  public init(options: IPipelineOpts) {
    this.id = options.id;
  }

  public async exec(payload: Partial<IDatasourcePayload>) {
    const inittPayload: IPipelinePayload = {
      progress: PiplineProgress.START,
      records: [],
      ...payload,
    };
    this.logger.info("TRANSPORTER:EXEC", {
      steps: [this.id],
    });
    this.bus.emit(TransporterEvents.NEXT, inittPayload, [this.id]);
  }
}
