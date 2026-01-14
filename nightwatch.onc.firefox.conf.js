// nightwatch.onc.firefox.conf.js - Firefox config for ONC tests

module.exports = {
  src_folders: ['packages'],
  output_folder: 'tests/output',
  
  webdriver: {
    start_process: true,
    server_path: require('geckodriver').path,
    port: 4444
  },

  test_settings: {
    default: {
      desiredCapabilities: {
        browserName: 'firefox',
        'moz:firefoxOptions': {
          args: [
            '--headless',
            '--width=1920',
            '--height=1080'
          ]
        }
      }
    }
  }
};