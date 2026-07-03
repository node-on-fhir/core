// imports/lib/loggerBackends/clientRelay.js
// Wraps a backend: passes every record through, and (when enabled) batches
// warn/error records to the server. Redaction already happened in the facade.
import { Meteor } from 'meteor/meteor';

export function withClientRelay(innerBackend) {
  let queue = [];
  let timer = null;
  function flush() {
    timer = null;
    if (queue.length === 0) { return; }
    const batch = queue.splice(0, 20);
    Meteor.call('logging.clientBatch', batch, function(error) {
      if (error) { console.warn('[clientRelay] ship failed:', error.reason); }
    });
  }
  return {
    write: function(record) {
      innerBackend.write(record);
      if (record.level === 'warn' || record.level === 'error') {
        queue.push(record);
        if (queue.length >= 20) { flush(); }
        else if (!timer) { timer = setTimeout(flush, 5000); }
      }
    }
  };
}
