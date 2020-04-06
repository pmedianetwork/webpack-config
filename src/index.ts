/*
 * The idea is that each portion of configuration is exposed as a
 * composable fragment that can then be combined in the project
 * configuration based on the exact need.
 */
import webpack from "webpack";
import merge from "webpack-merge";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import OptimizeCssAssetsPlugin from "optimize-css-assets-webpack-plugin";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
// @ts-ignore: Figure out how to type this
import PacktrackerPlugin from "@packtracker/webpack-plugin";
import { WebpackPluginServe } from "webpack-plugin-serve";
import BundleTracker from "webpack-bundle-tracker";
import TerserPlugin from "terser-webpack-plugin";

// This function returns a custom version of webpack-merge that's able to detect
// duplicate mini-css-extract-plugins and make sure only one remains in the
// configuration
function mergeConfig() {
  return merge({
    customizeArray: merge.unique(
      "plugins",
      ["MiniCssExtractPlugin"],
      (plugin) => plugin.constructor && plugin.constructor.name,
    ),
  });
}

// This function should be used for merging Storybook base configuration with
// project specific configuration. It's the place where Storybook can be optimized
// further.
function mergeStorybook({
  mode,
  config,
  userConfig,
}: {
  // mode is something that comes from Storybook - Maybe there's a better type for this.
  mode: "DEVELOPMENT" | "PRODUCTION";
  config: webpack.Configuration;
  userConfig: webpack.Configuration;
}) {
  const newConfig = merge(config, {
    plugins: userConfig.plugins,
    // https://medium.com/@kenneth_chau/speeding-up-webpack-typescript-incremental-builds-by-7x-3912ba4c1d15
    // The changes below gives a minor speed increase during rebundling
    optimization:
      mode === "DEVELOPMENT"
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
  newConfig.module.rules = userConfig?.module?.rules;
  // @ts-ignore
  newConfig.resolve.extensions = userConfig?.resolve?.extensions;
  // @ts-ignore
  newConfig.resolve.modules = userConfig?.resolve?.modules;

  return newConfig;
}

// TODO: Should we manage Babel configuration here or let the consumer inject it?
function loadJavaScript({ include }: { include: webpack.RuleSetCondition }) {
  return {
    resolve: {
      extensions: [".js"],
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          use: {
            loader: "babel-loader",
          },
          include,
          exclude: /node_modules/,
        },
        // In case modules already have source maps, load them as well.
        { enforce: "pre", test: /\.js$/, loader: "source-map-loader" },
      ],
    },
  };
}

function loadTypeScript() {
  const mode = process.env.NODE_ENV;

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
                // against CSS in this project!
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

// Webpack handles JSON out of the box but it's good to set the extension
// so that imports work without the extension.
function loadJSON() {
  return {
    resolve: {
      extensions: [".json"],
    },
  };
}

const cssLoader = {
  loader: "css-loader",
  options: {
    modules: {
      mode: "global",
      localIdentName: "[local]-[hash:base64:5]",
    },
  },
};

function loadLess() {
  const mode = process.env.NODE_ENV;

  return merge(
    {
      module: {
        rules: [
          {
            test: /\.less$/,
            use: [
              mode === "production"
                ? MiniCssExtractPlugin.loader
                : "style-loader",
              cssLoader,
              "less-loader",
            ],
          },
        ],
      },
    },
    extractCSS(),
  );
}

function loadCSS() {
  const mode = process.env.NODE_ENV;

  return merge(
    {
      module: {
        rules: [
          {
            test: /\.css$/,
            use: [
              mode === "production"
                ? MiniCssExtractPlugin.loader
                : "style-loader",
              cssLoader,
            ],
          },
        ],
      },
    },
    extractCSS(),
  );
}

function extractCSS() {
  const mode = process.env.NODE_ENV;

  return {
    plugins: [
      new MiniCssExtractPlugin({
        filename: `${mode === "production" ? "[name]-[hash]" : "[name]"}.css`,
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

// Don't parse known, pre-built javascript files (improves webpack perf)
function dontParse(paths: string[]) {
  return {
    module: {
      noParse: paths,
    },
  };
}

// https://webpack.js.org/configuration/dev-server/#devserver
function webpackDevServer(
  { https, staticPaths } = { https: undefined, staticPaths: "" },
) {
  if (process.env.STORYBOOK) {
    return {};
  }

  return {
    devServer: {
      contentBase: staticPaths,
      https,
      hot: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    },
  };
}

// The current implementation uses webpack-plugin-serve. It requires the consumer
// to set 'webpack-plugin-serve/client' as an entry and that cannot done here as
// due to polymorphism of webpack's entry configuration as far as I understand.
function webpackPluginServe(
  { https, staticPaths } = { https: undefined, staticPaths: "" },
) {
  if (process.env.STORYBOOK) {
    return {};
  }

  const WEBPACK_SERVE_PORT = 8001;
  const publicPath = `https://localhost:${WEBPACK_SERVE_PORT}/`;

  const serveOptions = {
    host: "127.0.0.1",
    port: WEBPACK_SERVE_PORT,
    hmr: true,
    https,
    // @ts-ignore: Figure out how to type this
    middleware: (app) =>
      // @ts-ignore: Figure out how to type this
      app.use(async (ctx, next) => {
        ctx.set("Access-Control-Allow-Origin", "*");
        await next();
      }),
    static: staticPaths,
  };

  return {
    output: {
      publicPath,
    },
    plugins: [new WebpackPluginServe(serveOptions)],
    watch: true,
  };
}

// For PackTracker (bundle size tracking service) to work, you should set
// CI flag to true in the continuous integration environment.
function trackBundleSize(token: string) {
  if (process.env.STORYBOOK) {
    return {};
  }
  return {
    plugins: [
      new PacktrackerPlugin({
        project_token: token,
        upload: process.env.CI,
      }),
    ],
  };
}

function minifyJavaScript() {
  return {
    optimization: {
      minimizer: [
        new TerserPlugin({
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

function minifyCSS() {
  return {
    optimization: {
      minimizer: [new OptimizeCssAssetsPlugin({})],
    },
  };
}

function cleanOutput() {
  if (process.env.STORYBOOK) {
    return {};
  }
  return {
    plugins: [new CleanWebpackPlugin({ verbose: true })],
  };
}

function emitStats({
  path = __dirname,
  filename,
  publicPath = "/-",
  logTime = true,
}: {
  path: string;
  filename: string;
  publicPath: string;
  logTime: boolean;
}) {
  return {
    plugins: [new BundleTracker({ path, filename, publicPath, logTime })],
  };
}

function provideGlobals(globals: { [key: string]: any }) {
  return {
    plugins: [new webpack.ProvidePlugin(globals)],
  };
}

export {
  mergeConfig,
  mergeStorybook,
  loadJavaScript,
  loadTypeScript,
  loadJSON,
  loadLess,
  loadCSS,
  loadFonts,
  loadImages,
  dontParse,
  webpackDevServer,
  webpackPluginServe,
  trackBundleSize,
  minifyJavaScript,
  minifyCSS,
  cleanOutput,
  emitStats,
  provideGlobals,
};
