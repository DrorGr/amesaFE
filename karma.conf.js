// Karma configuration file, see link for more information
// https://karma-runner.github.io/latest/config/configuration-file.html

const fs = require('fs');
const path = require('path');

// #region agent log
function logDebug(data) {
  const logPath = path.join(__dirname, '..', '.cursor', 'debug.log');
  const logEntry = JSON.stringify({
    sessionId: 'karma-resource-test',
    runId: 'run1',
    timestamp: Date.now(),
    location: 'karma.conf.js',
    ...data
  }) + '\n';
  try {
    fs.appendFileSync(logPath, logEntry, 'utf8');
  } catch (e) {
    // Ignore log errors
  }
}
// #endregion

module.exports = function (config) {
  // Detect CI environment
  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
  
  // #region agent log
  const startTime = Date.now();
  const initialMemory = process.memoryUsage();
  logDebug({
    message: 'Karma configuration start',
    hypothesisId: 'H1',
    data: {
      isCI,
      envCI: process.env.CI,
      envGithubActions: process.env.GITHUB_ACTIONS,
      initialMemoryMB: {
        heapUsed: Math.round(initialMemory.heapUsed / 1024 / 1024),
        heapTotal: Math.round(initialMemory.heapTotal / 1024 / 1024),
        rss: Math.round(initialMemory.rss / 1024 / 1024)
      }
    }
  });
  // #endregion
  
  const karmaConfig = {
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      // Only load kjhtml reporter in non-CI mode (for local development)
      ...(isCI ? [] : [require('karma-jasmine-html-reporter')]),
      // Coverage reporter only loaded if needed (disabled in CI)
      ...(isCI ? [] : [require('karma-coverage')]),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      jasmine: {
        clearContext: false,
        timeoutInterval: 10000 // 10 second timeout per test
      },
      clearContext: false
    },
    jasmineHtmlReporter: {
      suppressAll: true // removes the duplicated traces
    },
    // Coverage reporter only configured if not in CI
    ...(isCI ? {} : {
      coverageReporter: {
        dir: require('path').join(__dirname, './coverage/amesa'),
        subdir: '.',
        reporters: [
          { type: 'html' },
          { type: 'text-summary' }
        ]
      }
    }),
    // Use minimal reporter in CI, full reporters in local dev
    reporters: isCI ? ['progress'] : ['progress', 'kjhtml'],
    browsers: ['Chrome'],
    // Resource optimization settings
    concurrency: 1, // Run tests sequentially (one browser at a time)
    restartOnFileChange: !isCI, // Disable file watching in CI
    singleRun: isCI, // Exit after tests in CI, keep running in local dev
    
    // #region agent log
    // Log configuration values
    onPrepare: function() {
      logDebug({
        message: 'Karma onPrepare - configuration applied',
        hypothesisId: 'H2',
        data: {
          concurrency: 1,
          singleRun: isCI,
          restartOnFileChange: !isCI,
          reporters: isCI ? ['progress'] : ['progress', 'kjhtml'],
          hasCoverageReporter: !isCI,
          hasKjhtmlReporter: !isCI,
          chromeFlagsCount: 30 // Number of Chrome flags configured
        }
      });
    },
    
    // Track browser launch
    onBrowserStart: function(browser) {
      const memory = process.memoryUsage();
      logDebug({
        message: 'Browser started',
        hypothesisId: 'H3',
        data: {
          browserName: browser.name,
          memoryMB: {
            heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
            heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
            rss: Math.round(memory.rss / 1024 / 1024)
          },
          elapsedMs: Date.now() - startTime
        }
      });
    },
    
    // Track test execution
    onRunStart: function() {
      logDebug({
        message: 'Test run started',
        hypothesisId: 'H4',
        data: {
          elapsedMs: Date.now() - startTime
        }
      });
    },
    
    // Track test completion
    onRunComplete: function(browsers, results) {
      const endTime = Date.now();
      const finalMemory = process.memoryUsage();
      logDebug({
        message: 'Test run completed',
        hypothesisId: 'H5',
        data: {
          totalDurationMs: endTime - startTime,
          success: results.success,
          failed: results.failed,
          total: results.total,
          skipped: results.skipped,
          error: results.error,
          disconnected: results.disconnected,
          finalMemoryMB: {
            heapUsed: Math.round(finalMemory.heapUsed / 1024 / 1024),
            heapTotal: Math.round(finalMemory.heapTotal / 1024 / 1024),
            rss: Math.round(finalMemory.rss / 1024 / 1024)
          },
          memoryDeltaMB: {
            heapUsed: Math.round((finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024),
            heapTotal: Math.round((finalMemory.heapTotal - initialMemory.heapTotal) / 1024 / 1024),
            rss: Math.round((finalMemory.rss - initialMemory.rss) / 1024 / 1024)
          }
        }
      });
    },
    // #endregion
    // Timeout configurations to prevent hanging
    browserNoActivityTimeout: 30000, // 30 seconds
    captureTimeout: 60000, // 60 seconds
    browserDisconnectTimeout: 10000, // 10 seconds
    browserDisconnectTolerance: 3,
    customLaunchers: {
      ChromeHeadless: {
        base: 'Chrome',
        flags: [
          '--headless',
          '--disable-gpu',
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-extensions',
          '--disable-web-security',
          // Memory and resource limits
          '--js-flags=--max-old-space-size=512', // Limit V8 heap to 512MB
          '--disable-background-networking',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-backgrounding-occluded-windows',
          '--disable-ipc-flooding-protection',
          '--disable-features=TranslateUI',
          '--disable-features=BlinkGenPropertyTrees',
          '--disable-component-extensions-with-background-pages',
          '--disable-default-apps',
          '--disable-sync',
          '--metrics-recording-only',
          '--mute-audio',
          '--no-first-run',
          '--safebrowsing-disable-auto-update',
          '--disable-software-rasterizer',
          '--disable-setuid-sandbox',
          '--disable-breakpad',
          '--disable-client-side-phishing-detection',
          '--disable-crash-reporter',
          '--disable-hang-monitor',
          '--disable-popup-blocking',
          '--disable-prompt-on-repost',
          '--disable-domain-reliability',
          '--disable-features=AudioServiceOutOfProcess',
          '--force-color-profile=srgb',
          '--memory-pressure-off'
        ]
      }
    }
  };
  
  // #region agent log
  logDebug({
    message: 'Karma configuration created',
    hypothesisId: 'H1',
    data: {
      configKeys: Object.keys(karmaConfig),
      concurrency: karmaConfig.concurrency,
      singleRun: karmaConfig.singleRun,
      reporters: karmaConfig.reporters,
      chromeFlagsCount: karmaConfig.customLaunchers.ChromeHeadless.flags.length
    }
  });
  // #endregion
  
  config.set(karmaConfig);
};

