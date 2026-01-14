// nightwatch.onc.conf.js - ONC tests with authentication

module.exports = {
  src_folders: 'packages',  // String instead of array
  output_folder: 'tests/output',
  
  webdriver: {
    start_process: false,  // Don't auto-start, use manual ChromeDriver
    host: 'localhost',
    port: 9515
  },

  test_settings: {
    default: {
      desiredCapabilities: {
        browserName: 'chrome',
        'goog:chromeOptions': {
          args: [
            '--headless',
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--window-size=1920,1080'
          ]
        }
      },
      globals: {
        // Auto-login credentials for development
        devAutoLogin: true,
        devUsername: 'demouser',
        devPassword: 'password2025',
        baseUrl: 'http://localhost:3000'
      }
    }
  }
};