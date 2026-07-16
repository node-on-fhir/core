// npmPackages/pacio-core/server/methods/dnrOrder.js
//
// DNR code-status quick-order for the clinician workflow on the Advance
// Directives page. A patient's DNR *preference* lives in the advance-directive
// Consent/DocumentReference; the actual code-status *order* is a ServiceRequest
// coded ICD-10-CM Z66 ("Do not resuscitate"), which is what CMS1317v1's
// numerator Path 3 looks for ("Intervention, Order": Z66 → FHIR ServiceRequest,
// authoredOn during the encounter).
//
// Role-gated: only users in settings.public.pacio.dnrOrderRoles (default
// ['practitioner', 'admin']) may place the order. The client hides the prompt
// for other users, but this server-side check is the real guard.

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Roles } from 'meteor/alanning:roles';
import { Random } from 'meteor/random';
import { get } from 'lodash';

const log = (Meteor.Logger ? Meteor.Logger.for('pacio-dnr-order') : console);

function patientRefs(patientId) {
  return ['Patient/' + patientId, 'urn:uuid:' + patientId];
}

Meteor.methods({
  /**
   * Create a DNR code-status order (ServiceRequest, ICD-10-CM Z66) for a patient.
   * Idempotent: if an active Z66 order already exists, returns it instead of
   * creating a duplicate. Links to the patient's in-progress encounter when
   * one exists (CMS1317 Path 3 requires authoredOn during the encounter).
   *
   * @param {String} patientId - Patient id (loaders set _id = id)
   * @returns {{ serviceRequestId: String, encounterId: String|null, alreadyExisted: Boolean }}
   */
  'pacio.createDnrOrder': async function(patientId) {
    check(patientId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to place an order');
    }

    const allowedRoles = get(Meteor, 'settings.public.pacio.dnrOrderRoles', ['practitioner', 'admin']);
    if (!Roles.userIsInRole(this.userId, allowedRoles)) {
      throw new Meteor.Error('practitioner-only',
        'DNR code-status orders can only be placed by a clinician (roles: ' + allowedRoles.join(', ') + ')');
    }

    const ServiceRequests = get(global, 'Collections.ServiceRequests');
    if (!ServiceRequests || typeof ServiceRequests.insertAsync !== 'function') {
      throw new Meteor.Error('collection-not-available', 'ServiceRequests collection not available');
    }

    // Idempotency: don't stack duplicate active DNR orders
    const existing = await ServiceRequests.findOneAsync({
      'subject.reference': { $in: patientRefs(patientId) },
      'code.coding.code': 'Z66',
      status: 'active'
    });
    if (existing) {
      log.info('Active DNR order already exists; not duplicating', { serviceRequestId: existing._id });
      return { serviceRequestId: existing._id, encounterId: get(existing, 'encounter.reference', null), alreadyExisted: true };
    }

    // Link the order to the current admission when one exists, so it lands
    // inside the encounter window the quality measure evaluates.
    let encounterId = null;
    const Encounters = get(global, 'Collections.Encounters');
    if (Encounters && typeof Encounters.findOneAsync === 'function') {
      const activeEncounter = await Encounters.findOneAsync({
        'subject.reference': { $in: patientRefs(patientId) },
        status: 'in-progress'
      }, { sort: { 'period.start': -1 } });
      if (activeEncounter) {
        encounterId = get(activeEncounter, 'id', activeEncounter._id);
      } else {
        log.info('No in-progress encounter found; DNR order created without encounter link', { patientId });
      }
    }

    // Attribute the order to the ordering user
    const user = await Meteor.users.findOneAsync({ _id: this.userId });
    const requesterDisplay = get(user, 'profile.name') ||
      get(user, 'username') ||
      get(user, 'emails[0].address', 'Ordering clinician');

    const newId = Random.id();
    const serviceRequest = {
      _id: newId,
      id: newId,
      resourceType: 'ServiceRequest',
      status: 'active',
      intent: 'order',
      code: {
        coding: [{
          system: 'http://hl7.org/fhir/sid/icd-10-cm',
          code: 'Z66',
          display: 'Do not resuscitate'
        }],
        text: 'Do Not Resuscitate (DNR) code-status order'
      },
      subject: { reference: 'Patient/' + patientId },
      authoredOn: new Date().toISOString(),
      requester: { display: requesterDisplay },
      meta: {
        lastUpdated: new Date(),
        versionId: '1'
      }
    };

    if (encounterId) {
      serviceRequest.encounter = { reference: 'Encounter/' + encounterId };
    }

    await ServiceRequests.insertAsync(serviceRequest);
    log.phi('DNR code-status order created', { serviceRequestId: newId, patientId, encounterId }, { action: 'create' });

    return { serviceRequestId: newId, encounterId: encounterId, alreadyExisted: false };
  }
});

console.log('[pacio-core] DNR order methods registered'); // phi-audit: ok
