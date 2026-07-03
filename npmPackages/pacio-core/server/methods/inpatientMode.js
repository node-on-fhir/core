// npmPackages/pacio-core/server/methods/inpatientMode.js
//
// Facility "inpatient mode" flag. The canonical value lives server-side in
// Meteor.settings.private.pacio.inpatientMode (NOT public — the client reads it
// only through these methods). The ServerConfiguration panel displays and toggles
// it; toggling mutates the in-memory Meteor.settings.private so the change takes
// effect without a restart (it is not persisted to the settings file).
//
// Future: a ServerConfiguration database collection (a running, persisted log of
// MeteorSettings overrides) may supersede the settings value. The read/write seams
// below are marked so that store can be layered in without changing callers.

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get, set } from 'lodash';

const log = (Meteor.Logger ? Meteor.Logger.for('inpatientMode') : console);

Meteor.methods({
  'pacio.getInpatientMode': async function() {
    // TODO(server-config-db): when a persisted ServerConfiguration collection
    // exists, read the inpatient-mode override from it first (await the DB), and
    // fall back to Meteor.settings only when no override is stored.
    const inpatientMode = get(Meteor, 'settings.private.pacio.inpatientMode', false);
    return !!inpatientMode;
  },

  'pacio.setInpatientMode': async function(enabled) {
    check(enabled, Boolean);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in to change inpatient mode.');
    }

    // Adjust the in-memory representation of Meteor.settings.private. This is
    // process-local and does not survive a restart (the settings file is the
    // source of truth on boot).
    set(Meteor, 'settings.private.pacio.inpatientMode', enabled);

    // TODO(server-config-db): persist this change to a ServerConfiguration
    // collection so it survives restarts and produces an auditable history.

    log.debug('setInpatientMode inpatient mode set to', { enabled, userId: this.userId });
    return enabled;
  }
});

console.log('[pacio-core] inpatient mode methods registered'); // phi-audit: ok
