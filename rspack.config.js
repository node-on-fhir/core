const { defineConfig } = require('@meteorjs/rspack');
const path = require('path');
const WorkflowParserPlugin = require('./workflows/rspack.workflowParser.js');

// Detect CI environment
const isCI = process.env.CI === 'true' || process.env.CIRCLECI === 'true';

// Run workflow parser plugin to generate barrel files BEFORE rspack bundling
// This generates imports/workflows/index.js and loader.js with static imports
const workflowParser = new WorkflowParserPlugin({
  manifestPath: path.resolve(__dirname, 'workflows/workflows.json'),
  outputDir: path.resolve(__dirname, 'imports/workflows')
});
workflowParser.generate();

/**
 * Rspack configuration for Meteor projects.
 *
 * Provides typed flags on the `Meteor` object, such as:
 * - `Meteor.isClient` / `Meteor.isServer`
 * - `Meteor.isDevelopment` / `Meteor.isProduction`
 * - …and other flags available
 *
 * Use these flags to adjust your build settings based on environment.
 */
module.exports = defineConfig(Meteor => {
  const config = {
    plugins: [],
    // Disable lazy compilation at top level (experiments.lazyCompilation is deprecated in rspack 1.5+)
    // The EventSource endpoint conflicts with Meteor's dev server
    // (returns text/html instead of text/event-stream), causing Cornerstone3D init to fail
    lazyCompilation: false,
  };

  // Client-specific configuration
  if (Meteor.isClient) {
    config.resolve = {
      // Alias for workflow barrel files
      alias: {
        '@workflows': path.resolve(__dirname, 'imports/workflows')
      },
      // Polyfill Node.js core modules for browser
      fallback: {
        "util": require.resolve("util/"),
        "stream": require.resolve("stream-browserify"),
        "buffer": require.resolve("buffer/"),
        "process": require.resolve("process/browser"),
        // Exclude Node.js-only modules that shouldn't be in client bundle
        "path": false,
        "fs": false,
        "zlib": false
      }
    };

    config.plugins.push(
      new (require('@rspack/core').ProvidePlugin)({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer']
      }),
      // CesiumJS requires CESIUM_BASE_URL to locate Workers/Assets/Widgets
      new (require('@rspack/core').DefinePlugin)({
        CESIUM_BASE_URL: JSON.stringify('/cesium/')
      })
    );

    // Configure output for proper global object handling
    config.output = {
      ...config.output,
      publicPath: '/',
      globalObject: 'self',
      // Disable worker-related outputs since we're not using workers
      workerChunkLoading: false,
    };

    // Configure module rules
    config.module = {
      ...config.module,
      rules: [
        ...(config.module?.rules || []),
        // Handle WASM files as assets
        {
          test: /\.wasm$/,
          type: 'asset/resource',
        },
        // @spz-loader/core is an ESM package whose compiled code references
        // 'process/browser' without a .js extension.  Rspack's strict ESM
        // resolution (fullySpecified: true) rejects that import.  Relaxing
        // the rule for this package lets the existing resolve.fallback for
        // "process" handle it correctly.
        {
          test: /node_modules[\\/]@spz-loader[\\/]/,
          resolve: { fullySpecified: false }
        },
        // Strict-ESM client-side AI/ML deps that reference 'process/browser'
        // without a .js extension: @langchain/* + langsmith + openai
        // (genome-central-redux AI genome chart), and @mlc-ai/web-llm +
        // @xenova/transformers + onnxruntime-web (the mcp workflow's in-browser
        // WebLLM / transformers.js inference). Relax fullySpecified so the existing
        // resolve.fallback for "process" handles it.
        {
          test: /node_modules[\\/](@langchain[\\/]|langsmith[\\/]|openai[\\/]|@mlc-ai[\\/]|@xenova[\\/]|onnxruntime-web[\\/])/,
          resolve: { fullySpecified: false }
        }
      ]
    };

    // Enable experiments for modern features
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    };

    // Disable HMR in CI - WebSocket connections can fail in headless Chrome
    // causing the client bundle to not load properly after navigation
    if (isCI) {
      console.log('[rspack] CI detected - disabling HMR for stability');
      config.devServer = {
        ...config.devServer,
        hot: false,
        liveReload: false,
      };
    }
  }

  // Server-specific configuration
  //
  // The server bundle targets Node.js (target: 'node' is set by Meteor's base
  // config in @meteorjs/rspack).  Many npm packages (lodash, bluebird, debug,
  // node-forge, axios, mongoose, postcss, tslib, etc.) and project files
  // (FhirDehydrator.js, HipaaLogger.js, LayoutHelpers.js) contain bare
  // references to the `global` object.  Without the two settings below, Rspack
  // cannot resolve those references and the build fails with dozens of
  // "Can't resolve 'global'" errors.
  //
  // The client-side config already handles this by setting
  // output.globalObject = 'self' (line 66).  The server needs the Node.js
  // equivalent plus an explicit polyfill injection.
  if (Meteor.isServer) {
    // Add @workflows alias for server
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias['@workflows'] = path.resolve(__dirname, 'imports/workflows');
    config.resolve.alias['global'] = path.resolve(__dirname, 'workflows', 'rspack.globals.js');

    // Tell Rspack that the global scope object for the server bundle is Node's
    // `global`.  This is the server-side counterpart of the client's
    // `globalObject: 'self'` (line 66).  Without this, the CJS2 wrapper that
    // Rspack emits references an undefined global scope, breaking modules that
    // rely on it.
    config.output = {
      ...config.output,
      globalObject: 'global',
    };

    // Inject a polyfill so that bare `global` references inside module code
    // resolve to the real Node.js global object.  Rspack does NOT do this
    // automatically, even with target: 'node', because its default
    // node.global behavior emits a warning stub rather than a true polyfill.
    // This fixes the 39 "Can't resolve 'global'" errors from packages like
    // lodash, bluebird, debug, postcss, tslib, axios, and others.
    config.node = {
      ...config.node,
      global: true,
    };

    // Provide global shims for browser-oriented libraries that expect
    // `window` or `self` to exist.  On the server these are mapped to
    // Node's `global` object so the code doesn't throw ReferenceErrors.
    // We intentionally do NOT polyfill `process` here — the real Node.js
    // process object is already available.
    config.plugins.push(
      new (require('@rspack/core').ProvidePlugin)({
        window: 'global',
        self: 'global'
      })
    );

    // Mark 'ws' as external so rspack doesn't bundle it.
    // Node.js will resolve it at runtime via native require(),
    // preserving the WebSocketServer property on the module export.
    config.externals = ['ws'];
  }

  return config;
});
