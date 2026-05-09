// server/publications/selectedPatient.js
//
// Patient-scoped publications. Unlike autopublish.* (which requires
// autopublishSubscriptions=true and passes the full query from the client),
// these publications are ALWAYS registered and accept only a patientId
// string. The server builds the query via FhirUtilities.addPatientFilterToQuery().
//
// Role-based resolution:
//   - PHR / patient role  → forces user.patientId (ignores client param)
//   - Practitioner / admin → uses client-supplied patientId

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

import { FhirUtilities } from '/imports/lib/FhirUtilities';

// ── Collection imports (same set as autopublish.js) ──────────────────────

import { ActivityDefinitions } from '/imports/lib/schemas/SimpleSchemas/ActivityDefinitions';
import { AllergyIntolerances } from '/imports/lib/schemas/SimpleSchemas/AllergyIntolerances';
import { Appointments } from '/imports/lib/schemas/SimpleSchemas/Appointments';
import { AuditEvents } from '/imports/lib/schemas/SimpleSchemas/AuditEvents';
import { BodyStructures } from '/imports/lib/schemas/SimpleSchemas/BodyStructures';
import { Bundles } from '/imports/lib/schemas/SimpleSchemas/Bundles';
import { ClinicalImpressions } from '/imports/lib/schemas/SimpleSchemas/ClinicalImpressions';
import { CarePlans } from '/imports/lib/schemas/SimpleSchemas/CarePlans';
import { CareTeams } from '/imports/lib/schemas/SimpleSchemas/CareTeams';
import { Communications } from '/imports/lib/schemas/SimpleSchemas/Communications';
import { Compositions } from '/imports/lib/schemas/SimpleSchemas/Compositions';
import { Conditions } from '/imports/lib/schemas/SimpleSchemas/Conditions';
import { Consents } from '/imports/lib/schemas/SimpleSchemas/Consents';
import { Devices } from '/imports/lib/schemas/SimpleSchemas/Devices';
import { DiagnosticReports } from '/imports/lib/schemas/SimpleSchemas/DiagnosticReports';
import { DocumentReferences } from '/imports/lib/schemas/SimpleSchemas/DocumentReferences';
import { Encounters } from '/imports/lib/schemas/SimpleSchemas/Encounters';
import { ExplanationOfBenefits } from '/imports/lib/schemas/SimpleSchemas/ExplanationOfBenefits';
import { Goals } from '/imports/lib/schemas/SimpleSchemas/Goals';
import { Groups } from '/imports/lib/schemas/SimpleSchemas/Groups';
import { Immunizations } from '/imports/lib/schemas/SimpleSchemas/Immunizations';
import { ImagingStudies } from '/imports/lib/schemas/SimpleSchemas/ImagingStudies';
import { Lists } from '/imports/lib/schemas/SimpleSchemas/Lists';
import { Locations } from '/imports/lib/schemas/SimpleSchemas/Locations';
import { Medications } from '/imports/lib/schemas/SimpleSchemas/Medications';
import { MedicationAdministrations } from '/imports/lib/schemas/SimpleSchemas/MedicationAdministrations';
import { MedicationRequests } from '/imports/lib/schemas/SimpleSchemas/MedicationRequests';
import { MedicationStatements } from '/imports/lib/schemas/SimpleSchemas/MedicationStatements';
import { Measures } from '/imports/lib/schemas/SimpleSchemas/Measures';
import { MeasureReports } from '/imports/lib/schemas/SimpleSchemas/MeasureReports';
import { Medias } from '/imports/lib/schemas/SimpleSchemas/Medias';
import { MessageHeaders } from '/imports/lib/schemas/SimpleSchemas/MessageHeaders';
import { NutritionIntakes } from '/imports/lib/schemas/SimpleSchemas/NutritionIntakes';
import { NutritionOrders } from '/imports/lib/schemas/SimpleSchemas/NutritionOrders';
import { Observations } from '/imports/lib/schemas/SimpleSchemas/Observations';
import { Organizations } from '/imports/lib/schemas/SimpleSchemas/Organizations';
import { PlanDefinitions } from '/imports/lib/schemas/SimpleSchemas/PlanDefinitions';
import { Practitioners } from '/imports/lib/schemas/SimpleSchemas/Practitioners';
import { PractitionerRoles } from '/imports/lib/schemas/SimpleSchemas/PractitionerRoles';
import { Procedures } from '/imports/lib/schemas/SimpleSchemas/Procedures';
import { Questionnaires } from '/imports/lib/schemas/SimpleSchemas/Questionnaires';
import { QuestionnaireResponses } from '/imports/lib/schemas/SimpleSchemas/QuestionnaireResponses';
import { ResearchStudies } from '/imports/lib/schemas/SimpleSchemas/ResearchStudies';
import { ResearchSubjects } from '/imports/lib/schemas/SimpleSchemas/ResearchSubjects';
import { RiskAssessments } from '/imports/lib/schemas/SimpleSchemas/RiskAssessments';
import { Schedules } from '/imports/lib/schemas/SimpleSchemas/Schedules';
import { ServiceRequests } from '/imports/lib/schemas/SimpleSchemas/ServiceRequests';
import { MolecularSequences } from '/imports/lib/schemas/SimpleSchemas/MolecularSequences';
import { Specimens } from '/imports/lib/schemas/SimpleSchemas/Specimens';
import { SupplyDeliveries } from '/imports/lib/schemas/SimpleSchemas/SupplyDeliveries';
import { SupplyRequests } from '/imports/lib/schemas/SimpleSchemas/SupplyRequests';
import { Tasks } from '/imports/lib/schemas/SimpleSchemas/Tasks';
import { FamilyMemberHistories } from '/imports/lib/schemas/SimpleSchemas/FamilyMemberHistories';

