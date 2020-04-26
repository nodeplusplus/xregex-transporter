import {
  LoggerType,
  create as createLogger,
} from "@nodeplusplus/xregex-logger";
import XParser, {
  IXParser,
  HTMLParser,
  JSONParser,
} from "@nodeplusplus/xregex-parser";
import XFilter, { IXFilter } from "@nodeplusplus/xregex-filter";

import {
  ITemplate,
  IPipelineOpts,
  IDatasourceOpts,
  IStorageOpts,
} from "../types";
import { FileDatasource, MongoDBDatasource } from "../datasources";
import { FileStorage } from "../storages";
import {
  PassthroughPipeline,
  ParserPipeline,
  FilterPipeline,
} from "../pipelines";
import { LocalBus } from "../buses";
import { BaseBuilder } from "./Base.builder";

export class TemplateBuilder extends BaseBuilder {
  public make() {
    if (!this.container.isBound("BUS")) this.setBus(LocalBus);
    super.make();
  }

  public useTemplate({ logger: loggerOpts, ...settings }: ITemplate) {
    this.setSettings(settings);
    this.setLogger(
      createLogger(loggerOpts?.type || LoggerType.CONSOLE, loggerOpts?.opts)
    );
    this.useDatasources(settings.datasources);
    this.useStorages(settings.storages);
    this.usePipelines(settings.pipelines);
  }

  private useDatasources(
    datasources: Array<Required<IPipelineOpts<IDatasourceOpts>>>
  ) {
    for (let datasource of datasources) {
      if (datasource.type === FileDatasource.name) {
        this.addDatasource(FileDatasource);
        continue;
      }
      if (datasource.type === MongoDBDatasource.name) {
        this.addDatasource(MongoDBDatasource);
        continue;
      }
      throw new Error(`Datasource ${datasource.type} is not supported!`);
    }
  }

  private useStorages(storages: Array<Required<IPipelineOpts<IStorageOpts>>>) {
    for (let storage of storages) {
      if (storage.type === FileStorage.name) {
        this.addStorage(FileStorage);
        continue;
      }
      throw new Error(`Storage ${storage.type} is not supported!`);
    }
  }

  private usePipelines(pipelines: Array<IPipelineOpts<any>>) {
    this.container.bind<IXFilter>("XFILTER").to(XFilter);
    this.container.bind<IXParser>("XPARSER").to(XParser);
    this.container.bind<IXParser>("XPARSER_ENGINE_HTML").to(HTMLParser);
    this.container.bind<IXParser>("XPARSER_ENGINE_JSON").to(JSONParser);

    for (let pipeline of pipelines) {
      if (pipeline.type === PassthroughPipeline.name) {
        this.addPipeline(PassthroughPipeline);
        continue;
      }
      if (pipeline.type === ParserPipeline.name) {
        this.addPipeline(ParserPipeline);
        continue;
      }
      if (pipeline.type === FilterPipeline.name) {
        this.addPipeline(FilterPipeline);
        continue;
      }
      throw new Error(`Pipeline ${pipeline.type} is not supported!`);
    }
  }
}
