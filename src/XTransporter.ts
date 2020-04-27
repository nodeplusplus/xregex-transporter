import _ from "lodash";
import { injectable, inject } from "inversify";
import { Record } from "immutable";
import { nanoid } from "nanoid";
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
  StorageEvents,
  IPipelineTrackerRecord,
  IPipelineTracker,
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

  public async execLayers(
    payload: IPipelinePayload,
    tracker: IPipelineTracker
  ) {
    let nextArgs: IPipelineResponse = [payload, tracker];

    for (let pipeline of this.pipelines) {
      // Return undefined will break the pipeline
      // and storage process is NOT triggered
      if (typeof nextArgs === "undefined") break;

      nextArgs = await pipeline.exec(nextArgs[0], nextArgs[1]);
    }

    if (nextArgs) this.bus.emit(PipelineEvents.NEXT, ...nextArgs);
  }

  public init(options: IPipelineOpts) {
    this.id = options.id;
  }
  public getInfo() {
    return { id: this.id, options: null };
  }

  public async exec(payload: Partial<IDatasourcePayload>) {
    const inittPayload: IPipelinePayload = {
      progress: PiplineProgress.START,
      records: [],
      ...payload,
    };
    const initTracker = new XTranporterTracker({ steps: [this.id] });

    this.logger.info("TRANSPORTER:EXEC", {
      tracker: initTracker.toObject(),
    });
    this.bus.emit(TransporterEvents.NEXT, inittPayload, initTracker);

    return [inittPayload, initTracker] as IPipelineResponse;
  }

  public async execOnce(payload: Partial<IDatasourcePayload>) {
    const [, initTracker] = (await this.exec(payload)) as [
      IPipelinePayload<any>,
      IPipelineTracker
    ];

    const storages: { [name: string]: any[] } = this.storages
      .map((s) => s.getInfo().id)
      .reduce((s, id) => ({ ...s, [id]: [] }), {});
    return new Promise<{ [name: string]: any[] }>((resolve) => {
      this.bus.once(
        StorageEvents.DONE,
        (payload: IPipelinePayload, tracker: IPipelineTracker) => {
          const storageId = _.last(tracker.steps);
          if (storageId) storages[storageId] = payload.records;

          const isSameFlow = initTracker.id === tracker.id;
          const isFulfilled =
            Object.values(storages).filter((r) => !r.length).length === 0;
          if (isSameFlow && isFulfilled) return resolve(storages);
        }
      );
    });
  }
}

export const XTranporterTracker = Record<IPipelineTrackerRecord>({
  id: nanoid(),
  steps: [],
});
