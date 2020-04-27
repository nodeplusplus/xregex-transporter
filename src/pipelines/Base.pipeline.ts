import _ from "lodash";
import { injectable } from "inversify";

import { IPipeline, IPipelineOpts, IPipelinePayload } from "../types";

@injectable()
export abstract class BasePipeline<O = any> implements IPipeline {
  protected id!: string;
  protected options!: O;

  public init(options: Required<IPipelineOpts<any>>) {
    this.id = options.id;
    this.options = options.opts;
  }
  public getInfo() {
    return { id: this.id, options: this.options };
  }

  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
  abstract exec(payload: IPipelinePayload): Promise<IPipelinePayload | void>;
}
