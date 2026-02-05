// imports/ui/DICOM/utils/KeyImageUtils.js
// Loosely coupled utility for Key Image detection and creation
// Extensible for future approaches (annotations, clinical notes, etc.)

import { get } from 'lodash';

/**
 * Check if a DocumentReference is a Key Image
 * Extensible function - add new detection strategies as needed
 * @param {Object} docRef - DocumentReference resource
 * @returns {boolean}
 */
export function isKeyImage(docRef) {
  if (!docRef) {
    return false;
  }

  // Strategy 1: Check meta.tag for key-image code
  const tags = get(docRef, 'meta.tag', []);
  const hasKeyImageTag = tags.some(function(tag) {
    return tag.code === 'key-image' ||
           (tag.system && tag.system.includes('key-image'));
  });

  // Strategy 2: Check type.coding for DICOM KO (Key Object Selection)
  const typeCoding = get(docRef, 'type.coding', []);
  const hasKOType = typeCoding.some(function(coding) {
    return coding.code === 'KO' ||
           (coding.display && coding.display.includes('Key Object'));
  });

  // Strategy 3: Check category for key-image (future extension point)
  const categoryCoding = get(docRef, 'category', []);
  const hasKeyImageCategory = categoryCoding.some(function(cat) {
    const code = get(cat, 'coding.0.code', '');
    return code === 'key-image';
  });

  // Strategy 4: Check type.text for "Key Image" (simple text match)
  const typeText = get(docRef, 'type.text', '');
  const hasKeyImageTypeText = typeText.toLowerCase().includes('key image');

  // Return true if ANY strategy matches
  return hasKeyImageTag || hasKOType || hasKeyImageCategory || hasKeyImageTypeText;
}

/**
 * Check if an ImagingStudy instance has been marked as a Key Image
 * Looks for existing DocumentReference with matching SOP Instance UID
 * @param {Object} instance - ImagingStudy.series.instance element
 * @param {Array} documentReferences - Array of DocumentReference resources
 * @returns {boolean}
 */
export function isInstanceKeyImage(instance, documentReferences) {
  if (!instance || !documentReferences) {
    return false;
  }

  const gridfsFileId = getGridfsFileIdFromInstance(instance);
  if (!gridfsFileId) {
    return false;
  }

  // Check if any Key Image DocumentReference links to this GridFS file
  return documentReferences.some(function(docRef) {
    if (!isKeyImage(docRef)) {
      return false;
    }

    const attachmentUrl = get(docRef, 'content.0.attachment.url', '');
    return attachmentUrl.includes(gridfsFileId);
  });
}

/**
 * Extract GridFS file ID from ImagingStudy instance extension
 * @param {Object} instance - ImagingStudy.series.instance element
 * @returns {string|null}
 */
export function getGridfsFileIdFromInstance(instance) {
  if (!instance || !instance.extension) {
    return null;
  }

  const gridfsExtension = instance.extension.find(function(ext) {
    return ext.url === 'gridfsFileId';
  });

  return gridfsExtension ? gridfsExtension.valueString : null;
}

/**
 * Find the DocumentReference for a given instance (if it exists as Key Image)
 * @param {Object} instance - ImagingStudy.series.instance element
 * @param {Array} documentReferences - Array of DocumentReference resources
 * @returns {Object|null}
 */
export function findKeyImageDocRef(instance, documentReferences) {
  if (!instance || !documentReferences) {
    return null;
  }

  const gridfsFileId = getGridfsFileIdFromInstance(instance);
  if (!gridfsFileId) {
    return null;
  }

  return documentReferences.find(function(docRef) {
    if (!isKeyImage(docRef)) {
      return false;
    }

    const attachmentUrl = get(docRef, 'content.0.attachment.url', '');
    return attachmentUrl.includes(gridfsFileId);
  }) || null;
}

/**
 * Build a Key Image DocumentReference
 * Uses both meta.tag AND type.coding for maximum compatibility
 * @param {Object} options
 * @param {string} options.gridfsFileId - GridFS file ID
 * @param {string} options.imagingStudyId - ImagingStudy ID
 * @param {string} options.sopInstanceUid - SOP Instance UID
 * @param {string} [options.description] - Optional description
 * @param {string} [options.patientId] - Optional patient ID
 * @returns {Object} - DocumentReference resource
 */
export function buildKeyImageDocumentReference(options) {
  const {
    gridfsFileId,
    imagingStudyId,
    sopInstanceUid,
    description,
    patientId
  } = options;

  const docRef = {
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

    // Content: Link to GridFS file
    content: [{
      attachment: {
        contentType: 'application/dicom',
        url: '/api/dicom/file/' + gridfsFileId
      }
    }],

    // Context: Link to ImagingStudy
    context: {
      related: [{
        reference: 'ImagingStudy/' + imagingStudyId
      }]
    },

    // Description
    description: description || ('Key Image: ' + sopInstanceUid)
  };

  // Add patient reference if provided
  if (patientId) {
    docRef.subject = {
      reference: 'Patient/' + patientId
    };
  }

  return docRef;
}

/**
 * Get Key Image stats for display
 * @param {Array} documentReferences - Array of DocumentReference resources
 * @returns {Object} - Stats object
 */
export function getKeyImageStats(documentReferences) {
  if (!documentReferences || !Array.isArray(documentReferences)) {
    return { total: 0, keyImages: 0, regular: 0 };
  }

  const keyImages = documentReferences.filter(isKeyImage);

  return {
    total: documentReferences.length,
    keyImages: keyImages.length,
    regular: documentReferences.length - keyImages.length
  };
}
