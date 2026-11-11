// imports/api/email/methods.js
//
// SMTP diagnostics: status (redacted) + authenticated test send. Lets an
// operator verify the homepage deploy's SMTP, and a desktop user verify
// their own machine can reach an outbound mail server before relying on
// verification/launch emails. Desktop builds never bundle MAIL_URL creds
// (audit:desktop-settings enforces) — users supply their own via env.

import { Meteor } from 'meteor/meteor';
import { Email } from 'meteor/email';
import { get } from 'lodash';
import { parseMailUrlRedacted } from './parseMailUrl';

const log = (Meteor.Logger ? Meteor.Logger.for('email') : console);

Meteor.ServerMethods.define('email.smtpStatus', {
  description: 'Redacted SMTP configuration status (host/port/protocol only — never credentials).',
  requireAuth: true
}, async function(params, context) {
  const mailUrl = process.env.MAIL_URL || '';
  const parsed = parseMailUrlRedacted(mailUrl);
  if (!parsed) {
    log.info && log.info('SMTP not configured (no MAIL_URL)');
    return { configured: false, host: null, port: null, protocol: null };
  }
  return { configured: true, host: parsed.host, port: parsed.port, protocol: parsed.protocol };
});

Meteor.ServerMethods.define('email.sendTestEmail', {
  description: 'Send a test email to verify SMTP connectivity. Returns { ok, error }.',
  requireAuth: true,
  schemaObject: {
    type: 'object',
    properties: { to: { type: 'string' } },
    required: ['to']
  }
}, async function(params, context) {
  const to = get(params, 'to', '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    throw new Meteor.Error('invalid-email', 'A valid destination address is required');
  }
  if (!process.env.MAIL_URL) {
    return { ok: false, error: 'MAIL_URL is not set — SMTP is not configured on this server.' };
  }
  const siteName = get(Meteor, 'settings.public.appName', 'Honeycomb');
  const from = get(Meteor, 'settings.private.accounts.emailFrom', 'noreply@honeycomb.app');
  try {
    Email.send({
      to: to,
      from: siteName + ' <' + from + '>',
      subject: 'SMTP test from ' + siteName,
      text: 'This is a test message confirming outbound email works from this ' + siteName + ' instance.'
    });
    log.info && log.info('SMTP test email sent', { to: to });
    return { ok: true, error: null };
  } catch (err) {
    log.warn && log.warn('SMTP test email failed', { message: err.message });
    return { ok: false, error: err.message };
  }
});
