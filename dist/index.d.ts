import webpack from "webpack";
import WebpackDevServer from "webpack-dev-server";
import merge from "webpack-merge";
import OptimizeCssAssetsPlugin from "optimize-css-assets-webpack-plugin";
import { Options as CleanWebpackPluginOptions } from "clean-webpack-plugin";
import TerserPlugin from "terser-webpack-plugin";
import SentryCliPlugin from "@sentry/webpack-plugin";
declare function mergeConfig(): merge.ConfigurationMergeFunction;
declare function mergeStorybook({ mode, config, userConfig, }: {
    mode: "DEVELOPMENT" | "PRODUCTION";
    config: webpack.Configuration;
    userConfig: webpack.Configuration;
}): webpack.Configuration;
declare function loadJavaScript({ include, }?: {
    include?: webpack.RuleSetCondition;
}): webpack.Configuration;
declare function loadTypeScript(): webpack.Configuration;
declare function loadJSON(): webpack.Configuration;
declare function loadHTML(): webpack.Configuration;
declare function loadYAML(): webpack.Configuration;
declare type PostCSSPlugin = (id: string) => any;
declare function loadLess({ postCssPlugins, }?: {
    postCssPlugins?: PostCSSPlugin[];
}): webpack.Configuration;
declare function loadCSS({ postCssPlugins, }?: {
    postCssPlugins?: PostCSSPlugin[];
}): webpack.Configuration;
declare type FileLoaderOptions = {
    name?: string;
    outputPath?: string;
    publicPath?: string;
    postTransformPublicPath?: (p: string) => string;
    context?: string;
    emitFile?: boolean;
};
declare function loadFonts(options?: FileLoaderOptions): webpack.Configuration;
declare function loadImages(options?: FileLoaderOptions): webpack.Configuration;
declare function dontParse(paths: webpack.Module["noParse"]): webpack.Configuration;
declare function webpackDevServer(options: WebpackDevServer.Configuration): webpack.Configuration;
declare function trackBundleSize(token: string): webpack.Configuration;
declare function minifyJavaScript({ terserOptions, }?: {
    terserOptions: TerserPlugin.TerserPluginOptions["terserOptions"];
}): webpack.Configuration;
declare function minifyCSS(options?: OptimizeCssAssetsPlugin.Options): webpack.Configuration;
declare function cleanOutput(options?: CleanWebpackPluginOptions): webpack.Configuration;
declare function emitStats({ path, filename, publicPath, logTime, }: {
    path: string;
    filename: string;
    publicPath: string;
    logTime: boolean;
}): webpack.Configuration;
declare type Globals = {
    [key: string]: any;
};
declare function provideGlobals(globals: Globals): webpack.Configuration;
declare function injectGlobal({ test, globals, }: {
    test: webpack.RuleSetRule["test"];
    globals: Globals;
}): webpack.Configuration;
declare function uploadSourcemapsToSentry(): {
    plugins?: undefined;
} | {
    plugins: (webpack.EnvironmentPlugin | SentryCliPlugin)[];
};
declare function exposeEnvironmentVariables(environmentVariables: string[]): webpack.Configuration;
declare function exposeGlobals(globals: {
    [name: string]: string;
}): webpack.Configuration;
export { mergeConfig, mergeStorybook, loadJavaScript, loadTypeScript, loadJSON, loadLess, loadCSS, loadFonts, loadImages, loadHTML, loadYAML, dontParse, webpackDevServer, trackBundleSize, minifyJavaScript, minifyCSS, cleanOutput, emitStats, injectGlobal, provideGlobals, uploadSourcemapsToSentry, exposeEnvironmentVariables, exposeGlobals, };
