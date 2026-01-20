# Checklist Manifesto - Package Implementation Plan

## Overview

This plan outlines the conversion of the standalone Checklist Manifesto app (Meteor v3) into a modular Atmosphere package `clinical:checklist-manifesto` that integrates with Honeycomb's infrastructure.

## Key Differences from WorkQueues Package

1. **More Complex Data Model**: Two collections (Tasks and Lists) vs single collection
2. **Protocol System**: Template/protocol functionality for reusable checklists
3. **Already Meteor v3**: No need for major version migration
4. **FHIR Native**: Already uses FHIR Task and List resources

## Phase 1: Package Structure & Core Data (Day 1)

### 1.1 Package Setup
- [ ] Create package.js with minimal dependencies (following workqueues pattern)
- [ ] Set up directory structure: client/, server/, lib/, ui/
- [ ] Create index.jsx for SidebarWorkflow export

### 1.2 Data Layer Migration
- [ ] Copy TasksCollection.js to lib/collections/
- [ ] Copy ListsCollection.js to lib/collections/
- [ ] Remove Meteor accounts dependencies from collections
- [ ] Create indexes for performance

### 1.3 Utility Functions
- [ ] Migrate FhirTaskUtilities.js
- [ ] Migrate FhirDataUtilities.js
- [ ] Migrate dateHelpers.js
- [ ] Adapt DefaultProtocols.js for package structure

## Phase 2: Server Infrastructure (Day 1)

### 2.1 Methods Migration
- [ ] Migrate tasks/methods.js - adapt for Honeycomb auth
- [ ] Migrate tasks/protocol-methods.js
- [ ] Migrate lists/methods.js
- [ ] Remove accounts-specific methods
- [ ] Add audit logging using Honeycomb patterns

### 2.2 Publications
- [ ] Migrate tasks/publications.js
- [ ] Migrate tasks/protocol-publications.js
- [ ] Migrate lists/publications.js
- [ ] Add role-based access controls

### 2.3 Server Initialization
- [ ] Create server/index.js entry point
- [ ] Migrate protocol initialization from DefaultProtocols
- [ ] Set up collection hooks for audit trail

## Phase 3: UI Components (Day 2)

### 3.1 Core Task Components
- [ ] TaskForm.jsx - simplified without user lookup
- [ ] TaskList.jsx - integrate with Honeycomb patterns
- [ ] TaskFilter.jsx - adapt filter UI
- [ ] Task.jsx - individual task item
- [ ] TaskDetails.jsx - detailed view

### 3.2 List Components
- [ ] ListForm.jsx
- [ ] Adapt list display components
- [ ] List selection UI

### 3.3 Protocol Components
- [ ] ProtocolPreview.jsx
- [ ] Protocol selection UI
- [ ] Clone protocol functionality

### 3.4 Utility Components
- [ ] ImportExportDialog.jsx - integrate with Honeycomb's import
- [ ] ConnectionAlert.jsx - adapt for Honeycomb
- [ ] Simplify/remove FirstRunSetup

## Phase 4: Page Integration (Day 2)

### 4.1 Main Pages
- [ ] Create ChecklistManifestoPage.jsx (main entry point)
- [ ] Adapt TaskListPage as embedded component
- [ ] Create simplified ProtocolLibraryPage
- [ ] Integrate ImportExportPage functionality

### 4.2 Routing
- [ ] Set up routes in Honeycomb's App.jsx
- [ ] Create navigation between lists/tasks/protocols
- [ ] Handle URL-based filtering

## Phase 5: Integration Features (Day 3)

### 5.1 Authentication Integration
- [ ] Replace Meteor accounts with Honeycomb auth
- [ ] Use Meteor.userId() from Honeycomb session
- [ ] Integrate with role-based permissions

### 5.2 FHIR Integration
- [ ] Ensure Task resources are Honeycomb-compatible
- [ ] Map List resources to Honeycomb patterns
- [ ] Add patient/encounter context support

### 5.3 UI Integration
- [ ] Create SidebarWorkflow configuration
- [ ] Integrate with Honeycomb's theme
- [ ] Ensure Material-UI compatibility

## Migration Strategy

### Data to Migrate
1. **Collections**: TasksCollection, ListsCollection
2. **Methods**: All task/list/protocol methods
3. **Publications**: All data publications
4. **Components**: Core UI components (simplified)
5. **Utilities**: FHIR utilities, date helpers
6. **Protocols**: Default protocol library

### Data to Exclude
1. **Authentication**: Login/Register/FirstRun components
2. **Routing**: App.jsx, layout components
3. **Accounts**: All accounts-related code
4. **Desktop**: Electron-specific code
5. **Testing**: Nightwatch tests (create new ones later)

### Simplifications
1. **No separate pages**: Embed everything in one main page
2. **No custom auth**: Use Honeycomb's existing auth
3. **Simplified routing**: Single entry point with tabs/views
4. **No side drawer**: Use Honeycomb's existing navigation

## File Mapping

### Source → Destination

```
imports/db/TasksCollection.js → lib/collections/TasksCollection.js
imports/db/ListsCollection.js → lib/collections/ListsCollection.js

imports/api/tasks/methods.js → server/methods/tasks.js
imports/api/lists/methods.js → server/methods/lists.js
imports/api/tasks/publications.js → server/publications/tasks.js
imports/api/lists/publications.js → server/publications/lists.js

imports/ui/components/Task*.jsx → ui/components/Task*.jsx
imports/ui/components/List*.jsx → ui/components/List*.jsx
imports/ui/components/Protocol*.jsx → ui/components/Protocol*.jsx

imports/utils/*.js → lib/utils/*.js
```

## Success Criteria

1. ✅ Users can create, edit, delete tasks
2. ✅ Users can organize tasks into lists
3. ✅ Protocol library is accessible and clonable
4. ✅ Import/export FHIR tasks works
5. ✅ Real-time updates function properly
6. ✅ Integrates seamlessly with Honeycomb UI
7. ✅ Maintains FHIR compliance
8. ✅ Performance is acceptable with large task lists

## Risk Mitigation

1. **Complex Dependencies**: Start with core functionality, add features incrementally
2. **UI Conflicts**: Use namespaced CSS classes, test thoroughly
3. **Data Migration**: Provide clear upgrade path for existing data
4. **Performance**: Implement pagination early, test with large datasets
5. **Integration Issues**: Regular testing during development

## Timeline

- **Day 1**: Package setup, data layer, server infrastructure
- **Day 2**: UI components and page integration  
- **Day 3**: Integration features and testing

Total estimate: 3 days for functional package