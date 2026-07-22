// packages/pacio-core/server/methods/loadConnectathonData.js
//
// Server method to bulk load connectathon sample data into collections.
// Used for demo setup at the July 2026 CMS FHIR Connectathon (PACIO track).
//
// Two data sources, loaded in order:
//   1. The PACIO sample data depot (data/connectathon-july-2026-examples/
//      examples.ndjson, vendored from the connectathon-july-2026 branch of
//      github.com/paciowg/sample-data-fsh; refresh with
//      `npm run refresh-pacio-sample-data`)
//   2. Curated BSJ demo fixtures (data/2026-07-cms-connectathon/*.json) —
//      loaded last so the tuned demo resources win on _id collisions

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// PACIO sample data depot. Was loaded via Assets.getTextAsync(...examples.ndjson)
// in the Atmosphere package; NPM workflow packages have no Assets API, so the
// depot is vendored as a JSON array (examples.json, generated from the original
// examples.ndjson at migration time) and imported directly — the same
// Atmosphere-Asset → direct-import conversion used by reference-app.
import sampleResources from '../../data/connectathon-july-2026-examples/examples.json';

// Curated demo fixtures (authoritative overrides, loaded last)
import bsjPatient from '../../data/2026-07-cms-connectathon/bsj-patient.json';
import bsjTocComposition from '../../data/2026-07-cms-connectathon/bsj-toc-composition.json';
import bsjAdiDocumentReference from '../../data/2026-07-cms-connectathon/bsj-adi-documentreference.json';
import bsjPromis10QR from '../../data/2026-07-cms-connectathon/bsj-promis10-questionnaireresponse.json';
import bsjInpatientEncounter from '../../data/2026-07-cms-connectathon/bsj-inpatient-encounter.json';
import bsjZ66Condition from '../../data/2026-07-cms-connectathon/bsj-z66-condition.json';
import bsjAcpDiscussionObservation from '../../data/2026-07-cms-connectathon/bsj-acp-discussion-observation.json';
import bsjDnrServiceRequest from '../../data/2026-07-cms-connectathon/bsj-dnr-servicerequest.json';

// Home Health wound-management story (Vignette 1.a: HHA -> ED transition).
// Betsy's stage II right-hip pressure ulcer, declining Braden scores, wound
// pump / wheelchair devices, wound care plan, and discharge-care-plan goals.
import bsjPressureUlcerCondition from '../../data/2026-07-cms-connectathon/bsj-pressure-ulcer-condition.json';
import bsjBradenSocObservation from '../../data/2026-07-cms-connectathon/bsj-braden-soc-observation.json';
import bsjBradenDeclineObservation from '../../data/2026-07-cms-connectathon/bsj-braden-decline-observation.json';
import bsjWoundAssessmentObservation from '../../data/2026-07-cms-connectathon/bsj-wound-assessment-observation.json';
import bsjNpwtDevice from '../../data/2026-07-cms-connectathon/bsj-npwt-device.json';
import bsjWheelchairDevice from '../../data/2026-07-cms-connectathon/bsj-wheelchair-device.json';
import bsjWheelchairServiceRequest from '../../data/2026-07-cms-connectathon/bsj-wheelchair-servicerequest.json';
import bsjWoundCarePlan from '../../data/2026-07-cms-connectathon/bsj-wound-careplan.json';
import bsjGoalWedding from '../../data/2026-07-cms-connectathon/bsj-goal-wedding.json';
import bsjGoalFallSafety from '../../data/2026-07-cms-connectathon/bsj-goal-fall-safety.json';

// PFE PROMIS-10 Global Health Questionnaire (id: PROMIS-10-GlobalHealth,
// url: http://loinc.org/q/61577-3). This is the questionnaire PfeQuestionnairePage
// renders client-side; it is NOT in examples.json, so seed it here so the survey
// route (/survey/:id) and the structured-data-capture list can resolve it from the DB.
import promis10Questionnaire from '../../data/questionnaires/PROMIS-10-Questionnaire.json';

const log = (Meteor.Logger ? Meteor.Logger.for('loadConnectathonData') : console);

const CURATED_RESOURCES = [
  bsjPatient,
  bsjTocComposition,
  bsjAdiDocumentReference,
  bsjPromis10QR,
  bsjInpatientEncounter,
  bsjZ66Condition,
  bsjAcpDiscussionObservation,
  bsjDnrServiceRequest,
  bsjPressureUlcerCondition,
  bsjBradenSocObservation,
  bsjBradenDeclineObservation,
  bsjWoundAssessmentObservation,
  bsjNpwtDevice,
  bsjWheelchairDevice,
  bsjWheelchairServiceRequest,
  bsjWoundCarePlan,
  bsjGoalWedding,
  bsjGoalFallSafety,
  promis10Questionnaire
];

// resourceType -> collection name, where simple pluralization (+'s') is wrong
const PLURAL_OVERRIDES = {
  Library: 'Libraries',
  Binary: 'Binaries'
};

function collectionNameForResourceType(resourceType) {
  return PLURAL_OVERRIDES[resourceType] || (resourceType + 's');
}

