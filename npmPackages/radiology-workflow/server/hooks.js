// npmPackages/radiology-workflow/server/hooks.js

import { Meteor } from 'meteor/meteor';
import { fetch } from 'meteor/fetch';
import { Random } from 'meteor/random';
import { get } from 'lodash';

const log = (Meteor.Logger ? Meteor.Logger.for('radiology-hooks') : console);

// =============================================================================
// COLLECTION HOOKS FOR RADIOLOGY WORKFLOW AUTOMATION
// =============================================================================
//
// These hooks chain workflow events by reacting to collection changes.
// Each hook runs AFTER a document is inserted/updated, allowing us to:
// - Update related resources
// - Trigger notifications
// - Create derived records (e.g., MeasureReports)
//
// Hooks are deferred using Meteor.defer() to allow the initial operation
// to complete first.
// =============================================================================

/**
 * Initialize radiology workflow hooks
 * Call this function from server startup to register all hooks
 */
export function initRadiologyHooks() {
  console.log('[radiology-workflow] Initializing collection hooks...');

  const ServiceRequests = Meteor.Collections?.ServiceRequests || global.Collections?.ServiceRequests;
  const QuestionnaireResponses = Meteor.Collections?.QuestionnaireResponses || global.Collections?.QuestionnaireResponses;
  const ImagingStudies = Meteor.Collections?.ImagingStudies || global.Collections?.ImagingStudies;
  const DiagnosticReports = Meteor.Collections?.DiagnosticReports || global.Collections?.DiagnosticReports;
  const Procedures = Meteor.Collections?.Procedures || global.Collections?.Procedures;

  // ---------------------------------------------------------------------------
  // HOOK 1: ServiceRequest.after.insert
  // Trigger: New imaging order placed
  // Action: Log for tech worklist notification (pub/sub handles real-time)
  // ---------------------------------------------------------------------------

  if (ServiceRequests && ServiceRequests.after) {
    ServiceRequests.after.insert(async function(userId, doc) {
      // Only process imaging orders
      const categoryCode = get(doc, 'category.0.coding.0.code');
      if (categoryCode !== '363679005') {
        return; // Not an imaging order
      }

      Meteor.defer(async () => {
        try {
          console.log('[radiology] New imaging order created:', {
            _id: doc._id,
            status: doc.status,
            priority: doc.priority,
            modality: get(doc, 'code.coding.0.code'), // DICOM modality (first coding entry)
            patient: get(doc, 'subject.reference')
          });

          // Future: Push notification to RadTech worklist
          // Could use Meteor server-render or external push service

        } catch (error) {
          console.error('[radiology] Error in ServiceRequest.after.insert hook:', error);
        }
      });
    });

    console.log('[radiology-workflow] ServiceRequest.after.insert hook registered');

    // -------------------------------------------------------------------------
    // HOOK 1b: ServiceRequest.after.update
    // Trigger: Imaging order status changes (e.g., draft → active → completed)
    // Action: Log state transitions for audit
    // -------------------------------------------------------------------------

    ServiceRequests.after.update(async function(userId, doc, fieldNames, modifier, options) {
      // Only process imaging orders whose status changed
      const categoryCode = get(doc, 'category.0.coding.0.code');
      if (categoryCode !== '363679005') {
        return; // Not an imaging order
      }
      if (!fieldNames.includes('status')) {
        return;
      }

      Meteor.defer(async () => {
        try {
          console.log('[radiology] Imaging order status changed:', {
            _id: doc._id,
            status: doc.status,
            priority: doc.priority,
            modality: get(doc, 'code.coding.0.code'),
            patient: get(doc, 'subject.reference')
          });

          // Future: Notify worklist of status transition
          // Future: Validate state machine (draft → active → completed)

        } catch (error) {
          console.error('[radiology] Error in ServiceRequest.after.update hook:', error);
        }
      });
    });

    console.log('[radiology-workflow] ServiceRequest.after.update hook registered');
  } else {
    console.warn('[radiology-workflow] ServiceRequests collection or hooks not available');
  }

  // ---------------------------------------------------------------------------
  // HOOK 2: QuestionnaireResponse.after.insert
  // Trigger: Safety screening completed
  // Action: Evaluate for contraindications, flag ServiceRequest if needed
  // ---------------------------------------------------------------------------

  if (QuestionnaireResponses && QuestionnaireResponses.after) {
    QuestionnaireResponses.after.insert(async function(userId, doc) {
      // Check if this is related to a ServiceRequest (imaging safety screening)
      const basedOn = get(doc, 'basedOn', []);
      const serviceRequestRef = basedOn.find(ref =>
        get(ref, 'reference', '').includes('ServiceRequest')
      );

      if (!serviceRequestRef) {
        return; // Not related to a service request
      }

      Meteor.defer(async () => {
        try {
          const serviceRequestId = get(serviceRequestRef, 'reference', '').replace('ServiceRequest/', '');

          console.log('[radiology] Safety screening completed:', {
            questionnaireResponseId: doc._id,
            serviceRequestId: serviceRequestId,
            patient: get(doc, 'subject.reference')
          });

          // Evaluate answers for contraindications
          const items = get(doc, 'item', []);
          const contraindications = evaluateContraindications(items);

          if (contraindications.length > 0) {
            console.warn('[radiology] Contraindications detected:', contraindications);

            // Update ServiceRequest with contraindication flags
            if (ServiceRequests) {
              await ServiceRequests.updateAsync(
                { _id: serviceRequestId },
                {
                  $push: {
                    note: {
                      text: `CONTRAINDICATION ALERT: ${contraindications.join(', ')}`,
                      time: new Date().toISOString()
                    }
                  }
                }
              );
            }
          }

        } catch (error) {
          console.error('[radiology] Error in QuestionnaireResponse.after.insert hook:', error);
        }
      });
    });

    console.log('[radiology-workflow] QuestionnaireResponse.after.insert hook registered');
  }

  // ---------------------------------------------------------------------------
  // HOOK 3: ImagingStudy.after.insert
  // Trigger: Images acquired and available
  // Action: Notify radiologist worklist
  // ---------------------------------------------------------------------------

  if (ImagingStudies && ImagingStudies.after) {
    ImagingStudies.after.insert(async function(userId, doc) {
      Meteor.defer(async () => {
        try {
          console.log('[radiology] New imaging study available:', {
            _id: doc._id,
            status: doc.status,
            modality: get(doc, 'modality.0.code'),
            numberOfSeries: doc.numberOfSeries,
            numberOfInstances: doc.numberOfInstances,
            patient: get(doc, 'subject.reference')
          });

          // Future: Push notification to Radiologist worklist
          // Could integrate with existing DICOM viewer at /dicom/studies

        } catch (error) {
          console.error('[radiology] Error in ImagingStudy.after.insert hook:', error);
        }
      });
    });

    console.log('[radiology-workflow] ImagingStudy.after.insert hook registered');

    // -------------------------------------------------------------------------
    // HOOK 3b: ImagingStudy.after.update
    // Trigger: Study status changes (e.g., registered → available → cancelled)
    // Action: Log state transitions, notify worklist
    // -------------------------------------------------------------------------

    ImagingStudies.after.update(async function(userId, doc, fieldNames, modifier, options) {
      if (!fieldNames.includes('status')) {
        return;
      }

      Meteor.defer(async () => {
        try {
          console.log('[radiology] Imaging study status changed:', {
            _id: doc._id,
            status: doc.status,
            modality: get(doc, 'modality.0.code'),
            numberOfSeries: doc.numberOfSeries,
            numberOfInstances: doc.numberOfInstances,
            patient: get(doc, 'subject.reference')
          });

          // Publish FHIRcast event for ImagingStudy status change
          const patientRef = get(doc, 'subject.reference', '');
          const patientId = patientRef.replace('Patient/', '');
          if (patientId) {
            await publishFhircastEvent('imagingstudy-open', patientId, [
              {
                key: 'patient',
                resource: { resourceType: 'Patient', id: patientId },
              },
              {
                key: 'study',
                resource: {
                  resourceType: 'ImagingStudy',
                  id: doc._id,
                  status: doc.status,
                },
              },
            ]);
          }

        } catch (error) {
          console.error('[radiology] Error in ImagingStudy.after.update hook:', error);
        }
      });
    });

    console.log('[radiology-workflow] ImagingStudy.after.update hook registered');

    // -------------------------------------------------------------------------
    // HOOK 3c: ImagingStudy.after.remove
    // Trigger: ImagingStudy deleted
    // Action: Unlink GridFS DICOM files that referenced this study
    // -------------------------------------------------------------------------

    ImagingStudies.after.remove(async function(userId, doc) {
      Meteor.defer(async () => {
        try {
          const studyId = doc._id;
          console.log('[radiology] ImagingStudy removed, unlinking DICOM files:', {
            _id: studyId,
            status: doc.status,
            patient: get(doc, 'subject.reference')
          });

          const GridFSManager = global.GridFSManager;
          if (!GridFSManager || !GridFSManager.isInitialized()) {
            console.warn('[radiology] GridFSManager not available, cannot unlink files');
            return;
          }

          const bucket = GridFSManager.getBucket();
          const db = bucket.s.db;
          const filesCollection = db.collection('dicom.files');

          const result = await filesCollection.updateMany(
            { 'metadata.imagingStudyId': studyId },
            { $unset: { 'metadata.imagingStudyId': '' } }
          );

          console.log('[radiology] Unlinked DICOM files from removed ImagingStudy:', {
            imagingStudyId: studyId,
            filesUnlinked: result.modifiedCount
          });
        } catch (error) {
          console.error('[radiology] Error in ImagingStudy.after.remove hook:', error);
        }
      });
    });

    console.log('[radiology-workflow] ImagingStudy.after.remove hook registered');
  }

  // ---------------------------------------------------------------------------
  // HOOK 4: DiagnosticReport.after.insert
  // Trigger: Report signed by radiologist
  // Action: Link to Procedure, create quality MeasureReport, notify ordering provider
  // ---------------------------------------------------------------------------

  if (DiagnosticReports && DiagnosticReports.after) {
    DiagnosticReports.after.insert(async function(userId, doc) {
      // Only process radiology reports
      const categoryCode = get(doc, 'category.0.coding.0.code');
      if (categoryCode !== 'RAD') {
        return; // Not a radiology report
      }

      Meteor.defer(async () => {
        try {
          console.log('[radiology] Diagnostic report signed:', {
            _id: doc._id,
            status: doc.status,
            imagingStudy: get(doc, 'imagingStudy.0.reference'),
            basedOn: get(doc, 'basedOn.0.reference'),
            issued: doc.issued
          });

          // Calculate and log turnaround time
          const serviceRequestRef = get(doc, 'basedOn.0.reference', '');
          if (serviceRequestRef && ServiceRequests) {
            const serviceRequestId = serviceRequestRef.replace('ServiceRequest/', '');
            const order = await ServiceRequests.findOneAsync({ _id: serviceRequestId });

            if (order && order.authoredOn) {
              const orderTime = new Date(order.authoredOn);
              const reportTime = new Date(doc.issued);
              const turnaroundMinutes = Math.round((reportTime - orderTime) / 60000);

              console.log('[radiology] Report turnaround time:', {
                serviceRequestId,
                diagnosticReportId: doc._id,
                turnaroundMinutes,
                turnaroundHours: Math.round(turnaroundMinutes / 60 * 10) / 10
              });

              // Future: Create MeasureReport for quality tracking
              // await createTurnaroundMeasureReport(doc._id, serviceRequestId, turnaroundMinutes);
            }
          }

          // Publish FHIRcast event for new diagnostic report
          const drPatientRef = get(doc, 'subject.reference', '');
          const drPatientId = drPatientRef.replace('Patient/', '');
          if (drPatientId) {
            await publishFhircastEvent('DiagnosticReport-open', drPatientId, [
              {
                key: 'patient',
                resource: { resourceType: 'Patient', id: drPatientId },
              },
              {
                key: 'report',
                resource: {
                  resourceType: 'DiagnosticReport',
                  id: doc._id,
                  status: doc.status,
                },
              },
            ]);
          }

        } catch (error) {
          console.error('[radiology] Error in DiagnosticReport.after.insert hook:', error);
        }
      });
    });

    console.log('[radiology-workflow] DiagnosticReport.after.insert hook registered');

    // -------------------------------------------------------------------------
    // HOOK 4b: DiagnosticReport.after.update
    // Trigger: Report status changes (e.g., preliminary → final, or amended)
    // Action: Log state transitions, recalculate turnaround on finalization
    // -------------------------------------------------------------------------

    DiagnosticReports.after.update(async function(userId, doc, fieldNames, modifier, options) {
      // Only process radiology reports whose status changed
      const categoryCode = get(doc, 'category.0.coding.0.code');
      if (categoryCode !== 'RAD') {
        return; // Not a radiology report
      }
      if (!fieldNames.includes('status')) {
        return;
      }

      Meteor.defer(async () => {
        try {
          console.log('[radiology] Diagnostic report status changed:', {
            _id: doc._id,
            status: doc.status,
            imagingStudy: get(doc, 'imagingStudy.0.reference'),
            basedOn: get(doc, 'basedOn.0.reference'),
            issued: doc.issued
          });

          // Recalculate turnaround time when report is finalized
          if (doc.status === 'final' || doc.status === 'amended') {
            const serviceRequestRef = get(doc, 'basedOn.0.reference', '');
            if (serviceRequestRef && ServiceRequests) {
              const serviceRequestId = serviceRequestRef.replace('ServiceRequest/', '');
              const order = await ServiceRequests.findOneAsync({ _id: serviceRequestId });

              if (order && order.authoredOn) {
                const orderTime = new Date(order.authoredOn);
                const reportTime = new Date(doc.issued || new Date().toISOString());
                const turnaroundMinutes = Math.round((reportTime - orderTime) / 60000);

                console.log('[radiology] Report turnaround time (on status change):', {
                  serviceRequestId,
                  diagnosticReportId: doc._id,
                  status: doc.status,
                  turnaroundMinutes,
                  turnaroundHours: Math.round(turnaroundMinutes / 60 * 10) / 10
                });

                // Future: Create/update MeasureReport for quality tracking
              }
            }
          }

          // Publish FHIRcast event when report is finalized or amended
          if (doc.status === 'final' || doc.status === 'amended') {
            const drPatientRef = get(doc, 'subject.reference', '');
            const drPatientId = drPatientRef.replace('Patient/', '');
            if (drPatientId) {
              await publishFhircastEvent('DiagnosticReport-open', drPatientId, [
                {
                  key: 'patient',
                  resource: { resourceType: 'Patient', id: drPatientId },
                },
                {
                  key: 'report',
                  resource: {
                    resourceType: 'DiagnosticReport',
                    id: doc._id,
                    status: doc.status,
                  },
                },
              ]);
            }
          }

        } catch (error) {
          console.error('[radiology] Error in DiagnosticReport.after.update hook:', error);
        }
      });
    });

    console.log('[radiology-workflow] DiagnosticReport.after.update hook registered');
  }

  // ---------------------------------------------------------------------------
  // HOOK 5: Procedure.after.update
  // Trigger: Procedure status changes
  // Action: Log state transitions for audit
  // ---------------------------------------------------------------------------

  if (Procedures && Procedures.after) {
    Procedures.after.update(async function(userId, doc, fieldNames, modifier, options) {
      // Only process if status changed
      if (!fieldNames.includes('status')) {
        return;
      }

      Meteor.defer(async () => {
        try {
          console.log('[radiology] Procedure status changed:', {
            _id: doc._id,
            status: doc.status,
            basedOn: get(doc, 'basedOn.0.reference'),
            patient: get(doc, 'subject.reference')
          });

          // Future: Audit log, state machine validation

        } catch (error) {
          console.error('[radiology] Error in Procedure.after.update hook:', error);
        }
      });
    });

    console.log('[radiology-workflow] Procedure.after.update hook registered');
  }

  console.log('[radiology-workflow] All collection hooks initialized');
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Publish a FHIRcast event to the hub
 * @param {string} eventName - e.g. 'imagingstudy-open' or 'DiagnosticReport-open'
 * @param {string} patientId - Patient ID used as hub.topic
 * @param {Array} context - FHIRcast event context array
 */
async function publishFhircastEvent(eventName, patientId, context) {
  const hubUrl = get(Meteor, 'settings.private.fhircast.hubUrl',
    get(Meteor, 'settings.public.fhircast.hubUrl',
      'http://localhost:' + (process.env.PORT || '3100') + '/api/hub'));

  const eventData = {
    timestamp: new Date().toISOString(),
    id: Random.id(),
    event: {
      'hub.topic': patientId,
      'hub.event': eventName,
      context: context,
    },
  };

  try {
    await fetch(hubUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });
    log.debug('Published FHIRcast event for patient', { eventName, patientId });
  } catch (err) {
    console.warn('[radiology] Failed to publish FHIRcast event:', err.message);
  }
}

