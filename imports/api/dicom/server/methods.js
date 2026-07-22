// imports/api/dicom/server/methods.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

const log = (Meteor.Logger ? Meteor.Logger.for('DicomMethods') : console);

// =============================================================================
// DICOM UPLOAD METHODS
// =============================================================================

// Max file size for DDP-based upload (base64 inline storage)
// Files larger than this must use the HTTP upload endpoint (/api/dicom/upload)
const MAX_DDP_FILE_SIZE = 12 * 1024 * 1024; // 12 MB

/**
 * Process uploaded DICOM file (legacy DDP path - small files only)
 * For large files, use POST /api/dicom/upload + dicom.createFhirResources
 */
Meteor.ServerMethods.define('dicom.processUploadedFile', {
  description: 'Store a small base64-encoded DICOM file as a FHIR DocumentReference',
  phi: true,
  schemaObject: {
    type: 'object',
    properties: {
      filename: { type: 'string' },
      data: { type: 'string' },   // base64 encoded DICOM file
      size: { type: 'number' }
    },
    required: ['filename', 'data', 'size'],
    additionalProperties: false
  }
}, async function(params, context){
  const fileInfo = params;

  // File size guard - reject large files with helpful error
  if (fileInfo.size > MAX_DDP_FILE_SIZE) {
    throw new Meteor.Error('file-too-large',
      `File is ${(fileInfo.size / (1024 * 1024)).toFixed(1)} MB. ` +
      `Files over ${MAX_DDP_FILE_SIZE / (1024 * 1024)} MB must use the HTTP upload endpoint. ` +
      `The UI will handle this automatically.`
    );
  }

  try {
    context.log.info('Processing uploaded DICOM file', { filename: fileInfo.filename, size: fileInfo.size });

    const DocumentReferences = global.Collections?.DocumentReferences;

    if (!DocumentReferences) {
      context.log.warn('DocumentReferences collection not available, returning success anyway');
      return {
        success: true,
        message: 'DICOM file processed (DocumentReferences not available)',
        filename: fileInfo.filename,
        size: fileInfo.size
      };
    }

    const currentUser = await Meteor.users.findOneAsync({ _id: context.userId });
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
        reference: `Practitioner/${context.userId}`,
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
    context.log.info('Created DocumentReference', { docRefId: docRefId, filename: fileInfo.filename });

    return {
      success: true,
      message: 'DICOM file uploaded and stored as DocumentReference',
      filename: fileInfo.filename,
      size: fileInfo.size,
      documentReferenceId: docRefId,
      resourceType: 'DocumentReference'
    };

  } catch (error) {
    context.log.error('Error processing uploaded file', { message: error.message });
    throw new Meteor.Error('upload-processing-failed', error.message);
  }
});

/**
 * Convert DICOM file to FHIR DocumentReference and ImagingStudy resources
 * (legacy DDP path - small files only)
 */
Meteor.ServerMethods.define('dicom.convertToFHIR', {
  description: 'Convert a small DICOM file into FHIR DocumentReference and ImagingStudy resources',
  phi: true,
  schemaObject: {
    type: 'object',
    properties: {
      filename: { type: 'string' },
      data: { type: 'string' },
      size: { type: 'number' }
    },
    required: ['filename', 'data', 'size'],
    additionalProperties: false
  }
}, async function(params, context){
  const fileInfo = params;

  // File size guard
  if (fileInfo.size > MAX_DDP_FILE_SIZE) {
    throw new Meteor.Error('file-too-large',
      `File is ${(fileInfo.size / (1024 * 1024)).toFixed(1)} MB. ` +
      `Files over ${MAX_DDP_FILE_SIZE / (1024 * 1024)} MB must use the HTTP upload endpoint.`
    );
  }

  try {
    context.log.info('Converting DICOM to FHIR resources', { filename: fileInfo.filename });

    const DocumentReferences = global.Collections?.DocumentReferences;
    const ImagingStudies = global.Collections?.ImagingStudies;

    if (!DocumentReferences) {
      throw new Meteor.Error('collection-unavailable', 'DocumentReferences collection not available');
    }

    if (!ImagingStudies) {
      throw new Meteor.Error('collection-unavailable', 'ImagingStudies collection not available');
    }

    const currentUser = await Meteor.users.findOneAsync({ _id: context.userId });
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
        reference: `Practitioner/${context.userId}`,
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
    context.log.info('Created DocumentReference', { docRefId: docRefId });

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
    context.log.info('Created ImagingStudy', { imagingStudyId: imagingStudyId });

    const verifyStudy = await ImagingStudies.findOneAsync({ _id: imagingStudyId });
    context.log.debug('Verified ImagingStudy in database', { found: !!verifyStudy });

    await DocumentReferences.updateAsync(docRefId, {
      $set: {
        'context.related': [{
          reference: `ImagingStudy/${imagingStudyId}`
        }]
      }
    });

    context.log.info('DICOM to FHIR conversion completed successfully');

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
    context.log.error('Error converting DICOM to FHIR', { message: error.message });
    throw new Meteor.Error('fhir-conversion-failed', error.message);
  }
});

