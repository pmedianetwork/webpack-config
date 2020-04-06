"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
/*
 * The idea is that each portion of configuration is exposed as a
 * composable fragment that can then be combined in the project
 * configuration based on the exact need.
 */
var webpack_1 = tslib_1.__importDefault(require("webpack"));
var webpack_merge_1 = tslib_1.__importDefault(require("webpack-merge"));
var mini_css_extract_plugin_1 = tslib_1.__importDefault(require("mini-css-extract-plugin"));
var optimize_css_assets_webpack_plugin_1 = tslib_1.__importDefault(require("optimize-css-assets-webpack-plugin"));
var clean_webpack_plugin_1 = require("clean-webpack-plugin");
// @ts-ignore: Figure out how to type this
var webpack_plugin_1 = tslib_1.__importDefault(require("@packtracker/webpack-plugin"));
var webpack_plugin_serve_1 = require("webpack-plugin-serve");
var webpack_bundle_tracker_1 = tslib_1.__importDefault(require("webpack-bundle-tracker"));
var terser_webpack_plugin_1 = tslib_1.__importDefault(require("terser-webpack-plugin"));
// This function returns a custom version of webpack-merge that's able to detect
// duplicate mini-css-extract-plugins and make sure only one remains in the
// configuration
function mergeConfig() {
    return webpack_merge_1.default({
        customizeArray: webpack_merge_1.default.unique("plugins", ["MiniCssExtractPlugin"], function (plugin) { return plugin.constructor && plugin.constructor.name; }),
    });
}
exports.mergeConfig = mergeConfig;
// This function should be used for merging Storybook base configuration with
// project specific configuration. It's the place where Storybook can be optimized
// further.
function mergeStorybook(_a) {
    var mode = _a.mode, config = _a.config, userConfig = _a.userConfig;
    var _b, _c, _d;
    var newConfig = webpack_merge_1.default(config, {
        plugins: userConfig.plugins,
        // https://medium.com/@kenneth_chau/speeding-up-webpack-typescript-incremental-builds-by-7x-3912ba4c1d15
        // The changes below gives a minor speed increase during rebundling
        optimization: mode === "DEVELOPMENT"
            ? {
                removeAvailableModules: false,
                removeEmptyChunks: false,
                splitChunks: false,
            }
            : {},
        output: {
            pathinfo: false,
        },
    });
    // Another option would be to user merge.strategy but this is explicit
    // at least.
    // @ts-ignore: Find a safe way to merge these -> merge.strategy?
    newConfig.module.rules = (_b = userConfig === null || userConfig === void 0 ? void 0 : userConfig.module) === null || _b === void 0 ? void 0 : _b.rules;
    // @ts-ignore
    newConfig.resolve.extensions = (_c = userConfig === null || userConfig === void 0 ? void 0 : userConfig.resolve) === null || _c === void 0 ? void 0 : _c.extensions;
    // @ts-ignore
    newConfig.resolve.modules = (_d = userConfig === null || userConfig === void 0 ? void 0 : userConfig.resolve) === null || _d === void 0 ? void 0 : _d.modules;
    return newConfig;
}
exports.mergeStorybook = mergeStorybook;
// Note that .babelrc is exposed through the package root so that other tooling (babel-jest) can use it through
//
// {
//  extends: "@pmedianetwork/webpack-config/.babelrc"
// }
function loadJavaScript(_a) {
    var include = (_a === void 0 ? {} : _a).include;
    return {
        resolve: {
            extensions: [".js"],
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    use: "babel-loader",
                    include: include,
                    exclude: /node_modules/,
                },
                // In case modules already have source maps, load them as well.
                { enforce: "pre", test: /\.js$/, loader: "source-map-loader" },
            ],
        },
    };
}
exports.loadJavaScript = loadJavaScript;
// Now this portion will consume TS configuration from the project but
// we could consider moving it here if it looks like it's uniform between
// consumers.
function loadTypeScript() {
    var mode = process.env.NODE_ENV;
    return {
        resolve: {
            extensions: [".tsx", ".ts"],
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: [
                        {
                            loader: "ts-loader",
                            options: {
                                // fork-ts-checker-webpack-plugin could be potentially faster
                                // Unfortunately it crashes with
                                // TypeError: this[MODULE_TYPE] is not a function
                                // against CSS in adverity-datatap!
                                //
                                // Another option would be to consider handling
                                // type checking outside of webpack
                                transpileOnly: mode !== "production",
                            },
                        },
                    ],
                    exclude: /node_modules/,
                },
            ],
        },
    };
}
exports.loadTypeScript = loadTypeScript;
// Webpack handles JSON out of the box but it's good to set the extension
// so that imports work without the extension.
function loadJSON() {
    return {
        resolve: {
            extensions: [".json"],
        },
    };
}
exports.loadJSON = loadJSON;
var cssLoader = {
    loader: "css-loader",
    options: {
        modules: {
            mode: "global",
            localIdentName: "[local]-[hash:base64:5]",
        },
    },
};
function loadLess() {
    var mode = process.env.NODE_ENV;
    return webpack_merge_1.default({
        module: {
            rules: [
                {
                    test: /\.less$/,
                    use: [
                        mode === "production"
                            ? mini_css_extract_plugin_1.default.loader
                            : "style-loader",
                        cssLoader,
                        "less-loader",
                    ],
                },
            ],
        },
    }, extractCSS());
}
exports.loadLess = loadLess;
function loadCSS() {
    var mode = process.env.NODE_ENV;
    return webpack_merge_1.default({
        module: {
            rules: [
                {
                    test: /\.css$/,
                    use: [
                        mode === "production"
                            ? mini_css_extract_plugin_1.default.loader
                            : "style-loader",
                        cssLoader,
                    ],
                },
            ],
        },
    }, extractCSS());
}
exports.loadCSS = loadCSS;
function extractCSS() {
    var mode = process.env.NODE_ENV;
    return {
        plugins: [
            new mini_css_extract_plugin_1.default({
                filename: (mode === "production" ? "[name]-[hash]" : "[name]") + ".css",
            }),
        ],
    };
}
function loadFonts() {
    return {
        module: {
            rules: [
                {
                    test: /\.(woff|woff2|ttf|eot)($|\?)/,
                    use: {
                        loader: "file-loader",
                        options: { name: "[name].[ext]" },
                    },
                },
            ],
        },
    };
}
exports.loadFonts = loadFonts;
function loadImages() {
    return {
        module: {
            rules: [
                {
                    test: /\.(svg|png|gif|ico|jpg)($|\?)/,
                    use: {
                        loader: "file-loader",
                        options: { name: "[name].[ext]" },
                    },
                },
            ],
        },
    };
}
exports.loadImages = loadImages;
// Don't parse known, pre-built JavaScript files (improves webpack perf)
function dontParse(paths) {
    return {
        module: {
            noParse: paths,
            rules: [],
        },
    };
}
exports.dontParse = dontParse;
// https://webpack.js.org/configuration/dev-server/#devserver
function webpackDevServer(_a) {
    var _b = _a === void 0 ? { https: undefined, staticPaths: "" } : _a, https = _b.https, staticPaths = _b.staticPaths;
    if (process.env.STORYBOOK) {
        return {};
    }
    return {
        devServer: {
            contentBase: staticPaths,
            https: https,
            hot: true,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
        },
    };
}
exports.webpackDevServer = webpackDevServer;
// The current implementation uses webpack-plugin-serve. It requires the consumer
// to set 'webpack-plugin-serve/client' as an entry and that cannot done here as
// due to polymorphism of webpack's entry configuration as far as I understand.
function webpackPluginServe(_a) {
    var _this = this;
    var _b = _a === void 0 ? { https: undefined, staticPaths: "" } : _a, https = _b.https, staticPaths = _b.staticPaths;
    if (process.env.STORYBOOK) {
        return {};
    }
    var WEBPACK_SERVE_PORT = 8001;
    var publicPath = "https://localhost:" + WEBPACK_SERVE_PORT + "/";
    var serveOptions = {
        host: "127.0.0.1",
        port: WEBPACK_SERVE_PORT,
        hmr: true,
        https: https,
        // @ts-ignore: Figure out how to type this
        middleware: function (app) {
            // @ts-ignore: Figure out how to type this
            return app.use(function (ctx, next) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            ctx.set("Access-Control-Allow-Origin", "*");
                            return [4 /*yield*/, next()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
        },
        static: staticPaths,
    };
    return {
        output: {
            publicPath: publicPath,
        },
        plugins: [new webpack_plugin_serve_1.WebpackPluginServe(serveOptions)],
        watch: true,
    };
}
exports.webpackPluginServe = webpackPluginServe;
// For PackTracker (bundle size tracking service) to work, you should set
// CI flag to true in the continuous integration environment.
function trackBundleSize(token) {
    if (process.env.STORYBOOK) {
        return {};
    }
    return {
        plugins: [
            new webpack_plugin_1.default({
                project_token: token,
                upload: process.env.CI,
            }),
        ],
    };
}
exports.trackBundleSize = trackBundleSize;
function minifyJavaScript() {
    return {
        optimization: {
            minimizer: [
                new terser_webpack_plugin_1.default({
                    cache: true,
                    parallel: true,
                    terserOptions: {
                        output: {
                            comments: false,
                        },
                    },
                    extractComments: false,
                    // This works only with source-map, inline-source-map, hidden-source-map and
                    // nosources-source-map values for the devtool option!
                    sourceMap: true,
                }),
            ],
        },
    };
}
exports.minifyJavaScript = minifyJavaScript;
function minifyCSS() {
    return {
        optimization: {
            minimizer: [new optimize_css_assets_webpack_plugin_1.default({})],
        },
    };
}
exports.minifyCSS = minifyCSS;
function cleanOutput() {
    if (process.env.STORYBOOK) {
        return {};
    }
    return {
        plugins: [new clean_webpack_plugin_1.CleanWebpackPlugin({ verbose: true })],
    };
}
exports.cleanOutput = cleanOutput;
function emitStats(_a) {
    var _b = _a.path, path = _b === void 0 ? __dirname : _b, filename = _a.filename, _c = _a.publicPath, publicPath = _c === void 0 ? "/-" : _c, _d = _a.logTime, logTime = _d === void 0 ? true : _d;
    return {
        plugins: [new webpack_bundle_tracker_1.default({ path: path, filename: filename, publicPath: publicPath, logTime: logTime })],
    };
}
exports.emitStats = emitStats;
function provideGlobals(globals) {
    return {
        plugins: [new webpack_1.default.ProvidePlugin(globals)],
    };
}
exports.provideGlobals = provideGlobals;
