// npmPackages/radiology-workflow/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import { Random } from 'meteor/random';

const log = (Meteor.Logger ? Meteor.Logger.for('radiology-methods') : console);

// Find the screening QuestionnaireResponse for an order: the oldest in-progress
// draft wins (concurrent panel opens converge on it); fall back to a completed
// response (panel reopened after screening finished).
async function findScreeningResponse(QuestionnaireResponses, serviceRequestId, questionnaireId) {
  const baseQuery = {
    'basedOn.reference': `ServiceRequest/${serviceRequestId}`,
    questionnaire: `Questionnaire/${questionnaireId}`
  };

  const draft = await QuestionnaireResponses.findOneAsync(
    { ...baseQuery, status: 'in-progress' },
    { sort: { authored: 1 } }
  );
  if (draft) {
    return draft;
  }

  return await QuestionnaireResponses.findOneAsync(
    { ...baseQuery, status: 'completed' },
    { sort: { authored: 1 } }
  );
}

// Author must be a Reference object or absent — `author: null` fails R4B
// schema validation when settings.private.fhir.schemaValidation.validate is on.
async function getAuthorReference(userId) {
  const user = await Meteor.users.findOneAsync({ _id: userId });
  if (user && user.practitionerId) {
    return { reference: `Practitioner/${user.practitionerId}` };
  }
  return null;
}

// =============================================================================
// RADIOLOGY WORKFLOW METHODS (Meteor v3 Async Pattern)
// =============================================================================

// =============================================================================
// ServerMethods registry (rpc migration). All methods already carry canonical
// dotted 'radiology.*' names (no rename → no aliases). The
// `if (!this.userId) throw` guards are deleted in favor of the requireAuth
// default (true); the two methods that were genuinely guard-less AND touch no
// patient data (getSafetyQuestionnaire, generic template lookup) keep
// requireAuth:false with a comment. this.userId -> context.userId. Data was
// passed as a single named object per method, so positionalParams wraps the one
// object arg (or the legacy positional args where the signature was positional:
// calculateTurnaroundTime, generateMonthlyMeasureReport, getMonthlyHistory).
// phi:true on every method that flows patient orders/procedures/reports/
// findings. Uses the global Meteor.ServerMethods per the npmPackages exemplar.
// getDepartmentStatistics / calculateTurnaroundTime / getMonthlyHistory were
// guard-less pre-migration; requireAuth now applies (default true) — behavior
// change noted for the commit (they read across patient collections).
// =============================================================================

Meteor.ServerMethods.define('radiology.createImagingOrder', {
  description: 'Create a radiology imaging order (ServiceRequest) for a patient',
  phi: true,
  positionalParams: ['orderData'],
  schemaObject: {
    type: 'object',
    properties: {
      orderData: {
        type: 'object',
        properties: {
          patientId: { type: 'string' },
          encounterId: { type: 'string' },
          modality: { type: 'string' },
          modalityDisplay: { type: 'string' },
          procedureCode: { type: 'string' },
          procedureDisplay: { type: 'string' },
          priority: { type: 'string' },
          reasonCode: { type: 'string' },
          reasonDisplay: { type: 'string' },
          planDefinitionId: { type: 'string' },
          note: { type: 'string' }
        },
        required: ['patientId', 'modality']
      }
    },
    required: ['orderData']
  }
}, async function(params, context){
    const orderData = get(params, 'orderData');
    log.debug('Creating order for patient:', { patientId: orderData.patientId });

    // Build ServiceRequest (profiled for radiology workflow)
    const serviceRequest = {
      resourceType: 'ServiceRequest',
      id: Random.id(),
      meta: {
        profile: ['https://github.com/node-on-fhir/radiology-workflow']
      },
      status: 'active',
      intent: 'order',
      category: [{
        coding: [{
          system: 'http://snomed.info/sct',
          code: '363679005',
          display: 'Imaging'
        }],
        text: 'Imaging'
      }],
      code: {
        coding: [
          // DICOM modality (always first — used by worklist MOD column)
          {
            system: 'http://dicom.nema.org/resources/ontology/DCM',
            code: orderData.modality,
            display: orderData.modalityDisplay || orderData.modality
          },
          // LOINC procedure code (if available)
          ...(orderData.procedureCode ? [{
            system: 'http://loinc.org',
            code: orderData.procedureCode,
            display: orderData.procedureDisplay || orderData.modality
          }] : [])
        ],
        text: orderData.procedureDisplay || orderData.modalityDisplay || orderData.modality
      },
      priority: orderData.priority || 'routine',
      subject: {
        reference: `Patient/${orderData.patientId}`
      },
      authoredOn: new Date().toISOString()
    };

    // Add optional fields
    if (orderData.encounterId) {
      serviceRequest.encounter = {
        reference: `Encounter/${orderData.encounterId}`
      };
    }

    if (orderData.reasonCode) {
      serviceRequest.reasonCode = [{
        coding: [{
          code: orderData.reasonCode,
          display: orderData.reasonDisplay || orderData.reasonCode
        }],
        text: orderData.reasonDisplay || orderData.reasonCode
      }];
    }

    if (orderData.planDefinitionId) {
      serviceRequest.instantiatesCanonical = [`PlanDefinition/${orderData.planDefinitionId}`];
    }

    if (orderData.note) {
      serviceRequest.note = [{
        text: orderData.note,
        time: new Date().toISOString()
      }];
    }

    // Get requester from user's practitioner
    const user = await Meteor.users.findOneAsync({ _id: context.userId });
    if (user && user.practitionerId) {
      serviceRequest.requester = {
        reference: `Practitioner/${user.practitionerId}`
      };
    }

    serviceRequest._id = serviceRequest.id;

    const ServiceRequests = Meteor.Collections?.ServiceRequests || global.Collections?.ServiceRequests;
    if (!ServiceRequests) {
      throw new Meteor.Error('collection-not-found', 'ServiceRequests collection not available');
    }

    const result = await ServiceRequests.insertAsync(serviceRequest);
    console.log('[radiology.createImagingOrder] Created ServiceRequest:', result);

    return result;
});

