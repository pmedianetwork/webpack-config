/*
 * The idea is that each portion of configuration is exposed as a
 * composable fragment that can then be combined in the project
 * configuration based on the exact need.
 */
import webpack from "webpack";
import {
  WebpackPluginServe,
  WebpackPluginServeOptions,
} from "webpack-plugin-serve";
import merge from "webpack-merge";
import BrotliPlugin from "brotli-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import OptimizeCssAssetsPlugin from "optimize-css-assets-webpack-plugin";
import {
  CleanWebpackPlugin,
  Options as CleanWebpackPluginOptions,
} from "clean-webpack-plugin";
// @ts-ignore: Figure out how to type this
import PacktrackerPlugin from "@packtracker/webpack-plugin";
import BundleTracker from "webpack-bundle-tracker";
import TerserPlugin from "terser-webpack-plugin";
import SentryCliPlugin from "@sentry/webpack-plugin";
import ReactRefreshWebpackPlugin from "@pmmmwh/react-refresh-webpack-plugin";
import tsLoader from "ts-loader";

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
}): webpack.Configuration {
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
  // @ts-ignore
  newConfig.node = { ...newConfig?.node, ...userConfig?.node };

  return newConfig;
}

// Note that .babelrc is exposed through the package root so that other tooling (babel-jest) can use it through
//
// {
//  extends: "@pmedianetwork/webpack-config/.babelrc"
// }
function loadJavaScript({
  include,
  exclude,
}: {
  include?: webpack.RuleSetCondition;
  exclude?: webpack.RuleSetCondition;
} = {}): webpack.Configuration {
  return {
    resolve: {
      extensions: [".jsx", ".mjs", ".js"],
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          include,
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

function loadSourceMaps(): webpack.Configuration {
  return {
    module: {
      rules: [{ enforce: "pre", test: /\.js$/, loader: "source-map-loader" }],
    },
  };
}

// Now this portion will consume TS configuration from the project but
// we could consider moving it here if it looks like it's uniform between
// consumers.
//
// It is important to note that this will only **compile** the code and it's
// not going to perform a type check! Please run tsc separately to handle
// type checking.
function loadTypeScript({
  options,
}: {
  options?: tsLoader.Options;
} = {}): webpack.Configuration {
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
                ...options,
                // You should handle type checking outside of webpack!
                transpileOnly: true,
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
function loadJSON(): webpack.Configuration {
  return {
    resolve: {
      extensions: [".json"],
    },
  };
}

function loadHTML(): webpack.Configuration {
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

function loadYAML(): webpack.Configuration {
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

function cssLoader(options: { importLoaders?: number } = {}) {
  return {
    loader: "css-loader",
    options: {
      ...options,
      modules: {
        mode: "global",
        localIdentName: "[local]-[hash:base64:5]",
      },
    },
  };
}

type PostCSSPlugin = (id: string) => any;

function loadLess({
  postCssPlugins,
}: {
  postCssPlugins?: PostCSSPlugin[];
} = {}): webpack.Configuration {
  const mode = process.env.NODE_ENV;

  return {
    module: {
      rules: [
        {
          test: /\.less$/,
          use: [
            mode === "production"
              ? MiniCssExtractPlugin.loader
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

function loadCSS({
  mode,
  postCssPlugins,
}: {
  mode?: string;
  postCssPlugins?: PostCSSPlugin[];
} = {}): webpack.Configuration {
  const resolvedMode = mode || process.env.NODE_ENV;

  return {
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [
            resolvedMode === "production"
              ? MiniCssExtractPlugin.loader
              : "style-loader",
            cssLoader(postCssPlugins && { importLoaders: 1 }),
            postCssPlugins ? postCssLoader(postCssPlugins) : "",
          ].filter(Boolean),
        },
      ],
    },
  };
}

function postCssLoader(plugins: PostCSSPlugin[]) {
  return {
    loader: "postcss-loader",
    options: {
      plugins,
    },
  };
}

function extractCSS({
  filename,
}: { filename?: string } = {}): webpack.Configuration {
  const mode = process.env.NODE_ENV;

  return {
    plugins: [
      new MiniCssExtractPlugin({
        filename: `${
          filename
            ? filename
            : mode === "production"
            ? "[name]-[hash]"
            : "[name]"
        }.css`,
      }),
    ],
  };
}

type FileLoaderOptions = {
  name?: string;
  outputPath?: string;
  publicPath?: string;
  postTransformPublicPath?: (p: string) => string;
  context?: string;
  emitFile?: boolean;
};

function loadFonts(options: FileLoaderOptions = {}): webpack.Configuration {
  return {
    module: {
      rules: [
        {
          test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
          use: {
            loader: "url-loader",
            options: {
              limit: 10000,
              name: "[name].[ext]",
              mimetype: "application/font-woff",
              ...options,
            },
          },
        },
        {
          test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
          use: {
            loader: "file-loader",
            options: {
              name: "[name].[ext]",
              mimetype: "application/octet-stream",
              ...options,
            },
          },
        },
        {
          test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
          use: {
            loader: "file-loader",
            options: { name: "[name].[ext]", ...options },
          },
        },
      ],
    },
  };
}

// TODO: If the interface grows, either refactor into separate functions
// or change into an object form
function loadImages(
  options: FileLoaderOptions = {},
  // Resolve @svgr/webpack by an absolute path to avoid installing it
  // at consumers. #13
  //
  // This uses svgr to emit React components. You'll get
  // import starUrl, { ReactComponent as Star } from './star.svg'
  // style of import from this by default.
  svgLoader = [require.resolve("@svgr/webpack"), "url-loader"],
): webpack.Configuration {
  return {
    module: {
      rules: [
        {
          test: /\.(png|gif|ico|jpg)($|\?)/,
          use: {
            loader: "url-loader",
            options: { limit: 15000, name: "[name].[ext]", ...options },
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
            options: {
              limit: 15000,
              name: "[name].[ext]",
              mimetype: "image/svg+xml",
              ...options,
            },
          },
        },
      ],
    },
  };
}

// Don't parse known, pre-built JavaScript files (improves webpack perf)
function dontParse(paths: webpack.Module["noParse"]): webpack.Configuration {
  return {
    module: {
      noParse: paths,
      rules: [],
    },
  };
}

// https://www.npmjs.com/package/webpack-plugin-serve
//
// Note that when using webpack-plugin-serve, you have to run
// the process through regular webpack! The setup here will
// make sure it's running in watch mode and rest of the logic
// is built on this.
//
// When using the function, make sure your `output.publicPath` is included
// to `staticPaths`.
function webpackPluginServe({
  staticPaths,
  historyApiFallback,
  ...options
}: WebpackPluginServeOptions & {
  // Adapt to webpack-dev-server naming and avoid using static reserved
  // keyword.
  historyApiFallback: WebpackPluginServeOptions["historyFallback"];
  staticPaths: WebpackPluginServeOptions["static"];
}): webpack.Configuration {
  if (process.env.STORYBOOK) {
    return {};
  }
  const historyFallback = !!historyApiFallback;

  // You can speed up execution by 20-30% by enabling ramdisk. It's
  // not used as it's possible it runs out of memory on default settings.
  return {
    plugins: [
      new WebpackPluginServe({
        hmr: "refresh-on-failure",
        progress: "minimal",
        historyFallback,
        middleware: (app) =>
          app.use(async (ctx: any, next: any) => {
            ctx.set("Access-Control-Allow-Origin", "*");
            await next();
          }),
        static: staticPaths,
        waitForBuild: true,
        ...options,
      }),
    ],
    watch: true,
  };
}

// This is the modern option for React projects. If you enable the option,
// you don't have to do anything at the app side.
function reactFastRefresh({
  options = {},
}: {
  // The plugin options are exposed in a weird way so we have to look them
  // up from the constructor.
  // https://stackoverflow.com/questions/43481518/get-argument-types-for-function-class-constructor
  options?: ConstructorParameters<typeof ReactRefreshWebpackPlugin>[0];
} = {}): webpack.Configuration {
  if (process.env.STORYBOOK) {
    return {};
  }

  return {
    plugins: [new ReactRefreshWebpackPlugin(options)],
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

// For PackTracker (bundle size tracking service) to work, you should set
// CI flag to true in the continuous integration environment.
function trackBundleSize(token: string): webpack.Configuration {
  if (process.env.STORYBOOK || !process.env.CI) {
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

function minifyJavaScript(
  {
    terserOptions,
  }: {
    terserOptions: TerserPlugin.TerserPluginOptions["terserOptions"];
  } = { terserOptions: {} },
): webpack.Configuration {
  return {
    optimization: {
      minimizer: [
        new TerserPlugin({
          cache: true,
          parallel: true,
          terserOptions: {
            ...terserOptions,
            output: {
              comments: false,
              ...(terserOptions ? terserOptions.output : {}),
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

function minifyCSS(
  options: OptimizeCssAssetsPlugin.Options = {},
): webpack.Configuration {
  return {
    optimization: {
      minimizer: [new OptimizeCssAssetsPlugin(options)],
    },
  };
}

function cleanOutput(
  options: CleanWebpackPluginOptions = { verbose: true },
): webpack.Configuration {
  if (process.env.STORYBOOK) {
    return {};
  }
  return {
    plugins: [new CleanWebpackPlugin(options)],
  };
}

function emitStats({
  path = __dirname,
  filename,
  publicPath = "",
  logTime = false,
}: {
  path: string;
  filename: string;
  publicPath: string;
  logTime: boolean;
}): webpack.Configuration {
  return {
    plugins: [new BundleTracker({ path, filename, publicPath, logTime })],
  };
}

type Globals = {
  [key: string]: any;
};

function provideGlobals(globals: Globals): webpack.Configuration {
  return {
    plugins: [new webpack.ProvidePlugin(globals)],
  };
}

function injectGlobal({
  test,
  globals,
}: {
  test: webpack.RuleSetRule["test"];
  globals: Globals;
}): webpack.Configuration {
  return {
    module: {
      rules: [
        {
          test,
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
      new SentryCliPlugin({
        include: ".",
        ignore: ["node_modules", "webpack.config.js"],
        release: process.env.VERSION,
      }),
    ],
  };
}

function exposeEnvironmentVariables(
  environmentVariables:
    | string[]
    | {
        [name: string]: any;
      },
): webpack.Configuration {
  return {
    plugins: [new webpack.EnvironmentPlugin(environmentVariables)],
  };
}

function exposeGlobals(
  globals: {
    module: string;
    global: string;
  }[],
): webpack.Configuration {
  return {
    module: {
      rules: globals.map(({ module, global }) => {
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

function compressWithBrotli(
  options: BrotliPlugin.Options = {},
): webpack.Configuration {
  if (process.env.STORYBOOK || process.env.STAGING) {
    return {};
  }

  console.log("Applying brotli compression");

  return {
    plugins: [new BrotliPlugin(options)],
  };
}

export {
  merge, // Expose merge function through a facade
  mergeStorybook,
  loadJavaScript,
  loadTypeScript,
  loadJSON,
  loadLess,
  loadCSS,
  loadFonts,
  loadImages,
  loadHTML,
  loadYAML,
  loadSourceMaps,
  extractCSS,
  dontParse,
  webpackPluginServe,
  reactFastRefresh,
  trackBundleSize,
  minifyJavaScript,
  minifyCSS,
  cleanOutput,
  emitStats,
  injectGlobal,
  provideGlobals,
  uploadSourcemapsToSentry,
  exposeEnvironmentVariables,
  exposeGlobals,
  compressWithBrotli,
};
