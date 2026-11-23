#!/usr/bin/env node
// scripts/audit-desktop-settings.js
//
// Pre-build gate for desktop (Electron) extensions. The DMG bundles the whole
// Meteor server INCLUDING its settings JSON, so settings.private.* is NOT
// private in a desktop app — any live credential here ships to every customer.
// Scans extensions/desktop-*/settings/*.json and extensions/desktop-*/package.json
// (npm scripts have carried inline keys before). Exit 1 on findings.
//
// CJS on purpose: run by node directly AND imported by node --test.

const fs = require('fs');
const path = require('path');

const SECRET_PATTERNS = [
  { name: 'Google API key',           regex: /AIza[0-9A-Za-z_\-]{35}/ },
  { name: 'Stripe live secret',       regex: /sk_live_[0-9A-Za-z]{10,}/ },
  { name: 'Stripe live publishable',  regex: /pk_live_[0-9A-Za-z]{10,}/ },
  { name: 'Stripe webhook secret',    regex: /whsec_[0-9A-Za-z]{10,}/ },
  { name: 'Stripe restricted key',    regex: /rk_live_[0-9A-Za-z]{10,}/ },
  { name: 'Private key block',        regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: 'GitHub token',             regex: /gh[pousr]_[0-9A-Za-z]{20,}/ },
  { name: 'Slack token',              regex: /xox[baprs]-[0-9A-Za-z\-]{10,}/ },
  { name: 'AWS access key id',        regex: /AKIA[0-9A-Z]{16}/ },
  { name: 'SMTP URL with credentials', regex: /smtps?:\/\/[^\s"@/]+:[^\s"@/]+@/ }
];

function scanText(text, sourceLabel, findings) {
  SECRET_PATTERNS.forEach(function(pattern) {
    const match = text.match(pattern.regex);
    if (match) {
      findings.push({
        source: sourceLabel,
        pattern: pattern.name,
        preview: match[0].slice(0, 6) + '… (' + match[0].length + ' chars)'
      });
    }
  });
}

function auditDesktopExtensions(rootDir) {
  const findings = [];
  const extensionsDir = path.join(rootDir, 'extensions');
  if (!fs.existsSync(extensionsDir)) {
    return findings; // CI checkouts have no extensions/ — clean by definition
  }
  fs.readdirSync(extensionsDir)
    .filter(function(name) { return name.indexOf('desktop-') === 0; })
    .forEach(function(name) {
      const pkgPath = path.join(extensionsDir, name, 'package.json');
      if (fs.existsSync(pkgPath)) {
        scanText(fs.readFileSync(pkgPath, 'utf8'), name + '/package.json', findings);
      }
      const settingsDir = path.join(extensionsDir, name, 'settings');
      if (fs.existsSync(settingsDir)) {
        fs.readdirSync(settingsDir)
          .filter(function(f) { return f.slice(-5) === '.json'; })
          .forEach(function(f) {
            scanText(fs.readFileSync(path.join(settingsDir, f), 'utf8'),
              name + '/settings/' + f, findings);
          });
      }
    });
  return findings;
}

module.exports = { auditDesktopExtensions, scanText, SECRET_PATTERNS };

if (require.main === module) {
  const findings = auditDesktopExtensions(process.cwd());
  if (findings.length === 0) {
    console.log('[audit-desktop-settings] Clean: no live-looking credentials in desktop extension settings or build scripts.');
    process.exit(0);
  }
  console.error('[audit-desktop-settings] FINDINGS (' + findings.length + '):');
  findings.forEach(function(f) {
    console.error('  - ' + f.source + ': ' + f.pattern + ' ' + f.preview);
  });
  console.error('[audit-desktop-settings] Remove or blank these before building a DMG — bundled settings ship to every customer.');
  process.exit(1);
}
