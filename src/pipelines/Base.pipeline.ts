import _ from "lodash";
import { injectable } from "inversify";

import { IPipeline, IPipelineOpts, IPipelineContext } from "../types";

@injectable()
export abstract class BasePipeline<O = any> implements IPipeline {
  protected id!: string;
  protected options!: O;

  public init(options: Required<IPipelineOpts<any>>) {
    this.id = options.id;
    this.options = options.opts;
  }

  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
  abstract exec(ctx: IPipelineContext): Promise<IPipelineContext | void>;
}
