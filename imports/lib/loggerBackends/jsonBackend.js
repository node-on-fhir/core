// imports/lib/loggerBackends/jsonBackend.js
// Production server backend: one JSON line per record to stdout.
// This IS the Splunk integration (UF/HEC ingest container stdout).
module.exports = {
  write: function(record) {
    if (record.msg === '◂') { return; }              // group-close sentinel
    try {
      process.stdout.write(JSON.stringify(record) + '\n');
    } catch (error) {
      try { process.stderr.write('[jsonBackend] serialization failed: ' + (error && error.message) + '\n'); } catch (ignore) {}
    }
  }
};
