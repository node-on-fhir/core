# Clinical Documents Package

FHIR Clinical Documents implementation for Honeycomb based on the [HL7 FHIR Clinical Document IG](http://hl7.org/fhir/uv/fhir-clinical-document/).

## Overview

This package provides functionality for creating, managing, and viewing FHIR Clinical Documents in the Honeycomb framework. It implements the FHIR Clinical Document structure which consists of:

- **Bundle** - Document container with type "document"
- **Composition** - Document metadata and section organization
- **Supporting Resources** - Patient data, observations, procedures, etc.

## Installation

Add the package to your Meteor app:

```bash
meteor add clinical:clinical-documents
```

Or include it when running:

```bash
meteor run --extra-packages clinical:clinical-documents --settings packages/clinical-documents/configs/settings.clinical-documents.json
```

## Configuration

Copy the sample settings to your app and customize:

```bash
cp packages/clinical-documents/configs/settings.clinical-documents.json configs/settings.my-app.json
```

Key settings:
- `public.clinicalDocuments.enabled` - Enable/disable the module
- `public.clinicalDocuments.showInSidebar` - Show in navigation
- `public.clinicalDocuments.supportedDocumentTypes` - Document types to support
- `public.clinicalDocuments.features` - Enable specific features

## Usage

### Collections

The package provides two main collections:

#### ClinicalDocuments
Stores FHIR document bundles:

```javascript
import { ClinicalDocuments } from 'meteor/clinical:clinical-documents';

// Find all documents for a patient
const patientDocs = ClinicalDocuments.find({
  'entry.0.resource.subject.reference': 'Patient/123'
}).fetch();

// Get document composition
const doc = ClinicalDocuments.findOne(docId);
const composition = ClinicalDocuments.getComposition(doc);
const title = ClinicalDocuments.getTitle(doc);
```

#### DocumentRevisions
Tracks document versions:

```javascript
import { DocumentRevisions } from 'meteor/clinical:clinical-documents';

// Get all revisions for a document
const revisions = DocumentRevisions.getAllRevisions({
  system: 'http://example.org/documents',
  value: 'DOC-123'
});
```

### Routes

The package adds the following routes:
- `/clinical-documents` - Document list view
- `/clinical-documents/:id` - Document detail view
- `/clinical-documents/new` - Create new document

### API Methods

Helper functions for working with documents:

```javascript
// Document helpers
ClinicalDocuments.getComposition(doc)
ClinicalDocuments.getIdentifier(doc)
ClinicalDocuments.getPatientId(doc)
ClinicalDocuments.getTitle(doc)
ClinicalDocuments.getStatus(doc)
ClinicalDocuments.getDocumentDate(doc)
ClinicalDocuments.getAuthors(doc)
ClinicalDocuments.getSections(doc)
ClinicalDocuments.findResourceById(doc, resourceId)
ClinicalDocuments.findResourcesByType(doc, resourceType)

// Revision helpers
DocumentRevisions.getDocument(revision)
DocumentRevisions.getPreviousRevision(revision)
DocumentRevisions.getAllRevisions(documentIdentifier)
DocumentRevisions.getLatestRevision(documentIdentifier)
DocumentRevisions.isLatest(revision)
```

## Document Structure

A clinical document follows this structure:

```javascript
{
  resourceType: "Bundle",
  type: "document",
  identifier: {
    system: "http://example.org/documents",
    value: "DOC-123"
  },
  timestamp: "2024-01-15T10:30:00Z",
  entry: [{
    resource: {
      resourceType: "Composition",
      status: "final",
      type: {
        coding: [{
          system: "http://loinc.org",
          code: "11488-4",
          display: "Consult note"
        }]
      },
      category: [{
        coding: [{
          system: "http://loinc.org",
          code: "107903-7",
          display: "Clinical note"
        }]
      }],
      subject: {
        reference: "Patient/123"
      },
      date: "2024-01-15T10:30:00Z",
      author: [{
        reference: "Practitioner/456"
      }],
      title: "Consultation Note",
      section: [{
        title: "Chief Complaint",
        text: {
          status: "generated",
          div: "<div>Patient presents with...</div>"
        }
      }]
    }
  }, {
    // Additional resources (Patient, Practitioner, Observations, etc.)
  }]
}
```

## Standards Compliance

This package implements:
- HL7 FHIR R4
- FHIR Clinical Document IG v1.0.0
- CDA principles (persistence, stewardship, authentication, context, wholeness, human readability)

## Development

### Adding Document Types

To add support for new document types:

1. Add to `supportedDocumentTypes` in settings
2. Create specific templates if needed
3. Add any custom validation

### Extending the Package

The package is designed to be extended. You can:
- Add custom document templates
- Implement CDA import/export
- Add document signing workflows
- Integrate with external systems

## License

MIT