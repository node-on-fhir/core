# Drug Formulary Package - ONC 170.315(a)(10) Compliance

This package implements drug-formulary and preferred drug list checks as required for ONC Health IT certification, following the DaVinci PDEx Formulary Implementation Guide.

## Compliance Status

- **Regulation**: 170.315(a)(10) - Drug-formulary and preferred drug list checks
- **Algo**: ✅ Implemented
- **Implemented**: ✅ True
- **v3**: ✅ True

## Features

### Core Functionality
- **Formulary Search**: Search by drug name, RxNorm code, or NDC
- **Cost Tier Display**: Visual hierarchy of drug costs (Generic → Specialty)
- **Prior Authorization Alerts**: Clear indication of drugs requiring prior auth
- **Alternative Suggestions**: Lower-cost therapeutic alternatives
- **Multi-Plan Comparison**: Side-by-side cost comparison across insurance plans
- **Coverage Requirements**: Step therapy, quantity limits, specialty drug indicators

### Design Philosophy

The interface follows Tufte's principles and Borries Schwesinger's form design:
- **Small multiples**: Cost comparison across plans in compact grids
- **Information density**: Maximum data per screen area
- **Visual hierarchy**: Cost tiers with progressive visual weight
- **Layered disclosure**: Expandable alternatives and details
- **Data-ink ratio**: Minimal decoration, maximum information

## Implementation Details

### FHIR Resources Used
- `InsurancePlan` - Payer insurance plans and formularies
- `MedicationKnowledge` - Formulary drugs with RxNorm codes
- `Basic` - Formulary items with tier and cost details
- `Coverage` - Patient's insurance coverage

### Search Capabilities
- RxNorm code (SCD, SBD, SCDG, SBDG term types)
- Drug name (generic and brand)
- NDC (National Drug Code)
- Filtering by plan, tier, and requirements

### Cost Information
- Copay amounts
- Coinsurance percentages
- Tier levels (1-4 + Specialty)
- Monthly cost estimates

### Coverage Requirements
- Prior authorization
- Step therapy
- Quantity limits
- Mail order availability
- Specialty drug designation

## Configuration

```json
{
  "public": {
    "modules": {
      "drugFormulary": {
        "enabled": true,
        "showInSidebar": true,
        "requireAuthentication": true
      }
    }
  }
}
```

## Usage

The drug formulary page provides:
1. **Search bar** with multi-mode search (name/RxNorm/NDC)
2. **Filter controls** for insurance plan and cost tier
3. **Grid view** with small multiples for cost comparison
4. **Table view** for dense information display
5. **Visual indicators** for generic/brand, requirements, and restrictions

## Certification Criteria Met

Per §170.315(a)(10), the system:
- ✅ Checks if a drug is in formulary
- ✅ Displays cost tier information
- ✅ Shows prior authorization requirements
- ✅ Indicates quantity limits
- ✅ Suggests lower-cost alternatives
- ✅ Compares costs across plans
- ✅ Identifies specialty drugs
- ✅ Shows step therapy requirements

## Visual Design

- **Color coding**: Progressive cost indication (green → red)
- **Icons**: Intuitive symbols for drug types and requirements
- **Typography**: Hierarchical text sizes for scannability
- **Layout**: Responsive grid adapting to content density
- **Interaction**: Expandable sections for progressive disclosure