# clinical:vital-signs

HL7 FHIR Vital Signs Implementation Guide for Meteor/Honeycomb

## Overview

This package implements the HL7 FHIR US Core Vital Signs profiles (v2.0.0) for the Honeycomb healthcare platform. It provides comprehensive support for recording, displaying, and managing vital signs observations following the FHIR R4 standard.

## Features

- **Complete FHIR Vital Signs Support**
  - Blood pressure (with systolic, diastolic, mean arterial pressure)
  - Heart rate / pulse
  - Body temperature
  - Respiratory rate
  - Oxygen saturation
  - Body weight
  - Body height / length
  - Body mass index (BMI)
  - Head circumference
  - Vital signs panel (grouped observations)

- **Qualifying Extensions**
  - Body position during measurement
  - Exercise association
  - Measurement device details
  - Measurement setting/location
  - Sleep status
  - Associated situation

- **Rich UI Components**
  - Vital signs data entry form with validation
  - Summary panel showing current vital signs
  - Historical table view with sorting and filtering
  - Trend charts with normal range indicators
  - Responsive design for all form factors

- **Value Set Support**
  - UCUM units for all measurements
  - SNOMED CT codes for devices and qualifiers
  - LOINC codes for vital sign types
  - Comprehensive body position and cuff size value sets

## Installation

```bash
meteor add clinical:vital-signs
```

## Usage

### Basic Usage

```javascript
import { VitalSigns, VitalSignsSchemas } from 'meteor/clinical:vital-signs';

// Create a new blood pressure observation
const bloodPressure = {
  resourceType: 'Observation',
  status: 'final',
  category: [{
    coding: [{
      system: 'http://terminology.hl7.org/CodeSystem/observation-category',
      code: 'vital-signs'
    }]
  }],
  code: {
    coding: [{
      system: 'http://loinc.org',
      code: '85354-9',
      display: 'Blood pressure panel'
    }]
  },
  subject: {
    reference: 'Patient/123'
  },
  component: [
    {
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '8480-6',
          display: 'Systolic blood pressure'
        }]
      },
      valueQuantity: {
        value: 120,
        unit: 'mm[Hg]',
        system: 'http://unitsofmeasure.org'
      }
    },
    {
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '8462-4',
          display: 'Diastolic blood pressure'
        }]
      },
      valueQuantity: {
        value: 80,
        unit: 'mm[Hg]',
        system: 'http://unitsofmeasure.org'
      }
    }
  ]
};

// Validate and save
await Meteor.callAsync('VitalSigns.create', bloodPressure);
```

### Using Extensions

```javascript
// Add body position extension
bloodPressure.extension = [{
  url: 'http://hl7.org/fhir/us/vitals/StructureDefinition/BodyPositionExt',
  valueCodeableConcept: {
    coding: [{
      system: 'http://snomed.info/sct',
      code: '33586001',
      display: 'Sitting position'
    }]
  }
}];
```

### React Components

```jsx
import { VitalSignsPanel, VitalSignsTable, VitalSignForm } from 'meteor/clinical:vital-signs/client';

// Display current vital signs
<VitalSignsPanel 
  vitalSigns={vitalSigns}
  patientId={patientId}
/>

// Show vital signs history
<VitalSignsTable
  vitalSigns={vitalSigns}
  onSelectVitalSign={handleSelect}
/>

// Data entry form
<VitalSignForm
  patientId={patientId}
  onSubmit={handleSubmit}
/>
```

### Utilities

```javascript
import { 
  VitalSignsValidator,
  UnitConverter,
  VitalSignsFactory 
} from 'meteor/clinical:vital-signs/lib/utilities';

// Validate vital signs
const validation = VitalSignsValidator.validateBloodPressure(120, 80);
// Returns: { isValid: true, interpretation: 'Normal blood pressure' }

// Convert units
const fahrenheit = UnitConverter.celsiusToFahrenheit(37);
// Returns: 98.6

// Create vital sign observations
const heartRate = VitalSignsFactory.createHeartRate({
  value: 72,
  patientReference: 'Patient/123'
});
```

## Server Methods

- `VitalSigns.create` - Create a new vital sign observation
- `VitalSigns.update` - Update an existing vital sign
- `VitalSigns.delete` - Soft delete a vital sign (marks as entered-in-error)
- `VitalSigns.remove` - Hard delete (admin only)
- `VitalSigns.restore` - Restore a soft-deleted vital sign

## Publications

- `VitalSigns.byPatient` - Vital signs for a specific patient
- `VitalSigns.recent` - Recent vital signs across patients
- `VitalSigns.single` - Single vital sign by ID
- `VitalSigns.panel` - Vital sign panels
- `VitalSigns.latest` - Latest reading for each vital sign type

## Configuration

The package works out of the box but can be configured through Meteor settings:

```json
{
  "private": {
    "vitalSigns": {
      "enableAutoCalculation": true,
      "defaultUnits": {
        "temperature": "Cel",
        "weight": "kg",
        "height": "cm"
      },
      "normalRanges": {
        "adult": {
          "systolicBP": { "min": 90, "max": 140 },
          "diastolicBP": { "min": 60, "max": 90 }
        }
      }
    }
  }
}
```

## FHIR Compliance

This package implements the following FHIR profiles:
- http://hl7.org/fhir/us/vitals/StructureDefinition/vital-signs-panel
- http://hl7.org/fhir/us/vitals/StructureDefinition/blood-pressure-panel
- http://hl7.org/fhir/us/vitals/StructureDefinition/body-weight
- http://hl7.org/fhir/us/vitals/StructureDefinition/body-temperature
- http://hl7.org/fhir/us/vitals/StructureDefinition/heart-rate
- http://hl7.org/fhir/us/vitals/StructureDefinition/respiratory-rate
- http://hl7.org/fhir/us/vitals/StructureDefinition/oxygen-saturation
- http://hl7.org/fhir/us/vitals/StructureDefinition/bmi
- http://hl7.org/fhir/us/vitals/StructureDefinition/body-height
- http://hl7.org/fhir/us/vitals/StructureDefinition/body-length
- http://hl7.org/fhir/us/vitals/StructureDefinition/head-circumference

## Testing

```bash
# Run package tests
meteor test-packages ./packages/vital-signs

# Run with driver package
meteor test-packages ./packages/vital-signs --driver-package meteortesting:mocha
```

## License

MIT License

## Contributing

Contributions are welcome! Please ensure all changes maintain FHIR compliance and include appropriate tests.