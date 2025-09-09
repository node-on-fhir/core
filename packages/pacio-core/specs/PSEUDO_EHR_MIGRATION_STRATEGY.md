# Pseudo EHR to Honeycomb Migration Strategy

## Executive Summary
This document outlines the comprehensive strategy for migrating the Pseudo EHR functionality to Honeycomb. The migration involves two main components:
1. Updates to core Honeycomb UI components in `/imports/ui-fhir`
2. A new `packages/pacio-core` Atmosphere.js package containing Pseudo EHR-specific functionality

## Current State Analysis

### Existing Honeycomb Components
Honeycomb already supports many FHIR resources with standardized patterns:
- **Supported**: Patients, Conditions, Observations, CarePlans, CareTeams, Goals, ServiceRequests, QuestionnaireResponses, Compositions
- **Pattern**: Each resource has Table, Detail, and Page components
- **Infrastructure**: Smart-on-FHIR authentication, Meteor collections, Material-UI theming

### Gap Analysis - Missing Components
Based on the Pseudo EHR requirements, we need to add:

#### Core UI Components (for /imports/ui-fhir)
1. **AdvanceDirectives** - Complete implementation needed
2. **MedicationLists** (List resources) - Different from MedicationStatements
3. **NutritionOrders** - Collection exists, needs UI components
4. **DocumentReferences** - For PDF document handling
5. **Enhanced Components**:
   - Goals (add target display, achievement indicators)
   - Observations (add grouping by category/domain)
   - ServiceRequests (add priority and requester info)

#### Specialized Features
1. PDF viewer with watermarking capability
2. ADI status filtering (Current/Superseded/All)
3. Observation collection toggles
4. Enhanced patient sync functionality
5. Transition of Care document sections

## Migration Strategy

### Phase 1: Core Infrastructure (Week 1-2)
**Goal**: Establish foundation for Pseudo EHR functionality

#### 1.1 Core UI Component Updates (/imports/ui-fhir)
```
/imports/ui-fhir/
├── AdvanceDirectives/
│   ├── AdvanceDirectivesTable.jsx
│   ├── AdvanceDirectiveDetail.jsx
│   └── AdvanceDirectivesPage.jsx
├── MedicationLists/
│   ├── MedicationListsTable.jsx
│   ├── MedicationListDetail.jsx
│   └── MedicationListsPage.jsx
├── NutritionOrders/
│   ├── NutritionOrdersTable.jsx
│   ├── NutritionOrderDetail.jsx
│   └── NutritionOrdersPage.jsx
└── DocumentReferences/
    ├── DocumentReferencesTable.jsx
    ├── DocumentReferenceDetail.jsx
    └── PdfViewer.jsx
```

#### 1.2 Package Structure Setup
```
/packages/pacio-core/
├── package.js
├── index.jsx
├── client/
│   ├── components/
│   │   ├── advanceDirectives/
│   │   │   ├── AdvanceDirectiveCard.jsx
│   │   │   ├── AdvanceDirectiveStatusFilter.jsx
│   │   │   └── AdvanceDirectiveRevoke.jsx
│   │   ├── goals/
│   │   │   ├── GoalTargetDisplay.jsx
│   │   │   └── GoalAchievementIndicator.jsx
│   │   ├── observations/
│   │   │   ├── ObservationGroupsTable.jsx
│   │   │   ├── ObservationCollectionToggle.jsx
│   │   │   └── ObservationCategoryFilter.jsx
│   │   ├── transitionOfCare/
│   │   │   ├── TransitionOfCareTable.jsx
│   │   │   ├── TransitionOfCareDetail.jsx
│   │   │   └── TransitionOfCareCard.jsx
│   │   └── shared/
│   │       ├── PatientSyncButton.jsx
│   │       ├── ResourceFilter.jsx
│   │       └── PdfWatermark.jsx
│   ├── pages/
│   │   ├── PatientAdvanceDirectives.jsx
│   │   ├── PatientGoals.jsx
│   │   ├── PatientMedicationLists.jsx
│   │   ├── PatientNutritionOrders.jsx
│   │   └── PatientTransitionOfCare.jsx
│   └── hooks/
│       ├── useAdvanceDirectives.js
│       └── usePdfWatermark.js
├── lib/
│   ├── collections/
│   │   └── PacioCollections.js
│   └── utilities/
│       ├── AdvanceDirectiveUtils.js
│       └── PdfUtils.js
└── server/
    ├── methods/
    │   ├── syncPatientRecord.js
    │   ├── revokeAdvanceDirective.js
    │   └── generateWatermarkedPdf.js
    └── publications/
        └── pacioPublications.js
```

### Phase 2: Basic Functionality (Week 3-4)
**Goal**: Implement core viewing capabilities

