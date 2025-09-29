// server/SyncedCron.js
// Modified version of quave:synced-cron for controlled startup

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Random } from 'meteor/random';
import { check, Match } from 'meteor/check';

// Import Later.js for scheduling
import Later from '@breejs/later';

// A package for running jobs synchronized across multiple processes
global.SyncedCron = {
  _entries: {},
  running: false,
  processId: Random.id(),
  options: {
    //Log job run details to console
    log: true,

    logger: null,

    //Name of collection to use for synchronisation and logging
    collectionName: 'cronHistory',
    collectionOptions: {},

    //Default to using localTime
    utc: false,

    //TTL in seconds for history records in collection to expire
    //NOTE: Unset to remove expiry but ensure you remove the index from
    //mongo by hand
    collectionTTL: 172800,
  },
  config: function (opts) {
    this.options = Object.assign({}, this.options, opts);
  },
};

/*
  Logger factory function. Takes a prefix string and options object
  and uses an injected `logger` if provided, else falls back to
  Meteor's `Log` package.

  Will send a log object to the injected logger, on the following form:

    message: String
    level: String (info, warn, error, debug)
    tag: 'SyncedCron'
*/
function createLogger(prefix) {
  check(prefix, String);

  // Return noop if logging is disabled.
  if (SyncedCron.options.log === false) {
    return function () {};
  }

  return function (level, message) {
    check(level, Match.OneOf('info', 'error', 'warn', 'debug'));
    check(message, String);

    const logger = SyncedCron.options && SyncedCron.options.logger;

    if (logger && typeof logger === 'function') {
      logger({
        level: level,
        message: message,
        tag: prefix,
      });
    } else {
      console.log(`${prefix}: ${message}`);
    }
  };
}

let log;

const partial =
  (func, ...boundArgs) =>
  (...remainingArgs) =>
    func(...boundArgs, ...remainingArgs);

// Initialize SyncedCron (but don't auto-start)
Meteor.startup(async function syncedCronStartup() {
  // Prevent duplicate initialization
  if (SyncedCron._initialized) {
    console.log('SyncedCron: Already initialized, skipping duplicate startup');
    return;
  }
  SyncedCron._initialized = true;
  
  const options = SyncedCron.options;

  log = createLogger('SyncedCron');

  ['info', 'warn', 'error', 'debug'].forEach(function (level) {
    log[level] = partial(log, level);
  });

  // Don't allow TTL less than 5 minutes so we don't break synchronization
  const minTTL = 300;

  // Use UTC or localtime for evaluating schedules
  if (options.utc) Later.date.UTC();
  else Later.date.localTime();

  // collection holding the job history records
  // Check if collection already exists to prevent duplicate initialization
  if (!SyncedCron._collection) {
    SyncedCron._collection = new Mongo.Collection(
      options.collectionName,
      options.collectionOptions
    );
    
    // Create indexes only for new collection
    await SyncedCron._collection.createIndexAsync(
      { intendedAt: 1, name: 1 },
      { unique: true }
    );

    // Add TTL index if configured and not disabled
    if (options.collectionTTL) {
      const expiry = Math.max(minTTL, options.collectionTTL);
      await SyncedCron._collection.createIndexAsync(
        { startedAt: 1 },
        { expireAfterSeconds: expiry }
      );
    }
  }

  log.info('SyncedCron initialized (not started)');
});

// Schedule a job
const scheduleEntry = function (entry) {
  const schedule = entry.schedule(Later.parse);
  entry._timer = SyncedCron._laterSetInterval(
    SyncedCron._entryWrapper(entry),
    schedule
  );

  log.info('SyncedCron: scheduled "' + entry.name + '" next run ' +
    Later.schedule(schedule).next(1));
};

// Add a new job
SyncedCron.add = function (entry) {
  check(
    entry,
    Match.ObjectIncluding({
      name: String,
      schedule: Function,
      job: Function,
    })
  );

  // Check for unique name
  if (SyncedCron._entries[entry.name]) {
    throw new Error('SyncedCron: Entry "' + entry.name + '" already exists');
  }

  SyncedCron._entries[entry.name] = entry;

  if (SyncedCron.running) {
    scheduleEntry(entry);
  }
};