// ── Collections map ──────────────────────────────────────────────────────

const collectionsMap = {
  'ActivityDefinitions': ActivityDefinitions,
  'AllergyIntolerances': AllergyIntolerances,
  'Appointments': Appointments,
  'AuditEvents': AuditEvents,
  'BodyStructures': BodyStructures,
  'Bundles': Bundles,
  'CarePlans': CarePlans,
  'CareTeams': CareTeams,
  'ClinicalImpressions': ClinicalImpressions,
  'Communications': Communications,
  'Compositions': Compositions,
  'Conditions': Conditions,
  'Consents': Consents,
  'Devices': Devices,
  'DiagnosticReports': DiagnosticReports,
  'DocumentReferences': DocumentReferences,
  'Encounters': Encounters,
  'ExplanationOfBenefits': ExplanationOfBenefits,
  'FamilyMemberHistories': FamilyMemberHistories,
  'Goals': Goals,
  'Groups': Groups,
  'Immunizations': Immunizations,
  'ImagingStudies': ImagingStudies,
  'Lists': Lists,
  'Locations': Locations,
  'Medications': Medications,
  'MedicationAdministrations': MedicationAdministrations,
  'MedicationRequests': MedicationRequests,
  'MedicationStatements': MedicationStatements,
  'Measures': Measures,
  'MeasureReports': MeasureReports,
  'Medias': Medias,
  'MessageHeaders': MessageHeaders,
  'NutritionIntakes': NutritionIntakes,
  'NutritionOrders': NutritionOrders,
  'Observations': Observations,
  'Organizations': Organizations,
  'PlanDefinitions': PlanDefinitions,
  'Practitioners': Practitioners,
  'PractitionerRoles': PractitionerRoles,
  'Procedures': Procedures,
  'Questionnaires': Questionnaires,
  'QuestionnaireResponses': QuestionnaireResponses,
  'ResearchStudies': ResearchStudies,
  'ResearchSubjects': ResearchSubjects,
  'RiskAssessments': RiskAssessments,
  'Schedules': Schedules,
  'ServiceRequests': ServiceRequests,
  'MolecularSequences': MolecularSequences,
  'Specimens': Specimens,
  'SupplyDeliveries': SupplyDeliveries,
  'SupplyRequests': SupplyRequests,
  'Tasks': Tasks
};