#### Tasks:
1. Implement basic CRUD operations for new resources
2. Create table views with standard Honeycomb patterns
3. Add basic filtering and search
4. Integrate with existing patient context
5. Set up routes and navigation

#### Code Pattern Example:
```javascript
// /imports/ui-fhir/AdvanceDirectives/AdvanceDirectivesTable.jsx
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { get } from 'lodash';
import moment from 'moment';
import { useTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';
import { FhirUtilities } from '../../lib/FhirUtilities';

export function AdvanceDirectivesTable(props) {
  // Follow existing Honeycomb table patterns
  const data = useTracker(function() {
    return AdvanceDirectives.find().fetch();
  }, []);
  
  // Implementation following PatientsTable pattern
}
```

### Phase 3: Advanced Features (Week 5-6)
**Goal**: Implement Pseudo EHR-specific functionality

#### Key Features:
1. **PDF Viewer with Watermarking**
   - Integrate PDF.js or similar
   - Server-side watermarking for revoked documents
   - Client-side PDF rendering

2. **ADI Status Management**
   - Status filtering UI
   - Revoke functionality
   - Version history display

3. **Enhanced Observation Views**
   - Category grouping
   - Domain filtering
   - Collection/individual toggle

4. **Patient Sync Enhancement**
   - Progress indicators
   - Error handling
   - Selective resource sync

### Phase 4: Integration & Polish (Week 7-8)
**Goal**: Complete integration with Honeycomb ecosystem

#### Tasks:
1. **Route Integration**
   ```javascript
   // packages/pacio-core/index.jsx
   import PatientAdvanceDirectives from './client/pages/PatientAdvanceDirectives';
   
   export const DynamicRoutes = [{
     path: '/patient/:id/advance-directives',
     element: <PatientAdvanceDirectives />
   }, {
     path: '/advance-directive/:id',
     element: <AdvanceDirectiveDetail />
   }];
   ```

2. **Module Configuration**
   ```javascript
   // Integration with Honeycomb's module system
   export const ModuleConfig = {
     "fhir": {
       "AdvanceDirectives": { 
         "enabled": true,
         "showInSidebar": true,
         "defaultRoute": "/advance-directives"
       }
     }
   };
   ```

3. **Sidebar Integration**
   ```javascript
   export const SidebarElements = [{
     primaryText: "Advance Directives",
     to: "/advance-directives",
     iconName: "DocumentText"
   }];
   ```

## Technical Implementation Details

### Data Flow Architecture
1. **FHIR Server → Meteor Collections → React Components**
   - Leverage existing FhirClient connection
   - Use Meteor's reactivity for real-time updates
   - Cache data in minimongo

2. **Authentication Flow**
   - Reuse existing Smart-on-FHIR implementation
   - Add patient context management for Pseudo EHR views

### Component Communication
1. **Patient Context**: Use Session variables (existing pattern)
2. **Resource Selection**: Implement with React Router params
3. **Filter State**: Local component state with URL params

### Performance Considerations
1. **Lazy Loading**: Use React.lazy for route components
2. **Pagination**: Implement for all table views
3. **Caching**: Leverage Meteor's built-in caching

## Migration Checklist

### Pre-Migration
- [ ] Backup existing codebase
- [ ] Set up development environment
- [ ] Review existing patterns in detail

### Core Components (/imports/ui-fhir)
- [ ] AdvanceDirectives components
- [ ] MedicationLists components
- [ ] NutritionOrders components
- [ ] DocumentReferences components
- [ ] Enhanced Goals components
- [ ] Enhanced Observations components
- [ ] Enhanced ServiceRequests components

### Pacio-Core Package
- [ ] Package structure setup
- [ ] ADI-specific components
- [ ] PDF viewer implementation
- [ ] Watermarking functionality
- [ ] Patient sync enhancements
- [ ] Transition of Care components
- [ ] Route configuration
- [ ] Sidebar integration

### Integration
- [ ] Test with existing FHIR servers
- [ ] Verify Smart-on-FHIR flow
- [ ] Update documentation
- [ ] Performance testing
- [ ] Accessibility testing

## Risk Mitigation

### Technical Risks
1. **PDF Handling**: Use established libraries (PDF.js)
2. **Performance**: Implement pagination early
3. **Compatibility**: Test with multiple FHIR servers

### Process Risks
1. **Scope Creep**: Stick to defined phases
2. **Integration Issues**: Test incrementally
3. **Data Migration**: Not required (using FHIR APIs)

## Success Criteria
1. All Pseudo EHR resources viewable in Honeycomb
2. PDF viewing with watermarking functional
3. ADI status management working
4. Patient sync enhanced
5. No regression in existing functionality
6. Performance targets met (< 2s page load)

## Next Steps
1. Review and approve strategy
2. Set up pacio-core package structure
3. Begin Phase 1 implementation
4. Schedule weekly progress reviews