/**
 * Create FHIR resources for a DICOM file that was uploaded to GridFS via HTTP
 * Called after POST /api/dicom/upload returns a fileId
 * Stores only a URL reference in the DocumentReference (no inline base64 data)
 */
Meteor.ServerMethods.define('dicom.createFhirResources', {
  description: 'Create FHIR DocumentReference and ImagingStudy resources for a GridFS-stored DICOM file',
  phi: true,
  schemaObject: {
    type: 'object',
    properties: {
      fileId: { type: 'string' },
      filename: { type: 'string' },
      size: { type: 'number' },
      url: { type: 'string' }
    },
    required: ['fileId', 'filename', 'size', 'url'],
    additionalProperties: false
  }
}, async function(params, context){
  const fileInfo = params;

  try {
    context.log.info('Creating FHIR resources for GridFS file', { filename: fileInfo.filename, fileId: fileInfo.fileId });

    const DocumentReferences = global.Collections?.DocumentReferences;
    const ImagingStudies = global.Collections?.ImagingStudies;

    if (!DocumentReferences) {
      throw new Meteor.Error('collection-unavailable', 'DocumentReferences collection not available');
    }

    const currentUser = await Meteor.users.findOneAsync({ _id: context.userId });
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
        reference: `Practitioner/${context.userId}`,
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
    context.log.info('Created DocumentReference', { docRefId: docRefId, url: fileInfo.url });

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
      context.log.info('Created ImagingStudy', { imagingStudyId: imagingStudyId });

      // Link DocumentReference to ImagingStudy
      await DocumentReferences.updateAsync(docRefId, {
        $set: {
          'context.related': [{
            reference: `ImagingStudy/${imagingStudyId}`
          }]
        }
      });
    }

    context.log.info('FHIR resources created for GridFS file', { fileId: fileInfo.fileId });

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
    context.log.error('Error creating FHIR resources for GridFS file', { message: error.message });
    throw new Meteor.Error('fhir-resource-creation-failed', error.message);
  }
});

/**
 * Get GridFS storage status for the Getting Started wizard
 * Returns initialization status, file count, total storage size
 */
Meteor.ServerMethods.define('dicom.getGridFSStatus', {
  description: 'Report GridFS DICOM storage initialization status and usage stats'
  // No PHI: storage infrastructure stats only
}, async function(params, context){
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
    context.log.error('Error getting GridFS status', { message: error.message });
    return {
      initialized: false,
      error: error.message
    };
  }
});

/**
 * List DICOM files stored in GridFS
 * Returns file metadata for display in the DICOM Files table
 */
Meteor.ServerMethods.define('dicom.listGridFSFiles', {
  description: 'List DICOM files stored in GridFS with patient and study metadata',
  phi: true,
  schemaObject: {
    type: 'object',
    properties: {
      patientId: { type: 'string' },
      studyInstanceUid: { type: 'string' },
      limit: { type: 'number' },
      skip: { type: 'number' }
    },
    additionalProperties: false
  }
}, async function(params, context){
  const options = params || {};

  try {
    const GridFSManager = global.GridFSManager;

    if (!GridFSManager || !GridFSManager.isInitialized()) {
      context.log.warn('GridFSManager not initialized');
      return { files: [], total: 0 };
    }

    // Access the underlying MongoDB database and files collection
    const bucket = GridFSManager.getBucket();
    const db = bucket.s.db;
    const filesCollection = db.collection('dicom.files');

    // Build query
    const query = {};

    if (options.patientId) {
      query['metadata.patientId'] = options.patientId;
    }

    if (options.studyInstanceUid) {
      query['metadata.studyInstanceUid'] = options.studyInstanceUid;
    }

    const limit = options.limit || 100;
    const skip = options.skip || 0;

    // Execute query
    const cursor = filesCollection
      .find(query)
      .sort({ uploadDate: -1 })
      .skip(skip)
      .limit(limit);

    const files = await cursor.toArray();
    const total = await filesCollection.countDocuments(query);

    context.log.info('Listed GridFS files', { count: files.length, total: total });

    // Transform for client
    const transformedFiles = files.map(function(file) {
      return {
        _id: file._id.toString(),
        filename: file.filename,
        length: file.length,
        uploadDate: file.uploadDate,
        contentType: get(file, 'metadata.contentType', 'application/dicom'),
        // DICOM metadata
        studyInstanceUid: get(file, 'metadata.studyInstanceUid'),
        seriesInstanceUid: get(file, 'metadata.seriesInstanceUid'),
        sopInstanceUid: get(file, 'metadata.sopInstanceUid'),
        modality: get(file, 'metadata.modality'),
        studyDate: get(file, 'metadata.studyDate'),
        studyDescription: get(file, 'metadata.studyDescription'),
        seriesDescription: get(file, 'metadata.seriesDescription'),
        instanceNumber: get(file, 'metadata.instanceNumber'),
        // Patient info
        patientId: get(file, 'metadata.patientId'),
        dicomPatientName: get(file, 'metadata.dicomPatientName'),
        dicomPatientId: get(file, 'metadata.dicomPatientId'),
        // FHIR linkage
        imagingStudyId: get(file, 'metadata.imagingStudyId'),
        documentReferenceId: get(file, 'metadata.documentReferenceId'),
        // Original upload info
        userId: get(file, 'metadata.userId'),
        originalName: get(file, 'metadata.originalName')
      };
    });

    return {
      files: transformedFiles,
      total: total,
      limit: limit,
      skip: skip
    };

  } catch (error) {
    context.log.error('Error listing GridFS files', { message: error.message });
    throw new Meteor.Error('gridfs-query-failed', error.message);
  }
});

