<!-- .claude/ralph/jsonschema-migration-prompt.md -->
# JSON Schema migration loop — one file per iteration

Pick the FIRST file matching:
  grep -rL "createFhirCollection" imports/lib/schemas/SimpleSchemas/*.js | sort | head -1
(This selects files not yet converted — 77 still have `new SimpleSchema`
blocks, 17 carry only a dead `simpl-schema` import, and DeviceUseStatements.js
has neither and just needs the factory swap.)
If no file matches, the loop is COMPLETE: run `./scripts/verify-schema-migration.sh`
(must exit 0), then `npm test`, then STOP.

For the selected file:
1. Read it fully. Inventory: every export, every non-schema statement
   (helpers, createIndex calls, custom transforms, constants).
2. Rewrite following the exemplar `imports/lib/schemas/SimpleSchemas/Observations.js`
   (committed as "refactor(schemas): convert Observations to createFhirCollection"):
   - Keep: BaseModel class + `_collection` + `_transform` wiring, file-header
     comment, ALL non-schema code found in step 1, collection + model export names.
   - Replace `new Mongo.Collection('<Name>')` with
     `createFhirCollection('<ResourceType>', '<Name>')` — resourceType is the
     singular FHIR name (file PlanDefinitions.js → 'PlanDefinition' + 'PlanDefinitions').
   - Delete: all `new SimpleSchema({...})` blocks, the commented-out
     attachSchema line, `simpl-schema` import, unused
     `meteor/clinical:hl7-resource-datatypes` schema imports.
   - Remove schema-object exports (XxxSchema, XxxDstu2, XxxStu3, XxxR4).
3. grep repo-wide for the removed export names; fix each consumer
   (Schema.validate/clean → FhirValidator.validateResource; bare imports → delete).
4. Verify: `./scripts/verify-schema-migration.sh <file>` must print OK.
5. Commit ONLY the files you touched (the working tree carries unrelated
   uncommitted changes — NEVER `git add -A`):
   `git add <schema-file> [<consumer-files>] && git commit -m "refactor(schemas): convert <Name> to createFhirCollection"`
6. Every 10th iteration additionally: boot check —
   `timeout 300 meteor run --settings settings/settings.honeycomb.localhost.json`
   until "App running at" appears (then kill it). If boot fails, fix before continuing.
   (macOS: no `timeout` binary — run meteor in background, poll
   `curl -s http://localhost:3000/baseR4/metadata` until it answers, then
   `pkill -f "meteor run"`.)

RULES: One file per iteration. Never modify JSON schema files. Never rename
files or collection exports. If a file doesn't fit the template (unexpected
exports, logic you don't understand), SKIP it, append its path + reason to
`.claude/ralph/jsonschema-migration-skipped.md`, and continue; skipped files
are handled by a human.