Meteor.ServerMethods.define('radiology.getOrdersByEncounter', {
  description: 'List imaging orders (ServiceRequests) for an encounter',
  phi: true,
  positionalParams: ['encounterId'],
  schemaObject: {
    type: 'object',
    properties: { encounterId: { type: 'string' } },
    required: ['encounterId']
  }
}, async function(params, context){
    const encounterId = get(params, 'encounterId');
    console.log('[radiology.getOrdersByEncounter] Fetching orders for encounter:', encounterId);

    const ServiceRequests = Meteor.Collections?.ServiceRequests || global.Collections?.ServiceRequests;
    if (!ServiceRequests) {
      throw new Meteor.Error('collection-not-found', 'ServiceRequests collection not available');
    }

    const orders = await ServiceRequests.find({
      'encounter.reference': `Encounter/${encounterId}`,
      'category.coding.code': '363679005'
    }).fetchAsync();

    return orders;
});

// ---------------------------------------------------------------------------
// SAFETY SCREENING (Tech)
// ---------------------------------------------------------------------------

Meteor.ServerMethods.define('radiology.getSafetyQuestionnaire', {
  description: 'Fetch the active pre-imaging safety Questionnaire for a modality',
  // Public by design (pre-migration behavior — no auth guard): returns a
  // Questionnaire template, no patient data.
  requireAuth: false,
  positionalParams: ['modality'],
  schemaObject: {
    type: 'object',
    properties: { modality: { type: 'string' } },
    required: ['modality']
  }
}, async function(params, context){
    const modality = get(params, 'modality');
    console.log('[radiology.getSafetyQuestionnaire] Fetching questionnaire for modality:', modality);

    const Questionnaires = Meteor.Collections?.Questionnaires || global.Collections?.Questionnaires;
    if (!Questionnaires) {
      throw new Meteor.Error('collection-not-found', 'Questionnaires collection not available');
    }

    // Find questionnaire for this modality context
    const questionnaire = await Questionnaires.findOneAsync({
      status: 'active',
      $or: [
        { 'useContext.valueCodeableConcept.coding.code': modality },
        { 'useContext.code.code': 'pre-imaging-safety' }
      ]
    });

    return questionnaire;
});

Meteor.ServerMethods.define('radiology.beginSafetyScreening', {
  description: 'Find-or-create the in-progress safety-screening QuestionnaireResponse draft for an order',
  phi: true,
  positionalParams: ['screeningData'],
  schemaObject: {
    type: 'object',
    properties: {
      screeningData: {
        type: 'object',
        properties: {
          questionnaireId: { type: 'string' },
          serviceRequestId: { type: 'string' },
          patientId: { type: 'string' },
          encounterId: { type: 'string' },
          items: { type: 'array' }
        },
        required: ['serviceRequestId', 'patientId']
      }
    },
    required: ['screeningData']
  }
}, async function(params, context){
    const screeningData = get(params, 'screeningData');
    const questionnaireId = screeningData.questionnaireId || 'pre-imaging-safety';

    const QuestionnaireResponses = Meteor.Collections?.QuestionnaireResponses || global.Collections?.QuestionnaireResponses;
    if (!QuestionnaireResponses) {
      throw new Meteor.Error('collection-not-found', 'QuestionnaireResponses collection not available');
    }

    const existing = await findScreeningResponse(QuestionnaireResponses, screeningData.serviceRequestId, questionnaireId);
    if (existing) {
      console.log('[radiology.beginSafetyScreening] Found existing screening:', existing._id, '(' + existing.status + ')');
      return existing;
    }

    const response = {
      resourceType: 'QuestionnaireResponse',
      id: Random.id(),
      status: 'in-progress',
      questionnaire: `Questionnaire/${questionnaireId}`,
      subject: { reference: `Patient/${screeningData.patientId}` },
      basedOn: [{ reference: `ServiceRequest/${screeningData.serviceRequestId}` }],
      authored: new Date().toISOString(),
      source: { reference: `Patient/${screeningData.patientId}` },
      item: screeningData.items || []
    };

    const authorReference = await getAuthorReference(context.userId);
    if (authorReference) {
      response.author = authorReference;
    }

    if (screeningData.encounterId) {
      response.encounter = { reference: `Encounter/${screeningData.encounterId}` };
    }

    response._id = response.id;

    await QuestionnaireResponses.insertAsync(response);
    console.log('[radiology.beginSafetyScreening] Created draft QuestionnaireResponse:', response._id);

    // Concurrent opens both insert, then both converge on the oldest draft;
    // any stray duplicate is swept to completed by submitSafetyScreening.
    const canonical = await findScreeningResponse(QuestionnaireResponses, screeningData.serviceRequestId, questionnaireId);
    return canonical || response;
});

Meteor.ServerMethods.define('radiology.patchSafetyScreening', {
  description: 'Patch the answers on an in-progress safety-screening QuestionnaireResponse draft',
  phi: true,
  positionalParams: ['patchData'],
  schemaObject: {
    type: 'object',
    properties: {
      patchData: {
        type: 'object',
        properties: {
          questionnaireResponseId: { type: 'string' },
          items: { type: 'array' }
        },
        required: ['questionnaireResponseId', 'items']
      }
    },
    required: ['patchData']
  }
}, async function(params, context){
    const patchData = get(params, 'patchData');
    const QuestionnaireResponses = Meteor.Collections?.QuestionnaireResponses || global.Collections?.QuestionnaireResponses;
    if (!QuestionnaireResponses) {
      throw new Meteor.Error('collection-not-found', 'QuestionnaireResponses collection not available');
    }

    const existing = await QuestionnaireResponses.findOneAsync({ _id: patchData.questionnaireResponseId });
    if (!existing) {
      throw new Meteor.Error('not-found', 'QuestionnaireResponse not found');
    }

    if (existing.status !== 'in-progress') {
      console.log('[radiology.patchSafetyScreening] Skipping patch, response status is:', existing.status);
      return existing._id;
    }

    await QuestionnaireResponses.updateAsync(
      { _id: patchData.questionnaireResponseId },
      { $set: { item: patchData.items, authored: new Date().toISOString() } }
    );

    return existing._id;
});