// =============================================================================
// DICOM AGGREGATION AND KEY IMAGE METHODS
// =============================================================================

/**
 * Create or update ImagingStudy resources from uploaded GridFS files
 * Aggregates files by StudyInstanceUID - multiple files become one ImagingStudy
 * Does NOT create DocumentReferences (those are only for Key Images)
 */
Meteor.ServerMethods.define('dicom.createOrUpdateImagingStudy', {
  description: 'Aggregate GridFS DICOM files into FHIR ImagingStudy resources by StudyInstanceUID',
  phi: true,
  positionalParams: ['gridfsFileIds', 'options'],
  schemaObject: {
    type: 'object',
    properties: {
      gridfsFileIds: { type: 'array', items: { type: 'string' } },
      options: {
        type: 'object',
        properties: {
          patientId: { type: 'string' },
          serviceRequestId: { type: 'string' }
        },
        additionalProperties: false
      }
    },
    required: ['gridfsFileIds']
  }
}, async function(params, context){
  const gridfsFileIds = params.gridfsFileIds;
  const options = params.options || {};

  try {
    context.log.info('Processing files for ImagingStudy aggregation', { fileCount: gridfsFileIds.length });

    const GridFSManager = global.GridFSManager;
    const ImagingStudies = global.Collections?.ImagingStudies;

    if (!GridFSManager || !GridFSManager.isInitialized()) {
      throw new Meteor.Error('gridfs-unavailable', 'GridFS not initialized');
    }

    if (!ImagingStudies) {
      throw new Meteor.Error('collection-unavailable', 'ImagingStudies collection not available');
    }

    // Get files collection
    const bucket = GridFSManager.getBucket();
    const db = bucket.s.db;
    const filesCollection = db.collection('dicom.files');
    const { ObjectId } = await import('mongodb');

    // Load all file metadata
    const objectIds = gridfsFileIds.map(function(id) {
      return new ObjectId(id);
    });

    const files = await filesCollection.find({
      _id: { $in: objectIds }
    }).toArray();

    context.log.info('Loaded file records', { count: files.length });

    // Group files by StudyInstanceUID
    const studyGroups = {};

    for (const file of files) {
      const studyUid = get(file, 'metadata.studyInstanceUid', 'unknown-study');

      if (!studyGroups[studyUid]) {
        studyGroups[studyUid] = [];
      }

      studyGroups[studyUid].push(file);
    }

    const studyUids = Object.keys(studyGroups);
    context.log.info('Found unique studies', { count: studyUids.length });

    const results = [];
    const patientId = options.patientId || get(Meteor, 'settings.public.defaults.patientId', 'unknown-patient');

    // Look up Patient for display name (try _id first, then FHIR id fallback)
    const Patients = global.Collections?.Patients;
    let patientDisplay = '';
    if (Patients && patientId && patientId !== 'unknown-patient') {
      let patientRecord = await Patients.findOneAsync({ _id: patientId });
      if (!patientRecord) {
        patientRecord = await Patients.findOneAsync({ id: patientId });
      }
      if (patientRecord) {
        patientDisplay = get(patientRecord, 'name.0.text',
          [get(patientRecord, 'name.0.given.0', ''), get(patientRecord, 'name.0.family', '')].filter(Boolean).join(' ')
        );
        log.phi('[dicom.createOrUpdateImagingStudy] Patient display', { patientDisplay }, { action: 'create' });
      }
    }

    // Look up ServiceRequest for basedOn reference
    const ServiceRequests = global.Collections?.ServiceRequests;
    let serviceRequestRef = null;
    if (ServiceRequests && options.serviceRequestId) {
      let srRecord = await ServiceRequests.findOneAsync({ _id: options.serviceRequestId });
      if (!srRecord) {
        srRecord = await ServiceRequests.findOneAsync({ id: options.serviceRequestId });
      }
      if (srRecord) {
        const srId = srRecord._id;
        const srDisplay = get(srRecord, 'code.text',
          get(srRecord, 'code.coding.0.display', 'Service Request')
        );
        serviceRequestRef = {
          reference: 'ServiceRequest/' + srId,
          display: srDisplay
        };
        context.log.info('ServiceRequest ref resolved', { serviceRequestRef: serviceRequestRef });
      }
    }

    // Process each unique study
    for (const studyUid of studyUids) {
      const studyFiles = studyGroups[studyUid];
      const firstFile = studyFiles[0];

      context.log.info('Processing study', { studyUid: studyUid, fileCount: studyFiles.length });

      // Check if ImagingStudy already exists for this StudyInstanceUID
      let existingStudy = await ImagingStudies.findOneAsync({
        'identifier.value': studyUid
      });

      // Also check by identifier.value with urn:oid: prefix
      if (!existingStudy) {
        existingStudy = await ImagingStudies.findOneAsync({
          'identifier.value': 'urn:oid:' + studyUid
        });
      }

      // Group files by SeriesInstanceUID within this study
      const seriesGroups = {};
      for (const file of studyFiles) {
        const seriesUid = get(file, 'metadata.seriesInstanceUid', 'unknown-series');

        if (!seriesGroups[seriesUid]) {
          seriesGroups[seriesUid] = {
            metadata: {
              modality: get(file, 'metadata.modality', 'OT'),
              seriesDescription: get(file, 'metadata.seriesDescription'),
              seriesNumber: get(file, 'metadata.seriesNumber')
            },
            instances: []
          };
        }

        seriesGroups[seriesUid].instances.push(file);
      }

      // Build series array with instances
      const seriesArray = [];
      let totalInstances = 0;

      for (const seriesUid of Object.keys(seriesGroups)) {
        const seriesData = seriesGroups[seriesUid];
        const instances = seriesData.instances;

        // Sort instances by instance number
        instances.sort(function(a, b) {
          const numA = get(a, 'metadata.instanceNumber', 0) || 0;
          const numB = get(b, 'metadata.instanceNumber', 0) || 0;
          return numA - numB;
        });

        const instanceArray = instances.map(function(file, idx) {
          return {
            uid: get(file, 'metadata.sopInstanceUid', Date.now() + '.' + idx),
            number: get(file, 'metadata.instanceNumber', idx + 1),
            sopClass: {
              system: 'urn:ietf:rfc:3986',
              code: get(file, 'metadata.sopClassUid', 'urn:oid:1.2.840.10008.5.1.4.1.1.2')
            },
            // Extension: Link to GridFS file
            extension: [{
              url: 'gridfsFileId',
              valueString: file._id.toString()
            }]
          };
        });

        totalInstances += instanceArray.length;

        seriesArray.push({
          uid: seriesUid,
          number: seriesData.metadata.seriesNumber || seriesArray.length + 1,
          modality: {
            system: 'http://dicom.nema.org/resources/ontology/DCM',
            code: seriesData.metadata.modality || 'OT',
            display: seriesData.metadata.modality || 'Other'
          },
          description: seriesData.metadata.seriesDescription,
          numberOfInstances: instanceArray.length,
          instance: instanceArray
        });
      }

      if (existingStudy) {
        // UPDATE existing ImagingStudy: merge new series/instances
        context.log.info('Updating existing study', { imagingStudyId: existingStudy._id });

        // Clean orphaned instances: remove instances whose GridFS files no longer exist
        const existingSeries = existingStudy.series || [];
        const existingFileIds = [];
        for (const series of existingSeries) {
          for (const inst of (series.instance || [])) {
            const gridfsExt = (inst.extension || []).find(function(e) { return e.url === 'gridfsFileId'; });
            if (gridfsExt && gridfsExt.valueString) {
              existingFileIds.push(gridfsExt.valueString);
            }
          }
        }

        if (existingFileIds.length > 0) {
          const existingObjectIds = existingFileIds.map(function(id) {
            try { return new ObjectId(id); } catch (e) { return null; }
          }).filter(Boolean);

          const foundFiles = await filesCollection.find(
            { _id: { $in: existingObjectIds } },
            { projection: { _id: 1 } }
          ).toArray();
          const validFileIdSet = new Set(foundFiles.map(function(f) { return f._id.toString(); }));

          let orphanedCount = 0;
          for (const series of existingSeries) {
            if (series.instance) {
              const beforeCount = series.instance.length;
              series.instance = series.instance.filter(function(inst) {
                const gridfsExt = (inst.extension || []).find(function(e) { return e.url === 'gridfsFileId'; });
                if (!gridfsExt || !gridfsExt.valueString) return true;
                return validFileIdSet.has(gridfsExt.valueString);
              });
              orphanedCount += beforeCount - series.instance.length;
              series.numberOfInstances = series.instance.length;
            }
          }

          if (orphanedCount > 0) {
            context.log.info('Cleaned orphaned instances from existing study', { orphanedCount: orphanedCount });
          }
        }

        // Merge series - combine existing with new, deduping by series UID
        const existingSeriesMap = {};

        for (const series of existingSeries) {
          existingSeriesMap[series.uid] = series;
        }

        for (const newSeries of seriesArray) {
          if (existingSeriesMap[newSeries.uid]) {
            // Merge instances into existing series
            const existingInstances = existingSeriesMap[newSeries.uid].instance || [];
            const existingUids = new Set(existingInstances.map(function(i) { return i.uid; }));

            for (const newInstance of newSeries.instance) {
              if (!existingUids.has(newInstance.uid)) {
                existingInstances.push(newInstance);
              }
            }

            existingSeriesMap[newSeries.uid].instance = existingInstances;
            existingSeriesMap[newSeries.uid].numberOfInstances = existingInstances.length;
          } else {
            // Add new series
            existingSeriesMap[newSeries.uid] = newSeries;
          }
        }

        const mergedSeries = Object.values(existingSeriesMap);
        const mergedTotalInstances = mergedSeries.reduce(function(sum, s) {
          return sum + (s.numberOfInstances || 0);
        }, 0);

        const updateFields = {
          series: mergedSeries,
          numberOfSeries: mergedSeries.length,
          numberOfInstances: mergedTotalInstances
        };

        // Always update subject when a valid patient is provided
        if (patientId !== 'unknown-patient') {
          updateFields.subject = { reference: 'Patient/' + patientId };
          if (patientDisplay) {
            updateFields.subject.display = patientDisplay;
          }
        }

        // Merge basedOn — add ServiceRequest if not already present
        if (serviceRequestRef) {
          const existingBasedOn = get(existingStudy, 'basedOn', []);
          const alreadyLinked = existingBasedOn.some(function(ref) {
            return get(ref, 'reference') === serviceRequestRef.reference;
          });
          if (!alreadyLinked) {
            updateFields.basedOn = existingBasedOn.concat([serviceRequestRef]);
          }
        }

        const updateResult = await ImagingStudies.updateAsync(
          { _id: existingStudy._id },
          { $set: updateFields }
        );

        context.log.info('Update result', { updateResult: updateResult, fields: Object.keys(updateFields) });

        results.push({
          action: 'updated',
          imagingStudyId: existingStudy._id,
          studyInstanceUid: studyUid,
          seriesCount: mergedSeries.length,
          instanceCount: mergedTotalInstances
        });

      } else {
        // CREATE new ImagingStudy
        const subjectRef = { reference: 'Patient/' + patientId };
        if (patientDisplay) {
          subjectRef.display = patientDisplay;
        }

        const imagingStudy = {
          resourceType: 'ImagingStudy',
          status: 'available',
          identifier: [{
            use: 'official',
            system: 'urn:dicom:uid',
            value: studyUid
          }],
          subject: subjectRef,
          started: get(firstFile, 'metadata.studyDate')
            ? formatDicomDateForFhir(get(firstFile, 'metadata.studyDate'))
            : new Date().toISOString(),
          description: get(firstFile, 'metadata.studyDescription', 'DICOM Study'),
          numberOfSeries: seriesArray.length,
          numberOfInstances: totalInstances,
          series: seriesArray
        };

        // Add basedOn if ServiceRequest was found
        if (serviceRequestRef) {
          imagingStudy.basedOn = [serviceRequestRef];
        }

        const imagingStudyId = await ImagingStudies.insertAsync(imagingStudy);
        context.log.info('Created ImagingStudy', { imagingStudyId: imagingStudyId });

        results.push({
          action: 'created',
          imagingStudyId: imagingStudyId,
          studyInstanceUid: studyUid,
          seriesCount: seriesArray.length,
          instanceCount: totalInstances
        });

        // Update GridFS files with ImagingStudy reference
        for (const file of studyFiles) {
          await filesCollection.updateOne(
            { _id: file._id },
            { $set: { 'metadata.imagingStudyId': imagingStudyId } }
          );
        }
      }
    }

    context.log.info('ImagingStudy aggregation complete', { studiesProcessed: results.length });

    return {
      success: true,
      studies: results
    };

  } catch (error) {
    context.log.error('Error creating/updating ImagingStudy', { message: error.message });
    throw new Meteor.Error('imaging-study-creation-failed', error.message);
  }
});

