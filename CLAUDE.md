# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Honeycomb3 is a full-stack FHIR (Fast Healthcare Interoperability Resources) framework built on Meteor.js. It provides a TEFCA-compliant FHIR server, consent management, and SMART on FHIR support.

**Tech Stack**: Meteor v3 + React 18 + Material-UI v5 + MongoDB + FHIR R4

## Quick Start

```bash
# Run locally
meteor run --settings configs/settings.honeycomb.localhost.json

# Run tests
npm test
```

## Claude Code Workflow

Comprehensive guidance is organized in `.claude/`:

### Commands (Slash Commands)
- `/create-crud-microservice {Resource}` - Generate complete FHIR resource implementation
- `/create-crud-tests {Resource}` - Generate 9-test CRUD pattern
- `/create-npm-workflow {Name}` - Scaffold new NPM workflow package
- `/add-patient-context-to-tests {file}` - Fix test context management
- `/audit-id-lookups` - Scan for ID collision bugs
- `/audit-theme` - Scan for dark mode issues
- `/healthit-checklist {topic}` - Generate paranoia checklist

### Agents (Specialized Subagents)
- `fhir-schema-expert` - FHIR R4, SMART 2.x, ONC (g)(10), schema migration
- `test-stabilizer` - Nightwatch stability, Material-UI testing
- `patient-context-debugger` - Session state, subscription patterns
- `theme-auditor` - Light/dark mode compliance
- `healthit-auditor` - ONC (g)(10) certification

### Hooks (Automatic Verification)
- `post-tool-use-id-lookup.md` - Detects `_id||id` anti-pattern (runs after edits)
- `post-tool-use-theme.md` - Detects hardcoded colors (runs after edits)
- `post-tool-use-async.md` - Checks Meteor v3 async patterns (runs after edits)
- `verify-tests.md` - Smart test triggers (asks before running tests)

### Rules (Detailed Patterns)
- `.claude/rules/anti-patterns/` - Critical bugs to avoid
- `.claude/rules/fhir/` - FHIR resource implementation
- `.claude/rules/testing/` - E2E test patterns
- `.claude/rules/ui/` - Material-UI v5, theming, responsive
- `.claude/rules/meteor/` - Meteor v3 async, collections
- `.claude/rules/npm-packages/` - NPM workflow package patterns

## NPM Workflow Packages

The `npmPackages/` directory contains NPM-based workflow packages that are replacing Atmosphere.js packages. This enables plugin-style architecture using standard NPM tooling.

### Running with Extra Workflows

```bash
EXTRA_WORKFLOWS=@node-on-fhir/example-workflow meteor run --settings configs/settings.honeycomb.localhost.json
```

### Creating New Workflows

Use the `/create-npm-workflow` command:
```
/create-npm-workflow MyWorkflow
```

Or copy the template package:
```bash
cp -r npmPackages/example-workflow npmPackages/my-workflow
```

**More details**: See `npmPackages/CLAUDE.md` for comprehensive documentation on:
- Package structure and exports
- workflow.json configuration
- Server methods with Meteor v3 async
- WorkflowRegistry integration
- Migration from Atmosphere.js

## Critical Anti-Pattern: ID Lookup with OR Logic

**NEVER use OR logic when looking up records by ID.** This is the #1 bug in Honeycomb and causes ID collisions.

```javascript
// ❌ WRONG - Can match multiple records causing ID collisions!
const patientId = get(patient, 'id') || get(patient, '_id');
const record = collection.find(p => p.id === value || p._id === value);

// ✅ CORRECT - Use MongoDB _id (primary key) only
const patientId = get(patient, '_id');
const record = collection.find(p => p._id === value);
```

**Why**: After data transformation (e.g., `flattenPatient()`), records have **BOTH** `_id` (MongoDB primary key) and `id` (FHIR identifier). Using OR logic can match multiple records:

```javascript
{
  _id: '5832e8a0ea861706b1857c49',  // MongoDB primary key
  id: '23c65305-e7da-3fa8-e7c9-92d6199dd40e'  // FHIR identifier
}
```

Using OR logic (`||`) can cause catastrophic ID collisions:
- Patient A: `{ _id: 'abc123', id: 'xyz789' }`
- Patient B: `{ _id: 'xyz789', id: 'def456' }`
- Looking up `'xyz789'` with OR logic matches **BOTH** patients!
- `.find()` returns whichever comes first (wrong patient)

**Real-World Impact:** This bug caused test patients to open the wrong patient details page, showing "Kylee Leannon" instead of the test patient. With 293+ patients in the database, ID collisions are inevitable.

**When You Need FHIR ID:**

Get it from the found record after lookup, don't use it for the lookup itself:

