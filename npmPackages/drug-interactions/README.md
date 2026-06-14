# Drug Interactions Package

ONC §170.315(a)(4) - Drug-Drug and Drug-Allergy Interaction Checking

## Overview

This package provides drug-drug and drug-allergy interaction checking capabilities for the Honeycomb platform, meeting ONC Health IT Certification requirements for §170.315(a)(4).

## Features

### Drug-Drug Interaction Checking
- Checks for interactions between multiple medications
- Severity-based alerts (contraindicated, severe, moderate, minor)
- Provides mechanism of interaction and management recommendations
- Based on PDDI-CDS (Potential Drug-Drug Interaction Clinical Decision Support) guidelines

### Drug-Allergy Interaction Checking
- Checks medications against documented allergies
- Identifies contraindicated medications based on allergy profiles
- Provides cross-reactivity information
- Suggests alternative medications when applicable

## ONC Certification Compliance

This module meets ONC §170.315(a)(4) requirements by:

1. **Interventions**: Automatically checking for drug-drug and drug-allergy interactions
2. **Notifications**: Providing severity-based alerts at the point of care
3. **Information Source**: Using evidence-based interaction data from PDDI-CDS
4. **Adjustability**: Supporting configurable severity thresholds
5. **Audit Logging**: Creating FHIR AuditEvent resources for all checks

## FHIR Resources

The package works with the following FHIR resources:

- **MedicationRequest**: Orders being checked
- **AllergyIntolerance**: Patient allergy information
- **DetectedIssue**: Interaction alerts created
- **AuditEvent**: Audit trail of interaction checks

## Usage

### Routes

- `/drug-interactions` - Main interaction checker interface
- `/drug-interactions/drug-drug` - Drug-drug interaction checking
- `/drug-interactions/drug-allergy` - Drug-allergy interaction checking

### Methods

```javascript
// Check for drug-drug interactions
Meteor.call('drugInteractions.checkDrugDrug', medications, (error, interactions) => {
  if (!error) {
    console.log('Found interactions:', interactions);
  }
});

// Check for drug-allergy interactions
Meteor.call('drugInteractions.checkDrugAllergy', medications, allergies, (error, interactions) => {
  if (!error) {
    console.log('Found interactions:', interactions);
  }
});

// Create a DetectedIssue resource
Meteor.call('drugInteractions.createDetectedIssue', interactionData, (error, result) => {
  if (!error) {
    console.log('Created DetectedIssue:', result);
  }
});
```

## Configuration

Add to your settings file:

```json
{
  "public": {
    "modules": {
      "drugInteractions": {
        "enabled": true,
        "showInWorkflows": true,
        "severityThreshold": "moderate",
        "checkOnOrderEntry": true,
        "checkOnOrderSign": true
      }
    }
  }
}
```

## Interaction Database

The package includes a curated database of clinically significant interactions including:

### High-Priority Drug-Drug Interactions
- Warfarin + NSAIDs (bleeding risk)
- Warfarin + Amiodarone (INR elevation)
- Digoxin + Loop diuretics (toxicity risk)
- Digoxin + Cyclosporine (level increase)
- NSAIDs + Corticosteroids (GI bleeding)
- ACE inhibitors + K-sparing diuretics (hyperkalemia)
- Simvastatin + CYP3A4 inhibitors (rhabdomyolysis)

### Common Drug Allergies
- Penicillin allergy (includes amoxicillin, ampicillin)
- Sulfonamide allergy (includes Bactrim, some diuretics)
- NSAID allergy (includes ibuprofen, naproxen, ketorolac)
- Opioid allergies (codeine cross-reactivity)

## Testing

The package includes test scenarios for ONC certification:

1. **Drug-Drug Test**: Warfarin + Aspirin → Severe bleeding risk alert
2. **Drug-Allergy Test**: Penicillin allergy + Amoxicillin → Contraindicated alert
3. **Multiple Interactions**: Check 3+ medications for complex interactions
4. **Audit Trail**: Verify AuditEvent creation for all checks

## Integration with CPOE

This package integrates with the order-catalog CPOE package to provide real-time interaction checking during order entry and order signing workflows.

## References

- [ONC §170.315(a)(4) Test Method](https://www.healthit.gov/test-method/drug-drug-drug-allergy-interaction-checks-cpoe#ccg)
- [PDDI-CDS Implementation Guide](http://hl7.org/fhir/uv/pddi/2020SEP/index.html)
- [CDS Hooks Specification](https://cds-hooks.org/)

## License

Copyright (c) 2024 Clinical Meteor
Licensed under MIT License