Meteor.ServerMethods.define('radiology.submitSafetyScreening', {
  description: 'Complete a safety-screening QuestionnaireResponse (idempotent) and advance the order',
  phi: true,
  positionalParams: ['screeningData'],
  schemaObject: {
    type: 'object',
    properties: {
      screeningData: {
        type: 'object',
        properties: {
          questionnaireResponseId: { type: 'string' },
          questionnaireId: { type: 'string' },
          serviceRequestId: { type: 'string' },
          patientId: { type: 'string' },
          encounterId: { type: 'string' },
          items: { type: 'array' }
        },
        required: ['questionnaireId', 'serviceRequestId', 'patientId', 'items']
      }
    },
    required: ['screeningData']
  }
}, async function(params, context){
    const screeningData = get(params, 'screeningData');
    console.log('[radiology.submitSafetyScreening] Submitting screening for order:', screeningData.serviceRequestId);

    const QuestionnaireResponses = Meteor.Collections?.QuestionnaireResponses || global.Collections?.QuestionnaireResponses;
    const ServiceRequests = Meteor.Collections?.ServiceRequests || global.Collections?.ServiceRequests;

    if (!QuestionnaireResponses || !ServiceRequests) {
      throw new Meteor.Error('collection-not-found', 'Required collections not available');
    }

    const authorReference = await getAuthorReference(context.userId);

    // Resolve the target response: explicit id from the client, else lookup
    let existing = null;
    if (screeningData.questionnaireResponseId) {
      existing = await QuestionnaireResponses.findOneAsync({ _id: screeningData.questionnaireResponseId });
    }
    if (!existing) {
      existing = await findScreeningResponse(QuestionnaireResponses, screeningData.serviceRequestId, screeningData.questionnaireId);
    }

    let responseId;

    if (existing && existing.status === 'completed') {
      // Idempotent re-submit — don't duplicate supportingInfo/note pushes
      console.log('[radiology.submitSafetyScreening] Screening already completed:', existing._id);
      return existing._id;
    } else if (existing) {
      const setFields = {
        status: 'completed',
        item: screeningData.items,
        authored: new Date().toISOString()
      };
      if (authorReference) {
        setFields.author = authorReference;
      }
      await QuestionnaireResponses.updateAsync({ _id: existing._id }, { $set: setFields });
      responseId = existing._id;

      // Sweep stray concurrent drafts for the same order
      await QuestionnaireResponses.updateAsync(
        {
          'basedOn.reference': `ServiceRequest/${screeningData.serviceRequestId}`,
          questionnaire: `Questionnaire/${screeningData.questionnaireId}`,
          status: 'in-progress'
        },
        { $set: { status: 'completed' } },
        { multi: true }
      );
    } else {
      const response = {
        resourceType: 'QuestionnaireResponse',
        id: Random.id(),
        status: 'completed',
        questionnaire: `Questionnaire/${screeningData.questionnaireId}`,
        subject: { reference: `Patient/${screeningData.patientId}` },
        basedOn: [{ reference: `ServiceRequest/${screeningData.serviceRequestId}` }],
        authored: new Date().toISOString(),
        source: { reference: `Patient/${screeningData.patientId}` },
        item: screeningData.items
      };

      if (authorReference) {
        response.author = authorReference;
      }

      if (screeningData.encounterId) {
        response.encounter = { reference: `Encounter/${screeningData.encounterId}` };
      }

      response._id = response.id;

      responseId = await QuestionnaireResponses.insertAsync(response);
      console.log('[radiology.submitSafetyScreening] Created QuestionnaireResponse:', responseId);
    }

    // Advance the ServiceRequest and link the response — but never regress the
    // order (auto-complete can fire at procedure start, after status moved on),
    // and never push a duplicate link.
    const serviceRequest = await ServiceRequests.findOneAsync({ _id: screeningData.serviceRequestId });
    if (serviceRequest) {
      const responseRef = `QuestionnaireResponse/${responseId}`;
      const alreadyLinked = (get(serviceRequest, 'supportingInfo') || []).some(function(info) {
        return get(info, 'reference') === responseRef;
      });

      const modifier = {};
      if (serviceRequest.status === 'active') {
        modifier.$set = { status: 'screening-complete' };
      }
      if (!alreadyLinked) {
        modifier.$push = {
          supportingInfo: { reference: responseRef },
          note: {
            text: 'Safety screening completed',
            time: new Date().toISOString()
          }
        };
      }
      if (Object.keys(modifier).length > 0) {
        await ServiceRequests.updateAsync({ _id: screeningData.serviceRequestId }, modifier);
      }
    } else {
      console.log('[radiology.submitSafetyScreening] ServiceRequest not found, skipping status update:', screeningData.serviceRequestId);
    }

    console.log('[radiology.submitSafetyScreening] Screening complete, QuestionnaireResponse:', responseId);
    return responseId;
});

Meteor.ServerMethods.define('radiology.startProcedure', {
  description: 'Start an imaging Procedure for an order and advance the ServiceRequest to in-progress',
  phi: true,
  positionalParams: ['procedureData'],
  schemaObject: {
    type: 'object',
    properties: {
      procedureData: {
        type: 'object',
        properties: {
          serviceRequestId: { type: 'string' },
          patientId: { type: 'string' },
          encounterId: { type: 'string' },
          bodySiteId: { type: 'string' },
          modality: { type: 'string' },
          modalityDisplay: { type: 'string' }
        },
        required: ['serviceRequestId', 'patientId', 'modality']
      }
    },
    required: ['procedureData']
  }
}, async function(params, context){
    const procedureData = get(params, 'procedureData');
    console.log('[radiology.startProcedure] Starting procedure for order:', procedureData.serviceRequestId);

    const Procedures = Meteor.Collections?.Procedures || global.Collections?.Procedures;
    const ServiceRequests = Meteor.Collections?.ServiceRequests || global.Collections?.ServiceRequests;
    if (!Procedures) {
      throw new Meteor.Error('collection-not-found', 'Procedures collection not available');
    }

    // Get performer from user's practitioner
    const user = await Meteor.users.findOneAsync({ _id: context.userId });
    const performerReference = user?.practitionerId
      ? { reference: `Practitioner/${user.practitionerId}` }
      : null;

    const procedure = {
      resourceType: 'Procedure',
      id: Random.id(),
      status: 'in-progress',
      basedOn: [{ reference: `ServiceRequest/${procedureData.serviceRequestId}` }],
      code: {
        coding: [{
          system: 'http://dicom.nema.org/resources/ontology/DCM',
          code: procedureData.modality,
          display: procedureData.modalityDisplay || procedureData.modality
        }],
        text: procedureData.modalityDisplay || procedureData.modality
      },
      subject: { reference: `Patient/${procedureData.patientId}` },
      performedPeriod: {
        start: new Date().toISOString()
      }
    };

    if (performerReference) {
      procedure.performer = [{
        actor: performerReference,
        function: {
          coding: [{
            system: 'http://snomed.info/sct',
            code: '159016003',
            display: 'Radiographer'
          }],
          text: 'Technologist'
        }
      }];
    }

    if (procedureData.encounterId) {
      procedure.encounter = { reference: `Encounter/${procedureData.encounterId}` };
    }

    if (procedureData.bodySiteId) {
      procedure.bodySite = [{ reference: `BodyStructure/${procedureData.bodySiteId}` }];
    }

    procedure._id = procedure.id;

    const result = await Procedures.insertAsync(procedure);
    console.log('[radiology.startProcedure] Created Procedure:', result);

    // Advance ServiceRequest status to in-progress
    if (ServiceRequests) {
      await ServiceRequests.updateAsync(
        { _id: procedureData.serviceRequestId },
        { $set: { status: 'in-progress' } }
      );
    }

    return result;
});

