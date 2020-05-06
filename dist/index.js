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
exports.merge = webpack_merge_1.default;
var mini_css_extract_plugin_1 = tslib_1.__importDefault(require("mini-css-extract-plugin"));
var optimize_css_assets_webpack_plugin_1 = tslib_1.__importDefault(require("optimize-css-assets-webpack-plugin"));
var clean_webpack_plugin_1 = require("clean-webpack-plugin");
// @ts-ignore: Figure out how to type this
var webpack_plugin_1 = tslib_1.__importDefault(require("@packtracker/webpack-plugin"));
var webpack_bundle_tracker_1 = tslib_1.__importDefault(require("webpack-bundle-tracker"));
var terser_webpack_plugin_1 = tslib_1.__importDefault(require("terser-webpack-plugin"));
var webpack_plugin_2 = tslib_1.__importDefault(require("@sentry/webpack-plugin"));
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
                    include: include,
                    exclude: /node_modules/,
                    use: {
                        loader: "babel-loader",
                        options: {
                            // Use cache to speed up recompilation.
                            // The default cache is written to node_modules/.cache/babel-loader
                            //
                            // See https://www.npmjs.com/package/babel-loader#options for further
                            // information.
                            cacheDirectory: true,
                        },
                    },
                },
            ],
        },
    };
}
exports.loadJavaScript = loadJavaScript;
function loadSourceMaps() {
    return {
        module: {
            rules: [{ enforce: "pre", test: /\.js$/, loader: "source-map-loader" }],
        },
    };
}
exports.loadSourceMaps = loadSourceMaps;
// Now this portion will consume TS configuration from the project but
// we could consider moving it here if it looks like it's uniform between
// consumers.
function loadTypeScript() {
    var mode = process.env.NODE_ENV;
    // TODO: It's worth benchmarking babel-loader here. Given there's no
    // full feature-parity, you should enable isolatedModules in your TS
    // settings if you go this way.
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
function loadHTML() {
    return {
        module: {
            rules: [
                {
                    test: /\.html$/,
                    loader: "html-loader",
                },
            ],
        },
    };
}
exports.loadHTML = loadHTML;
function loadYAML() {
    return {
        module: {
            rules: [
                {
                    test: /\.(yml|yaml)$/,
                    use: ["json-loader", "yaml-loader"],
                },
            ],
        },
    };
}
exports.loadYAML = loadYAML;
function cssLoader(options) {
    if (options === void 0) { options = {}; }
    return {
        loader: "css-loader",
        options: tslib_1.__assign(tslib_1.__assign({}, options), { modules: {
                mode: "global",
                localIdentName: "[local]-[hash:base64:5]",
            } }),
    };
}
function loadLess(_a) {
    var postCssPlugins = (_a === void 0 ? {} : _a).postCssPlugins;
    var mode = process.env.NODE_ENV;
    return {
        module: {
            rules: [
                {
                    test: /\.less$/,
                    use: [
                        mode === "production"
                            ? mini_css_extract_plugin_1.default.loader
                            : "style-loader",
                        cssLoader(postCssPlugins && { importLoaders: 1 }),
                        postCssPlugins ? postCssLoader(postCssPlugins) : "",
                        "less-loader",
                    ].filter(Boolean),
                },
            ],
        },
    };
}
exports.loadLess = loadLess;
function loadCSS(_a) {
    var postCssPlugins = (_a === void 0 ? {} : _a).postCssPlugins;
    var mode = process.env.NODE_ENV;
    return {
        module: {
            rules: [
                {
                    test: /\.css$/,
                    use: [
                        mode === "production"
                            ? mini_css_extract_plugin_1.default.loader
                            : "style-loader",
                        cssLoader(postCssPlugins && { importLoaders: 1 }),
                        postCssPlugins ? postCssLoader(postCssPlugins) : "",
                    ].filter(Boolean),
                },
            ],
        },
    };
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
function extractCSS(_a) {
    var filename = (_a === void 0 ? {} : _a).filename;
    var mode = process.env.NODE_ENV;
    return {
        plugins: [
            new mini_css_extract_plugin_1.default({
                filename: (filename || mode === "production" ? "[name]-[hash]" : "[name]") + ".css",
            }),
        ],
    };
}
exports.extractCSS = extractCSS;
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
// TODO: If the interface grows, either refactor into separate functions
// or change into an object form
function loadImages(options, svgLoader) {
    if (options === void 0) { options = {}; }
    if (svgLoader === void 0) { svgLoader = "@svgr/webpack"; }
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
                // For svg loaded from jsx/tsx, process it as a React component
                // More info: https://www.npmjs.com/package/@svgr/webpack
                {
                    test: /\.(svg)$/,
                    issuer: {
                        test: /\.(js|jsx|ts|tsx)$/,
                    },
                    use: {
                        loader: svgLoader,
                    },
                },
                // Use inlining behavior (<15k -> inline) for css/less/scss
                {
                    // Note that the regexp is going to match `.svg` too in addition to
                    // ones with a version suffix!
                    test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                    issuer: {
                        test: /\.(css|less|sass|scss)$/,
                    },
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
function minifyJavaScript(_a) {
    var terserOptions = (_a === void 0 ? { terserOptions: {} } : _a).terserOptions;
    return {
        optimization: {
            minimizer: [
                new terser_webpack_plugin_1.default({
                    cache: true,
                    parallel: true,
                    terserOptions: tslib_1.__assign(tslib_1.__assign({}, terserOptions), { output: tslib_1.__assign({ comments: false }, (terserOptions ? terserOptions.output : {})) }),
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
function minifyCSS(options) {
    if (options === void 0) { options = {}; }
    return {
        optimization: {
            minimizer: [new optimize_css_assets_webpack_plugin_1.default(options)],
        },
    };
}
exports.minifyCSS = minifyCSS;
function cleanOutput(options) {
    if (options === void 0) { options = { verbose: true }; }
    if (process.env.STORYBOOK) {
        return {};
    }
    return {
        plugins: [new clean_webpack_plugin_1.CleanWebpackPlugin(options)],
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
    if (!process.env.FRONTEND_SENTRY_DSN) {
        // eslint-disable-next-line no-console
        console.warn("Sentry: Missing FRONTEND_SENTRY_DSN!");
        return {};
    }
    return {
        plugins: [
            // Map Sentry environment variables from env to webpack so they are available
            // to Sentry.init at the application (remember set it up!).
            // Note the FRONTEND prefix at the env!
            new webpack_1.default.DefinePlugin({
                "process.env.SENTRY_DSN": "\"" + process.env.FRONTEND_SENTRY_DSN + "\"",
            }),
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
function exposeGlobals(globals) {
    return {
        module: {
            rules: Object.keys(globals).map(function (test) {
                return {
                    test: test,
                    use: {
                        loader: "expose-loader",
                        options: globals[test],
                    },
                };
            }),
        },
    };
}
exports.exposeGlobals = exposeGlobals;
