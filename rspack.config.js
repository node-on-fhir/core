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
  if (Meteor.isServer) {
    // Add @workflows alias for server
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias['@workflows'] = path.resolve(__dirname, 'imports/workflows');

    // Provide global shims for browser-oriented libraries
    // Don't polyfill process - use the real Node.js process
    config.plugins.push(
      new (require('@rspack/core').ProvidePlugin)({
        // Make 'window' and 'self' available as 'global' on the server
        window: 'global',
        self: 'global'
      })
    );
  }

  return config;
});
