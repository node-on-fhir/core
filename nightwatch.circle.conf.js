// CircleCI-specific Nightwatch configuration
// This configuration is optimized for CI environments with verbose logging

const baseConfig = require('./nightwatch.conf.js');

// Use environment variable if set by CircleCI
const chromeDriverPath = process.env.CHROMEDRIVER_PATH || '/usr/local/bin/chromedriver';

module.exports = {
  ...baseConfig,
  
  // Disable parallel test execution in CI
  test_workers: {
    enabled: false
  },
  
  // Moderate output for CI - not too verbose
  detailed_output: false,
  live_output: true,
  
  test_settings: {
    default: {
      ...baseConfig.test_settings.default,
      
      // Increase timeouts for CI environment
      globals: {
        waitForConditionTimeout: 30000,
        waitForConditionPollInterval: 500,
        asyncHookTimeout: 30000,
        retryAssertionTimeout: 10000
      },
      
      // Moderate logging - show important info only
      silent: false,
      output: true,
      detailed_output: false,
      disable_error_log: false,
      log_screenshot_data: false, // Don't log base64 data, but still take screenshots
      // Disable HTTP request/response logging
      disable_colors: false,
      enable_http_request_logging: false, // Disable WebDriver HTTP request/response logging
      request_timeout_options: {
        timeout: 60000,
        retry_attempts: 3
      },
      
      desiredCapabilities: {
        browserName: 'chrome',
        'goog:chromeOptions': {
          args: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-setuid-sandbox',
            '--headless',
            '--disable-gpu',
            '--window-size=1920,1080', // Larger window to avoid overlaps
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--force-device-scale-factor=1'
          ]
        }
      },
      
      webdriver: {
        start_process: true,
        // ChromeDriver will be installed by CircleCI orb
        server_path: chromeDriverPath,
        log_path: false,  // Disable webdriver HTTP request logging
        port: 9515,
        cli_args: [
          '--log-level=WARNING',  // Only show warnings and errors
          '--port=9515',
          '--allowed-ips=',
          '--disable-dev-shm-usage',
          '--whitelisted-ips=',
          '--silent'  // Add silent flag to reduce ChromeDriver output
        ],
        // Increase timeout for webdriver
        timeout_options: {
          timeout: 60000,
          retry_attempts: 3
        },
        // Additional selenium settings
        keep_alive: true,
        check_process_delay: 1000,
        // Disable verbose output
        verbose: false,
        log_file_name: false  // Don't create log files
      }
    }
  },
  
  // Custom reporter function to ensure output without being too verbose
  reporter: function(results, done) {
    const status = results.failed > 0 || results.errors > 0 ? '❌ FAILED' : '✅ PASSED';
    console.log(`\n${status} - ${results.passed}/${results.tests} tests passed, ${results.failed} failed, ${results.errors} errors\n`);
    done();
  }
};