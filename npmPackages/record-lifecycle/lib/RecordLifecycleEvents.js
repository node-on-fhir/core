// npmPackages/record-lifecycle/lib/RecordLifecycleEvents.js

// =============================================================================
// HL7 Record Lifecycle Events — 27 Event Types
// =============================================================================
//
// Based on HL7 EHR-S FM Record Lifecycle specification.
// These events describe the full range of actions that can be performed on
// electronic health records, bridging CRUD operations, HIPAA audit types,
// and FHIRcast event semantics.
// =============================================================================

export const RecordLifecycleEvent = {
  // --- CRUD-triggered (auto-detected from collection hooks) ---
  ORIGINATE:    'originate',     // Record created
  AMEND:        'amend',         // Record updated (general)
  ATTEST:       'attest',        // Record finalized (status → final)
  DEPRECATE:    'deprecate',     // Record marked entered-in-error
  REACTIVATE:   'reactivate',    // Record reactivated (status → active from inactive)
  DESTROY:      'destroy',       // Record permanently deleted
  ACCESS:       'access',        // Record read/viewed

  // --- Lifecycle management (manual or future automation) ---
  ARCHIVE:      'archive',       // Record moved to long-term storage
  RESTORE:      'restore',       // Record retrieved from archive
  HOLD:         'hold',          // Legal hold placed on record
  UNHOLD:       'unhold',        // Legal hold removed
  MERGE:        'merge',         // Records merged (e.g., patient merge)
  UNMERGE:      'unmerge',       // Merge reversed
  LINK:         'link',          // Records linked together
  UNLINK:       'unlink',        // Link between records removed
  TRANSFORM:    'transform',     // Record format changed (e.g., CDA → FHIR)
  TRANSLATE:    'translate',     // Record language translated
  TRANSMIT:     'transmit',      // Record sent externally
  RECEIVE:      'receive',       // Record received from external source
  DISCLOSE:     'disclose',      // Record disclosed to third party
  ENCRYPT:      'encrypt',       // Record encrypted
  DECRYPT:      'decrypt',       // Record decrypted
  PSEUDONYMIZE: 'pseudonymize',  // Record de-identified
  REIDENTIFY:   'reidentify',    // Record re-identified
  EXTRACT:      'extract',       // Data extracted from record
  VERIFY:       'verify',        // Record integrity verified
  REPORT:       'report'         // Record included in a report
};

// All lifecycle event codes as an array (for validation)
export const AllLifecycleEvents = Object.values(RecordLifecycleEvent);

// =============================================================================
// CRUD → Lifecycle Event Resolution
// =============================================================================
//
// Inspects the CRUD operation context (insert/update/remove) along with
// document fields to determine the most specific lifecycle event.
// =============================================================================

/**
 * Resolve a CRUD operation to the most specific HL7 Record Lifecycle Event.
 *
 * @param {string} crudOperation - 'insert', 'update', or 'remove'
 * @param {Object} doc - The document after the operation
 * @param {string[]} fieldNames - Fields that changed (for updates)
 * @param {Object} [previousDoc] - The document before the operation (for updates)
 * @returns {string} The lifecycle event code
 */
export function resolveLifecycleEvent(crudOperation, doc, fieldNames, previousDoc) {
  if (crudOperation === 'insert') {
    return RecordLifecycleEvent.ORIGINATE;
  }

  if (crudOperation === 'remove') {
    return RecordLifecycleEvent.DESTROY;
  }

  if (crudOperation === 'update') {
    const currentStatus = doc?.status;
    const previousStatus = previousDoc?.status;

    // Status changed to 'final' or 'completed' → attest
    if (fieldNames?.includes('status') && (currentStatus === 'final' || currentStatus === 'completed')) {
      return RecordLifecycleEvent.ATTEST;
    }

    // Status changed to 'entered-in-error' → deprecate
    if (fieldNames?.includes('status') && currentStatus === 'entered-in-error') {
      return RecordLifecycleEvent.DEPRECATE;
    }

    // Status changed to 'active' from 'inactive' or 'cancelled' → reactivate
    if (fieldNames?.includes('status') && currentStatus === 'active') {
      if (previousStatus === 'inactive' || previousStatus === 'cancelled' || previousStatus === 'suspended') {
        return RecordLifecycleEvent.REACTIVATE;
      }
    }

    // General update
    return RecordLifecycleEvent.AMEND;
  }

  // Fallback
  return RecordLifecycleEvent.AMEND;
}

