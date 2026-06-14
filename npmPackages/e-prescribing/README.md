# E-Prescribing Package

Electronic Prescribing for ONC §170.315(b)(3) Certification

## Overview

This package implements NCPDP SCRIPT 2017071 compliant electronic prescribing, enabling secure transmission of prescriptions between prescribers and pharmacies. It supports the complete prescription lifecycle from creation to fulfillment.

## Features

### NCPDP SCRIPT Message Types
- **NewRx**: New prescription transmission
- **RxChangeRequest/Response**: Medication changes
- **CancelRx/Response**: Prescription cancellation
- **RxFill**: Dispensing status updates
- **RxRenewalRequest/Response**: Renewal workflows

### Key Capabilities
- **Drug Formulary Checking**: Real-time formulary status
- **DEA Schedule Support**: Controlled substance handling
- **Prior Authorization**: PA request submission
- **Pharmacy Directory**: NCPDP pharmacy lookup
- **Fill History**: Complete dispensing records
- **Multi-Message Dashboard**: Unified prescription management

## ONC Certification Compliance

### §170.315(b)(3) - Electronic Prescribing

1. **NCPDP SCRIPT Standard**: Version 2017071 compliant
2. **Message Types**: NewRx, RxChangeRequest, CancelRx, RxFill
3. **Data Elements**: All required and optional fields
4. **Pharmacy Directory**: NCPDP ID based routing
5. **Audit Trail**: Complete message logging

## User Interface

Information-dense design inspired by:
- **Edward Tufte**: The Visual Display of Quantitative Information
- **Borries Schwesinger**: The Form Book

### UI Components
- **Message Type Selector**: Quick NCPDP message switching
- **Prescription Form**: Comprehensive drug entry
- **Pending Requests**: Active renewal/change requests
- **Message Log**: Complete audit trail
- **Formulary Status**: Visual tier indicators

## Usage

### Routes
- `/e-prescribing` - Main e-prescribing interface

### Methods

```javascript
// Send new prescription
Meteor.call('ePrescribing.sendMessage', {
  messageType: 'NewRx',
  prescription: {
    patient: 'patient-id',
    medication: { name: 'Lisinopril', ndc: '00000000000' },
    strength: '10mg',
    form: 'Tablet',
    sig: 'Take 1 tablet by mouth daily',
    quantity: '30',
    refills: '5',
    substitution: 'allowed',
    pharmacy: { ncpdpId: '1234567' }
  },
  timestamp: new Date().toISOString()
}, callback);

// Process incoming message
Meteor.call('ePrescribing.receiveMessage', ncpdpXmlString, callback);

// Check formulary status
Meteor.call('ePrescribing.checkFormulary', medicationCode, insurancePlan, callback);

// Submit prior authorization
Meteor.call('ePrescribing.submitPriorAuth', {
  prescriptionId: 'rx-123',
  diagnosis: 'I10',
  clinicalJustification: 'Failed first-line therapy'
}, callback);
```

## NCPDP SCRIPT Message Format

### NewRx Message Structure
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Message xmlns="http://www.ncpdp.org/schema/SCRIPT" version="2017071">
  <Header>
    <To Qualifier="P">PHARMACY_NCPDP_ID</To>
    <From Qualifier="D">PRESCRIBER_ID</From>
    <MessageID>MSG-123456</MessageID>
    <SentTime>2024-01-15T10:30:00Z</SentTime>
  </Header>
  <Body>
    <NewRx>
      <Patient>
        <HumanPatient>
          <Name>
            <LastName>Doe</LastName>
            <FirstName>John</FirstName>
          </Name>
          <Gender>M</Gender>
          <DateOfBirth>19700101</DateOfBirth>
        </HumanPatient>
      </Patient>
      <Prescriber>
        <HumanPrescriber>
          <Identification>
            <NPI>1234567890</NPI>
            <DEANumber>BM1234567</DEANumber>
          </Identification>
          <Name>
            <LastName>Smith</LastName>
            <FirstName>Jane</FirstName>
          </Name>
        </HumanPrescriber>
      </Prescriber>
      <MedicationPrescribed>
        <DrugDescription>Lisinopril 10mg Tablet</DrugDescription>
        <Quantity>
          <Value>30</Value>
          <CodeListQualifier>38</CodeListQualifier>
          <UnitOfMeasure>EA</UnitOfMeasure>
        </Quantity>
        <Directions>Take 1 tablet by mouth daily</Directions>
        <Refills>
          <Qualifier>R</Qualifier>
          <Value>5</Value>
        </Refills>
        <Substitutions>0</Substitutions>
      </MedicationPrescribed>
    </NewRx>
  </Body>
