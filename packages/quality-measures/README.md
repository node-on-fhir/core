# Quality Measures Package

Clinical Quality Measures (CQMs) for ONC §170.315(c)(1-4) Certification

## Overview

This package implements comprehensive Clinical Quality Measure calculation and reporting, integrating with industry-standard CQL execution engines and QRDA reporting tools. It provides a unified interface for measure calculation, automated numerator recording, and quality reporting.

## Integration with Tacoma Libraries

This package integrates with four powerful libraries from the workzone/tacoma directory:

### 1. **cql-execution** 
- Core CQL execution engine
- Evaluates Clinical Quality Language expressions
- Supports CQL 1.4 and 1.5 specifications
- TypeScript/JavaScript implementation

### 2. **cqm-execution**
- Clinical Quality Measures execution
- Built on cql-execution
- Supports QDM (Quality Data Model) based measures
- Includes measure calculation algorithms

### 3. **fqm-execution**
- FHIR Quality Measure execution
- FHIR-native measure calculation
- Supports FHIR R4 resources
- Implements measure scoring algorithms (proportion, ratio, continuous-variable, cohort)

### 4. **cqm-reports**
- QRDA (Quality Reporting Document Architecture) generation
- Supports QRDA Category I (patient-level) and Category III (aggregate)
- Import/export capabilities for quality reporting

## Features

### Core Capabilities
- **Measure Calculation**: Automated calculation using CQL logic
- **Population Criteria**: Initial population, denominator, numerator, exclusions, exceptions
- **Scoring Types**: Proportion, ratio, continuous variable, and cohort measures
- **FHIR Native**: Uses FHIR MeasureReport resources
- **Multi-Format Export**: FHIR, QRDA I/III, CSV, JSON

### Advanced Features
- **Automated Numerator Recording**: Real-time capture of quality events
- **Gaps in Care**: Identify care gaps and generate recommendations
- **Data Requirements**: Calculate required data elements for measures
- **Stratification**: Support for measure stratifiers
- **Risk Adjustment**: Supplemental data elements for risk adjustment

## ONC Certification Compliance

### §170.315(c)(1) - CQMs - Record and Export
- Captures quality data during care delivery
- Exports in QRDA Category I format
- Maintains audit trail of all recordings

### §170.315(c)(2) - CQMs - Import and Calculate
- Imports QRDA Category I, C-CDA, and FHIR bundles
- Calculates measures using CQL execution engine
- Supports batch calculation

### §170.315(c)(3) - CQMs - Report
- Generates QRDA Category III aggregate reports
- Creates FHIR MeasureReport resources
- Supports multiple reporting formats

### §170.315(c)(4) - Quality Management System
- Comprehensive quality tracking
- Performance monitoring
- Automated measure calculation

## User Interface

Information-dense dashboard inspired by:
- **Edward Tufte**: The Visual Display of Quantitative Information
- **Borries Schwesinger**: The Form Book

### UI Components
- **Measure List**: Available CMS measures with current scores
- **Calculation Engine**: Real-time measure calculation with progress tracking
- **Population Waterfall**: Visual breakdown of population criteria
- **Results Dashboard**: Comprehensive view of all measure results
- **Export Manager**: Multi-format export capabilities

## Usage

### Routes
- `/quality-measures` - Main quality measures dashboard

### Methods

```javascript
// Calculate a measure
Meteor.call('qualityMeasures.calculate', {
  measureId: 'CMS122v12',
  periodStart: '2024-01-01',
  periodEnd: '2024-12-31',
  reportType: 'summary',  // or 'individual', 'stratified'
  patientId: 'patient-123' // for individual reports
}, callback);

// Export measure reports
Meteor.call('qualityMeasures.export', {
  measureIds: ['CMS122v12', 'CMS165v12'],
  format: 'qrda3', // or 'fhir', 'qrda1', 'csv', 'json'
  periodStart: '2024-01-01',
  periodEnd: '2024-12-31'
}, callback);

// Import quality data
Meteor.call('qualityMeasures.import', {
  format: 'fhir', // or 'qrda1', 'c-cda'
  data: bundleJsonString
}, callback);

// Record automated numerator
Meteor.call('qualityMeasures.recordNumerator', {
  measureId: 'CMS146v11',
  patientId: 'patient-456',
  value: true,
  reason: 'Strep test performed',
  encounter: 'encounter-789'
}, callback);
```

## CQL Integration

