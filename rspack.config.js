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
  const config = {
    plugins: []
  };

  // Client-specific configuration
  if (Meteor.isClient) {
    config.resolve = {
      // Polyfill Node.js core modules for browser
      fallback: {
        "util": require.resolve("util/"),
        "stream": require.resolve("stream-browserify"),
        "buffer": require.resolve("buffer/"),
        "process": require.resolve("process/browser")
      }
    };

    config.plugins.push(
      new (require('@rspack/core').ProvidePlugin)({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer']
      })
    );

    // Configure Web Worker support for Cornerstone3D DICOM image loader
    // The issue: RSPack's import_scripts chunk loading injects CommonJS code
    // that references 'module' which doesn't exist in ES module workers
    config.output = {
      ...config.output,
      // Try using 'import' style chunk loading for workers to avoid CommonJS
      // This tells RSPack to use dynamic import() instead of importScripts()
      workerChunkLoading: false, // Disable automatic chunk loading in workers
      // Ensure workers can load chunks properly
      publicPath: '/',
      // Global object for workers (should be 'self', not 'window')
      globalObject: 'self',
    };

    // Experiments for worker support
    config.experiments = {
      ...config.experiments,
      // Enable top-level await for workers (allows async imports)
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