Meteor.ServerMethods.define('radiology.completeProcedure', {
  description: 'Complete an imaging Procedure and create/update its ImagingStudy',
  phi: true,
  positionalParams: ['completionData'],
  schemaObject: {
    type: 'object',
    properties: {
      completionData: {
        type: 'object',
        properties: {
          procedureId: { type: 'string' },
          serviceRequestId: { type: 'string' },
          patientId: { type: 'string' },
          encounterId: { type: 'string' },
          modality: { type: 'string' },
          numberOfSeries: { type: 'number' },
          numberOfInstances: { type: 'number' },
          description: { type: 'string' }
        },
        required: ['procedureId', 'serviceRequestId', 'patientId', 'modality']
      }
    },
    required: ['completionData']
  }
}, async function(params, context){
    const completionData = get(params, 'completionData');
    console.log('[radiology.completeProcedure] Completing procedure:', completionData.procedureId);

    const Procedures = Meteor.Collections?.Procedures || global.Collections?.Procedures;
    const ImagingStudies = Meteor.Collections?.ImagingStudies || global.Collections?.ImagingStudies;
    const ServiceRequests = Meteor.Collections?.ServiceRequests || global.Collections?.ServiceRequests;

    if (!Procedures || !ImagingStudies || !ServiceRequests) {
      throw new Meteor.Error('collection-not-found', 'Required collections not available');
    }

    // Update Procedure to completed
    await Procedures.updateAsync(
      { _id: completionData.procedureId },
      {
        $set: {
          status: 'completed',
          'performedPeriod.end': new Date().toISOString()
        }
      }
    );

    // Check if an ImagingStudy already exists for this ServiceRequest (from DICOM upload)
    const serviceRequestRef = `ServiceRequest/${completionData.serviceRequestId}`;
    const existingImagingStudy = await ImagingStudies.findOneAsync({
      'basedOn.reference': serviceRequestRef
    });

    let imagingStudyId;

    if (existingImagingStudy) {
      // Update existing ImagingStudy — preserve DICOM data (series, gridfsFileIds, etc.)
      const updateFields = {
        procedureReference: { reference: `Procedure/${completionData.procedureId}` },
        modality: [{
          system: 'http://dicom.nema.org/resources/ontology/DCM',
          code: completionData.modality
        }]
      };

      if (completionData.encounterId) {
        updateFields.encounter = { reference: `Encounter/${completionData.encounterId}` };
      }

      if (completionData.description) {
        updateFields.description = completionData.description;
      }

      // Fix series-level modality: replace 'OT' defaults with correct modality
      const series = existingImagingStudy.series;
      if (Array.isArray(series)) {
        updateFields.series = series.map(function(s) {
          if (get(s, 'modality.code') === 'OT') {
            return {
              ...s,
              modality: {
                system: 'http://dicom.nema.org/resources/ontology/DCM',
                code: completionData.modality
              }
            };
          }
          return s;
        });
      }

      await ImagingStudies.updateAsync(
        { _id: existingImagingStudy._id },
        { $set: updateFields }
      );

      imagingStudyId = existingImagingStudy._id;
      console.log('[radiology.completeProcedure] Updated existing ImagingStudy:', imagingStudyId);
    } else {
      // No existing ImagingStudy — create new one
      const imagingStudy = {
        resourceType: 'ImagingStudy',
        id: Random.id(),
        status: 'available',
        subject: { reference: `Patient/${completionData.patientId}` },
        started: new Date().toISOString(),
        basedOn: [{ reference: serviceRequestRef }],
        procedureReference: { reference: `Procedure/${completionData.procedureId}` },
        modality: [{
          system: 'http://dicom.nema.org/resources/ontology/DCM',
          code: completionData.modality
        }],
        numberOfSeries: completionData.numberOfSeries || 1,
        numberOfInstances: completionData.numberOfInstances || 1
      };

      if (completionData.encounterId) {
        imagingStudy.encounter = { reference: `Encounter/${completionData.encounterId}` };
      }

      if (completionData.description) {
        imagingStudy.description = completionData.description;
      }

      imagingStudy._id = imagingStudy.id;

      imagingStudyId = await ImagingStudies.insertAsync(imagingStudy);
      console.log('[radiology.completeProcedure] Created new ImagingStudy:', imagingStudyId);
    }

    // Update ServiceRequest to completed
    await ServiceRequests.updateAsync(
      { _id: completionData.serviceRequestId },
      { $set: { status: 'completed' } }
    );

    console.log('[radiology.completeProcedure] Completed procedure:', completionData.procedureId);

    return {
      procedureId: completionData.procedureId,
      imagingStudyId: imagingStudyId
    };
});

Meteor.ServerMethods.define('radiology.cancelServiceRequest', {
  description: 'Cancel (revoke) an imaging order ServiceRequest',
  phi: true,
  positionalParams: ['cancelData'],
  schemaObject: {
    type: 'object',
    properties: {
      cancelData: {
        type: 'object',
        properties: { serviceRequestId: { type: 'string' } },
        required: ['serviceRequestId']
      }
    },
    required: ['cancelData']
  }
}, async function(params, context){
    const cancelData = get(params, 'cancelData');
    console.log('[radiology.cancelServiceRequest] Cancelling:', cancelData.serviceRequestId);

    const ServiceRequests = Meteor.Collections?.ServiceRequests || global.Collections?.ServiceRequests;
    if (!ServiceRequests) {
      throw new Meteor.Error('collection-not-found', 'ServiceRequests collection not available');
    }

    const existing = await ServiceRequests.findOneAsync({ _id: cancelData.serviceRequestId });
    if (!existing) {
      throw new Meteor.Error('not-found', 'ServiceRequest not found');
    }

    await ServiceRequests.updateAsync(
      { _id: cancelData.serviceRequestId },
      { $set: { status: 'revoked' } }
    );

    console.log('[radiology.cancelServiceRequest] Revoked:', cancelData.serviceRequestId);
    return cancelData.serviceRequestId;
});