### CQL Expression Evaluation
```cql
library ExampleMeasure version '1.0.0'

using FHIR version '4.0.1'

parameter "Measurement Period" Interval<DateTime>

context Patient

define "Initial Population":
  exists [Encounter: "Office Visit"] E
    where E.period during "Measurement Period"

define "Denominator":
  "Initial Population"

define "Numerator":
  exists [Observation: "HbA1c Test"] O
    where O.effective during "Measurement Period"
      and O.value < 9 '%'
```

### Library Management
- Stores CQL libraries and their ELM representations
- Manages library dependencies
- Supports library versioning

## Measure Calculation Process

### 1. Data Collection
- Retrieve patient data based on data requirements
- Fetch relevant value sets
- Load CQL libraries

### 2. CQL Execution
- Parse CQL to ELM (Expression Logical Model)
- Execute population criteria expressions
- Evaluate each patient against criteria

### 3. Score Calculation
- Apply scoring algorithm based on measure type
- Calculate performance rates
- Apply stratifications if defined

### 4. Report Generation
- Create FHIR MeasureReport
- Generate QRDA documents
- Export in requested format

## Population Criteria Semantics

| Population Type | Description | Used In |
|----------------|-------------|---------|
| Initial Population | All patients/episodes to evaluate | All measures |
| Denominator | Subset eligible for measure | Proportion, Ratio |
| Denominator Exclusion | Remove from denominator | Proportion, Ratio |
| Denominator Exception | Clinical exceptions | Proportion only |
| Numerator | Met measure criteria | Proportion, Ratio |
| Numerator Exclusion | Remove from numerator | Proportion, Ratio |
| Measure Population | Base for continuous variable | Continuous Variable |
| Measure Observation | Aggregation function | Continuous Variable, Ratio |

## Scoring Algorithms

### Proportion
```
Score = (Numerator - Numerator Exclusion) / 
        (Denominator - Denominator Exclusion - Denominator Exception)
```

### Ratio
```
Score = aggregate(Numerator) / aggregate(Denominator)
```

### Continuous Variable
```
Score = aggregate_function(Measure Observations)
```

## Value Set Management

- Integration with VSAC (Value Set Authority Center)
- Local value set caching
- Support for multiple code systems (SNOMED, ICD-10, CPT, LOINC)

## Configuration

Add to your settings file:

```json
{
  "public": {
    "modules": {
      "qualityMeasures": {
        "enabled": true,
        "showInWorkflows": true,
        "defaultMeasureYear": 2024,
        "enableAutomatedRecording": true,
        "enableGapsInCare": true
      }
    }
  },
  "private": {
    "vsac": {
      "apiKey": "YOUR_VSAC_API_KEY"
    }
  }
}
```

## Testing

The package includes comprehensive test coverage:

1. **Measure Calculation**: Validates population criteria evaluation
2. **CQL Execution**: Tests CQL expression evaluation
3. **QRDA Generation**: Validates QRDA document structure
4. **Import/Export**: Round-trip testing of data formats
5. **Automated Recording**: Tests numerator capture

## Development with Tacoma Libraries

To use the full capabilities:

1. Install the tacoma libraries:
```bash
npm install --save cql-execution@^3.0.0
npm install --save cqm-execution@^4.1.0
npm install --save fqm-execution@^2.0.0
```

2. For QRDA reports (Ruby-based), set up the service:
```bash
gem install cqm-reports
```

3. Configure the CQL translator:
```bash
# Download cql-to-elm translator
wget https://github.com/cqframework/clinical_quality_language/releases/latest/download/cql-to-elm.jar
```

## Supported CMS Measures

- CMS2 - Preventive Care and Screening
- CMS22 - High Blood Pressure Screening
- CMS69 - BMI Screening and Follow-Up
- CMS90 - Functional Status Assessments
- CMS117 - Childhood Immunization Status
- CMS122 - Diabetes: HbA1c Poor Control
- CMS125 - Breast Cancer Screening
- CMS130 - Colorectal Cancer Screening
- CMS146 - Appropriate Testing for Pharyngitis
- CMS165 - Controlling High Blood Pressure

## References

- [CQL Specification](https://cql.hl7.org/)
- [FHIR Quality Measure IG](https://build.fhir.org/ig/HL7/cqf-measures/)
- [QRDA Implementation Guide](https://ecqi.healthit.gov/qrda)
- [CMS eCQM Specifications](https://ecqi.healthit.gov/ecqms)
- [ONC Certification Criteria](https://www.healthit.gov/test-method/clinical-quality-measures-cqms)

## License

Copyright (c) 2024 Clinical Meteor
Licensed under MIT License