// =============================================================================
// Lifecycle → HIPAA Event Type Mapping
// =============================================================================

export const LifecycleToHipaa = {
  [RecordLifecycleEvent.ORIGINATE]:    'create',
  [RecordLifecycleEvent.AMEND]:        'update',
  [RecordLifecycleEvent.ATTEST]:       'modify',
  [RecordLifecycleEvent.DEPRECATE]:    'modify',
  [RecordLifecycleEvent.REACTIVATE]:   'modify',
  [RecordLifecycleEvent.DESTROY]:      'delete',
  [RecordLifecycleEvent.ACCESS]:       'view',
  [RecordLifecycleEvent.ARCHIVE]:      'modify',
  [RecordLifecycleEvent.RESTORE]:      'modify',
  [RecordLifecycleEvent.HOLD]:         'modify',
  [RecordLifecycleEvent.UNHOLD]:       'modify',
  [RecordLifecycleEvent.MERGE]:        'update',
  [RecordLifecycleEvent.UNMERGE]:      'update',
  [RecordLifecycleEvent.LINK]:         'update',
  [RecordLifecycleEvent.UNLINK]:       'update',
  [RecordLifecycleEvent.TRANSFORM]:    'modify',
  [RecordLifecycleEvent.TRANSLATE]:    'modify',
  [RecordLifecycleEvent.TRANSMIT]:     'export',
  [RecordLifecycleEvent.RECEIVE]:      'create',
  [RecordLifecycleEvent.DISCLOSE]:     'export',
  [RecordLifecycleEvent.ENCRYPT]:      'modify',
  [RecordLifecycleEvent.DECRYPT]:      'access',
  [RecordLifecycleEvent.PSEUDONYMIZE]: 'modify',
  [RecordLifecycleEvent.REIDENTIFY]:   'modify',
  [RecordLifecycleEvent.EXTRACT]:      'export',
  [RecordLifecycleEvent.VERIFY]:       'access',
  [RecordLifecycleEvent.REPORT]:       'export'
};

// =============================================================================
// Lifecycle → FHIRcast Action Suffix Mapping
// =============================================================================
//
// Maps lifecycle events to FHIRcast action suffixes (open, close, update).
// Only resources with FHIRcast counterparts are translated by the bridge.
// null means no FHIRcast equivalent.
// =============================================================================

export const LifecycleToFhircast = {
  [RecordLifecycleEvent.ORIGINATE]:    'open',
  [RecordLifecycleEvent.AMEND]:        'update',
  [RecordLifecycleEvent.ATTEST]:       'update',
  [RecordLifecycleEvent.DEPRECATE]:    null,
  [RecordLifecycleEvent.REACTIVATE]:   'open',
  [RecordLifecycleEvent.DESTROY]:      'close',
  [RecordLifecycleEvent.ACCESS]:       'open',
  [RecordLifecycleEvent.ARCHIVE]:      'close',
  [RecordLifecycleEvent.RESTORE]:      'open',
  [RecordLifecycleEvent.HOLD]:         null,
  [RecordLifecycleEvent.UNHOLD]:       null,
  [RecordLifecycleEvent.MERGE]:        'update',
  [RecordLifecycleEvent.UNMERGE]:      null,
  [RecordLifecycleEvent.LINK]:         null,
  [RecordLifecycleEvent.UNLINK]:       null,
  [RecordLifecycleEvent.TRANSFORM]:    null,
  [RecordLifecycleEvent.TRANSLATE]:    null,
  [RecordLifecycleEvent.TRANSMIT]:     null,
  [RecordLifecycleEvent.RECEIVE]:      'open',
  [RecordLifecycleEvent.DISCLOSE]:     null,
  [RecordLifecycleEvent.ENCRYPT]:      null,
  [RecordLifecycleEvent.DECRYPT]:      null,
  [RecordLifecycleEvent.PSEUDONYMIZE]: null,
  [RecordLifecycleEvent.REIDENTIFY]:   null,
  [RecordLifecycleEvent.EXTRACT]:      null,
  [RecordLifecycleEvent.VERIFY]:       null,
  [RecordLifecycleEvent.REPORT]:       null
};

// FHIRcast-eligible FHIR resource types (lowercase for matching)
export const FhircastResourceTypes = [
  'patient',
  'imagingstudy',
  'diagnosticreport',
  'encounter'
];
