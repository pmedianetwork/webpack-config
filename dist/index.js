"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
/*
 * The idea is that each portion of configuration is exposed as a
 * composable fragment that can then be combined in the project
 * configuration based on the exact need.
 */
var webpack_1 = tslib_1.__importDefault(require("webpack"));
var webpack_plugin_serve_1 = require("webpack-plugin-serve");
var webpack_merge_1 = tslib_1.__importDefault(require("webpack-merge"));
exports.merge = webpack_merge_1.default;
var brotli_webpack_plugin_1 = tslib_1.__importDefault(require("brotli-webpack-plugin"));
var mini_css_extract_plugin_1 = tslib_1.__importDefault(require("mini-css-extract-plugin"));
var optimize_css_assets_webpack_plugin_1 = tslib_1.__importDefault(require("optimize-css-assets-webpack-plugin"));
var clean_webpack_plugin_1 = require("clean-webpack-plugin");
// @ts-ignore: Figure out how to type this
var webpack_plugin_1 = tslib_1.__importDefault(require("@packtracker/webpack-plugin"));
var webpack_bundle_tracker_1 = tslib_1.__importDefault(require("webpack-bundle-tracker"));
var terser_webpack_plugin_1 = tslib_1.__importDefault(require("terser-webpack-plugin"));
var webpack_plugin_2 = tslib_1.__importDefault(require("@sentry/webpack-plugin"));
var react_refresh_webpack_plugin_1 = tslib_1.__importDefault(require("@pmmmwh/react-refresh-webpack-plugin"));
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
    // @ts-ignore
    newConfig.node = tslib_1.__assign(tslib_1.__assign({}, newConfig === null || newConfig === void 0 ? void 0 : newConfig.node), userConfig === null || userConfig === void 0 ? void 0 : userConfig.node);
    return newConfig;
}
exports.mergeStorybook = mergeStorybook;
// Note that .babelrc is exposed through the package root so that other tooling (babel-jest) can use it through
//
// {
//  extends: "@pmedianetwork/webpack-config/.babelrc"
// }
function loadJavaScript(_a) {
    var _b = _a === void 0 ? {} : _a, include = _b.include, exclude = _b.exclude;
    return {
        resolve: {
            extensions: [".jsx", ".mjs", ".js"],
        },
        module: {
            rules: [
                {
                    test: /\.jsx?$/,
                    include: include,
                    exclude: exclude || /node_modules/,
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
//
// It is important to note that this will only **compile** the code and it's
// not going to perform a type check! Please run tsc separately to handle
// type checking.
function loadTypeScript(_a) {
    var options = (_a === void 0 ? {} : _a).options;
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
                            options: tslib_1.__assign(tslib_1.__assign({}, options), { 
                                // You should handle type checking outside of webpack!
                                transpileOnly: true }),
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
    var _b = _a === void 0 ? {} : _a, mode = _b.mode, postCssPlugins = _b.postCssPlugins;
    var resolvedMode = mode || process.env.NODE_ENV;
    return {
        module: {
            rules: [
                {
                    test: /\.css$/,
                    use: [
                        resolvedMode === "production"
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
                filename: (filename
                    ? filename
                    : mode === "production"
                        ? "[name]-[hash]"
                        : "[name]") + ".css",
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
function loadImages(options, 
// Resolve @svgr/webpack by an absolute path to avoid installing it
// at consumers. #13
//
// This uses svgr to emit React components. You'll get
// import starUrl, { ReactComponent as Star } from './star.svg'
// style of import from this by default.
svgLoader) {
    if (options === void 0) { options = {}; }
    if (svgLoader === void 0) { svgLoader = [require.resolve("@svgr/webpack"), "url-loader"]; }
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
                    use: svgLoader,
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
// https://www.npmjs.com/package/webpack-plugin-serve
//
// Note that when using webpack-plugin-serve, you have to run
// the process through regular webpack! The setup here will
// make sure it's running in watch mode and rest of the logic
// is built on this.
//
// When using the function, make sure your `output.publicPath` is included
// to `staticPaths`.
function webpackPluginServe(_a) {
    var _this = this;
    var staticPaths = _a.staticPaths, historyApiFallback = _a.historyApiFallback, options = tslib_1.__rest(_a, ["staticPaths", "historyApiFallback"]);
    if (process.env.STORYBOOK) {
        return {};
    }
    var historyFallback = !!historyApiFallback;
    // You can speed up execution by 20-30% by enabling ramdisk. It's
    // not used as it's possible it runs out of memory on default settings.
    return {
        plugins: [
            new webpack_plugin_serve_1.WebpackPluginServe(tslib_1.__assign({ hmr: "refresh-on-failure", progress: "minimal", historyFallback: historyFallback, middleware: function (app) {
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
                }, static: staticPaths, waitForBuild: true }, options)),
        ],
        watch: true,
    };
}
exports.webpackPluginServe = webpackPluginServe;
// This is the modern option for React projects. If you enable the option,
// you don't have to do anything at the app side.
function reactFastRefresh(_a) {
    var _b = (_a === void 0 ? {} : _a).options, options = _b === void 0 ? {} : _b;
    if (process.env.STORYBOOK) {
        return {};
    }
    return {
        plugins: [new react_refresh_webpack_plugin_1.default(options)],
        module: {
            rules: [
                {
                    test: /\.(j|t)sx?$/,
                    enforce: "post",
                    use: [
                        {
                            loader: "babel-loader",
                            options: {
                                plugins: ["react-refresh/babel"],
                            },
                        },
                    ],
                    exclude: /node_modules/,
                },
            ],
        },
    };
}
exports.reactFastRefresh = reactFastRefresh;
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
// The Sentry plugin will look for VERSION in the CI environment
// so remember to set them when using this helper.
//
// The part is an adapter to Sentry CLI and takes care of uploading
// source maps to Sentry service.
function uploadSourcemapsToSentry() {
    if (process.env.STORYBOOK || !process.env.CI) {
        return {};
    }
    if (!process.env.VERSION) {
        // eslint-disable-next-line no-console
        console.warn("Sentry: Missing VERSION!");
        return {};
    }
    // Map from FRONTEND_ to non-prefixed versions for Sentry CLI
    // TODO: Should we enforce all of these are set?
    process.env.SENTRY_AUTH_TOKEN = process.env.FRONTEND_SENTRY_AUTH_TOKEN;
    process.env.SENTRY_URL = process.env.FRONTEND_SENTRY_URL;
    process.env.SENTRY_ORG = process.env.FRONTEND_SENTRY_ORG;
    process.env.SENTRY_PROJECT = process.env.FRONTEND_SENTRY_PROJECT;
    return {
        plugins: [
            // Send source maps to Sentry using the CLI through
            // a webpack plugin.
            new webpack_plugin_2.default({
                include: ".",
                ignore: ["node_modules", "webpack.config.js"],
                release: process.env.VERSION,
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
            rules: globals.map(function (_a) {
                var module = _a.module, global = _a.global;
                return {
                    test: module,
                    use: {
                        loader: "expose-loader",
                        options: global,
                    },
                };
            }),
        },
    };
}
exports.exposeGlobals = exposeGlobals;
function compressWithBrotli(options) {
    if (options === void 0) { options = {}; }
    if (process.env.STORYBOOK || process.env.STAGING) {
        return {};
    }
    console.log("Applying brotli compression");
    return {
        plugins: [new brotli_webpack_plugin_1.default(options)],
    };
}
exports.compressWithBrotli = compressWithBrotli;
