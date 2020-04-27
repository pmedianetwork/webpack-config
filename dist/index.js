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
var webpack_bundle_tracker_1 = tslib_1.__importDefault(require("webpack-bundle-tracker"));
var terser_webpack_plugin_1 = tslib_1.__importDefault(require("terser-webpack-plugin"));
var webpack_plugin_2 = tslib_1.__importDefault(require("@sentry/webpack-plugin"));
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
            extensions: [".jsx", ".js"],
        },
        module: {
            rules: [
                {
                    test: /\.jsx?$/,
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
function loadLess(_a) {
    var postCssPlugins = (_a === void 0 ? {} : _a).postCssPlugins;
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
                        postCssPlugins ? postCssLoader(postCssPlugins) : "",
                        "less-loader",
                    ].filter(Boolean),
                },
            ],
        },
    }, extractCSS());
}
exports.loadLess = loadLess;
function loadCSS(_a) {
    var postCssPlugins = (_a === void 0 ? {} : _a).postCssPlugins;
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
                        postCssPlugins ? postCssLoader(postCssPlugins) : "",
                    ].filter(Boolean),
                },
            ],
        },
    }, extractCSS());
}
exports.loadCSS = loadCSS;
function postCssLoader(plugins) {
    return {
        loader: "postcss-loader",
        options: {
            plugins: plugins,
        },
    };
}
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
function loadFonts(options) {
    if (options === void 0) { options = {}; }
    return {
        module: {
            rules: [
                {
                    test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
                    use: {
                        loader: "url-loader",
                        options: tslib_1.__assign({ limit: 10000, name: "[name].[ext]", mimetype: "application/font-woff" }, options),
                    },
                },
                {
                    test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
                    use: {
                        loader: "file-loader",
                        options: tslib_1.__assign({ name: "[name].[ext]", mimetype: "application/octet-stream" }, options),
                    },
                },
                {
                    test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
                    use: {
                        loader: "file-loader",
                        options: tslib_1.__assign({ name: "[name].[ext]" }, options),
                    },
                },
            ],
        },
    };
}
exports.loadFonts = loadFonts;
function loadImages(options) {
    if (options === void 0) { options = {}; }
    return {
        module: {
            rules: [
                {
                    test: /\.(png|gif|ico|jpg)($|\?)/,
                    use: {
                        loader: "url-loader",
                        options: tslib_1.__assign({ limit: 15000, name: "[name].[ext]" }, options),
                    },
                },
                {
                    test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                    use: {
                        loader: "url-loader",
                        options: tslib_1.__assign({ limit: 15000, name: "[name].[ext]", mimetype: "image/svg+xml" }, options),
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
//
// Note that HMR is enabled by default! That could be extracted to
// another function in case it's not needed in all projects.
function webpackDevServer(options) {
    if (process.env.STORYBOOK) {
        return {};
    }
    return {
        devServer: tslib_1.__assign({ hot: true, headers: {
                "Access-Control-Allow-Origin": "*",
            } }, options),
        // HMR setup with React and react-hot-loader
        plugins: [new webpack_1.default.HotModuleReplacementPlugin()],
        resolve: {
            alias: { "react-dom": "@hot-loader/react-dom" },
        },
    };
}
exports.webpackDevServer = webpackDevServer;
// For PackTracker (bundle size tracking service) to work, you should set
// CI flag to true in the continuous integration environment.
function trackBundleSize(token) {
    if (process.env.STORYBOOK || !process.env.CI) {
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
    var _b = _a.path, path = _b === void 0 ? __dirname : _b, filename = _a.filename, _c = _a.publicPath, publicPath = _c === void 0 ? "" : _c, _d = _a.logTime, logTime = _d === void 0 ? false : _d;
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
function injectGlobal(_a) {
    var test = _a.test, globals = _a.globals;
    return {
        module: {
            rules: [
                {
                    test: test,
                    use: [
                        {
                            loader: "imports-loader",
                            options: globals,
                        },
                    ],
                },
            ],
        },
    };
}
exports.injectGlobal = injectGlobal;
// The Sentry plugin will look for SENTRY_AUTH_TOKEN and
// other env variables defined at https://docs.sentry.io/cli/configuration/#configuration-values
//
// It's an adapter to Sentry CLI and takes care of uploading
// source maps to Sentry service.
function uploadSourcemapsToSentry() {
    if (!process.env.SENTRY_ORG) {
        // eslint-disable-next-line no-console
        console.warn("Sentry: Missing environment variables!");
        return {};
    }
    return {
        plugins: [
            // Map Sentry environment variables from env to webpack so they are available
            // to Sentry.init at the application (remember set it up!).
            new webpack_1.default.EnvironmentPlugin([
                "SENTRY_DSN",
                "SENTRY_PUBLIC_KEY",
                "SENTRY_PROJECT_ID",
            ]),
            // Send source maps to Sentry using the CLI through
            // a webpack plugin.
            new webpack_plugin_2.default({
                include: ".",
                ignore: ["node_modules", "webpack.config.js"],
            }),
        ],
    };
}
exports.uploadSourcemapsToSentry = uploadSourcemapsToSentry;
function exposeEnvironmentVariables(environmentVariables) {
    return {
        plugins: [new webpack_1.default.EnvironmentPlugin(environmentVariables)],
    };
}
exports.exposeEnvironmentVariables = exposeEnvironmentVariables;