/**
 * Create a Key Image DocumentReference for a specific DICOM instance
 * Called when user marks an instance as a Key Image in the UI
 */
Meteor.ServerMethods.define('dicom.createKeyImage', {
  description: 'Create a Key Image DocumentReference for a specific DICOM instance',
  phi: true,
  schemaObject: {
    type: 'object',
    properties: {
      gridfsFileId: { type: 'string' },
      imagingStudyId: { type: 'string' },
      sopInstanceUid: { type: 'string' },
      description: { type: 'string' }
    },
    required: ['gridfsFileId', 'imagingStudyId', 'sopInstanceUid'],
    additionalProperties: false
  }
}, async function(params, context){
  const options = params;

  try {
    context.log.info('Creating Key Image', { sopInstanceUid: options.sopInstanceUid });

    const DocumentReferences = global.Collections?.DocumentReferences;

    if (!DocumentReferences) {
      throw new Meteor.Error('collection-unavailable', 'DocumentReferences collection not available');
    }

    // Look up actual content type from GridFS file metadata
    const GridFSManager = global.GridFSManager;
    let fileContentType = 'application/dicom';
    if (GridFSManager && GridFSManager.isInitialized()) {
      const bucket = GridFSManager.getBucket();
      const db = bucket.s.db;
      const filesCollection = db.collection('dicom.files');
      const { ObjectId } = await import('mongodb');
      const fileMeta = await filesCollection.findOne({ _id: new ObjectId(options.gridfsFileId) });
      fileContentType = get(fileMeta, 'metadata.contentType', 'application/dicom');
      context.log.debug('File contentType resolved', { fileContentType: fileContentType });
    }

    const currentUser = await Meteor.users.findOneAsync({ _id: context.userId });
    const username = currentUser?.username || currentUser?.emails?.[0]?.address || 'unknown';

    // Look up actual patient from the ImagingStudy (required for pub/sub patient filtering)
    const ImagingStudies = global.Collections?.ImagingStudies;
    let patientId = 'unknown-patient';
    if (ImagingStudies) {
      const imagingStudy = await ImagingStudies.findOneAsync({ _id: options.imagingStudyId });
      if (imagingStudy) {
        const subjectRef = get(imagingStudy, 'subject.reference', '');
        patientId = subjectRef.replace('Patient/', '') || patientId;
      }
    }
    const timestamp = new Date().toISOString();

    // Build Key Image DocumentReference using both meta.tag AND type.coding
    const documentReference = {
      resourceType: 'DocumentReference',
      status: 'current',
      docStatus: 'final',

      // Type: DICOM Key Object Selection (semantic meaning)
      type: {
        coding: [{
          system: 'http://dicom.nema.org/resources/ontology/DCM',
          code: 'KO',
          display: 'Key Object Selection'
        }],
        text: 'Key Image'
      },

      // Meta tag: For easy filtering and identification
      meta: {
        tag: [{
          system: 'http://honeycomb.health/fhir/tag',
          code: 'key-image',
          display: 'Key Image'
        }]
      },

      // Subject: Patient
      subject: {
        reference: 'Patient/' + patientId
      },

      // Date and author
      date: timestamp,
      author: [{
        reference: 'Practitioner/' + context.userId,
        display: username
      }],

      // Description
      description: options.description || ('Key Image: ' + options.sopInstanceUid),

      // Content: Link to GridFS file
      content: [{
        attachment: {
          contentType: fileContentType,
          url: '/api/dicom/files/' + options.gridfsFileId,
          creation: timestamp
        }
      }],

      // Context: Link to ImagingStudy
      context: {
        related: [{
          reference: 'ImagingStudy/' + options.imagingStudyId
        }]
      }
    };

    const docRefId = await DocumentReferences.insertAsync(documentReference);
    context.log.info('Created Key Image DocumentReference', { docRefId: docRefId });

    return {
      success: true,
      documentReferenceId: docRefId,
      sopInstanceUid: options.sopInstanceUid
    };

  } catch (error) {
    context.log.error('Error creating Key Image', { message: error.message });
    throw new Meteor.Error('key-image-creation-failed', error.message);
  }
});

