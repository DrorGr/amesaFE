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
        timeoutInterval: isCI ? 10000 : 30000 // Local: 30s per test, CI: 10s per test
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
    // Local: Triple resources (3x concurrency, 3x memory, longer timeouts)
    // CI: Minimal resources (1x concurrency, limited memory, strict timeouts)
    concurrency: isCI ? 1 : 3, // Local: 3 browsers in parallel, CI: 1 browser
    restartOnFileChange: !isCI, // Disable file watching in CI
    singleRun: isCI, // Exit after tests in CI, keep running in local dev
    
    // #region agent log
    // Log configuration values
    onPrepare: function() {
      logDebug({
        message: 'Karma onPrepare - configuration applied',
        hypothesisId: 'H2',
        data: {
          concurrency: isCI ? 1 : 3,
          singleRun: isCI,
          restartOnFileChange: !isCI,
          reporters: isCI ? ['progress'] : ['progress', 'kjhtml'],
          hasCoverageReporter: !isCI,
          hasKjhtmlReporter: !isCI,
          chromeFlagsCount: 30, // Number of Chrome flags configured
          memoryLimit: isCI ? '512MB' : '1536MB',
          browserTimeout: isCI ? '30s' : '90s'
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
    // Timeout configurations - Triple for local, standard for CI
    browserNoActivityTimeout: isCI ? 30000 : 90000, // Local: 90s, CI: 30s
    captureTimeout: isCI ? 60000 : 180000, // Local: 180s, CI: 60s
    browserDisconnectTimeout: isCI ? 10000 : 30000, // Local: 30s, CI: 10s
    browserDisconnectTolerance: isCI ? 3 : 9, // Local: 9, CI: 3
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
          // Memory and resource limits - Triple for local (1536MB), standard for CI (512MB)
          isCI 
            ? '--js-flags=--max-old-space-size=512' // CI: 512MB
            : '--js-flags=--max-old-space-size=1536', // Local: 1536MB (3x)
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

