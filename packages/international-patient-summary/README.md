# International Patient Summary (IPS) Package

This package implements the HL7 FHIR International Patient Summary (IPS) specification for the Honeycomb framework.

## Overview

The International Patient Summary (IPS) is a minimal and non-exhaustive patient summary specialty-agnostic, condition-independent, but readily usable by clinicians for the cross-border unscheduled care of a patient.

## Features

### Two Layout Modes

1. **Single Column Layout** - Traditional tablet-optimized view with tabbed sections
2. **Dual Column Layout** - Fullscreen view with structured data on left and narrative editor on right

### IPS Sections

According to the HL7 FHIR IPS Implementation Guide, the following sections are included:

#### Required Sections
- Problem List - Current clinical problems or conditions
- Allergies and Intolerances - Relevant allergies with reaction types and criticality
- Medication Summary - Current and relevant medications

#### Recommended Sections
- Immunizations - Immunization status and history
- Diagnostic Results - Laboratory, pathology, and radiology results
- History of Procedures - Past procedures relevant to the IPS scope
- Medical Devices - History of medical device use

#### Optional Sections
- Vital Signs - Recent vital signs including BP, temperature, heart rate
- Social History - Tobacco use, alcohol use, and other social factors
- History of Pregnancy - Pregnancy status and history summary
- Advance Directives - Patient's advance directives with supporting documents
- Functional Status - Capability to perform activities of daily living
- Plan of Care - Expectations for care including proposals and goals
- History of Past Problems - Resolved conditions no longer being tracked

## Usage

The package automatically adds a route at `/international-patient-summary` and a sidebar workflow item labeled "International Summary".

### Data Sources

The IPS viewer pulls data from the following Honeycomb collections:
- Conditions (for Problem List and Past Problems)
- AllergyIntolerances
- MedicationStatements and MedicationRequests
- Immunizations
- Observations (for Diagnostic Results and Vital Signs)
- DiagnosticReports
- Procedures
- DeviceUseStatements and Devices

### Future Enhancements

- LLM-powered narrative generation from structured IPS data
- IPS Bundle export in standard FHIR format
- IPS Bundle import functionality
- SMART on FHIR sharing capabilities
- Cross-border data exchange support

## Installation

This package is included with Honeycomb and will be automatically loaded.

## Configuration

No additional configuration is required. The package uses the patient selected in the main Honeycomb interface.

## Compliance

This implementation follows the HL7 FHIR International Patient Summary Implementation Guide v1.1.0.