// Start all jobs
SyncedCron.start = function () {
  if (SyncedCron.running) {
    log.warn('SyncedCron: start() called while already running');
    return;
  }

  log.info('SyncedCron: Starting...');
  SyncedCron.running = true;

  Object.keys(SyncedCron._entries).forEach(function (name) {
    scheduleEntry(SyncedCron._entries[name]);
  });
};

// Pause all jobs
SyncedCron.pause = function () {
  if (!SyncedCron.running) {
    log.warn('SyncedCron: pause() called while not running');
    return;
  }

  log.info('SyncedCron: Pausing...');
  SyncedCron.running = false;

  Object.keys(SyncedCron._entries).forEach(function (name) {
    const entry = SyncedCron._entries[name];
    if (entry._timer) {
      entry._timer.clear();
      entry._timer = undefined;
    }
  });
};

// Stop and remove all jobs
SyncedCron.stop = function () {
  log.info('SyncedCron: Stopping...');
  SyncedCron.pause();
  SyncedCron._entries = {};
};

// Remove a specific job
SyncedCron.remove = function (name) {
  check(name, String);

  if (!SyncedCron._entries[name]) {
    throw new Error('SyncedCron: Cannot remove entry "' + name + '", not found');
  }

  const entry = SyncedCron._entries[name];
  if (entry._timer) {
    entry._timer.clear();
  }

  delete SyncedCron._entries[name];
  log.info('SyncedCron: Removed entry "' + name + '"');
};

// Run a job now
SyncedCron.run = function (name) {
  check(name, String);

  const entry = SyncedCron._entries[name];
  if (!entry) {
    throw new Error('SyncedCron: Cannot run entry "' + name + '", not found');
  }

  log.info('SyncedCron: Running job "' + name + '" now');
  return SyncedCron._entryWrapper(entry)();
};

// Get next run times
SyncedCron.nextScheduledAtDate = function (name) {
  check(name, String);

  const entry = SyncedCron._entries[name];
  if (!entry) {
    throw new Error('SyncedCron: Cannot find entry "' + name + '"');
  }

  const schedule = entry.schedule(Later.parse);
  return Later.schedule(schedule).next(1);
};

// Wrapper for job execution
SyncedCron._entryWrapper = function (entry) {
  return async function () {
    const startedAt = new Date();
    const intendedAt = new Date();
    intendedAt.setSeconds(0);
    intendedAt.setMilliseconds(0);

    const jobHistory = {
      intendedAt: intendedAt,
      name: entry.name,
      startedAt: startedAt,
      runId: SyncedCron.processId,
    };

    let finished = false;

    try {
      // Try to insert the job history record
      const result = await SyncedCron._collection.insertAsync(jobHistory);
      log.info('SyncedCron: Running job "' + entry.name + '"');

      try {
        // Run the job
        await entry.job.call(entry);
        finished = true;

        // Update the history record
        await SyncedCron._collection.updateAsync(result, {
          $set: {
            finishedAt: new Date(),
            result: 'success'
          }
        });

        log.info('SyncedCron: Job "' + entry.name + '" completed successfully');
      } catch (error) {
        finished = true;
        log.error('SyncedCron: Job "' + entry.name + '" failed: ' + error.message);

        // Update the history record with error
        await SyncedCron._collection.updateAsync(result, {
          $set: {
            finishedAt: new Date(),
            result: 'error',
            error: error.message
          }
        });
      }
    } catch (error) {
      // Job is already running or other database error
      if (error.code === 11000) {
        log.info('SyncedCron: Job "' + entry.name + '" is already running');
      } else {
        log.error('SyncedCron: Error creating job history for "' + entry.name + '": ' + error.message);
      }
    }
  };
};

// Custom interval setter using Later.js
SyncedCron._laterSetInterval = function (fn, schedule) {
  return Later.setInterval(fn, schedule);
};

// Graceful shutdown handling
if (Meteor.isServer) {
  process.on('SIGTERM', function() {
    if (SyncedCron.running) {
      log.info('SyncedCron: Initiating graceful shutdown (SIGTERM)');
      log.info('SyncedCron: Received SIGTERM signal - cleaning up running jobs');
      SyncedCron.stop();
    }
  });
  
  process.on('SIGINT', function() {
    if (SyncedCron.running) {
      log.info('SyncedCron: Initiating graceful shutdown (SIGINT)');
      SyncedCron.stop();
    }
    process.exit(0);
  });
}

export { SyncedCron };