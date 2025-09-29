// /Volumes/SonicMagic/Code/honeycomb-public-release/.circleci/research/nightwatch.testrunnervisibility.conf.js
// Minimal Nightwatch configuration for maximum test visibility in CircleCI
// Optimized for single test file execution with reduced verbosity

const baseConfig = require('../../nightwatch.circle.conf.js');

module.exports = {
  ...baseConfig,
  
  // Disable parallel execution - we'll run tests individually
  test_workers: {
    enabled: false
  },
  
  // Minimal output - rely on test results, not logs
  detailed_output: false,
  live_output: false,
  silent: true,
  output: false,
  disable_error_log: true,
  log_screenshot_data: false,
  
  test_settings: {
    default: {
      ...baseConfig.test_settings.default,
      
      // Don't auto-start ChromeDriver - CI will manage it
      webdriver: {
        ...baseConfig.test_settings.default.webdriver,
        start_process: false,
        port: 9515,
        default_path_prefix: '',
        
        // Disable all logging
        log_path: false,
        verbose: false,
        log_file_name: false,
        
        // Minimal CLI args
        cli_args: [
          '--port=9515',
          '--silent'
        ]
      },
      
      // Disable verbose output at test level
      silent: true,
      output: false,
      detailed_output: false,
      disable_error_log: true,
      log_screenshot_data: false,
      screenshots: {
        enabled: true,
        on_failure: true,
        on_error: true,
        path: 'tests/screenshots'
      },
      
      // Disable HTTP request logging
      enable_http_request_logging: false,
      request_logs: false,
      enable_global_apis: false
    }
  },
  
  // Minimal reporter - just show pass/fail
  reporter: function(results, done) {
    // Only output the test result, nothing else
    const testFile = process.env.NIGHTWATCH_TEST_FILE || 'test';
    const status = results.failed > 0 || results.errors > 0 ? 'FAILED' : 'PASSED';
    console.log(`${testFile}: ${status} (${results.passed}/${results.tests})`);
    done();
  }
};