Meteor.ServerMethods.define('radiology.hardDeleteServiceRequest', {
  description: 'Permanently delete an imaging order ServiceRequest from the database',
  phi: true,
  positionalParams: ['deleteData'],
  schemaObject: {
    type: 'object',
    properties: {
      deleteData: {
        type: 'object',
        properties: { serviceRequestId: { type: 'string' } },
        required: ['serviceRequestId']
      }
    },
    required: ['deleteData']
  }
}, async function(params, context){
    const deleteData = get(params, 'deleteData');
    console.log('[radiology.hardDeleteServiceRequest] Deleting:', deleteData.serviceRequestId);

    const ServiceRequests = Meteor.Collections?.ServiceRequests || global.Collections?.ServiceRequests;
    if (!ServiceRequests) {
      throw new Meteor.Error('collection-not-found', 'ServiceRequests collection not available');
    }

    const existing = await ServiceRequests.findOneAsync({ _id: deleteData.serviceRequestId });
    if (!existing) {
      throw new Meteor.Error('not-found', 'ServiceRequest not found');
    }

    await ServiceRequests.removeAsync({ _id: deleteData.serviceRequestId });

    console.log('[radiology.hardDeleteServiceRequest] Deleted:', deleteData.serviceRequestId);
    return deleteData.serviceRequestId;
});

// ---------------------------------------------------------------------------
// READING (Radiologist)
// ---------------------------------------------------------------------------

Meteor.ServerMethods.define('radiology.getReadingWorklist', {
  description: 'List available ImagingStudies that still need a final diagnostic report',
  phi: true
}, async function(params, context){
    console.log('[radiology.getReadingWorklist] Fetching worklist');

    const ImagingStudies = Meteor.Collections?.ImagingStudies || global.Collections?.ImagingStudies;
    const DiagnosticReports = Meteor.Collections?.DiagnosticReports || global.Collections?.DiagnosticReports;

    if (!ImagingStudies || !DiagnosticReports) {
      throw new Meteor.Error('collection-not-found', 'Required collections not available');
    }

    // Get all available imaging studies
    const studies = await ImagingStudies.find({
      status: 'available'
    }).fetchAsync();

    // Filter out studies that already have final reports
    const studyIds = studies.map(s => s._id);
    const reports = await DiagnosticReports.find({
      'imagingStudy.reference': { $in: studyIds.map(id => `ImagingStudy/${id}`) },
      status: 'final'
    }).fetchAsync();

    const reportedStudyIds = new Set(
      reports.map(r => get(r, 'imagingStudy.0.reference', '').replace('ImagingStudy/', ''))
    );

    const unreportedStudies = studies.filter(s => !reportedStudyIds.has(s._id));

    return unreportedStudies;
});

Meteor.ServerMethods.define('radiology.addFinding', {
  description: 'Add a radiology finding (Observation) derived from an ImagingStudy',
  phi: true,
  positionalParams: ['findingData'],
  schemaObject: {
    type: 'object',
    properties: {
      findingData: {
        type: 'object',
        properties: {
          imagingStudyId: { type: 'string' },
          patientId: { type: 'string' },
          encounterId: { type: 'string' },
          code: { type: 'string' },
          codeDisplay: { type: 'string' },
          valueString: { type: 'string' },
          bodySiteCode: { type: 'string' },
          bodySiteDisplay: { type: 'string' },
          note: { type: 'string' }
        },
        required: ['imagingStudyId', 'patientId', 'code']
      }
    },
    required: ['findingData']
  }
}, async function(params, context){
    const findingData = get(params, 'findingData');
    console.log('[radiology.addFinding] Adding finding for study:', findingData.imagingStudyId);

    const Observations = Meteor.Collections?.Observations || global.Collections?.Observations;
    if (!Observations) {
      throw new Meteor.Error('collection-not-found', 'Observations collection not available');
    }

    // Get performer from user's practitioner
    const user = await Meteor.users.findOneAsync({ _id: context.userId });
    const performerReference = user?.practitionerId
      ? [{ reference: `Practitioner/${user.practitionerId}` }]
      : [];

    const observation = {
      resourceType: 'Observation',
      id: Random.id(),
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'imaging',
          display: 'Imaging'
        }],
        text: 'Imaging'
      }],
      code: {
        coding: [{
          code: findingData.code,
          display: findingData.codeDisplay || findingData.code
        }],
        text: findingData.codeDisplay || findingData.code
      },
      subject: { reference: `Patient/${findingData.patientId}` },
      effectiveDateTime: new Date().toISOString(),
      performer: performerReference,
      derivedFrom: [{ reference: `ImagingStudy/${findingData.imagingStudyId}` }]
    };

    if (findingData.encounterId) {
      observation.encounter = { reference: `Encounter/${findingData.encounterId}` };
    }

    if (findingData.valueString) {
      observation.valueString = findingData.valueString;
    }

    if (findingData.bodySiteCode) {
      observation.bodySite = {
        coding: [{
          code: findingData.bodySiteCode,
          display: findingData.bodySiteDisplay || findingData.bodySiteCode
        }],
        text: findingData.bodySiteDisplay || findingData.bodySiteCode
      };
    }

    if (findingData.note) {
      observation.note = [{ text: findingData.note }];
    }

    observation._id = observation.id;

    const result = await Observations.insertAsync(observation);
    console.log('[radiology.addFinding] Created Observation:', result);

    return result;
});

