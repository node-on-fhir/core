// imports/accounts/lib/ageGate.js
//
// Pure age-gate math for the settings-gated COPPA signup check
// (settings.public.accounts.requireAgeGate). CJS on purpose: consumed by
// Meteor client AND server AND node --test (root package.json has no
// "type":"module", so .js must be CJS to run under node --test).

var MIN_AGE_YEARS = 13;
var MAX_PLAUSIBLE_AGE_YEARS = 130;

function parseBirthDate(birthDateString) {
  if (typeof birthDateString !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(birthDateString)) {
    return null;
  }
  var parsed = new Date(birthDateString + 'T00:00:00Z');
  if (isNaN(parsed.getTime())) {
    return null;
  }
  // Reject calendar rollover (e.g. 2000-13-45 silently becoming a later date)
  if (parsed.toISOString().slice(0, 10) !== birthDateString) {
    return null;
  }
  return parsed;
}

function ageInYears(birthDateString, now) {
  var birth = parseBirthDate(birthDateString);
  if (!birth) {
    return null;
  }
  var reference = now instanceof Date ? now : new Date();
  var age = reference.getUTCFullYear() - birth.getUTCFullYear();
  var monthDiff = reference.getUTCMonth() - birth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && reference.getUTCDate() < birth.getUTCDate())) {
    age = age - 1;
  }
  return age;
}

function meetsMinimumAge(birthDateString, now) {
  var age = ageInYears(birthDateString, now);
  if (age === null || age < 0 || age > MAX_PLAUSIBLE_AGE_YEARS) {
    return false;
  }
  return age >= MIN_AGE_YEARS;
}

module.exports = {
  MIN_AGE_YEARS: MIN_AGE_YEARS,
  parseBirthDate: parseBirthDate,
  ageInYears: ageInYears,
  meetsMinimumAge: meetsMinimumAge
};