// Betsy Smith-Johnson exists under two ids across the two data sources: the PACIO
// sample depot uses `patient-betsysmith-johnson01` (497 resources reference it —
// clinical notes, discharge summaries, TOC docs, labs, meds, conditions, contacts),
// while the curated demo fixtures use `bsj-patient-001` (the patient selected in the
// demo, and the one the ADI references). Unify everything onto the curated id so the
// selected patient surfaces her full clinical record. The curated bsjPatient still
// loads last and wins the resulting `_id` collision.
const PATIENT_ID_ALIASES = {
  'patient-betsysmith-johnson01': 'bsj-patient-001'
};

// Rewrite an alias id everywhere it appears in a resource — the resource's own id and
// every embedded reference (subject.reference, patient.reference, …). Returns a new
// object so the imported module data isn't mutated across repeated calls. The alias
// tokens are highly specific, so a whole-document string replace is safe.
function normalizeAliases(resource) {
  let json = JSON.stringify(resource);
  for (const alias of Object.keys(PATIENT_ID_ALIASES)) {
    if (json.indexOf(alias) !== -1) {
      json = json.split(alias).join(PATIENT_ID_ALIASES[alias]);
    }
  }
  return JSON.parse(json);
}

// Upsert one FHIR resource into its collection.
// Returns 'loaded', 'skipped', or throws.
async function upsertResource(resource, skippedTypes) {
  // Unify aliased patient ids (e.g. Betsy's two records) before storage
  resource = normalizeAliases(resource);

  const resourceType = resource.resourceType;
  const collectionName = collectionNameForResourceType(resourceType);
  const collection = get(global, 'Collections.' + collectionName);

  if (!collection) {
    skippedTypes[resourceType] = (skippedTypes[resourceType] || 0) + 1;
    return 'skipped';
  }

  if (!resource._id && resource.id) {
    resource._id = resource.id;
  }

  await collection.updateAsync(
    { _id: resource._id },
    { $set: resource },
    { upsert: true }
  );
  return 'loaded';
}

/**
 * Load all connectathon sample data into collections.
 * Upserts to avoid duplicates on repeated calls.
 */
Meteor.ServerMethods.define('pacio.loadConnectathonData', {
  description: 'Bulk-load the July 2026 CMS Connectathon PACIO sample data into collections',
  phi: true
}, async function(params, context) {
    context.log.info('loadConnectathonData Loading July 2026 CMS Connectathon sample data');

    let loadedCount = 0;
    let skippedCount = 0;
    const errors = [];
    const skippedTypes = {};
    const byResourceType = {};

    // 1. PACIO sample data depot (vendored examples.json — array of FHIR
    //    resources, converted from the original examples.ndjson)
    if (Array.isArray(sampleResources)) {
      for (let i = 0; i < sampleResources.length; i++) {
        const resource = sampleResources[i];
        if (!resource || !resource.resourceType) {
          continue;
        }

        try {
          const outcome = await upsertResource(resource, skippedTypes);
          if (outcome === 'loaded') {
            loadedCount++;
            byResourceType[resource.resourceType] = (byResourceType[resource.resourceType] || 0) + 1;
          } else {
            skippedCount++;
          }
        } catch (error) {
          errors.push(resource.resourceType + '/' + resource._id + ': ' + error.message);
        }

        if (loadedCount > 0 && loadedCount % 100 === 0) {
          console.log('[pacio.loadConnectathonData] ...', loadedCount, 'resources loaded');
        }
      }
    } else {
      const msg = 'Sample data depot (examples.json) did not import as an array';
      console.warn('[pacio.loadConnectathonData]', msg);
      errors.push(msg);
    }

    // 2. Curated demo fixtures — loaded last so they win on _id collisions
    for (const resource of CURATED_RESOURCES) {
      try {
        const outcome = await upsertResource(resource, skippedTypes);
        if (outcome === 'loaded') {
          loadedCount++;
          byResourceType[resource.resourceType] = (byResourceType[resource.resourceType] || 0) + 1;
          console.log('[pacio.loadConnectathonData] Loaded curated', resource.resourceType + '/' + resource._id);
        } else {
          skippedCount++;
        }
      } catch (error) {
        errors.push(resource.resourceType + '/' + resource._id + ': ' + error.message);
      }
    }

    // 3. Remove any orphaned alias Patient records left by earlier loads
    //    (their references have all been re-pointed at the canonical id above).
    const Patients = get(global, 'Collections.Patients');
    if (Patients) {
      for (const aliasId of Object.keys(PATIENT_ID_ALIASES)) {
        const removed = await Patients.removeAsync({ _id: aliasId });
        if (removed) {
          log.debug('Removed orphaned alias Patient:', { aliasId });
        }
      }
    }

    if (Object.keys(skippedTypes).length > 0) {
      console.warn('[pacio.loadConnectathonData] Skipped resource types with no registered collection:', JSON.stringify(skippedTypes));
    }
    console.log('[pacio.loadConnectathonData] Done:', loadedCount, 'loaded,', skippedCount, 'skipped,', errors.length, 'errors');

    return {
      loadedCount: loadedCount,
      skippedCount: skippedCount,
      skippedTypes: skippedTypes,
      byResourceType: byResourceType,
      errors: errors
    };
});