/**
 * Remove a Key Image DocumentReference
 * Called when user unmarks an instance as a Key Image in the UI
 */
Meteor.ServerMethods.define('dicom.removeKeyImage', {
  description: 'Remove a Key Image DocumentReference by id',
  phi: true,
  positionalParams: ['documentReferenceId'],
  schemaObject: {
    type: 'object',
    properties: { documentReferenceId: { type: 'string' } },
    required: ['documentReferenceId']
  }
}, async function(params, context){
  const documentReferenceId = params.documentReferenceId;

  try {
    context.log.info('Removing Key Image', { documentReferenceId: documentReferenceId });

    const DocumentReferences = global.Collections?.DocumentReferences;

    if (!DocumentReferences) {
      throw new Meteor.Error('collection-unavailable', 'DocumentReferences collection not available');
    }

    const result = await DocumentReferences.removeAsync({ _id: documentReferenceId });
    context.log.info('Removed Key Image', { removed: result });

    return {
      success: true,
      removed: result
    };

  } catch (error) {
    context.log.error('Error removing Key Image', { message: error.message });
    throw new Meteor.Error('key-image-removal-failed', error.message);
  }
});

/**
 * Regenerate ImagingStudy resources from ALL existing GridFS DICOM files
 * Used to process files uploaded before the aggregation logic was implemented
 * This is an admin operation - processes all files regardless of owner
 */
