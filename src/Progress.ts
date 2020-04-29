import _ from "lodash";
import { injectable, inject } from "inversify";

import {
  IProgress,
  IProgressRecord,
  DatasourceEvents,
  ISettings,
  StorageEvents,
  IPipelinePayload,
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
    return new Promise((resolve, reject) => {
      const storageIds = this.settings.storages.map((s) => s.id);

      this.bus.on(DatasourceEvents.NEXT, (payload: IPipelinePayload) => {
        storageIds.map((storage) =>
          this.from({ ...payload.progress, storage })
        );

        if (this.isDone()) return resolve();
      });

      this.bus.on(StorageEvents.NEXT, (payload: IPipelinePayload) => {
        this.to(payload.progress);

        if (this.isDone()) return resolve();
      });
    });
  }

  private isDone(): Boolean {
    const datasources = Array.from(this.datasources);
    const storages = Array.from(this.storages);
    if (datasources.length !== storages.length) return false;

    return _.difference(datasources, storages).length === 0;
  }
}
