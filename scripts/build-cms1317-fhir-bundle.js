#!/usr/bin/env node

// scripts/build-cms1317-fhir-bundle.js
//
// Assembles fqm-execution-ready measure bundles for the CMS1317 FHIR
// translations (faithful + PACIO variants):
//   Measure + Library (base64 CQL [+ ELM when available]) + vendored ValueSets
//
// ELM: drop compiled ELM JSON at
//   packages/quality-measures/specs/cms1317/fhir/elm/<LibraryName>.json
// (MADiE export route: MADiE's own exported bundle can be imported directly
// via qualityMeasures.importMeasureBundle — this builder covers the case
// where we receive bare ELM, e.g. from MITRE's translator.)
//
// Output: packages/quality-measures/specs/cms1317/fhir/bundles/*.json
//
// Usage: node scripts/build-cms1317-fhir-bundle.js

const fs = require('fs');
const path = require('path');

const FHIR_DIR = path.resolve(__dirname, '../packages/quality-measures/specs/cms1317/fhir');
const VS_DIR = path.resolve(__dirname, '../packages/quality-measures/specs/cms1317/valuesets');
const ELM_DIR = path.join(FHIR_DIR, 'elm');
const OUT_DIR = path.join(FHIR_DIR, 'bundles');

const VARIANTS = [
  {
    measureId: 'CMS1317-FHIR',
    title: 'CMS1317 Advance Care Planning (FHIR translation, faithful)',
    libraryName: 'CMS1317AdvancedCarePlanningFHIR',
    cqlFile: 'CMS1317AdvancedCarePlanningFHIR.cql',
    description: 'Faithful FHIR/QI-Core translation of the official CMS1317-v1.0.000 QDM eCQM (standard QDM->FHIR datatype mapping).'
  },
  {
    measureId: 'CMS1317-PACIO',
    title: 'CMS1317 Advance Care Planning (PACIO-extended)',
    libraryName: 'CMS1317AdvancedCarePlanningPACIO',
    cqlFile: 'CMS1317AdvancedCarePlanningPACIO.cql',
    description: 'PACIO-extended variant: document path additionally accepts ADI DocumentReferences; DNR path additionally accepts Z66 Conditions. The delta vs CMS1317-FHIR quantifies under-counting in PACIO systems.'
  }
];

const LIBRARY_VERSION = '0.1.000';

function buildMeasure(variant) {
  return {
    resourceType: 'Measure',
    id: variant.measureId,
    url: 'https://honeycomb.fhir.org/Measure/' + variant.measureId,
    version: LIBRARY_VERSION,
    name: variant.libraryName.replace('AdvancedCarePlanning', 'Measure'),
    title: variant.title,
    status: 'draft',
    experimental: true,
    description: variant.description,
    library: ['https://honeycomb.fhir.org/Library/' + variant.libraryName],
    scoring: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/measure-scoring',
        code: 'proportion',
        display: 'Proportion'
      }]
    },
    improvementNotation: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/measure-improvement-notation',
        code: 'increase'
      }]
    },
    group: [{
      population: [
        {
          code: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/measure-population', code: 'initial-population' }] },
          criteria: { language: 'text/cql-identifier', expression: 'Initial Population' }
        },
        {
          code: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/measure-population', code: 'denominator' }] },
          criteria: { language: 'text/cql-identifier', expression: 'Denominator' }
        },
        {
          code: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/measure-population', code: 'numerator' }] },
          criteria: { language: 'text/cql-identifier', expression: 'Numerator' }
        }
      ]
    }]
  };
}

function buildLibrary(variant, cqlText, elmJson) {
  const content = [{
    contentType: 'text/cql',
    data: Buffer.from(cqlText, 'utf8').toString('base64')
  }];

  if (elmJson) {
    content.push({
      contentType: 'application/elm+json',
      data: Buffer.from(JSON.stringify(elmJson), 'utf8').toString('base64')
    });
  }

  return {
    resourceType: 'Library',
    id: variant.libraryName,
    url: 'https://honeycomb.fhir.org/Library/' + variant.libraryName,
    version: LIBRARY_VERSION,
    name: variant.libraryName,
    status: 'draft',
    type: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/library-type',
        code: 'logic-library'
      }]
    },
    content: content
  };
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const valueSets = fs.readdirSync(VS_DIR)
    .filter(function(name) { return name.endsWith('.json'); })
    .map(function(name) { return JSON.parse(fs.readFileSync(path.join(VS_DIR, name), 'utf8')); });
  console.log('[build-cms1317-fhir-bundle] Loaded', valueSets.length, 'vendored ValueSets');

  let computableCount = 0;

  for (const variant of VARIANTS) {
    const cqlText = fs.readFileSync(path.join(FHIR_DIR, variant.cqlFile), 'utf8');

    let elmJson = null;
    const elmPath = path.join(ELM_DIR, variant.libraryName + '.json');
    if (fs.existsSync(elmPath)) {
      elmJson = JSON.parse(fs.readFileSync(elmPath, 'utf8'));
      computableCount++;
    }

    const bundle = {
      resourceType: 'Bundle',
      type: 'collection',
      entry: [
        { resource: buildMeasure(variant) },
        { resource: buildLibrary(variant, cqlText, elmJson) }
      ].concat(valueSets.map(function(vs) { return { resource: vs }; }))
    };

    const outPath = path.join(OUT_DIR, variant.measureId.toLowerCase() + '-bundle.json');
    fs.writeFileSync(outPath, JSON.stringify(bundle, null, 2));
    console.log('[build-cms1317-fhir-bundle]', variant.measureId, '->',
      path.relative(process.cwd(), outPath),
      elmJson ? '(CQL + ELM: computable)' : '(CQL only: NOT yet computable)');
  }

  if (computableCount < VARIANTS.length) {
    console.log('');
    console.log('[build-cms1317-fhir-bundle] ELM missing for ' + (VARIANTS.length - computableCount) + ' variant(s).');
    console.log('  To make the bundles computable by fqm-execution, compile the CQL and drop');
    console.log('  the ELM JSON at packages/quality-measures/specs/cms1317/fhir/elm/<LibraryName>.json:');
    console.log('    - MADiE (madie.cms.gov): paste the CQL, export, extract the ELM (or import');
    console.log('      the MADiE bundle directly via qualityMeasures.importMeasureBundle), or');
    console.log('    - hand the CQL to MITRE at the PACIO Thursday tech call.');
  }
}

main();