// Resources that use non-standard patient reference paths.
// FhirUtilities.addPatientFilterToQuery already covers patient.reference
// and subject.reference, but some resources need additional transforms.
const SPECIAL_REFERENCE_RESOURCES = {
  'Appointments': 'participant.actor.reference',
  'Schedules': 'actor.0.reference'
};

// Patient-scoped resources that REQUIRE a patient to be selected before
// publishing.  Without a patient filter these collections can contain
// thousands of records (e.g. 4.5 K Observations) and sending them all
// to the client is both a data-leak and a performance problem.
//
// Resources NOT in this set (Patients, Practitioners, Organizations,
// Locations, Medications, Questionnaires, ValueSets, etc.) are
// patient-agnostic and safe to browse without patient context.
const PATIENT_SCOPED_RESOURCES = new Set([
  'AllergyIntolerances',
  'Appointments',
  'BodyStructures',
  'CarePlans',
  'CareTeams',
  'ClinicalImpressions',
  'Communications',
  'Compositions',
  'Conditions',
  'Consents',
  'DiagnosticReports',
  'DocumentReferences',
  'Encounters',
  'ExplanationOfBenefits',
  'FamilyMemberHistories',
  'Goals',
  'Immunizations',
  'ImagingStudies',
  'MedicationAdministrations',
  'MedicationRequests',
  'MedicationStatements',
  'MeasureReports',
  'NutritionIntakes',
  'NutritionOrders',
  'Observations',
  'Procedures',
  'QuestionnaireResponses',
  'RiskAssessments',
  'Schedules',
  'ServiceRequests',
  'MolecularSequences',
  'Specimens',
  'SupplyDeliveries',
  'SupplyRequests',
  'Tasks'
]);

// ── Helper: role precedence (same as patients.js and FhirAuth.js) ────────

function getAuthorizedRole(userRoles) {
  const authorizedRoles = ['healthcare practitioner', 'healthcare provider', 'patient'];
  if (Array.isArray(userRoles)) {
    for (const role of authorizedRoles) {
      if (userRoles.includes(role)) {
        return role;
      }
    }
  }
  return 'patient'; // default if no authorized role found
}

// Log dedup: only warn once per user per server restart
const _warnedNoPatientIdSelected = new Set();

// ── Helper: resolve patientId based on user role ─────────────────────────

async function resolvePatientId(userId, clientPatientId) {
  if (!userId) return null;

  const user = await Meteor.users.findOneAsync({ _id: userId });
  if (!user) return null;

  // Use getAuthorizedRole pattern (same precedence as patients.js and FhirAuth.js)
  const authorizedRole = getAuthorizedRole(get(user, 'roles', []));

  // PHR / patient-only role: always use the user's own patientId
  if (authorizedRole === 'patient') {
    const userPatientId = get(user, 'patientId') || get(user, 'profile.patientId');
    if (userPatientId) {
      return userPatientId;
    }
    // Patient user without linked patientId — cannot publish
    if (!_warnedNoPatientIdSelected.has(userId)) {
      console.warn('[selectedPatient] Patient-role user has no patientId:', userId);
      _warnedNoPatientIdSelected.add(userId);
    }
    return null;
  }

  // Practitioner / admin: trust client-supplied patientId
  if (clientPatientId) {
    return clientPatientId;
  }

  return null;
}

// ── Build patient query with special-case transforms ─────────────────────

function buildPatientQuery(collectionName, resolvedPatientId) {
  const query = FhirUtilities.addPatientFilterToQuery(resolvedPatientId);

  // Special-case: Appointments use participant.actor.reference
  if (collectionName === 'Appointments' && query.$or) {
    const extraConditions = [];
    query.$or.forEach(function(condition) {
      if (condition['patient.reference']) {
        extraConditions.push({ 'participant.actor.reference': condition['patient.reference'] });
      } else if (condition['subject.reference']) {
        extraConditions.push({ 'participant.actor.reference': condition['subject.reference'] });
      }
    });
    if (extraConditions.length > 0) {
      query.$or = query.$or.concat(extraConditions);
    }
  }

  // Special-case: Schedules use actor.0.reference
  if (collectionName === 'Schedules' && query.$or) {
    const extraConditions = [];
    query.$or.forEach(function(condition) {
      if (condition['patient.reference']) {
        extraConditions.push({ 'actor.0.reference': condition['patient.reference'] });
      } else if (condition['subject.reference']) {
        extraConditions.push({ 'actor.0.reference': condition['subject.reference'] });
      }
    });
    if (extraConditions.length > 0) {
      query.$or = query.$or.concat(extraConditions);
    }
  }

  return query;
}

