// Karma configuration file, see link for more information
// https://karma-runner.github.io/latest/config/configuration-file.html

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      jasmine: {
        // you can add configuration for jasmine here
        // values for clearContext are not supported here
        // as they are overwritten by karma-jasmine-html-reporter
        clearContext: false
      },
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    jasmineHtmlReporter: {
      suppressAll: true // removes the duplicated traces
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/amesa'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' },
        { type: 'lcov' },
        { type: 'json-summary' }
      ],
      check: {
        global: {
          statements: 85,
          branches: 80,
          functions: 85,
          lines: 85
        }
      }
    },
    reporters: ['progress', 'kjhtml', 'coverage'],
    browsers: ['Chrome'],
    customLaunchers: {
      ChromeHeadless: {
        base: 'Chrome',
        flags: [
          '--headless',
          '--no-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage'
        ]
      }
    },
    restartOnFileChange: true,
    singleRun: false
  });
};

