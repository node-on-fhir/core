# DocumentReference UI Testing Guide

## Summary

I've successfully found and analyzed the DocumentReference UI components in the Honeycomb codebase:

### Components Found:
1. **DocumentReferencesPage** (`/imports/ui-fhir/documentReferences/DocumentReferencesPage.jsx`)
   - Main list page with table display
   - Contains "Add Document Reference" button that navigates to `/documentReferences/new`
   - Subscribes to `autopublish.DocumentReferences` publication

2. **DocumentReferenceDetail** (`/imports/ui-fhir/documentReferences/DocumentReferenceDetail.jsx`)
   - Form component for creating/editing document references
   - Handles both new document creation and existing document editing
   - Uses Meteor methods for CRUD operations

3. **DocumentReferencesTable** (`/imports/ui-fhir/documentReferences/DocumentReferencesTable.jsx`)
   - Table component for displaying document references
   - Supports pagination and row click navigation

### Routing Configuration:
- `/documentReferences` - Lists all document references
- `/documentReferences/new` - Create new document reference
- `/documentReferences/:id` - View/edit existing document reference

### Key Updates Made:
1. Fixed method calls in DocumentReferenceDetail to use correct method names:
   - Changed `documentReferences.create` to `documentReferences.insert`
   - Changed direct collection access for read operations
   - Updated subscription name to use autopublish pattern

2. Fixed routing inconsistency:
   - Changed route from `/document-references` to `/documentReferences` for consistency

### How the "Add Document Reference" Button Works:
1. Button is located in the DocumentReferencesPage header
2. On click, it calls `handleAddDocumentReference()` which uses `navigate('/documentReferences/new')`
3. This routes to DocumentReferenceDetail component with `id='new'`
4. The component detects this is a new document and:
   - Starts in edit mode
   - Pre-populates patient info from session
   - Shows a form for entering document details
   - On save, calls `documentReferences.insert` method

### Testing Instructions:
1. Navigate to `/documentReferences` in your app
2. Click "Add Document Reference" button
3. Fill in the form fields
4. Click "Save" to create a new document reference
5. Verify it appears in the list after creation