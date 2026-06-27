# @node-on-fhir/allergy-testing

A guided Material-UI workflow for viewing and entering a patient's allergies as
FHIR `AllergyIntolerance` resources. Route: **`/allergy-testing`**.

## Features

- **Current Allergies** — patient-scoped list (reuses the core `AllergyIntolerancesTable`).
- **Test Panels** — Default ⊂ Standard ⊂ Deluxe allergen checklists; creates one
  `AllergyIntolerance` per positive result (`allergyTesting.submitPanel`).
- **Self-Report** — single-allergen form (reuses the core `AllergyIntoleranceFormView`,
  writes via `createAllergyIntolerance`).
- **No Known Allergies** — records the US Core sentinel (SNOMED `716186003`, confirmed).

Verification status follows the registrar: provider entries → `confirmed`,
patient self-reports → `unconfirmed`.

## Run

```bash
EXTRA_WORKFLOWS=@node-on-fhir/allergy-testing meteor run --settings settings/settings.honeycomb.localhost.json
```

Optionally gate via `settings.public.modules.allergyTesting.enabled` (default `true`).

## Reuses (does not recreate)

- Collection/schema `AllergyIntolerances`, dehydrator `flattenAllergyIntolerance`,
  and methods `createAllergyIntolerance` / `updateAllergyIntolerance` from the core app.
- Allergen panel data lives in `lib/allergyPanels.js` (isomorphic, SNOMED-coded).