Meteor.ServerMethods.define('dicom.regenerateAllImagingStudies', {
  description: 'Regenerate ImagingStudy resources from all DICOM files stored in GridFS',
  phi: true
}, async function(params, context){
  try {
    context.log.info('Starting bulk ImagingStudy regeneration');

    const GridFSManager = global.GridFSManager;

    if (!GridFSManager || !GridFSManager.isInitialized()) {
      throw new Meteor.Error('gridfs-unavailable', 'GridFS not initialized');
    }

    // Get all GridFS file IDs
    const bucket = GridFSManager.getBucket();
    const db = bucket.s.db;
    const filesCollection = db.collection('dicom.files');

    const allFiles = await filesCollection.find({}).toArray();
    const fileIds = allFiles.map(function(f) {
      return f._id.toString();
    });

    context.log.info('Found files to process', { count: fileIds.length });

    if (fileIds.length === 0) {
      return {
        success: true,
        message: 'No DICOM files found in GridFS',
        filesProcessed: 0,
        studiesCreated: 0
      };
    }

    // Call the aggregation method in-process (preserves userId through the
    // ServerMethods pipeline; Meteor.callAsync would lose the invocation context)
    const result = await Meteor.ServerMethods.invoke('dicom.createOrUpdateImagingStudy',
      { gridfsFileIds: fileIds, options: {} },
      { userId: context.userId }
    );

    context.log.info('Regeneration complete', { studies: (result.studies || []).length });

    return {
      success: true,
      message: 'ImagingStudies regenerated from existing files',
      filesProcessed: fileIds.length,
      studies: result.studies || []
    };

  } catch (error) {
    context.log.error('Error regenerating ImagingStudies', { message: error.message });
    throw new Meteor.Error('regeneration-failed', error.message);
  }
});