```javascript
// Find by MongoDB _id
const patient = Patients.findOne({ _id: mongoId });

// Then extract FHIR id for navigation or display
const fhirId = patient.id;
navigate(`/patients/${fhirId}`);
```

**MongoDB _id is the source of truth** for all record lookups. FHIR `id` is just a field and should only be used for:
- Display purposes
- FHIR API compliance
- Navigation URLs (after lookup)

**More details**: See `.claude/rules/anti-patterns/id-lookup.md`

## Critical Anti-Pattern: Secrets in Source Code

**NEVER hardcode API keys, tokens, passwords, or credentials in source files.** Always pass secrets via `Meteor.settings` (loaded from a settings JSON file) or environment variables. Settings files containing real credentials must be `.gitignored`.

```javascript
// ❌ WRONG - Secret committed to git history
const apiKey = 'pk.eyJ1IjoibWFwYm94IiwiYSI6...';
const url = `https://api.example.com?key=sk_live_abc123`;

// ✅ CORRECT - Read from Meteor.settings (private)
const apiKey = get(Meteor, 'settings.private.googleMaps.apiKey', '');

// ✅ CORRECT - Read from environment variable
const apiKey = process.env.GOOGLE_MAPS_API_KEY;
```

**Settings file pattern** (`configs/settings.*.json`):
```json
{
  "private": {
    "googleMaps": {
      "apiKey": ""
    }
  }
}
```

**Why this matters:**
- GitHub push protection blocks pushes containing detected secrets
- Secrets in git history persist even after the code is changed — scrubbing requires force-push rebases
- Healthcare applications face HIPAA/compliance scrutiny for credential exposure

**If you need a third-party API key**, create a Meteor method that reads it server-side from `Meteor.settings.private` and returns only the data the client needs (or the key itself if the client must call the API directly).

## Development Guidelines

### Meteor v3 Async (Server-Side)
```javascript
// ❌ WRONG: Synchronous (Meteor v2)
const record = Observations.findOne({ _id: id });

// ✅ CORRECT: Async (Meteor v3)
const record = await Observations.findOneAsync({ _id: id });
```

**More details**: See `.claude/rules/meteor/v3-async.md`

### Material-UI Theming
```javascript
// ❌ WRONG: Hardcoded colors (breaks dark mode)
<Box sx={{ backgroundColor: '#ffffff', color: '#000000' }} />

// ✅ CORRECT: Theme tokens
<Box sx={{ backgroundColor: 'background.paper', color: 'text.primary' }} />
```

**More details**: See `.claude/rules/ui/theming.md`

### React Navigation
```javascript
// ❌ WRONG: Full page reload
window.location.href = '/patients';

// ✅ CORRECT: React Router
const navigate = useNavigate();
navigate('/patients');
```

**More details**: See `.claude/rules/anti-patterns/navigation.md`

## Additional Patterns

For comprehensive guidance on:
- **FHIR Resources**: See `.claude/rules/fhir/resource-implementation.md`
- **Patient Filtering**: See `.claude/rules/fhir/patient-filtering.md`
- **Test Patterns**: See `.claude/rules/testing/crud-patterns.md`
- **Theme Compliance**: See `.claude/rules/ui/theming.md`
- **All Anti-Patterns**: See `.claude/rules/anti-patterns/`

Use `/audit-id-lookups` and `/audit-theme` commands to scan the codebase for common issues 

## Coding Style

- **Meteor v3**: Use async/await on server (`findOneAsync`, `insertAsync`, `updateAsync`, `removeAsync`)
- **Function syntax**: Prefer `function() {}` over arrow functions for Meteor methods (preserves `this` context)
- **Lodash**: Use `get()` and `set()` for circuit breaker pattern; import functions explicitly, not `_`
- **Date/time**: Use `moment` library
- **HTTP calls**: Use `meteor/fetch` package
- **Routing**: Use `useNavigate()` hook, never `window.location.href`
- **Console**: Use full gamut (`console.warn`, `console.error`, `console.group`, etc.)
- **Conditionals**: Always balance if/then with console messages, don't silently swallow
- **File headers**: Add path/name as first line (commented out)
- **No bundlers**: Don't suggest webpack, vite, etc. (Meteor has built-in bundler)
- **No index.js**: Avoid directory index files

## Healthy Paranoia Checklist Format

When discussing risky technical implementations, use `/healthit-checklist {topic}` or this format:

```markdown
### Healthy Paranoia Checklist: [Topic]

**What could still go wrong:**
- 🎯 [Specific technical risk]
- 💥 [Infrastructure/deployment concern]
- 🐛 [Likely bug or edge case]
- 📱 [Platform/device-specific issue]
- 🔒 [Security/compliance/regulatory worry]
- 😭 [Nightmare scenario]

**But remember:** [What's actually working and why that's significant]
```

This validates concerns while maintaining perspective.

