// imports/api/dicom/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';

// =============================================================================
// DICOM UPLOAD METHODS
// =============================================================================

// Max file size for DDP-based upload (base64 inline storage)
// Files larger than this must use the HTTP upload endpoint (/api/dicom/upload)
const MAX_DDP_FILE_SIZE = 12 * 1024 * 1024; // 12 MB

Meteor.methods({
  /**
   * Process uploaded DICOM file (legacy DDP path - small files only)
   * For large files, use POST /api/dicom/upload + dicom.createFhirResources
   */
  async 'dicom.processUploadedFile'(fileInfo) {
    check(fileInfo, {
      filename: String,
      data: String,  // base64 encoded DICOM file
      size: Number,
    });

    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in');
    }

    // File size guard - reject large files with helpful error
    if (fileInfo.size > MAX_DDP_FILE_SIZE) {
      throw new Meteor.Error('file-too-large',
        `File is ${(fileInfo.size / (1024 * 1024)).toFixed(1)} MB. ` +
        `Files over ${MAX_DDP_FILE_SIZE / (1024 * 1024)} MB must use the HTTP upload endpoint. ` +
        `The UI will handle this automatically.`
      );
    }

    try {
      console.log('Processing uploaded DICOM file:', fileInfo.filename, `(${fileInfo.size} bytes)`);

      const DocumentReferences = global.Collections?.DocumentReferences;

      if (!DocumentReferences) {
        console.warn('DocumentReferences collection not available, returning success anyway');
        return {
          success: true,
          message: 'DICOM file processed (DocumentReferences not available)',
          filename: fileInfo.filename,
          size: fileInfo.size
        };
      }

      const currentUser = await Meteor.users.findOneAsync({ _id: this.userId });
      const username = currentUser?.username || currentUser?.emails?.[0]?.address || 'unknown';

      const documentReference = {
        resourceType: 'DocumentReference',
        status: 'current',
        docStatus: 'final',
        type: {
          coding: [{
            system: 'http://loinc.org',
            code: '18748-4',
            display: 'Diagnostic imaging study'
          }],
          text: 'DICOM Image'
        },
        category: [{
          coding: [{
            system: 'http://loinc.org',
            code: 'LP29684-5',
            display: 'Radiology'
          }]
        }],
        subject: get(Meteor, 'settings.public.defaults.patientId') ? {
          reference: `Patient/${get(Meteor, 'settings.public.defaults.patientId')}`
        } : undefined,
        date: new Date().toISOString(),
        author: [{
          reference: `Practitioner/${this.userId}`,
          display: username
        }],
        description: `DICOM file: ${fileInfo.filename}`,
        content: [{
          attachment: {
            contentType: 'application/dicom',
            data: fileInfo.data,
            title: fileInfo.filename,
            creation: new Date().toISOString(),
            size: fileInfo.size
          }
        }],
        context: {
          related: [{
            reference: `Binary/${fileInfo.filename.replace(/[^a-zA-Z0-9]/g, '-')}`
          }]
        }
      };

      const docRefId = await DocumentReferences.insertAsync(documentReference);
      console.log('Created DocumentReference:', docRefId, 'for', fileInfo.filename);

      return {
        success: true,
        message: 'DICOM file uploaded and stored as DocumentReference',
        filename: fileInfo.filename,
        size: fileInfo.size,
        documentReferenceId: docRefId,
        resourceType: 'DocumentReference'
      };

    } catch (error) {
      console.error('Error processing uploaded file:', error);
      throw new Meteor.Error('upload-processing-failed', error.message);
    }
  },

  /**
   * Convert DICOM file to FHIR DocumentReference and ImagingStudy resources
   * (legacy DDP path - small files only)
   */
  async 'dicom.convertToFHIR'(fileInfo) {
    check(fileInfo, {
      filename: String,
      data: String,
      size: Number,
    });

    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in');
    }

    // File size guard
    if (fileInfo.size > MAX_DDP_FILE_SIZE) {
      throw new Meteor.Error('file-too-large',
        `File is ${(fileInfo.size / (1024 * 1024)).toFixed(1)} MB. ` +
        `Files over ${MAX_DDP_FILE_SIZE / (1024 * 1024)} MB must use the HTTP upload endpoint.`
      );
    }

    try {
      console.log('Converting DICOM to FHIR resources:', fileInfo.filename);

      const DocumentReferences = global.Collections?.DocumentReferences;
      const ImagingStudies = global.Collections?.ImagingStudies;

      if (!DocumentReferences) {
        throw new Meteor.Error('collection-unavailable', 'DocumentReferences collection not available');
      }

      if (!ImagingStudies) {
        throw new Meteor.Error('collection-unavailable', 'ImagingStudies collection not available');
      }

      const currentUser = await Meteor.users.findOneAsync({ _id: this.userId });
      const username = currentUser?.username || currentUser?.emails?.[0]?.address || 'unknown';

      const timestamp = new Date().toISOString();
      const patientId = get(Meteor, 'settings.public.defaults.patientId', 'unknown-patient');

      const documentReference = {
        resourceType: 'DocumentReference',
        status: 'current',
        docStatus: 'final',
        type: {
          coding: [{
            system: 'http://loinc.org',
            code: '18748-4',
            display: 'Diagnostic imaging study'
          }],
          text: 'DICOM Image'
        },
        category: [{
          coding: [{
            system: 'http://loinc.org',
            code: 'LP29684-5',
            display: 'Radiology'
          }]
        }],
        subject: {
          reference: `Patient/${patientId}`
        },
        date: timestamp,
        author: [{
          reference: `Practitioner/${this.userId}`,
          display: username
        }],
        description: `DICOM file: ${fileInfo.filename}`,
        content: [{
          attachment: {
            contentType: 'application/dicom',
            data: fileInfo.data,
            title: fileInfo.filename,
            creation: timestamp,
            size: fileInfo.size
          }
        }]
      };

      const docRefId = await DocumentReferences.insertAsync(documentReference);
      console.log('Created DocumentReference:', docRefId);

      const imagingStudy = {
        resourceType: 'ImagingStudy',
        status: 'available',
        subject: {
          reference: `Patient/${patientId}`
        },
        started: timestamp,
        numberOfSeries: 1,
        numberOfInstances: 1,
        description: `Imaging study from ${fileInfo.filename}`,
        series: [{
          uid: `${Date.now()}.1`,
          number: 1,
          modality: {
            system: 'http://dicom.nema.org/resources/ontology/DCM',
            code: 'CT',
            display: 'Computed Tomography'
          },
          description: 'DICOM series',
          numberOfInstances: 1,
          started: timestamp,
          instance: [{
            uid: `${Date.now()}.1.1`,
            sopClass: {
              system: 'urn:ietf:rfc:3986',
              code: 'urn:oid:1.2.840.10008.5.1.4.1.1.2'
            },
            number: 1
          }]
        }]
      };

      const imagingStudyId = await ImagingStudies.insertAsync(imagingStudy);
      console.log('Created ImagingStudy:', imagingStudyId);

      const verifyStudy = await ImagingStudies.findOneAsync({ _id: imagingStudyId });
      console.log('Verified ImagingStudy in database:', verifyStudy ? 'Found' : 'NOT FOUND');

      await DocumentReferences.updateAsync(docRefId, {
        $set: {
          'context.related': [{
            reference: `ImagingStudy/${imagingStudyId}`
          }]
        }
      });

      console.log('DICOM to FHIR conversion completed successfully');

      return {
        success: true,
        documentReference: {
          id: docRefId,
          resourceType: 'DocumentReference'
        },
        imagingStudy: {
          id: imagingStudyId,
          resourceType: 'ImagingStudy'
        },
        filename: fileInfo.filename
      };

    } catch (error) {
      console.error('Error converting DICOM to FHIR:', error);
      throw new Meteor.Error('fhir-conversion-failed', error.message);
    }
  },

  /**
   * Create FHIR resources for a DICOM file that was uploaded to GridFS via HTTP
   * Called after POST /api/dicom/upload returns a fileId
   * Stores only a URL reference in the DocumentReference (no inline base64 data)
   */
  async 'dicom.createFhirResources'(fileInfo) {
    check(fileInfo, {
      fileId: String,
      filename: String,
      size: Number,
      url: String
    });

    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in');
    }

    try {
      console.log('Creating FHIR resources for GridFS file:', fileInfo.filename, 'fileId:', fileInfo.fileId);

      const DocumentReferences = global.Collections?.DocumentReferences;
      const ImagingStudies = global.Collections?.ImagingStudies;

      if (!DocumentReferences) {
        throw new Meteor.Error('collection-unavailable', 'DocumentReferences collection not available');
      }

      const currentUser = await Meteor.users.findOneAsync({ _id: this.userId });
      const username = currentUser?.username || currentUser?.emails?.[0]?.address || 'unknown';

      const timestamp = new Date().toISOString();
      const patientId = get(Meteor, 'settings.public.defaults.patientId', 'unknown-patient');

      // Create FHIR DocumentReference with URL reference (not inline data)
      const documentReference = {
        resourceType: 'DocumentReference',
        status: 'current',
        docStatus: 'final',
        type: {
          coding: [{
            system: 'http://loinc.org',
            code: '18748-4',
            display: 'Diagnostic imaging study'
          }],
          text: 'DICOM Image'
        },
        category: [{
          coding: [{
            system: 'http://loinc.org',
            code: 'LP29684-5',
            display: 'Radiology'
          }]
        }],
        subject: {
          reference: `Patient/${patientId}`
        },
        date: timestamp,
        author: [{
          reference: `Practitioner/${this.userId}`,
          display: username
        }],
        description: `DICOM file: ${fileInfo.filename}`,
        content: [{
          attachment: {
            contentType: 'application/dicom',
            url: fileInfo.url,  // GridFS URL reference instead of inline data
            title: fileInfo.filename,
            creation: timestamp,
            size: fileInfo.size
          }
        }]
      };

      const docRefId = await DocumentReferences.insertAsync(documentReference);
      console.log('Created DocumentReference:', docRefId, '(GridFS URL:', fileInfo.url, ')');

      // Create ImagingStudy if collection is available
      let imagingStudyId = null;
      if (ImagingStudies) {
        const imagingStudy = {
          resourceType: 'ImagingStudy',
          status: 'available',
          subject: {
            reference: `Patient/${patientId}`
          },
          started: timestamp,
          numberOfSeries: 1,
          numberOfInstances: 1,
          description: `Imaging study from ${fileInfo.filename}`,
          series: [{
            uid: `${Date.now()}.1`,
            number: 1,
            modality: {
              system: 'http://dicom.nema.org/resources/ontology/DCM',
              code: 'CT',
              display: 'Computed Tomography'
            },
            description: 'DICOM series',
            numberOfInstances: 1,
            started: timestamp,
            instance: [{
              uid: `${Date.now()}.1.1`,
              sopClass: {
                system: 'urn:ietf:rfc:3986',
                code: 'urn:oid:1.2.840.10008.5.1.4.1.1.2'
              },
              number: 1
            }]
          }]
        };

        imagingStudyId = await ImagingStudies.insertAsync(imagingStudy);
        console.log('Created ImagingStudy:', imagingStudyId);

        // Link DocumentReference to ImagingStudy
        await DocumentReferences.updateAsync(docRefId, {
          $set: {
            'context.related': [{
              reference: `ImagingStudy/${imagingStudyId}`
            }]
          }
        });
      }

      console.log('FHIR resources created for GridFS file:', fileInfo.fileId);

      return {
        success: true,
        documentReference: {
          id: docRefId,
          resourceType: 'DocumentReference'
        },
        imagingStudy: imagingStudyId ? {
          id: imagingStudyId,
          resourceType: 'ImagingStudy'
        } : null,
        filename: fileInfo.filename
      };

    } catch (error) {
      console.error('Error creating FHIR resources for GridFS file:', error);
      throw new Meteor.Error('fhir-resource-creation-failed', error.message);
    }
  },

  /**
   * Get GridFS storage status for the Getting Started wizard
   * Returns initialization status, file count, total storage size
   */
  async 'dicom.getGridFSStatus'() {
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in');
    }

    try {
      const GridFSManager = global.GridFSManager;

      if (!GridFSManager) {
        return {
          initialized: false,
          bucketName: 'dicom',
          chunkSize: 255 * 1024,
          fileCount: 0,
          totalSize: 0,
          message: 'GridFSManager not available on global scope'
        };
      }

      const stats = await GridFSManager.getStats();
      return stats;
    } catch (error) {
      console.error('Error getting GridFS status:', error);
      return {
        initialized: false,
        error: error.message
      };
    }
  }
});

console.log('DICOM server methods registered');