Meteor.ServerMethods.define('radiology.signReport', {
  description: 'Sign/finalize a radiology DiagnosticReport for an ImagingStudy',
  phi: true,
  positionalParams: ['reportData'],
  schemaObject: {
    type: 'object',
    properties: {
      reportData: {
        type: 'object',
        properties: {
          imagingStudyId: { type: 'string' },
          serviceRequestId: { type: 'string' },
          procedureId: { type: 'string' },
          patientId: { type: 'string' },
          encounterId: { type: 'string' },
          observationIds: { type: 'array' },
          conclusion: { type: 'string' },
          conclusionCodes: { type: 'array' },
          reportHtml: { type: 'string' }
        },
        required: ['imagingStudyId', 'serviceRequestId', 'procedureId', 'patientId', 'observationIds', 'conclusion']
      }
    },
    required: ['reportData']
  }
}, async function(params, context){
    const reportData = get(params, 'reportData');
    console.log('[radiology.signReport] Signing report for study:', reportData.imagingStudyId);

    const DiagnosticReports = Meteor.Collections?.DiagnosticReports || global.Collections?.DiagnosticReports;
    const Procedures = Meteor.Collections?.Procedures || global.Collections?.Procedures;

    if (!DiagnosticReports || !Procedures) {
      throw new Meteor.Error('collection-not-found', 'Required collections not available');
    }

    // Get interpreter from user's practitioner
    const user = await Meteor.users.findOneAsync({ _id: context.userId });
    const interpreterReference = user?.practitionerId
      ? [{ reference: `Practitioner/${user.practitionerId}` }]
      : [];

    const report = {
      resourceType: 'DiagnosticReport',
      id: Random.id(),
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
          code: 'RAD',
          display: 'Radiology'
        }],
        text: 'Radiology'
      }],
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '18748-4',
          display: 'Diagnostic imaging report'
        }],
        text: 'Diagnostic imaging report'
      },
      subject: { reference: `Patient/${reportData.patientId}` },
      basedOn: [{ reference: `ServiceRequest/${reportData.serviceRequestId}` }],
      effectiveDateTime: new Date().toISOString(),
      issued: new Date().toISOString(),
      performer: interpreterReference,
      resultsInterpreter: interpreterReference,
      result: reportData.observationIds.map(id => ({ reference: `Observation/${id}` })),
      imagingStudy: [{ reference: `ImagingStudy/${reportData.imagingStudyId}` }],
      conclusion: reportData.conclusion
    };

    if (reportData.encounterId) {
      report.encounter = { reference: `Encounter/${reportData.encounterId}` };
    }

    if (reportData.conclusionCodes && reportData.conclusionCodes.length > 0) {
      report.conclusionCode = reportData.conclusionCodes.map(code => ({
        coding: [{ code: code.code, display: code.display }],
        text: code.display
      }));
    }

    if (reportData.reportHtml) {
      report.presentedForm = [{
        contentType: 'text/html',
        data: Buffer.from(reportData.reportHtml).toString('base64')
      }];
    }

    // Check for existing report linked to this ImagingStudy
    const existingReport = await DiagnosticReports.findOneAsync({
      'imagingStudy.reference': `ImagingStudy/${reportData.imagingStudyId}`,
      'category.coding.code': 'RAD'
    });

    let reportId;
    if (existingReport) {
      // Update existing report
      reportId = existingReport._id;
      report.id = reportId;
      report._id = reportId;

      await DiagnosticReports.updateAsync(
        { _id: reportId },
        { $set: {
          status: report.status,
          conclusion: report.conclusion,
          conclusionCode: report.conclusionCode,
          result: report.result,
          performer: report.performer,
          resultsInterpreter: report.resultsInterpreter,
          issued: report.issued,
          effectiveDateTime: report.effectiveDateTime,
          presentedForm: report.presentedForm
        }}
      );
      console.log('[radiology.signReport] Updated existing DiagnosticReport:', reportId);
    } else {
      // Insert new report
      report._id = report.id;
      reportId = await DiagnosticReports.insertAsync(report);
      console.log('[radiology.signReport] Created new DiagnosticReport:', reportId);
    }

    // Link report to Procedure
    await Procedures.updateAsync(
      { _id: reportData.procedureId },
      { $set: { report: [{ reference: `DiagnosticReport/${reportId}` }] } }
    );

    return reportId;
});

// ---------------------------------------------------------------------------
// QUALITY MEASURES
// ---------------------------------------------------------------------------

Meteor.ServerMethods.define('radiology.calculateTurnaroundTime', {
  description: 'Compute the order-to-report turnaround time for a completed radiology report',
  phi: true,
  positionalParams: ['serviceRequestId', 'diagnosticReportId'],
  schemaObject: {
    type: 'object',
    properties: {
      serviceRequestId: { type: 'string' },
      diagnosticReportId: { type: 'string' }
    },
    required: ['serviceRequestId', 'diagnosticReportId']
  }
}, async function(params, context){
    const serviceRequestId = get(params, 'serviceRequestId');
    const diagnosticReportId = get(params, 'diagnosticReportId');
    console.log('[radiology.calculateTurnaroundTime] Calculating for:', { serviceRequestId, diagnosticReportId });

    const ServiceRequests = Meteor.Collections?.ServiceRequests || global.Collections?.ServiceRequests;
    const DiagnosticReports = Meteor.Collections?.DiagnosticReports || global.Collections?.DiagnosticReports;

    if (!ServiceRequests || !DiagnosticReports) {
      throw new Meteor.Error('collection-not-found', 'Required collections not available');
    }

    const order = await ServiceRequests.findOneAsync({ _id: serviceRequestId });
    const report = await DiagnosticReports.findOneAsync({ _id: diagnosticReportId });

    if (!order || !report) {
      throw new Meteor.Error('not-found', 'Order or report not found');
    }

    const orderTime = new Date(order.authoredOn);
    const reportTime = new Date(report.issued);
    const turnaroundMs = reportTime - orderTime;
    const turnaroundMinutes = Math.round(turnaroundMs / 60000);

    return {
      serviceRequestId,
      diagnosticReportId,
      orderTime: order.authoredOn,
      reportTime: report.issued,
      turnaroundMinutes,
      turnaroundHours: Math.round(turnaroundMinutes / 60 * 10) / 10
    };
});

// ---------------------------------------------------------------------------
// ENRICHED WORKLIST METHODS
// ---------------------------------------------------------------------------