// ── Register publications ────────────────────────────────────────────────

const subscriptionLimit = get(Meteor, 'settings.public.defaults.subscriptionLimit', 1000);

console.log('[selectedPatient] Registering patient-scoped publications for', Object.keys(collectionsMap).length, 'collections');

Object.keys(collectionsMap).forEach(function(collectionName) {
  const collection = collectionsMap[collectionName];

  if (collection && collection._collection) {
    const publicationName = `selectedPatient.${collectionName}`;

    Meteor.publish(publicationName, async function(clientPatientId, options) {
      try {
        // Auth check
        if (!this.userId) {
          return this.ready();
        }

        // Sanitize options
        options = options || {};
        options.limit = Math.min(options.limit || subscriptionLimit, subscriptionLimit);

        if (!options.sort) {
          options.sort = { '_id': -1 };
        }

        // Resolve patient ID (role-based)
        const resolvedPatientId = await resolvePatientId(this.userId, clientPatientId);
        if (!resolvedPatientId) {
          // Patient-scoped resources (Observations, Conditions, etc.) must NOT
          // be published without a patient filter — doing so leaks potentially
          // thousands of records to every connected clinician client.
          if (PATIENT_SCOPED_RESOURCES.has(collectionName)) {
            console.log(`[selectedPatient.${collectionName}] No patient selected — skipping patient-scoped resource`);
            return this.ready();
          }

          // Patient-agnostic resources (Patients, Practitioners, Locations,
          // Medications, etc.) are safe to browse without patient context.
          const BROWSE_ALL_ROLES = ['sysadmin', 'healthcare provider', 'healthcare practitioner'];
          const user = await Meteor.users.findOneAsync({ _id: this.userId });
          const userRoles = get(user, 'roles', []);
          const canBrowseAll = Array.isArray(userRoles) && userRoles.some(function(r) { return BROWSE_ALL_ROLES.includes(r); });

          if (canBrowseAll) {
            console.log(`[selectedPatient.${collectionName}] Clinician/admin browsing patient-agnostic resource (no patient selected)`);
            return collection.find({}, options);
          }
          return this.ready();
        }

        // Build patient-scoped query
        const query = buildPatientQuery(collectionName, resolvedPatientId);
        console.log(`[selectedPatient.${collectionName}] Publishing for patient: ${resolvedPatientId} (limit: ${options.limit})`);
        return collection.find(query, options);
      } catch (error) {
        console.error(`[selectedPatient.${collectionName}] Publication error:`, error);
        return this.ready();
      }
    });
  }
});

console.log('[selectedPatient] All patient-scoped publications registered');

// ── Diagnostic method ───────────────────────────────────────────────────
// Call from browser console: Meteor.call('debug.checkPatientPublication', 'Procedures', patientId, console.log)

Meteor.methods({
  'debug.checkPatientPublication': async function(collectionName, clientPatientId) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    const collection = collectionsMap[collectionName];
    if (!collection) {
      return { error: 'Collection not found in collectionsMap: ' + collectionName };
    }

    const hasInternalCollection = !!collection._collection;
    const resolvedPatientId = await resolvePatientId(this.userId, clientPatientId);
    const query = resolvedPatientId ? buildPatientQuery(collectionName, resolvedPatientId) : {};
    const count = await collection.find(query).countAsync();
    const sample = await collection.findOneAsync(query);

    return {
      collectionName: collectionName,
      hasInternalCollection: hasInternalCollection,
      resolvedPatientId: resolvedPatientId,
      query: JSON.stringify(query),
      matchCount: count,
      sampleId: sample ? sample._id : null,
      sampleSubjectRef: sample ? get(sample, 'subject.reference', 'N/A') : null
    };
  }
});