/**
 * Check for duplicate DICOM files in GridFS storage
 * Uses MongoDB aggregation to find SOPInstanceUIDs uploaded more than once
 */
Meteor.ServerMethods.define('dicom.checkDuplicateFiles', {
  description: 'Find SOPInstanceUIDs uploaded to GridFS more than once',
  phi: true
}, async function(params, context){
  try {
    const GridFSManager = global.GridFSManager;

    if (!GridFSManager || !GridFSManager.isInitialized()) {
      return { duplicates: [], totalDuplicateFiles: 0, uniqueDuplicatedImages: 0 };
    }

    const bucket = GridFSManager.getBucket();
    const db = bucket.s.db;
    const filesCollection = db.collection('dicom.files');

    const pipeline = [
      { $match: { 'metadata.sopInstanceUid': { $exists: true, $ne: null } } },
      { $group: {
        _id: '$metadata.sopInstanceUid',
        count: { $sum: 1 },
        studyUids: { $addToSet: '$metadata.studyInstanceUid' },
        filenames: { $push: '$filename' }
      }},
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ];

    const duplicates = await filesCollection.aggregate(pipeline).toArray();
    const totalDuplicateFiles = duplicates.reduce(function(sum, d) { return sum + d.count; }, 0);

    context.log.info('Duplicate check complete', { duplicatedImages: duplicates.length, totalDuplicateFiles: totalDuplicateFiles });

    return {
      duplicates: duplicates,
      totalDuplicateFiles: totalDuplicateFiles,
      uniqueDuplicatedImages: duplicates.length
    };

  } catch (error) {
    context.log.error('Error checking duplicate files', { message: error.message });
    throw new Meteor.Error('duplicate-check-failed', error.message);
  }
});

