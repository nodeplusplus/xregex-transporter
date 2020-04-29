import _ from "lodash";
import { injectable, inject } from "inversify";

import {
  IProgress,
  IProgressRecord,
  DatasourceEvents,
  ISettings,
  StorageEvents,
  IPipelineContext,
} from "./types";

import { IEventBus } from "./types";

@injectable()
export class Progress implements IProgress {
  public static DELIMITER = "/";

  @inject("BUS") private bus!: IEventBus;
  @inject("SETTINGS") settings!: ISettings;

  private datasources: Set<string> = new Set([]);
  private storages: Set<string> = new Set([]);

  public from({ id, datasource, storage }: IProgressRecord) {
    this.datasources.add([id, datasource, storage].join(Progress.DELIMITER));
  }
  public to({ id, datasource, storage }: IProgressRecord) {
    this.storages.add([id, datasource, storage].join(Progress.DELIMITER));
  }

  public async done() {
    // @TODO: Solve race condition of 2 events
    return new Promise((resolve) => {
      const storageIds = this.settings.storages.map((s) => s.id);

      this.bus.on(DatasourceEvents.NEXT, (ctx: Required<IPipelineContext>) => {
        storageIds.map((storage) => this.from({ ...ctx.progress, storage }));
        if (this.isDone()) return resolve();
      });

      this.bus.on(StorageEvents.NEXT, (ctx: Required<IPipelineContext>) => {
        this.to(ctx.progress);
        if (this.isDone()) return resolve();
      });
    });
  }

  private isDone(): Boolean {
    const datasourceIds = this.settings.datasources.map((s) => s.id);
    const storageIds = this.settings.storages.map((s) => s.id);
    const min = datasourceIds.length * storageIds.length;

    const datasources = Array.from(this.datasources);
    const storages = Array.from(this.storages);
    // Must exec all round at least 1 time
    if (datasources.length < min || storages.length < min) return false;
    if (datasources.length !== storages.length) return false;

    return _.difference(datasources, storages).length === 0;
  }
}
