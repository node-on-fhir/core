# Order Catalog Implementation Details

## Architecture Overview

This package implements a **Minimum Viable CPOE (Computerized Provider Order Entry)** system that meets ONC Health IT Certification requirements while using simplified catalog management for rapid deployment.

## What We've Actually Implemented

### 1. UI/Frontend (`OrderCatalogPage.jsx`)

#### Features Implemented:
- ✅ **Hardcoded catalog arrays** with sample lab tests and medications
- ✅ **Split-screen interface**: Browse catalog (left) | Active orders (right)
- ✅ **Order priority selection** (Routine/Urgent/STAT) - ONC required
- ✅ **Order customization** for medications (quantity, frequency, duration)
- ✅ **Visual drug interaction alerts** (UI only, simplified demonstration)
- ✅ **Category filtering and search** with real-time results
- ✅ **Progressive disclosure** via accordion orders
- ✅ **Batch order submission** with validation

#### Data Structure:
```javascript
// Current Implementation: Hardcoded Arrays
const LAB_CATALOG = [
  { 
    id: 'K_serum', 
    code: '2823-3',  // LOINC code
    display: 'Potassium [Moles/volume] in Serum or Plasma',
    category: 'Chemistry',
    specimen: 'Serum/Plasma',
    turnaround: '4 hours',
    priority: ['routine', 'stat']
  },
  // ... more items
];

const MEDICATION_CATALOG = [
  {
    id: 'amoxicillin_500',
    code: '308182',  // RxNorm code
    display: 'Amoxicillin 500 MG Oral Capsule',
    category: 'Antibiotic',
    route: 'PO',
    form: 'capsule',
    strength: '500 mg'
  },
  // ... more items
];
```

### 2. Server Methods (`methods.js`)

#### Implemented Methods:

##### `orderCatalog.submitOrders`
Creates actual FHIR resources based on order type:

**For Laboratory Orders → Creates `ServiceRequest`:**
```javascript
{
  resourceType: 'ServiceRequest',
  id: Random.id(),
  status: 'active',
  intent: 'order',
  priority: 'routine|urgent|stat',
  code: {
    coding: [{
      system: 'http://loinc.org',
      code: order.code,
      display: order.display
    }]
  },
  subject: { reference: 'Patient/[id]' },
  authoredOn: timestamp,
  requester: { reference: 'Practitioner/[id]' }
}
```

**For Medication Orders → Creates `MedicationRequest`:**
```javascript
{
  resourceType: 'MedicationRequest',
  id: Random.id(),
  status: 'active',
  intent: 'order',
  priority: 'routine|urgent|stat',
  medicationCodeableConcept: {
    coding: [{
      system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
      code: order.code,
      display: order.display
    }]
  },
  subject: { reference: 'Patient/[id]' },
  authoredOn: timestamp,
  dosageInstruction: [{
    text: '[quantity] [form] [frequency] for [duration]',
    timing: { /* structured timing */ },
    route: { /* SNOMED route codes */ },
    doseAndRate: [{ /* structured dosing */ }]
  }]
}
```

**For All Orders → Creates `AuditEvent`:**
```javascript
{
  resourceType: 'AuditEvent',
  type: { system: '...', code: 'rest' },
  action: 'C',  // Create
  recorded: timestamp,
  outcome: '0',  // Success
  agent: [{ who: { reference: 'Practitioner/[id]' }}],
  entity: [{ what: { reference: '[ResourceType]/[id]' }}]
}
```

##### `orderCatalog.checkDrugInteractions`
- Simplified demonstration only
- Hardcoded interaction examples
- Returns interaction severity and description
- **NOT** connected to real drug interaction database

##### `orderCatalog.getCatalogItems`
- Currently returns empty structure
- Placeholder for future PlanDefinition integration

### 3. FHIR Resources Usage

