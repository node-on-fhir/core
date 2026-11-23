// imports/lib/contextSidebar/contextSidebarStore.js
//
// Client singleton for the ContextSidebar (FHIR stash panel). Owns panel
// open state (Session-backed, reactive), the current-selection holder that
// pages feed for Ctrl/Cmd+Shift+X stashing, and the stash helpers that call
// the contextStash.* server methods. Paste-mode target registry lands in
// Phase 2 — getActiveTarget() is a stub until then.
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import lodash from 'lodash';
import { CONTEXT_SIDEBAR_OPEN } from '/imports/lib/SessionKeys.js';
import { isFhirResource, deriveLabel, deriveSummary } from '/imports/lib/contextSidebar/fhirDisplay.js';

const get = lodash.get;

const log = Meteor.Logger ? Meteor.Logger.for('context-sidebar') : console;

// Transient UI signal for the stash toast (panel shows UNDO); local UI
// state, not a cross-package Session contract.
const LAST_STASH_KEY = 'contextSidebarLastStash';

let currentSelection = null; // { resource, meta } — pages call setCurrentSelection

export const contextSidebarStore = {

  // --- panel state -------------------------------------------------------
  isOpen() {
    return !!Session.get(CONTEXT_SIDEBAR_OPEN);
  },
  open() {
    Session.set(CONTEXT_SIDEBAR_OPEN, true);
  },
  close() {
    Session.set(CONTEXT_SIDEBAR_OPEN, false);
  },
  toggle() {
    Session.set(CONTEXT_SIDEBAR_OPEN, !Session.get(CONTEXT_SIDEBAR_OPEN));
  },
  // Phase 1: browse only. Phase 2 returns the registered usePasteTarget.
  getActiveTarget() {
    return null;
  },

  // --- current selection (fed by pages; consumed by Ctrl/Cmd+Shift+X) -----
  setCurrentSelection(resource, meta) {
    currentSelection = resource ? { resource: resource, meta: meta || {} } : null;
  },
  getCurrentSelection() {
    return currentSelection;
  },

  // --- stashing ------------------------------------------------------------
  async stashResource(resource, meta) {
    if (!isFhirResource(resource)) {
      throw new Meteor.Error('not-a-resource', 'Only FHIR resources (objects with a resourceType) can be stashed as fhir items');
    }
    const payload = JSON.parse(JSON.stringify(resource)); // deep-copied snapshot
    const item = {
      kind: 'fhir',
      resourceType: payload.resourceType,
      label: get(meta, 'label', '') || deriveLabel(payload),
      summary: deriveSummary(payload),
      payload: payload,
      patientId: Session.get('selectedPatientId') || null,
      source: {
        route: window.location.pathname,
        sessionKey: get(meta, 'sessionKey', null)
      }
    };
    const result = await Meteor.rpc('contextStash.add', { item: item });
    Session.set(LAST_STASH_KEY, {
      _id: get(result, '_id'),
      label: item.label,
      resourceType: item.resourceType,
      at: new Date()
    });
    log.info('stashed resource', { resourceType: item.resourceType, route: item.source.route });
    return get(result, '_id');
  },

  async stashText(text, meta) {
    const value = String(text || '');
    if (!value.trim()) {
      throw new Meteor.Error('empty-text', 'Nothing to stash');
    }
    const item = {
      kind: 'text',
      resourceType: null,
      label: get(meta, 'label', '') || value.substring(0, 60),
      summary: get(meta, 'summary', '') || 'not FHIR',
      payload: value,
      patientId: Session.get('selectedPatientId') || null,
      source: {
        route: window.location.pathname,
        sessionKey: get(meta, 'sessionKey', null)
      }
    };
    const result = await Meteor.rpc('contextStash.add', { item: item });
    Session.set(LAST_STASH_KEY, {
      _id: get(result, '_id'),
      label: item.label,
      resourceType: 'Text',
      at: new Date()
    });
    return get(result, '_id');
  },

  // Stash a set of resources — as ONE collection Bundle by default (the
  // handoff's "Stash as Bundle"), or each separately with asBundle: false.
  async stashResources(resources, meta) {
    const list = (Array.isArray(resources) ? resources : []).filter(isFhirResource);
    if (list.length === 0) {
      throw new Meteor.Error('nothing-to-stash', 'No FHIR resources to stash');
    }
    if (get(meta, 'asBundle', true) !== false) {
      const bundle = {
        resourceType: 'Bundle',
        type: 'collection',
        total: list.length,
        entry: list.map(function(resource) { return { resource: resource }; })
      };
      return await this.stashResource(bundle, meta);
    }
    const ids = [];
    for (const resource of list.slice(0, 20)) {
      ids.push(await this.stashResource(resource, meta));
    }
    return ids;
  },

  // Stash raw clipboard/drop content: JSON with a resourceType → fhir tile,
  // everything else → text tile.
  async stashUnknown(raw, meta) {
    const text = String(raw || '').trim();
    if (!text) {
      throw new Meteor.Error('empty-text', 'Nothing to stash');
    }
    try {
      const parsed = JSON.parse(text);
      if (isFhirResource(parsed)) {
        return await this.stashResource(parsed, meta);
      }
    } catch (error) {
      // fall through — not JSON
    }
    return await this.stashText(text, meta);
  },

  // --- stash-the-selection entry point (Ctrl/Cmd+Shift+X) -----------------
  async stashCurrentSelection() {
    const selection = this.getCurrentSelection();
    if (selection) {
      return await this.stashResource(selection.resource, selection.meta);
    }
    const selectedPatient = Session.get('selectedPatient');
    if (isFhirResource(selectedPatient)) {
      return await this.stashResource(selectedPatient, { sessionKey: 'selectedPatient' });
    }
    return null; // caller shows the "nothing selected" notice
  },

  LAST_STASH_KEY: LAST_STASH_KEY
};

export default contextSidebarStore;
