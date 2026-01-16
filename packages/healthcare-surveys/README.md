# Healthcare Surveys Package

This package implements the FHIR Healthcare Surveys Reporting Implementation Guide for Meteor applications.

## Overview

The Healthcare Surveys package supports the National Health Care Surveys (NHCS) by enabling automated extraction and submission of healthcare data from EHR systems to the National Center for Health Statistics (NCHS).

## Features

- FHIR R4.0.1 compliant profiles for healthcare survey reporting
- Support for emergency department, inpatient, and outpatient encounters
- Automated data collection and reporting
- USCDI Version 3.0 alignment
- US Core 6.1.0 profile compatibility

## Installation

```bash
meteor add clinical:healthcare-surveys
```

## Usage

### Schemas

The package provides SimpleSchema definitions for all FHIR profiles:

```javascript
import { HcsComposition } from 'meteor/clinical:healthcare-surveys';
import { HcsMedicationAdministration } from 'meteor/clinical:healthcare-surveys';
```

### Value Sets

Access predefined value sets:

```javascript
import { CareTeamFunctionValueSet } from 'meteor/clinical:healthcare-surveys';
import { ParticipationFunctionValueSet } from 'meteor/clinical:healthcare-surveys';
```

## License

MIT