| Resource Type | How We Use It | Implementation Status |
|--------------|---------------|----------------------|
| **ServiceRequest** | Created for lab orders | ✅ Fully implemented |
| **MedicationRequest** | Created for medication orders | ✅ Fully implemented |
| **AuditEvent** | Created for all orders (compliance) | ✅ Fully implemented |
| **PlanDefinition** | Should define catalog items | ❌ Not implemented - using hardcoded arrays |
| **ActivityDefinition** | Should define order templates | ❌ Not implemented |
| **SpecimenDefinition** | Should define specimen requirements | ❌ Not implemented - text only |

### 4. ONC Certification Compliance

#### Requirements Met:
- ✅ **§170.315(a)(1)** - CPOE Medications
  - Can create medication orders
  - Includes dosing, route, frequency
  - Requires priority selection
  
- ✅ **§170.315(a)(2)** - CPOE Laboratory
  - Can create lab orders
  - Includes specimen type display
  - Shows turnaround time
  
- ✅ **§170.315(a)(4)** - Drug-Drug Interactions
  - UI shows interaction warnings
  - Basic checking implemented
  - Severity levels displayed

#### Simplified/Demo Elements:
- ⚠️ Catalog data is hardcoded (not from FHIR server)
- ⚠️ Drug interactions use demo data (not real database)
- ⚠️ No clinical decision support beyond basic checks
- ⚠️ No order sets or protocols

## Gap Analysis: Current vs. Full FHIR Implementation

### What a Full Implementation Would Have:

1. **Catalog Management via FHIR:**
   ```
   PlanDefinition (defines orderable item)
     ├── ActivityDefinition (details/template)
     ├── SpecimenDefinition (for labs)
     └── ObservationDefinition (expected results)
   ```

2. **Real Drug Interaction Service:**
   - Integration with RxNorm
   - FDA drug interaction database
   - Allergy checking against AllergyIntolerance resources

3. **Clinical Decision Support:**
   - Contraindication checking
   - Dosing calculators
   - Renal/hepatic adjustments
   - Age/weight-based dosing

4. **Order Sets/Protocols:**
   - Grouped orders (e.g., admission orders)
   - Disease-specific protocols
   - Standing orders

### Current Implementation Trade-offs:

| Aspect | Current (Simplified) | Production (Full) |
|--------|---------------------|------------------|
| **Catalog Source** | Hardcoded arrays | FHIR PlanDefinition |
| **Drug Interactions** | Demo examples | Real drug database |
| **Updates** | Code changes | Dynamic from server |
| **Customization** | Developer only | Admin UI |
| **Validation** | Basic required fields | Clinical rules engine |

## Development Roadmap

### Phase 1 (Current) ✅
- Basic CPOE interface
- Create valid FHIR orders
- Meet minimum ONC requirements

### Phase 2 (Next)
- [ ] Implement PlanDefinition for catalog items
- [ ] Add ActivityDefinition templates
- [ ] Connect to real drug interaction API
- [ ] Add SpecimenDefinition support

### Phase 3 (Future)
- [ ] Order sets and protocols
- [ ] Clinical decision support rules
- [ ] Preference lists per provider
- [ ] Smart order suggestions

## Testing Considerations

### For ONC Certification Testing:
1. Create orders with all three priority levels
2. Verify ServiceRequest/MedicationRequest creation
3. Check AuditEvent generation
4. Demonstrate drug interaction alerts
5. Validate required field enforcement

### Current Limitations to Document:
- Catalog updates require code changes
- Drug interactions are demonstration only
- No real-time inventory checking
- No insurance/formulary validation

## Summary

This implementation provides a **working CPOE system** that:
- ✅ Meets ONC certification UI requirements
- ✅ Creates valid FHIR resources
- ✅ Provides good UX with information-dense design
- ⚠️ Uses simplified catalog management
- ⚠️ Requires enhancement for production clinical use

The architecture allows for progressive enhancement - the hardcoded catalogs can be replaced with FHIR PlanDefinition queries without changing the UI significantly.