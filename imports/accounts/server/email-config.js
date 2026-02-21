// imports/accounts/server/email-config.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Configure MAIL_URL from settings.json if not already set via environment variable
if (!process.env.MAIL_URL) {
  const smtpConfig = get(Meteor, 'settings.private.email.smtp', {});
  const host = get(smtpConfig, 'host', '');
  const port = get(smtpConfig, 'port', 587);
  const secure = get(smtpConfig, 'secure', false);
  const username = get(smtpConfig, 'username', '');
  const password = get(smtpConfig, 'password', '');

  if (host && username && username !== 'YOUR_SMTP_USERNAME' && password) {
    const protocol = secure ? 'smtps' : 'smtp';
    const encodedUser = encodeURIComponent(username);
    const encodedPass = encodeURIComponent(password);
    process.env.MAIL_URL = `${protocol}://${encodedUser}:${encodedPass}@${host}:${port}`;
    console.log('[email-config] MAIL_URL configured from settings.json');
  } else {
    console.warn('[email-config] Email not configured. Set MAIL_URL env var or configure settings.private.email.smtp');
  }
} else {
  console.log('[email-config] MAIL_URL already set via environment variable');
}
