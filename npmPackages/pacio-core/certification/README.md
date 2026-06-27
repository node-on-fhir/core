# Certification & Conformance Testing

## Inferno test kits (July 2026 CMS Connectathon, PACIO track)

Run the PACIO Inferno test kits against a locally running honeycomb instance
(`http://localhost:3000/baseR4` — see `inferno.config.json` for the input
values; load sample data first via the "Load Connectathon Data" footer button
or `Meteor.call('pacio.loadConnectathonData')`).

| Kit | Covers | Repo |
|-----|--------|------|
| Unified PACIO test kit | All PACIO IGs | https://github.com/paciowg/pacio-test-kit |
| ToC test kit | Transitions of Care STU1 | https://github.com/paciowg/pacio-toc-test-kit |
| PFE test kit | Personal Functioning & Engagement STU2 | https://github.com/paciowg/pacio-pfe-test-kit |
| SMP test kit | Standardized Medication Profile STU1 | https://github.com/paciowg/pacio-smp-test-kit |

IG versions tested at the July 2026 Connectathon: ToC **STU1**, ADI **CI
build** (v2.0.0-ballot), PFE **STU2**, SMP STU1.

`inferno.config.json` previously pointed at the shared reference server
(`http://www.care-commons.app/baseR4`); switch the `url` input back to that
value to test against the shared environment instead of localhost.

## ONC §170.315 tests

Nightwatch scenario tests for (b)(1), (b)(2), and (e)(3) live in
`../tests/nightwatch/`.
