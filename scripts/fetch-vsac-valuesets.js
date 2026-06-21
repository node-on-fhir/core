#!/usr/bin/env node

// scripts/fetch-vsac-valuesets.js
//
// Upgrades the vendored CMS1317 value set expansions
// (packages/quality-measures/specs/cms1317/valuesets/) from proxy/placeholder
// to OFFICIAL by fetching $expand from the VSAC FHIR terminology service.
//
// Usage:
//   UMLS_API_KEY=<your-umls-api-key> node scripts/fetch-vsac-valuesets.js
//
// Without the key, prints which sets are still proxy/placeholder and exits.
// VSAC FHIR API auth: HTTP Basic with username 'apikey' and the UMLS API key
// as the password (https://www.nlm.nih.gov/vsac/support/usingvsac/vsacfhirapi.html).

const fs = require('fs');
const path = require('path');

const VS_DIR = path.resolve(__dirname, '../packages/quality-measures/specs/cms1317/valuesets');
const VSAC_FHIR_BASE = 'https://cts.nlm.nih.gov/fhir/ValueSet/';
const PROVENANCE_EXT_URL = 'https://honeycomb.fhir.org/StructureDefinition/valueset-expansion-provenance';

const OIDS = [
  '2.16.840.1.113762.1.4.1170.45',  // Advance Care Planning Documentation
  '2.16.840.1.113762.1.4.1170.43',  // Advance Directive Documentation
  '2.16.840.1.113762.1.4.1170.31',  // Healthcare Agent and Power of Attorney Documentation
  '2.16.840.1.113762.1.4.1170.48',  // Portable Medical Order Documentation
  '2.16.840.1.113883.3.666.5.307'   // Encounter Inpatient
];

function provenanceOf(valueSet) {
  const ext = (valueSet.extension || []).find(function(e) { return e.url === PROVENANCE_EXT_URL; });
  return ext ? ext.valueString : 'unknown';
}

async function main() {
  const apiKey = process.env.UMLS_API_KEY;

  if (!apiKey) {
    console.log('[fetch-vsac-valuesets] No UMLS_API_KEY set. Current vendored expansion status:');
    for (const oid of OIDS) {
      const file = path.join(VS_DIR, 'ValueSet-' + oid + '.json');
      if (fs.existsSync(file)) {
        const valueSet = JSON.parse(fs.readFileSync(file, 'utf8'));
        console.log('  ' + oid + ' (' + valueSet.name + '): ' + provenanceOf(valueSet) +
          ', ' + (valueSet.expansion?.total ?? 0) + ' codes');
      } else {
        console.log('  ' + oid + ': MISSING vendored file');
      }
    }
    console.log('[fetch-vsac-valuesets] Run with UMLS_API_KEY=<key> to fetch official expansions.');
    return;
  }

  const auth = 'Basic ' + Buffer.from('apikey:' + apiKey).toString('base64');
  let upgraded = 0;

  for (const oid of OIDS) {
    const url = VSAC_FHIR_BASE + oid + '/$expand';
    console.log('[fetch-vsac-valuesets] Expanding', oid, '...');

    let response;
    try {
      response = await fetch(url, { headers: { Authorization: auth, Accept: 'application/fhir+json' } });
    } catch (error) {
      console.error('  FAILED (network):', error.message);
      continue;
    }

    if (!response.ok) {
      console.error('  FAILED: HTTP', response.status, response.status === 401 ? '(check UMLS_API_KEY)' : '');
      continue;
    }

    const expanded = await response.json();
    const contains = expanded?.expansion?.contains || [];
    if (contains.length === 0) {
      console.warn('  WARNING: empty expansion for', oid, '- keeping vendored version');
      continue;
    }

    const file = path.join(VS_DIR, 'ValueSet-' + oid + '.json');
    const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};

    const official = Object.assign({}, existing, expanded, {
      id: 'vsac-' + oid,
      identifier: [{ system: 'urn:ietf:rfc:3986', value: 'urn:oid:' + oid }],
      extension: [{ url: PROVENANCE_EXT_URL, valueString: 'official' }],
      description: 'Official VSAC expansion fetched ' + new Date().toISOString().slice(0, 10) + '.'
    });

    fs.writeFileSync(file, JSON.stringify(official, null, 2));
    console.log('  OK:', contains.length, 'codes ->', path.relative(process.cwd(), file));
    upgraded++;
  }

  console.log('[fetch-vsac-valuesets] Upgraded', upgraded, 'of', OIDS.length, 'value sets to official.');
  if (upgraded > 0) {
    console.log('[fetch-vsac-valuesets] Restart the app (or rerun pacio.loadConnectathonData) to upsert them.');
  }
}

main().catch(function(error) {
  console.error('[fetch-vsac-valuesets] FAILED:', error.message);
  process.exit(1);
});
