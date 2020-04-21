import { EventEmitter } from "events";
import { interfaces, Container } from "inversify";
import { ILogger } from "@nodeplusplus/xregex-logger";

import {
  IDatasource,
  IStorage,
  IPipeline,
  IXTransporter,
  ISettings,
  IPipelineOpts,
  IDatasourceOpts,
  IStorageOpts,
} from "../types";
import { XTransporter } from "../XTransporter";

export class BaseBuilder {
  protected container!: Container;

  constructor() {
    this.reset();
  }

  public reset() {
    this.container = new Container();
  }

  public setSettings(settings: ISettings) {
    if (this.container.isBound("SETTINGS")) {
      this.container.rebind<ISettings>("SETTINGS").toConstantValue(settings);
      return;
    }

    this.container.bind<ISettings>("SETTINGS").toConstantValue(settings);
  }

  public setLogger(logger: ILogger) {
    if (this.container.isBound("LOGGER")) {
      this.container.rebind<ILogger>("LOGGER").toConstantValue(logger);
      return;
    }

    this.container.bind<ILogger>("LOGGER").toConstantValue(logger);
  }

  public setEmitter(emitter: EventEmitter = new EventEmitter()) {
    if (this.container.isBound("EMITTER")) {
      this.container.rebind<EventEmitter>("EMITTER").toConstantValue(emitter);
      return;
    }

    this.container.bind<EventEmitter>("EMITTER").toConstantValue(emitter);
  }

  public addDatasource(Datasource: interfaces.Newable<IDatasource>) {
    this.container
      .bind<IDatasource>("DATASOURCES")
      .to(Datasource)
      .whenTargetNamed(Datasource.name);
  }
  public addStorage(Storage: interfaces.Newable<IStorage>) {
    this.container
      .bind<IStorage>("STORAGES")
      .to(Storage)
      .whenTargetNamed(Storage.name);
  }

  public addPipeline(Pipeline: interfaces.Newable<IPipeline>) {
    this.container
      .bind<IPipeline>("PIPELINES")
      .to(Pipeline)
      .whenTargetNamed(Pipeline.name);
  }

  public registerFactory() {
    this.container
      .bind<interfaces.Factory<IDatasource>>("FACTORY<DATASOURCE>")
      .toFactory<IDatasource>(this.createDatasource);

    this.container
      .bind<interfaces.Factory<IStorage>>("FACTORY<STORAGE>")
      .toFactory<IStorage>(this.createStorage);

    this.container
      .bind<interfaces.Factory<IPipeline>>("FACTORY<PIPELINE>")
      .toFactory<IPipeline>(this.createPipeline);
  }

  public getTransporter(): IXTransporter {
    return this.container.resolve<IXTransporter>(XTransporter);
  }

  private createDatasource(context: interfaces.Context) {
    return function createDatasourceWithOpts(
      options: Required<IPipelineOpts<IDatasourceOpts>>
    ) {
      const datasource = context.container.getNamed<IDatasource>(
        "DATASOURCES",
        options.type
      );
      datasource.init(options);
      return datasource;
    };
  }

  private createStorage(context: interfaces.Context) {
    return function createStorageWithOpts(
      options: IPipelineOpts<IStorageOpts>
    ) {
      const storage = context.container.getNamed<IStorage>(
        "STORAGES",
        options.type
      );
      storage.init(options);
      return storage;
    };
  }

  private createPipeline(context: interfaces.Context) {
    return function createPipelineWithOpts(
      options: IPipelineOpts<IPipelineOpts>
    ) {
      const pipeline = context.container.getNamed<IPipeline>(
        "PIPELINES",
        options.type
      );
      pipeline.init(options);
      return pipeline;
    };
  }
}
