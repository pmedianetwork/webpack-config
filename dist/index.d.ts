import webpack from "webpack";
import WebpackDevServer from "webpack-dev-server";
import merge from "webpack-merge";
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
declare function loadLess(): webpack.Configuration;
declare function loadCSS(): webpack.Configuration;
declare type FileLoaderOptions = {
    outputPath?: string;
    publicPath?: string;
    postTransformPublicPath?: (p: string) => string;
    context?: string;
    emitFile?: boolean;
};
declare function loadFonts(options: FileLoaderOptions): webpack.Configuration;
declare function loadImages(options: FileLoaderOptions): webpack.Configuration;
declare function dontParse(paths: webpack.Module["noParse"]): webpack.Configuration;
declare function webpackDevServer(options: WebpackDevServer.Configuration): webpack.Configuration;
declare function trackBundleSize(token: string): webpack.Configuration;
declare function minifyJavaScript(): webpack.Configuration;
declare function minifyCSS(): webpack.Configuration;
declare function cleanOutput(): webpack.Configuration;
declare function emitStats({ path, filename, publicPath, logTime, }: {
    path: string;
    filename: string;
    publicPath: string;
    logTime: boolean;
}): webpack.Configuration;
declare function provideGlobals(globals: {
    [key: string]: any;
}): webpack.Configuration;
export { mergeConfig, mergeStorybook, loadJavaScript, loadTypeScript, loadJSON, loadLess, loadCSS, loadFonts, loadImages, dontParse, webpackDevServer, trackBundleSize, minifyJavaScript, minifyCSS, cleanOutput, emitStats, provideGlobals, };
