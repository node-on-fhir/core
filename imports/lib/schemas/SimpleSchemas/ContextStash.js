// imports/lib/schemas/SimpleSchemas/ContextStash.js
//
// ContextStash — the per-user FHIR stash behind the ContextSidebar panel
// (Ctrl/Cmd+Shift+P). PRIVATE collection: deliberately NOT registered in
// Meteor.Collections / global.Collections / autopublish maps, so it never
// surfaces through REST, the exporter dropdowns, or the resource census.
// Access is exclusively via the contextStash.* server methods and the
// contextStash.mine publication (both userId-guarded).
//
// Doc shape (spec: fable/superpowers/specs/2026-11-07-context-sidebar-design.md):
//   { _id, userId, patientId, kind: 'fhir'|'text', resourceType, label,
//     summary, payload, bytes, source: { route, sessionKey }, pinned, createdAt }
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

export const ContextStash = new Mongo.Collection('ContextStash');

if (Meteor.isServer) {
  Meteor.startup(async function() {
    await ContextStash.createIndexAsync({ userId: 1, createdAt: -1 });
    // TTL backstop (24h): the explicit expiry paths (CLEAR PATIENT, logout)
    // are authoritative; this net bounds PHI residue if a session simply
    // never ends (abandoned tab, crashed client).
    await ContextStash.createIndexAsync({ createdAt: 1 }, { expireAfterSeconds: 86400 });
  });
}

export default ContextStash;
