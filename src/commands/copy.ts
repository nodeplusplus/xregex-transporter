require("dotenv").config();
import "reflect-metadata";
import _ from "lodash";
import { Command, flags } from "@oclif/command";
import { Container } from "inversify";
import * as XJSON from "@nodeplusplus/xregex-json";
import * as XYML from "@nodeplusplus/xregex-yml";
import * as XLogger from "@nodeplusplus/xregex-logger";

import {
  ISettings,
  IPipeline,
  IDatasource,
  IStorage,
  DatasourceEvents,
  IDatasourcePayload,
} from "../types";
import { EventEmitter } from "events";
import { FileDatasource } from "../datasources";
import { FileStorage } from "../storages";
import {
  Pipeline,
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

    const template: ITemplate = _.merge(
      {},
      args.template && (await XYML.parse(args.template)),
      flags.options && (await XJSON.parse(flags.options))
    );

    const container = new Container();

    const logger = XLogger.create(
      template.logger?.type || XLogger.LoggerType.CONSOLE,
      template.logger?.opts
    );
    container.bind<XLogger.ILogger>("LOGGER").toConstantValue(logger);
    const emitter = new EventEmitter();
    container.bind<EventEmitter>("EMITTER").toConstantValue(emitter);

    template.datasources.forEach((options) => {
      container
        .bind<IDatasource>("DATASOURCE")
        .to(FileDatasource)
        .whenTargetNamed(options.name);
      container
        .bind<any>("OPTIONS")
        .toConstantValue(options)
        .whenTargetNamed(options.name);
    });

    const datasources = template.datasources.map((options) => {
      const datasource = container.resolve<IDatasource>(FileDatasource);
      datasource.options = options;
      return datasource;
    });
    const storages = template.storages.map((options) => {
      const storage = container.resolve<IStorage>(FileStorage);
      storage.options = options;
      return storage;
    });

    container.bind<any>("SETTINGS").toConstantValue({});
    container.bind<IXFilter>("XFILTER").to(XFilter);
    container.bind<IXParser>("XPARSER").to(XParser);
    container.bind<IXParser>("XPARSER_ENGINE_HTML").to(HTMLParser);
    container.bind<IXParser>("XPARSER_ENGINE_JSON").to(JSONParser);
    const pipelines = template.pipelines.map((options) => {
      let pipeline: any;
      if (options.type === "passthrough") {
        pipeline = container.resolve<IPipeline>(PassthroughPipeline);
      }
      if (options.type === "parser") {
        pipeline = container.resolve<IPipeline>(ParserPipeline);
      }
      if (options.type === "filter") {
        pipeline = container.resolve<IPipeline>(FilterPipeline);
      }

      pipeline.options = options;
      return pipeline;
    });

    container.bind<IPipeline[]>("PIPELINES").toConstantValue(pipelines as any);
    const pipline = container.resolve<IPipeline>(Pipeline);

    await Promise.all([
      ...datasources.map((datasource) => datasource.start()),
      ...storages.map((storage) => storage.start()),
      pipline.start(),
    ]);

    const payload: IDatasourcePayload = {
      datasource: { limit: 1 },
      records: [],
    };
    emitter.emit(DatasourceEvents.INIT, payload);

    // await Promise.all([
    //   ...datasources.map((datasource) => datasource.stop()),
    //   ...storages.map((storage) => storage.stop()),
    //   pipline.stop(),
    // ]);
  }
}

interface ITemplate extends ISettings {
  logger?: {
    type?: XLogger.LoggerType;
    opts: XLogger.ILoggerCreatorOpts;
  };
}
