#!/usr/bin/env node

// scripts/fetch-pacio-sample-data.js
//
// Downloads the PACIO sample data depot (connectathon-july-2026 branch of
// github.com/paciowg/sample-data-fsh, built by the FHIR IG publisher) and
// vendors it into packages/pacio-core for pacio.loadConnectathonData.
//
// Outputs:
//   packages/pacio-core/data/connectathon-july-2026-examples/*.json   (per-file, human-inspectable)
//   packages/pacio-core/data/connectathon-july-2026-examples/examples.ndjson  (what the app loads)
//
// Usage:
//   node scripts/fetch-pacio-sample-data.js                       # fetch + write, keep legacy data
//   node scripts/fetch-pacio-sample-data.js --replace-legacy      # also delete data/PACIO-examples/
//   node scripts/fetch-pacio-sample-data.js --include-conformance # keep ValueSet/CodeSystem/StructureDefinition

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const EXAMPLES_ZIP_URL = 'https://build.fhir.org/ig/paciowg/sample-data-fsh/branches/connectathon-july-2026/examples.json.zip';

const REPO_ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(REPO_ROOT, 'packages/pacio-core/data/connectathon-july-2026-examples');
const LEGACY_DIR = path.join(REPO_ROOT, 'packages/pacio-core/data/PACIO-examples');

const REPLACE_LEGACY = process.argv.includes('--replace-legacy');
const INCLUDE_CONFORMANCE = process.argv.includes('--include-conformance');

// IG infrastructure / conformance resources we skip by default.
// Questionnaires are instance-adjacent (needed for PFE workflows) and always kept.
const CONFORMANCE_TYPES = [
  'ImplementationGuide',
  'StructureDefinition',
  'CodeSystem',
  'ValueSet',
  'SearchParameter',
  'CapabilityStatement',
  'OperationDefinition'
];

async function main() {
  console.log('[fetch-pacio-sample-data] Downloading', EXAMPLES_ZIP_URL);

  const response = await fetch(EXAMPLES_ZIP_URL);
  if (!response.ok) {
    throw new Error('Download failed: HTTP ' + response.status);
  }
  const zipBuffer = Buffer.from(await response.arrayBuffer());
  console.log('[fetch-pacio-sample-data] Downloaded', (zipBuffer.length / 1024 / 1024).toFixed(1), 'MB');

  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pacio-sample-data-'));
  const zipPath = path.join(workDir, 'examples.json.zip');
  fs.writeFileSync(zipPath, zipBuffer);
  execFileSync('unzip', ['-o', '-q', zipPath, '-d', workDir]);

  const sourceFiles = fs.readdirSync(workDir).filter(function(name) {
    return name.endsWith('.json');
  });
  console.log('[fetch-pacio-sample-data] Unzipped', sourceFiles.length, 'JSON files');

  // Reset output dir
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const ndjsonLines = [];
  const byResourceType = {};
  const skippedTypes = {};
  let parseErrors = 0;

  for (const name of sourceFiles) {
    let resource;
    try {
      resource = JSON.parse(fs.readFileSync(path.join(workDir, name), 'utf8'));
    } catch (error) {
      console.warn('[fetch-pacio-sample-data] Parse error in', name, '-', error.message);
      parseErrors++;
      continue;
    }

    const resourceType = resource.resourceType;
    if (!resourceType) {
      console.warn('[fetch-pacio-sample-data] No resourceType in', name, '- skipping');
      parseErrors++;
      continue;
    }

    if (!INCLUDE_CONFORMANCE && CONFORMANCE_TYPES.includes(resourceType)) {
      skippedTypes[resourceType] = (skippedTypes[resourceType] || 0) + 1;
      continue;
    }

    fs.writeFileSync(path.join(OUTPUT_DIR, name), JSON.stringify(resource, null, 2));
    ndjsonLines.push(JSON.stringify(resource));
    byResourceType[resourceType] = (byResourceType[resourceType] || 0) + 1;
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, 'examples.ndjson'), ndjsonLines.join('\n') + '\n');

  console.log('[fetch-pacio-sample-data] Wrote', ndjsonLines.length, 'resources to', path.relative(REPO_ROOT, OUTPUT_DIR));
  console.log('[fetch-pacio-sample-data] By resourceType:');
  Object.keys(byResourceType).sort().forEach(function(type) {
    console.log('  ' + type + ': ' + byResourceType[type]);
  });
  if (Object.keys(skippedTypes).length > 0) {
    console.log('[fetch-pacio-sample-data] Skipped conformance resources (use --include-conformance to keep):');
    Object.keys(skippedTypes).sort().forEach(function(type) {
      console.log('  ' + type + ': ' + skippedTypes[type]);
    });
  }
  if (parseErrors > 0) {
    console.warn('[fetch-pacio-sample-data]', parseErrors, 'files failed to parse');
  }

  if (REPLACE_LEGACY) {
    if (fs.existsSync(LEGACY_DIR)) {
      const legacyCount = fs.readdirSync(LEGACY_DIR).length;
      fs.rmSync(LEGACY_DIR, { recursive: true, force: true });
      console.log('[fetch-pacio-sample-data] Deleted legacy', path.relative(REPO_ROOT, LEGACY_DIR), '(' + legacyCount + ' files)');
    } else {
      console.log('[fetch-pacio-sample-data] Legacy dir already gone:', path.relative(REPO_ROOT, LEGACY_DIR));
    }
  } else {
    console.log('[fetch-pacio-sample-data] Legacy data kept; rerun with --replace-legacy to delete', path.relative(REPO_ROOT, LEGACY_DIR));
  }

  fs.rmSync(workDir, { recursive: true, force: true });
}

main().catch(function(error) {
  console.error('[fetch-pacio-sample-data] FAILED:', error.message);
  process.exit(1);
});