Meteor.ServerMethods.define('radiology.getTechWorklist', {
  description: 'List imaging orders enriched with in-progress Procedure status for the tech worklist',
  phi: true
}, async function(params, context){
    console.log('[radiology.getTechWorklist] Fetching enriched tech worklist');

    const ServiceRequests = Meteor.Collections?.ServiceRequests || global.Collections?.ServiceRequests;
    const Procedures = Meteor.Collections?.Procedures || global.Collections?.Procedures;

    if (!ServiceRequests) {
      throw new Meteor.Error('collection-not-found', 'ServiceRequests collection not available');
    }

    // Get all imaging orders (not just active, for the "All" tab)
    const orders = await ServiceRequests.find({
      'category.coding.code': '363679005'
    }, { sort: { authoredOn: -1 }, limit: 200 }).fetchAsync();

    // Get in-progress procedures to annotate orders
    let procedureMap = {};
    if (Procedures) {
      const procedures = await Procedures.find({
        status: 'in-progress'
      }).fetchAsync();

      procedures.forEach(function(proc) {
        const basedOn = get(proc, 'basedOn.0.reference', '');
        const orderId = basedOn.replace('ServiceRequest/', '');
        if (orderId) {
          procedureMap[orderId] = {
            procedureId: proc._id,
            status: proc.status,
            startedAt: get(proc, 'performedPeriod.start', '')
          };
        }
      });
    }

    // Enrich each order with procedure info
    const enriched = orders.map(function(order) {
      const procedureInfo = procedureMap[order._id] || null;
      return {
        ...order,
        _procedureInfo: procedureInfo,
        _hasInProgressProcedure: !!procedureInfo
      };
    });

    return enriched;
});

// ---------------------------------------------------------------------------
// DEPARTMENT STATISTICS
// ---------------------------------------------------------------------------

Meteor.ServerMethods.define('radiology.getDepartmentStatistics', {
  description: 'Return real-time radiology department counts by order/report/resource status',
  // Was guard-less pre-migration; requireAuth now applies (default true) — it
  // aggregates counts across patient-scoped collections. phi:true defensively
  // (counts derive from patient data, though only totals are returned).
  phi: true
}, async function(params, context){
    console.log('[radiology.getDepartmentStatistics] Fetching department stats');

    const Patients = Meteor.Collections?.Patients || global.Collections?.Patients;
    const ServiceRequests = Meteor.Collections?.ServiceRequests || global.Collections?.ServiceRequests;
    const DiagnosticReports = Meteor.Collections?.DiagnosticReports || global.Collections?.DiagnosticReports;
    const ImagingStudies = Meteor.Collections?.ImagingStudies || global.Collections?.ImagingStudies;
    const Procedures = Meteor.Collections?.Procedures || global.Collections?.Procedures;

    // Patient count
    let patientCount = 0;
    if (Patients) {
      patientCount = await Patients.find({}).countAsync();
    }

    // ServiceRequest (imaging orders) counts by status
    let ordersActive = 0;
    let ordersCompleted = 0;
    let ordersOnHold = 0;
    let ordersCancelled = 0;

    if (ServiceRequests) {
      ordersActive = await ServiceRequests.find({
        'category.coding.code': '363679005',
        status: 'active'
      }).countAsync();

      ordersCompleted = await ServiceRequests.find({
        'category.coding.code': '363679005',
        status: 'completed'
      }).countAsync();

      ordersOnHold = await ServiceRequests.find({
        'category.coding.code': '363679005',
        status: 'on-hold'
      }).countAsync();

      ordersCancelled = await ServiceRequests.find({
        'category.coding.code': '363679005',
        status: { $in: ['revoked', 'entered-in-error'] }
      }).countAsync();
    }

    // DiagnosticReport counts by status
    let reportsRegistered = 0;
    let reportsPreliminary = 0;
    let reportsFinal = 0;
    let reportsCancelled = 0;

    if (DiagnosticReports) {
      reportsRegistered = await DiagnosticReports.find({
        status: 'registered'
      }).countAsync();

      reportsPreliminary = await DiagnosticReports.find({
        status: 'preliminary'
      }).countAsync();

      reportsFinal = await DiagnosticReports.find({
        status: 'final'
      }).countAsync();

      reportsCancelled = await DiagnosticReports.find({
        status: { $in: ['cancelled', 'entered-in-error'] }
      }).countAsync();
    }

    // Other resource totals
    let imagingStudyCount = 0;
    let procedureCount = 0;

    if (ImagingStudies) {
      imagingStudyCount = await ImagingStudies.find({}).countAsync();
    }

    if (Procedures) {
      procedureCount = await Procedures.find({}).countAsync();
    }

    return {
      patients: patientCount,
      orders: {
        active: ordersActive,
        completed: ordersCompleted,
        onHold: ordersOnHold,
        cancelled: ordersCancelled,
        total: ordersActive + ordersCompleted + ordersOnHold + ordersCancelled
      },
      reads: {
        unread: reportsRegistered,
        inProgress: reportsPreliminary,
        finalized: reportsFinal,
        cancelled: reportsCancelled,
        total: reportsRegistered + reportsPreliminary + reportsFinal + reportsCancelled
      },
      imagingStudies: imagingStudyCount,
      procedures: procedureCount,
      lastUpdated: new Date()
    };
});

