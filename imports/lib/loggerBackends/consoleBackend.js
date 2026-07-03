// imports/lib/loggerBackends/consoleBackend.js
// Dev/client backend: renders LogRecords via native console for real
// browser group nesting and formatting. Records marked phi carry only the
// redaction stub by construction (see Logger.js).
const METHOD = { error: 'error', warn: 'warn', info: 'log', verbose: 'log', debug: 'debug', trace: 'debug' };

module.exports = {
  write: function(record) {
    if (record.msg === '◂') { console.groupEnd(); return; }
    const prefix = '[' + record.module + ']';
    if (record.msg && record.msg.indexOf('▸ ') === 0 && typeof console.group === 'function') {
      console.group(prefix + ' ' + record.msg.slice(2));
      return;
    }
    const args = [prefix + ' ' + record.msg];
    if (record.data !== undefined) { args.push(record.data); }
    (console[METHOD[record.level]] || console.log).apply(console, args);
  }
};
