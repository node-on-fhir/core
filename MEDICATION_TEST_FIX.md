# Medication Administration Test Fix

## Issue
The medication administration test was failing at test 05 because data was not being saved to the database. The collection count was 0 after save.

## Root Cause
The MedicationAdministration and MedicationRequest resources were missing from the private REST configuration in the settings file, even though they were enabled in the public modules section.

## Solution
Added both resources to the REST configuration in `/configs/settings.honeycomb.localhost.json`:

```json
"MedicationAdministration": {
  "interactions": [
    "read",
    "create",
    "update",
    "delete",
    "search"
  ],
  "search": true,
  "publication": true
},
"MedicationRequest": {
  "interactions": [
    "read",
    "create",
    "update",
    "delete",
    "search"
  ],
  "search": true,
  "publication": true
},
```

## Required Action
**IMPORTANT**: You must restart the Meteor server for these settings changes to take effect:

1. Stop the current Meteor process (Ctrl+C)
2. Start it again with: `meteor run --settings configs/settings.honeycomb.localhost.json`

## Verification
After restarting, run the medication administration test again:
```bash
npx nightwatch tests/nightwatch/honeycomb/crud.medicationadministrations.js
```

The test should now pass completely as the data will be properly saved and published.

## Key Learning
For FHIR resources to work properly in this application, they must be configured in THREE places in the settings file:
1. `public.defaults.autopublish: true` (already set)
2. `public.modules.fhir.{ResourceName}: true` (already set)
3. `private.fhir.rest.{ResourceName}` with interactions and publication settings (was missing)

Without the REST configuration, the resources won't be properly published even with autopublish enabled.