require("dotenv").config();
import "reflect-metadata";
import _ from "lodash";
import { Command, flags } from "@oclif/command";
import * as XJSON from "@nodeplusplus/xregex-json";
import * as XYML from "@nodeplusplus/xregex-yml";
import * as XLogger from "@nodeplusplus/xregex-logger";

import { ISettings } from "../types";
import { TemplateBuilder as Builder } from "../builders";

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

    const builder = new Builder();
    builder.useTemplate(template);
    builder.make();
    const transporter = builder.getTransporter();
    transporter.init({ id: "transporter.main", type: "XTransporter" });
    await transporter.start();

    await transporter.execOnce({ datasource: { limit: 100 } });
    await transporter.stop();
  }
}

interface ITemplate extends ISettings {
  logger?: {
    type?: XLogger.LoggerType;
    opts: XLogger.ILoggerCreatorOpts;
  };
}