</Message>
```

## Drug Database Integration

### RxNorm Integration
- Drug identification via RxCUI codes
- Semantic drug relationships
- Clinical drug components

### NDC (National Drug Code)
- Product-level identification
- Package-specific codes
- Manufacturer tracking

### Formulary Tiers
- **Preferred**: Tier 1, lowest copay
- **Non-Preferred**: Tier 2-3, higher copay
- **Non-Formulary**: Requires prior auth
- **Specialty**: Special handling required

## DEA Controlled Substances

### Schedule Classifications
- **Schedule II**: High potential for abuse (opioids, stimulants)
- **Schedule III**: Moderate potential (codeine combinations)
- **Schedule IV**: Low potential (benzodiazepines)
- **Schedule V**: Lowest potential (cough preparations)

### EPCS Requirements
- Two-factor authentication
- Identity proofing
- Audit controls
- Logical access controls

## Pharmacy Integration

### Pharmacy Directory
```javascript
{
  ncpdpId: '1234567',        // 7-digit NCPDP Provider ID
  name: 'CVS Pharmacy #2401',
  address: {
    street: '123 Main St',
    city: 'Boston',
    state: 'MA',
    postalCode: '02134'
  },
  phone: '617-555-0100',
  fax: '617-555-0101',
  services: ['retail', '24hour', 'compounding', 'specialty']
}
```

### Transmission Methods
- **Surescripts**: Primary network
- **Direct**: Point-to-point
- **Fax**: Fallback option
- **Print**: Manual backup

## Prior Authorization

### PA Workflow
1. Check formulary for PA requirement
2. Gather clinical documentation
3. Submit PA request with justification
4. Receive PA determination
5. Update prescription status

### Required Information
- Diagnosis codes (ICD-10)
- Clinical justification
- Previous therapies tried
- Supporting lab values
- Medical necessity documentation

## Security & Compliance

### Data Protection
- End-to-end encryption
- TLS 1.2+ for transmission
- At-rest encryption
- Access controls

### Audit Requirements
- All prescription actions logged
- Message transmission tracking
- User authentication events
- Error and exception logging

## Configuration

Add to your settings file:

```json
{
  "public": {
    "modules": {
      "ePrescribing": {
        "enabled": true,
        "showInWorkflows": true,
        "ncpdpVersion": "2017071",
        "enableEPCS": false,
        "surescriptsEndpoint": "https://api.surescripts.net/v1"
      }
    }
  },
  "private": {
    "surescripts": {
      "username": "YOUR_USERNAME",
      "password": "YOUR_PASSWORD",
      "accountId": "YOUR_ACCOUNT_ID"
    }
  }
}
```

## Testing

The package includes test scenarios for ONC certification:

1. **NewRx Transmission**: Send new prescription
2. **Change Request**: Modify existing prescription
3. **Cancel Prescription**: Cancel active prescription
4. **Fill Status**: Receive dispensing updates
5. **Renewal Processing**: Handle renewal requests

## References

- [NCPDP SCRIPT Standard](https://www.ncpdp.org/Standards/Standards-Info/SCRIPT-Standard)
- [ONC §170.315(b)(3) Test Method](https://www.healthit.gov/test-method/electronic-prescribing)
- [Surescripts Network](https://surescripts.com/)
- [DEA EPCS Requirements](https://www.deadiversion.usdoj.gov/ecomm/e_rx/)
- [RxNorm](https://www.nlm.nih.gov/research/umls/rxnorm/)

## License

Copyright (c) 2024 Clinical Meteor
Licensed under MIT License