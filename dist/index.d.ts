import webpack from "webpack";
import WebpackDevServer from "webpack-dev-server";
import merge from "webpack-merge";
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
declare function minifyJavaScript(): webpack.Configuration;
declare function minifyCSS(): webpack.Configuration;
declare function cleanOutput(): webpack.Configuration;
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
export { mergeConfig, mergeStorybook, loadJavaScript, loadTypeScript, loadJSON, loadLess, loadCSS, loadFonts, loadImages, dontParse, webpackDevServer, trackBundleSize, minifyJavaScript, minifyCSS, cleanOutput, emitStats, injectGlobal, provideGlobals, uploadSourcemapsToSentry, exposeEnvironmentVariables, };
