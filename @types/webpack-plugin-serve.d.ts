// TODO: Replace this with @types/webpack-plugin-serve as that has been fixed
declare module "webpack-plugin-serve" {
  import { Compiler } from "webpack";

  export interface WebpackPluginServeOptions {
    hmr?: boolean | "refresh-on-failure";
    historyFallback?: boolean;
    static?: string[];
    progress?: string;
    middleware?: (app: any) => any;
    waitForBuild?: boolean;
  }

  export class WebpackPluginServe {
    constructor(opts?: WebpackPluginServeOptions);
    attach(): {
      apply(compiler: Compiler): void;
    };
    hook(compiler: Compiler): void;
    apply(compiler: Compiler): void;
  }
}
