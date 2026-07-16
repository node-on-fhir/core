// npmPackages/pacio-core/lib/MedicationReconciliation.js
//
// Pure FHIR-artifact builders for medication reconciliation. Plain CJS, zero
// deps, no Meteor imports -- testable with plain `node --test`
// (WorkflowNavigation.js precedent). The server method layer
// (server/methods/medicationReconciliation.js) supplies ids and timestamps;
// these functions only assemble JSON.
//
// FHIR semantics:
//   - The reconciled List is a snapshot (mode: 'snapshot'), so entries may
//     NEVER carry `deleted: true` (invariant lst-2). Disposition is expressed
//     with `entry.flag` instead: continued -> list-item-flag 01 "Unchanged",
//     discontinued -> 03 "Cancelled".
//   - LOINC 10160-0 matches the pacio.medicationLists publication query and
//     the PACIO SMP sample lists, so saved lists are immediately visible.
//   - SNOMED 430193006 "Medication reconciliation (procedure)" is the code
//     CMS eCQMs (e.g. Medication Reconciliation Post-Discharge) look for.

const RXNORM_SYSTEM = 'http://www.nlm.nih.gov/research/umls/rxnorm';
const LOINC_SYSTEM = 'http://loinc.org';
const SNOMED_SYSTEM = 'http://snomed.info/sct';
const LIST_ITEM_FLAG_SYSTEM = 'http://terminology.hl7.org/CodeSystem/list-item-flag';
const V3_DATA_OPERATION_SYSTEM = 'http://terminology.hl7.org/CodeSystem/v3-DataOperation';
const PROVENANCE_PARTICIPANT_TYPE_SYSTEM = 'http://terminology.hl7.org/CodeSystem/provenance-participant-type';

const MEDICATION_LIST_LOINC = '10160-0';
const MED_REC_SNOMED = '430193006';

const ENTRY_FLAGS = {
  continue: { code: '01', display: 'Unchanged', text: 'continued' },
  discontinue: { code: '03', display: 'Cancelled', text: 'discontinued' }
};

// action: { _id, resourceType ('MedicationRequest'|'MedicationStatement'),
//           action ('continue'|'discontinue'), display, code }
function buildListEntry(action) {
  const flag = ENTRY_FLAGS[action.action] || ENTRY_FLAGS.continue;
  const entry = {
    flag: {
      coding: [{
        system: LIST_ITEM_FLAG_SYSTEM,
        code: flag.code,
        display: flag.display
      }],
      text: flag.text
    },
    item: {
      reference: (action.resourceType || 'MedicationRequest') + '/' + action._id
    }
  };
  if (action.display) {
    entry.item.display = action.display;
  }
  return entry;
}

// options = { listId, actions, patientReference ('Patient/<id>' form -- the
//   pacio publications only match this form, never urn:uuid:), patientDisplay,
//   authorReference, authorDisplay, note, recorded (ISO string) }
function buildReconciledList(options) {
  const list = {
    resourceType: 'List',
    id: options.listId,
    _id: options.listId,
    meta: { lastUpdated: options.recorded },
    status: 'current',
    mode: 'snapshot',
    title: 'Reconciled Medication List',
    code: {
      coding: [{
        system: LOINC_SYSTEM,
        code: MEDICATION_LIST_LOINC,
        display: 'History of Medication use Narrative'
      }],
      text: 'Medication Reconciliation'
    },
    subject: { reference: options.patientReference },
    date: options.recorded,
    entry: (options.actions || []).map(buildListEntry)
  };
  if (options.patientDisplay) {
    list.subject.display = options.patientDisplay;
  }
  if (options.authorReference) {
    list.source = { reference: options.authorReference };
    if (options.authorDisplay) {
      list.source.display = options.authorDisplay;
    }
  }
  if (options.note) {
    list.note = [{ text: options.note }];
  }
  return list;
}

// options = { provenanceId, listId, actions, authorReference, authorDisplay,
//             recorded }
function buildReconciliationProvenance(options) {
  const targets = [{
    reference: 'List/' + options.listId,
    display: 'Reconciled Medication List'
  }];
  (options.actions || []).forEach(function(action) {
    targets.push({
      reference: (action.resourceType || 'MedicationRequest') + '/' + action._id
    });
  });

  const provenance = {
    resourceType: 'Provenance',
    id: options.provenanceId,
    _id: options.provenanceId,
    meta: { lastUpdated: options.recorded },
    target: targets,
    recorded: options.recorded,
    activity: {
      coding: [
        {
          system: V3_DATA_OPERATION_SYSTEM,
          code: 'UPDATE',
          display: 'revise'
        },
        {
          system: SNOMED_SYSTEM,
          code: MED_REC_SNOMED,
          display: 'Medication reconciliation (procedure)'
        }
      ],
      text: 'Medication Reconciliation'
    },
    agent: [{
      type: {
        coding: [{
          system: PROVENANCE_PARTICIPANT_TYPE_SYSTEM,
          code: 'author',
          display: 'Author'
        }]
      },
      who: { reference: options.authorReference }
    }]
  };
  if (options.authorDisplay) {
    provenance.agent[0].who.display = options.authorDisplay;
  }
  return provenance;
}

