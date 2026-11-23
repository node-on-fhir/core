// imports/api/email/parseMailUrl.js
//
// Redacting MAIL_URL parser for SMTP diagnostics. Returns connection facts
// only — credentials are flagged, never returned (the status method's
// response reaches the client). CJS: Meteor server AND node --test.

function parseMailUrlRedacted(mailUrl) {
  if (typeof mailUrl !== 'string' || !mailUrl.trim()) {
    return null;
  }
  var match = mailUrl.trim().match(/^(smtps?):\/\/(?:([^@/]+)@)?([^:/@\s]+)(?::(\d+))?/);
  if (!match) {
    return null;
  }
  return {
    protocol: match[1],
    host: match[3],
    port: match[4] || null,
    hasCredentials: !!match[2] && match[2].indexOf(':') !== -1
  };
}

module.exports = { parseMailUrlRedacted: parseMailUrlRedacted };
