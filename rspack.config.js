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