/**
 * Check for existing files in GridFS by filename (originalName)
 * Used to detect duplicates before uploading binary files.
 */
Meteor.ServerMethods.define('dicom.checkExistingFiles', {
  description: 'Check GridFS for already-uploaded files matching a list of filenames',
  phi: true,
  schemaObject: {
    type: 'object',
    properties: {
      filenames: { type: 'array', items: { type: 'string' } }
    },
    required: ['filenames'],
    additionalProperties: false
  }
}, async function(params, context){
  const options = params;

  try {
    const GridFSManager = global.GridFSManager;

    if (!GridFSManager || !GridFSManager.isInitialized()) {
      return { matches: [] };
    }

    const bucket = GridFSManager.getBucket();
    const db = bucket.s.db;
    const filesCollection = db.collection('dicom.files');

    // Query by originalName in metadata, or by filename
    const query = {
      $or: [
        { 'metadata.originalName': { $in: options.filenames } },
        { filename: { $in: options.filenames } }
      ]
    };

    const files = await filesCollection.find(query).toArray();

    context.log.info('Checked filenames for existing matches', {
      checked: options.filenames.length,
      found: files.length
    });

    var matches = files.map(function(file) {
      return {
        _id: file._id.toString(),
        filename: file.filename,
        originalName: get(file, 'metadata.originalName', file.filename),
        url: '/api/dicom/files/' + file._id.toString(),
        uploadDate: file.uploadDate
      };
    });

    return { matches: matches };

  } catch (error) {
    context.log.error('Error checking existing files', { message: error.message });
    throw new Meteor.Error('check-existing-failed', error.message);
  }
});

/**
 * Delete a GridFS file by its _id
 * Removes the file document and its chunks from the dicom GridFS bucket,
 * and also removes the linked ImagingStudy (if any)
 */
Meteor.ServerMethods.define('dicom.deleteGridFSFile', {
  description: 'Delete a GridFS DICOM file and its linked ImagingStudy',
  phi: true,
  positionalParams: ['fileId'],
  schemaObject: {
    type: 'object',
    properties: { fileId: { type: 'string' } },
    required: ['fileId']
  }
}, async function(params, context){
  const fileId = params.fileId;

  const GridFSManager = global.GridFSManager;
  if (!GridFSManager || !GridFSManager.isInitialized()) {
    throw new Meteor.Error('gridfs-unavailable', 'GridFS is not initialized');
  }

  context.log.info('Deleting file', { fileId: fileId });

  // Look up file metadata before deleting so we can find the linked ImagingStudy
  const fileMeta = await GridFSManager.findFile(fileId);
  const imagingStudyId = get(fileMeta, 'metadata.imagingStudyId');

  const deleted = await GridFSManager.deleteFile(fileId);
  if (!deleted) {
    throw new Meteor.Error('delete-failed', 'Failed to delete file from GridFS');
  }

  context.log.info('Successfully deleted file', { fileId: fileId });

  // Remove the linked ImagingStudy
  if (imagingStudyId) {
    const ImagingStudies = global.Collections?.ImagingStudies;
    if (ImagingStudies) {
      const removed = await ImagingStudies.removeAsync({ _id: imagingStudyId });
      context.log.info('Removed linked ImagingStudy', { imagingStudyId: imagingStudyId, removed: removed });
    } else {
      context.log.warn('ImagingStudies collection not available, could not remove study', { imagingStudyId: imagingStudyId });
    }
  } else {
    context.log.info('No linked ImagingStudy for file', { fileId: fileId });
  }

  return true;
});

/**
 * Helper: Format DICOM date (YYYYMMDD) to FHIR datetime
 */
function formatDicomDateForFhir(dicomDate) {
  if (!dicomDate || dicomDate.length < 8) {
    return new Date().toISOString();
  }

  const year = dicomDate.substring(0, 4);
  const month = dicomDate.substring(4, 6);
  const day = dicomDate.substring(6, 8);

  return year + '-' + month + '-' + day + 'T00:00:00.000Z';
}

log.info('DICOM server methods registered');
