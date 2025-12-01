// client/ClientLogger.js
// Client-side logger using console

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Log level hierarchy (lower number = higher priority)
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  verbose: 3,
  debug: 4,
  trace: 5,
  data: 6
};

// Determine if a message at the given level should be logged
function shouldLog(level) {
  const threshold = get(Meteor, 'settings.public.loggingThreshold', 'info');

  if (threshold === 'everything') {
    return true;
  }

  const currentLevel = levels[level];
  const thresholdLevel = levels[threshold];

  if (currentLevel === undefined || thresholdLevel === undefined) {
    return true;
  }

  return currentLevel <= thresholdLevel;
}

// Client logger object
export const logger = {
  error: function(...args) {
    if (shouldLog('error')) console.error(...args);
  },
  warn: function(...args) {
    if (shouldLog('warn')) console.warn(...args);
  },
  info: function(...args) {
    if (shouldLog('info')) console.info(...args);
  },
  verbose: function(...args) {
    if (shouldLog('verbose')) console.log('[VERBOSE]', ...args);
  },
  debug: function(...args) {
    if (shouldLog('debug')) console.log('[DEBUG]', ...args);
  },
  trace: function(...args) {
    if (shouldLog('trace')) console.log('[TRACE]', ...args);
  },
  data: function(...args) {
    if (shouldLog('data')) console.log('[DATA]', ...args);
  },
  on: function(event, callback) {
    // No-op on client - winston compatibility
  }
};

console.info('Setting the logging threshold to: ' + get(Meteor, 'settings.public.loggingThreshold', 'info'));

// Attach to window for global access
if (typeof window === "object") {
  window.logger = logger;
}

// log() function
export function log() {
  if (window.console) {
    let logFn;
    if (Function.prototype.bind) {
      logFn = Function.prototype.bind.call(console.log, console);
    } else {
      logFn = function() {
        Function.prototype.apply.call(console.log, console, arguments);
      };
    }
    logFn.apply(this, arguments);
  }
}

// Attach log to window
if (typeof window === "object") {
  window.log = log;
}

// message utility object
export const message = {
  log: function(text) {
    if (shouldLog('info')) {
      console.log(...arguments);
    }
  },
  info: function(text) {
    if (shouldLog('info')) {
      console.info(...arguments);
    }
  },
  debug: function(text) {
    if (shouldLog('debug')) {
      console.log('[DEBUG]', ...arguments);
    }
  },
  warn: function(text) {
    if (shouldLog('warn')) {
      console.warn(...arguments);
    }
  },
  error: function(text) {
    if (shouldLog('error')) {
      console.error(...arguments);
    }
  }
};

export default { logger, log, message };
