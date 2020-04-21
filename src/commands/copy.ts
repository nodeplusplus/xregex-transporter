require("dotenv").config();
import "reflect-metadata";
import _ from "lodash";
import { Command, flags } from "@oclif/command";
import { Container, interfaces } from "inversify";
import * as XJSON from "@nodeplusplus/xregex-json";
import * as XYML from "@nodeplusplus/xregex-yml";
import * as XLogger from "@nodeplusplus/xregex-logger";

import {
  ISettings,
  IPipeline,
  IDatasource,
  IStorage,
  IDatasourceOpts,
  IPipelineOpts,
  IStorageOpts,
  IXTransporter,
  DatasourceEvents,
} from "../types";
import { EventEmitter } from "events";
import { FileDatasource, MongoDBDatasource } from "../datasources";
import { FileStorage } from "../storages";
import {
  PassthroughPipeline,
  ParserPipeline,
  FilterPipeline,
} from "../pipelines";
import XParser, {
  IXParser,
  HTMLParser,
  JSONParser,
} from "@nodeplusplus/xregex-parser";
import XFilter, { IXFilter } from "@nodeplusplus/xregex-filter";
import { XTransporter } from "../XTransporter";

export default class Copy extends Command {
  static description =
    "Copy data from one or more resources to your destination";

  static examples = [
    `$ xtransporter copy ./templates/file2file.yml`,
    `$ xtransporter copy ./templates/file2mongodb.yml`,
    `$ xtransporter copy ./templates/file2es.yml`,
  ];

  static flags = {
    help: flags.help({ char: "h" }),
    options: flags.string({
      char: "o",
      description: "override your template options",
    }),
  };

  static args = [
    { name: "template", description: "./path/to/your/yaml/template" },
  ];

  async run() {
    const { args, flags } = this.parse(Copy);

    const settings: ITemplate = _.merge(
      {},
      args.template && (await XYML.parse(args.template)),
      flags.options && (await XJSON.parse(flags.options))
    );

    const container = new Container();
    container.bind<ISettings>("SETTINGS").toConstantValue(settings);

    const logger = XLogger.create(
      settings.logger?.type || XLogger.LoggerType.CONSOLE,
      settings.logger?.opts
    );
    container.bind<XLogger.ILogger>("LOGGER").toConstantValue(logger);

    const emitter = new EventEmitter();
    container.bind<EventEmitter>("EMITTER").toConstantValue(emitter);

    container
      .bind<IDatasource>("DATASOURCES")
      .to(FileDatasource)
      .whenTargetNamed("file");
    container
      .bind<IDatasource>("DATASOURCES")
      .to(MongoDBDatasource)
      .whenTargetNamed("mongodb");
    container
      .bind<interfaces.Factory<IDatasource>>("FACTORY<DATASOURCE>")
      .toFactory<IDatasource>(
        (context: interfaces.Context) =>
          function createDatasource(
            options: Required<IPipelineOpts<IDatasourceOpts>>
          ) {
            const datasource = context.container.getNamed<IDatasource>(
              "DATASOURCES",
              options.type
            );
            datasource.init(options);
            return datasource;
          }
      );

    container
      .bind<IStorage>("STORAGES")
      .to(FileStorage)
      .whenTargetNamed("file");
    container
      .bind<interfaces.Factory<IStorage>>("FACTORY<STORAGE>")
      .toFactory<IStorage>(
        (context: interfaces.Context) =>
          function createDatasource(options: IPipelineOpts<IStorageOpts>) {
            const storage = context.container.getNamed<IStorage>(
              "STORAGES",
              options.type
            );
            storage.init(options);
            return storage;
          }
      );

    container
      .bind<IPipeline>("PIPELINES")
      .to(PassthroughPipeline)
      .whenTargetNamed("passthrough");
    container.bind<IXFilter>("XFILTER").to(XFilter);
    container
      .bind<IPipeline>("PIPELINES")
      .to(FilterPipeline)
      .whenTargetNamed("filter");
    container.bind<IXParser>("XPARSER").to(XParser);
    container.bind<IXParser>("XPARSER_ENGINE_HTML").to(HTMLParser);
    container.bind<IXParser>("XPARSER_ENGINE_JSON").to(JSONParser);
    container
      .bind<IPipeline>("PIPELINES")
      .to(ParserPipeline)
      .whenTargetNamed("parser");

    container
      .bind<interfaces.Factory<IPipeline>>("FACTORY<PIPELINE>")
      .toFactory<IPipeline>(
        (context: interfaces.Context) =>
          function createDatasource(options: IPipelineOpts<IPipelineOpts>) {
            const pipeline = context.container.getNamed<IPipeline>(
              "PIPELINES",
              options.type
            );
            pipeline.init(options);
            return pipeline;
          }
      );

    const transporter = container.resolve<IXTransporter>(XTransporter);

    await transporter.start();

    emitter.emit(DatasourceEvents.INIT, {
      datasource: { limit: 1 },
      records: [],
    });
    // await transporter.stop();
  }
}

interface ITemplate extends ISettings {
  logger?: {
    type?: XLogger.LoggerType;
    opts: XLogger.ILoggerCreatorOpts;
  };
}
