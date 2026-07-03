# CLAUDE.md — @node-on-fhir/checklist-manifesto

Migrated from Atmosphere `clinical:checklist-manifesto` (2026-06-13). Checklist /
protocol management (surgical-safety-checklist style). Route `/checklist-manifesto`.

## Notes

- Richer structure: `ui/` (pages + components), `lib/collections/`
  (ChecklistTasks, ChecklistLists), `server/methods/*` + `server/publications/*`.
- The Atmosphere client mainModule was `client/index.js` (collections + re-export
  of index.jsx); consolidated into a self-contained `client.js` that registers
  the collections, builds routes/sidebar from workflow.json, and re-exports the
  collections + page. `index.jsx` and `client/index.js` are carried but vestigial.
- Kept existing `server/index.js` (collections + methods/* + publications/* +
  `Meteor.startup` system-template seeding). `serverEntry: ./server`.
- iconName `checklist`→`Checklist`. `moment` peer (present). Monorepo-tracked →
  fresh `git init`.
