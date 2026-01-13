const { defineConfig } = require('@meteorjs/rspack');

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
  const isCI = process.env.CI === 'true' || process.env.CIRCLECI === 'true';

  const config = {
    plugins: [],
    // CI-specific memory optimizations
    ...(isCI && {
      // Disable source maps in CI to reduce memory usage
      devtool: false,
      // Reduce parallelism to avoid memory spikes
      optimization: {
        minimize: false, // Skip minification in test builds
      }
    })
  };

  // Client-specific configuration
  if (Meteor.isClient) {
    config.resolve = {
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
  }

  // Server-specific configuration
  if (Meteor.isServer) {
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
