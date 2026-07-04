// imports/lib/extensions/RandomExtensions.js
// Core replacement for Random.date from clinical:extended-api.
// Plain CJS, zero Meteor imports -- makeRandomDate is pure and testable with
// `node --test`; installRandomExtensions(Random) is wired at startup (Task 4).
const moment = require('moment');

function makeRandomDate(fractionFn, maxDateAgo, dateFormat, momentLib) {
  const start = momentLib(maxDateAgo || '1950-01-01');
  const now = momentLib();
  const totalDays = momentLib.duration(now.diff(start)).as('days');
  const randomDays = parseInt(fractionFn() * totalDays, 10);
  // note: subtract() mutates `now` in place — safe here, totalDays was computed above
  return now.subtract(randomDays, 'days').format(dateFormat || 'YYYY-MM-DD');
}

function installRandomExtensions(Random) {
  Random.date = function(maxDateAgo, dateFormat) {
    return makeRandomDate(function() { return Random.fraction(); }, maxDateAgo, dateFormat, moment);
  };
  return Random;
}

module.exports = { makeRandomDate, installRandomExtensions };