// options = { procedureId, patientReference, patientDisplay, authorReference,
//             authorDisplay, recorded }
function buildReconciliationProcedure(options) {
  const procedure = {
    resourceType: 'Procedure',
    id: options.procedureId,
    _id: options.procedureId,
    meta: { lastUpdated: options.recorded },
    status: 'completed',
    code: {
      coding: [{
        system: SNOMED_SYSTEM,
        code: MED_REC_SNOMED,
        display: 'Medication reconciliation (procedure)'
      }],
      text: 'Medication reconciliation'
    },
    subject: { reference: options.patientReference },
    performedDateTime: options.recorded
  };
  if (options.patientDisplay) {
    procedure.subject.display = options.patientDisplay;
  }
  if (options.authorReference) {
    procedure.performer = [{
      actor: { reference: options.authorReference }
    }];
    if (options.authorDisplay) {
      procedure.performer[0].actor.display = options.authorDisplay;
    }
  }
  return procedure;
}

// Extracts [{ system, code, display }] from a MedicationRequest or
// MedicationStatement. Handles medicationCodeableConcept only (the app's
// medicationReference form carries no coding to match on).
function extractMedicationCodings(resource) {
  const concept = resource && resource.medicationCodeableConcept;
  const codings = concept && Array.isArray(concept.coding) ? concept.coding : [];
  return codings.filter(function(coding) {
    return coding && coding.code;
  });
}

function getMedicationDisplay(resource) {
  const concept = resource && resource.medicationCodeableConcept;
  if (concept && concept.text) {
    return concept.text;
  }
  const codings = extractMedicationCodings(resource);
  if (codings.length && codings[0].display) {
    return codings[0].display;
  }
  const reference = resource && resource.medicationReference;
  if (reference && reference.display) {
    return reference.display;
  }
  return 'Unknown Medication';
}

// Pairs home meds (MedicationStatements) with orders (MedicationRequests) by
// exact medication code intersection (RxNorm codes preferred but any shared
// system+code counts). Each statement/request participates in at most one
// pair. The Phase B RxNorm assist upgrades this to RxCUI/ingredient matching;
// this exact-code version is the always-available fallback.
// Returns { matches: [{ statementId, requestId, code }],
//           unmatchedStatementIds: [], unmatchedRequestIds: [] }
function matchMedicationPairs(statements, requests) {
  const matches = [];
  const usedRequestIds = {};
  const unmatchedStatementIds = [];

  (statements || []).forEach(function(statement) {
    const statementCodes = extractMedicationCodings(statement).map(function(coding) {
      return coding.code;
    });
    let matchedRequest = null;
    let matchedCode = null;

    (requests || []).forEach(function(request) {
      if (matchedRequest || usedRequestIds[request._id]) {
        return;
      }
      const shared = extractMedicationCodings(request).find(function(coding) {
        return statementCodes.indexOf(coding.code) !== -1;
      });
      if (shared) {
        matchedRequest = request;
        matchedCode = shared.code;
      }
    });

    if (matchedRequest) {
      usedRequestIds[matchedRequest._id] = true;
      matches.push({
        statementId: statement._id,
        requestId: matchedRequest._id,
        code: matchedCode
      });
    } else {
      unmatchedStatementIds.push(statement._id);
    }
  });

  const unmatchedRequestIds = (requests || []).filter(function(request) {
    return !usedRequestIds[request._id];
  }).map(function(request) {
    return request._id;
  });

  return {
    matches: matches,
    unmatchedStatementIds: unmatchedStatementIds,
    unmatchedRequestIds: unmatchedRequestIds
  };
}

module.exports = {
  RXNORM_SYSTEM: RXNORM_SYSTEM,
  MEDICATION_LIST_LOINC: MEDICATION_LIST_LOINC,
  MED_REC_SNOMED: MED_REC_SNOMED,
  buildReconciledList: buildReconciledList,
  buildReconciliationProvenance: buildReconciliationProvenance,
  buildReconciliationProcedure: buildReconciliationProcedure,
  extractMedicationCodings: extractMedicationCodings,
  getMedicationDisplay: getMedicationDisplay,
  matchMedicationPairs: matchMedicationPairs
};