/**
 * Evaluate questionnaire responses for contraindications
 * @param {Array} items - QuestionnaireResponse items
 * @returns {Array} List of contraindication descriptions
 */
function evaluateContraindications(items) {
  const contraindications = [];

  items.forEach(item => {
    const linkId = get(item, 'linkId', '');
    const answer = get(item, 'answer.0', {});

    // Check for known contraindication patterns
    // These would be customized based on actual questionnaire structure

    // Example: Contrast allergy
    if (linkId.includes('allergy') && get(answer, 'valueBoolean') === true) {
      contraindications.push('History of contrast allergy');
    }

    // Example: Pregnancy
    if (linkId.includes('pregnancy') && get(answer, 'valueBoolean') === true) {
      contraindications.push('Pregnancy - requires review');
    }

    // Example: Metallic implants (MRI contraindication)
    if (linkId.includes('implant') && get(answer, 'valueBoolean') === true) {
      contraindications.push('Metallic implant - MRI contraindication');
    }

    // Example: Renal function (contrast risk)
    if (linkId.includes('kidney') || linkId.includes('renal')) {
      const gfr = get(answer, 'valueQuantity.value');
      if (gfr && gfr < 30) {
        contraindications.push(`Low GFR (${gfr}) - contrast nephropathy risk`);
      }
    }

    // Example: Claustrophobia
    if (linkId.includes('claustrophobia') && get(answer, 'valueBoolean') === true) {
      contraindications.push('Claustrophobia - may require sedation');
    }

    // Recursively check nested items
    if (item.item && Array.isArray(item.item)) {
      contraindications.push(...evaluateContraindications(item.item));
    }
  });

  return contraindications;
}

// Hook initialization is handled by the server-loader.js (via initializeWorkflowHooks).
// Do NOT self-initialize here — collections may not be ready yet.

console.log('[radiology-workflow] Server hooks module loaded');
