// imports/ui/DICOM/utils/SimpleDicomLoader.js
// DICOM loader using Cornerstone3D Image Loader API
// Creates image IDs that Cornerstone can load automatically

import dicomParser from 'dicom-parser';

/**
 * Parse DICOM file from base64 data and create Cornerstone image ID
 * @param {string} base64Data - Base64 encoded DICOM file
 * @returns {Object} - Parsed DICOM info with imageId for Cornerstone
 */
export function parseDicomFromBase64(base64Data) {
  try {
    // Convert base64 to ArrayBuffer
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const arrayBuffer = bytes.buffer;

    // Parse the DICOM file
    const dataSet = dicomParser.parseDicom(bytes);

    // Get transfer syntax
    const transferSyntax = dataSet.string('x00020010');
    console.log('Transfer Syntax UID:', transferSyntax);

    // Create a blob URL from the DICOM data
    const blob = new Blob([arrayBuffer], { type: 'application/dicom' });
    const blobUrl = URL.createObjectURL(blob);

    // Create Cornerstone image ID using wadouri scheme
    const imageId = 'wadouri:' + blobUrl;

    console.log('✅ Created Cornerstone image ID:', imageId);

    return {
      dataSet: dataSet,
      arrayBuffer: arrayBuffer,
      byteArray: bytes,
      transferSyntax: transferSyntax,
      imageId: imageId,
      blobUrl: blobUrl
    };
  } catch (error) {
    console.error('Error parsing DICOM:', error);
    throw new Error(`Failed to parse DICOM file: ${error.message}`);
  }
}

/**
 * Extract DICOM metadata
 * @param {Object} dataSet - Parsed DICOM dataset
 * @returns {Object} - Metadata object
 */
export function extractDicomMetadata(dataSet) {
  function getString(tag, defaultValue = 'N/A') {
    try {
      return dataSet.string(tag) || defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }

  function getNumber(tag, defaultValue = 0) {
    try {
      return dataSet.uint16(tag) || defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }

  return {
    patientName: getString('x00100010'),
    patientID: getString('x00100020'),
    studyDate: getString('x00080020'),
    studyDescription: getString('x00081030'),
    seriesDescription: getString('x0008103e'),
    modality: getString('x00080060'),
    manufacturer: getString('x00080070'),
    imageNumber: getNumber('x00200013'),
    sliceThickness: getString('x00180050'),
    pixelSpacing: getString('x00280030'),
    rows: getNumber('x00280010'),
    columns: getNumber('x00280011'),
    bitsAllocated: getNumber('x00280100'),
    windowCenter: getString('x00281050'),
    windowWidth: getString('x00281051')
  };
}

/**
 * Parse DICOM file from an ArrayBuffer and create Cornerstone image ID
 * Used when loading DICOM from a URL (GridFS, blob URL, etc.)
 * @param {ArrayBuffer} arrayBuffer - Raw DICOM file bytes
 * @returns {Object} - Parsed DICOM info with imageId for Cornerstone
 */
export function parseDicomFromArrayBuffer(arrayBuffer) {
  try {
    const bytes = new Uint8Array(arrayBuffer);

    // Parse the DICOM file
    const dataSet = dicomParser.parseDicom(bytes);

    // Get transfer syntax
    const transferSyntax = dataSet.string('x00020010');
    console.log('Transfer Syntax UID:', transferSyntax);

    // Create a blob URL from the DICOM data
    const blob = new Blob([arrayBuffer], { type: 'application/dicom' });
    const blobUrl = URL.createObjectURL(blob);

    // Create Cornerstone image ID using wadouri scheme
    const imageId = 'wadouri:' + blobUrl;

    console.log('Created Cornerstone image ID:', imageId);

    return {
      dataSet: dataSet,
      arrayBuffer: arrayBuffer,
      byteArray: bytes,
      transferSyntax: transferSyntax,
      imageId: imageId,
      blobUrl: blobUrl
    };
  } catch (error) {
    console.error('Error parsing DICOM from ArrayBuffer:', error);
    throw new Error('Failed to parse DICOM file: ' + error.message);
  }
}

/**
 * Cleanup blob URL to free memory
 * @param {string} blobUrl - Blob URL to revoke
 */
export function cleanupBlobUrl(blobUrl) {
  if (blobUrl && blobUrl.startsWith('blob:')) {
    URL.revokeObjectURL(blobUrl);
    console.log('🧹 Cleaned up blob URL');
  }
}
