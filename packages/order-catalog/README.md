# Order Catalog Package

## Overview

FHIR-compliant Computerized Provider Order Entry (CPOE) system for medications and laboratory orders. This package meets ONC Health IT Certification requirements for:

- **§170.315(a)(1)** - CPOE Medications
- **§170.315(a)(2)** - CPOE Laboratory  
- **§170.315(a)(4)** - Drug-Drug, Drug-Allergy Interaction Checks

## Features

### Information-Dense Single Page Interface
Inspired by Edward Tufte's principles of information design and Borries Schwesinger's form design patterns:

- **Compact Visual Hierarchy**: All critical ordering functions visible on one screen
- **Progressive Disclosure**: Order details expand inline without navigation
- **Real-time Validation**: ONC compliance checks during order entry
- **Parallel Workflows**: Browse catalog while managing active orders

### ONC Certification Compliance
- ✅ Required order priority levels (Routine, Urgent, STAT)
- ✅ Drug interaction checking for medications
- ✅ Complete audit trail via FHIR AuditEvent
- ✅ FHIR-compliant ServiceRequest and MedicationRequest generation
- ✅ Clinical decision support integration points

### Technical Implementation
- Built on FHIR R4 standards
- Uses PlanDefinition for catalog items
- ActivityDefinition for order templates
- Real-time order validation
- Async server methods with Meteor v3 patterns

## Installation

```javascript
meteor add clinical:order-catalog
```

## Usage

The package automatically adds routes to your application:
- `/order-catalog` - Main CPOE interface
- `/cpoe/medications` - Direct medication ordering
- `/cpoe/laboratory` - Direct laboratory ordering

## Architecture

### Data Flow
1. **Catalog Browse**: Filter and search available orders
2. **Order Building**: Add items with required parameters
3. **Validation**: Check ONC requirements and interactions
4. **Submission**: Create FHIR resources with audit trail

### FHIR Resources Created
- `ServiceRequest` - For laboratory orders
- `MedicationRequest` - For medication orders
- `AuditEvent` - For compliance tracking

## Design Philosophy

Following Tufte's principles:
- **Small Multiples**: Repeated order cards with consistent structure
- **Data-Ink Ratio**: Minimal chrome, maximum information
- **Sparklines**: Inline indicators for priority and status

Following Schwesinger's form patterns:
- **Scannable Layout**: F-pattern reading flow
- **Grouped Controls**: Related fields clustered
- **Progressive Enhancement**: Basic to advanced features

## ONC Testing

To validate certification compliance:

1. Create orders with all priority levels
2. Verify drug interaction alerts appear
3. Check audit events are generated
4. Confirm all required fields are enforced