Meteor.ServerMethods.define('radiology.generateMonthlyMeasureReport', {
  description: 'Generate a monthly radiology-department MeasureReport for the given year and month',
  positionalParams: ['year', 'month'],
  schemaObject: {
    type: 'object',
    properties: { year: { type: 'number' }, month: { type: 'number' } },
    required: ['year', 'month']
  }
}, async function(params, context){
    const year = get(params, 'year');
    const month = get(params, 'month');
    console.log(`[radiology.generateMonthlyMeasureReport] Generating for ${year}-${month}`);

    const MeasureReports = Meteor.Collections?.MeasureReports || global.Collections?.MeasureReports;
    if (!MeasureReports) {
      throw new Meteor.Error('collection-not-found', 'MeasureReports collection not available');
    }

    // Calculate period dates
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0, 23, 59, 59, 999);

    // Get current stats snapshot
    const stats = await Meteor.callAsync('radiology.getDepartmentStatistics');

    // Create MeasureReport
    const measureReport = {
      resourceType: 'MeasureReport',
      id: Random.id(),
      status: 'complete',
      type: 'summary',
      measure: 'Measure/radiology-department-monthly',
      date: new Date().toISOString(),
      period: {
        start: periodStart.toISOString(),
        end: periodEnd.toISOString()
      },
      group: [
        {
          code: {
            coding: [{
              system: 'http://honeycomb.ehr/measure-groups',
              code: 'orders',
              display: 'Orders'
            }],
            text: 'Orders'
          },
          population: [
            {
              code: {
                coding: [{ system: 'http://honeycomb.ehr/population', code: 'active', display: 'Active' }],
                text: 'Active'
              },
              count: stats.orders.active
            },
            {
              code: {
                coding: [{ system: 'http://honeycomb.ehr/population', code: 'completed', display: 'Completed' }],
                text: 'Completed'
              },
              count: stats.orders.completed
            },
            {
              code: {
                coding: [{ system: 'http://honeycomb.ehr/population', code: 'on-hold', display: 'On Hold' }],
                text: 'On Hold'
              },
              count: stats.orders.onHold
            },
            {
              code: {
                coding: [{ system: 'http://honeycomb.ehr/population', code: 'cancelled', display: 'Cancelled' }],
                text: 'Cancelled'
              },
              count: stats.orders.cancelled
            }
          ]
        },
        {
          code: {
            coding: [{
              system: 'http://honeycomb.ehr/measure-groups',
              code: 'reads',
              display: 'Reads'
            }],
            text: 'Reads'
          },
          population: [
            {
              code: {
                coding: [{ system: 'http://honeycomb.ehr/population', code: 'unread', display: 'Unread' }],
                text: 'Unread'
              },
              count: stats.reads.unread
            },
            {
              code: {
                coding: [{ system: 'http://honeycomb.ehr/population', code: 'in-progress', display: 'In Progress' }],
                text: 'In Progress'
              },
              count: stats.reads.inProgress
            },
            {
              code: {
                coding: [{ system: 'http://honeycomb.ehr/population', code: 'finalized', display: 'Finalized' }],
                text: 'Finalized'
              },
              count: stats.reads.finalized
            },
            {
              code: {
                coding: [{ system: 'http://honeycomb.ehr/population', code: 'cancelled', display: 'Cancelled' }],
                text: 'Cancelled'
              },
              count: stats.reads.cancelled
            }
          ]
        },
        {
          code: {
            coding: [{
              system: 'http://honeycomb.ehr/measure-groups',
              code: 'resources',
              display: 'Resources'
            }],
            text: 'Resources'
          },
          population: [
            {
              code: {
                coding: [{ system: 'http://honeycomb.ehr/population', code: 'patients', display: 'Patients' }],
                text: 'Patients'
              },
              count: stats.patients
            },
            {
              code: {
                coding: [{ system: 'http://honeycomb.ehr/population', code: 'imaging-studies', display: 'Imaging Studies' }],
                text: 'Imaging Studies'
              },
              count: stats.imagingStudies
            },
            {
              code: {
                coding: [{ system: 'http://honeycomb.ehr/population', code: 'procedures', display: 'Procedures' }],
                text: 'Procedures'
              },
              count: stats.procedures
            }
          ]
        }
      ]
    };

    measureReport._id = measureReport.id;

    const result = await MeasureReports.insertAsync(measureReport);
    console.log('[radiology.generateMonthlyMeasureReport] Created MeasureReport:', result);

    return result;
});

Meteor.ServerMethods.define('radiology.getMonthlyHistory', {
  description: 'List the last N monthly radiology-department MeasureReports',
  // Was guard-less pre-migration; requireAuth now applies (default true) — it
  // reads department MeasureReports (aggregate summaries, no direct PHI).
  positionalParams: ['months'],
  schemaObject: {
    type: 'object',
    properties: { months: { type: 'number' } }
  }
}, async function(params, context){
    const months = get(params, 'months');
    const limit = months || 6;

    console.log(`[radiology.getMonthlyHistory] Fetching last ${limit} months`);

    const MeasureReports = Meteor.Collections?.MeasureReports || global.Collections?.MeasureReports;
    if (!MeasureReports) {
      return [];
    }

    const reports = await MeasureReports.find({
      measure: 'Measure/radiology-department-monthly'
    }, {
      sort: { 'period.start': -1 },
      limit: limit
    }).fetchAsync();

    return reports;
});

Meteor.ServerMethods.define('radiology.getEnrichedReadingWorklist', {
  description: 'List ImagingStudies enriched with order priority/reason and reading status for the radiologist worklist',
  phi: true
}, async function(params, context){
    console.log('[radiology.getEnrichedReadingWorklist] Fetching enriched reading worklist');

    const ImagingStudies = Meteor.Collections?.ImagingStudies || global.Collections?.ImagingStudies;
    const DiagnosticReports = Meteor.Collections?.DiagnosticReports || global.Collections?.DiagnosticReports;
    const ServiceRequests = Meteor.Collections?.ServiceRequests || global.Collections?.ServiceRequests;

    if (!ImagingStudies) {
      throw new Meteor.Error('collection-not-found', 'ImagingStudies collection not available');
    }

    // Get all imaging studies
    const studies = await ImagingStudies.find({}, {
      sort: { started: -1 },
      limit: 200
    }).fetchAsync();

    // Build report status map
    let reportStatusMap = {};
    if (DiagnosticReports) {
      const reports = await DiagnosticReports.find({
        'category.coding.code': 'RAD'
      }).fetchAsync();

      reports.forEach(function(report) {
        const studyRef = get(report, 'imagingStudy.0.reference', '');
        const studyId = studyRef.replace('ImagingStudy/', '');
        if (studyId) {
          reportStatusMap[studyId] = report.status;
        }
      });
    }

    // Build ServiceRequest map for priority/reason
    let serviceRequestMap = {};
    if (ServiceRequests) {
      const srs = await ServiceRequests.find({
        'category.coding.code': '363679005'
      }).fetchAsync();

      srs.forEach(function(sr) {
        serviceRequestMap[sr._id] = {
          priority: get(sr, 'priority', 'routine'),
          reasonCode: get(sr, 'reasonCode.0.text', get(sr, 'reasonCode.0.coding.0.display', '')),
          description: get(sr, 'code.text', get(sr, 'code.coding.0.display', ''))
        };
      });
    }

    // Enrich each study
    const enriched = studies.map(function(study) {
      const basedOnRef = get(study, 'basedOn.0.reference', '');
      const serviceRequestId = basedOnRef.replace('ServiceRequest/', '');
      const orderContext = serviceRequestMap[serviceRequestId] || {};
      const reportStatus = reportStatusMap[study._id] || null;

      let readingStatus = 'unread';
      if (reportStatus === 'final') {
        readingStatus = 'reported';
      } else if (reportStatus === 'preliminary') {
        readingStatus = 'in-progress';
      }

      return {
        ...study,
        _orderPriority: orderContext.priority || 'routine',
        _orderReasonCode: orderContext.reasonCode || '',
        _orderDescription: orderContext.description || '',
        _readingStatus: readingStatus,
        _reportStatus: reportStatus
      };
    });

    return enriched;
});

console.log('[radiology-workflow] Server methods registered');
