// packages/data-importer/lib/BinaryFileClassifier.js
//
// Classifies dropped files by extension and filename patterns
// for binary medical file import (.dcm, .wav, .pdf).

var BINARY_EXTENSIONS = ['.dcm', '.wav', '.pdf'];

/**
 * Check if a file is a binary medical import file (quick check for routing).
 * @param {File} file
 * @returns {boolean}
 */
function isBinaryImportFile(file) {
  if (!file || !file.name) return false;
  var name = file.name.toLowerCase();
  for (var i = 0; i < BINARY_EXTENSIONS.length; i++) {
    if (name.endsWith(BINARY_EXTENSIONS[i])) return true;
  }
  return false;
}

/**
 * Classify an array of File objects by extension and filename patterns.
 *
 * Classification rules:
 *   .dcm              → type: 'dicom',   label: 'DICOM Image'
 *   .wav + "ECG" name → type: 'ecg-wav', label: 'ECG Recording'
 *   .wav (other)      → type: 'pcg-wav', label: 'Heart Sound Recording'
 *   .pdf              → type: 'pdf',     label: 'Summary Report'
 *
 * @param {File[]} fileArray
 * @returns {{ file: File, type: string, label: string, icon: string }[]}
 */
function classifyFiles(fileArray) {
  var results = [];

  for (var i = 0; i < fileArray.length; i++) {
    var file = fileArray[i];
    var name = file.name.toLowerCase();
    var entry = null;

    if (name.endsWith('.dcm')) {
      entry = { file: file, type: 'dicom', label: 'DICOM Image', icon: 'Description' };
    } else if (name.endsWith('.wav')) {
      if (name.indexOf('ecg') !== -1) {
        entry = { file: file, type: 'ecg-wav', label: 'ECG Recording', icon: 'AudioFile' };
      } else {
        entry = { file: file, type: 'pcg-wav', label: 'Heart Sound Recording', icon: 'AudioFile' };
      }
    } else if (name.endsWith('.pdf')) {
      entry = { file: file, type: 'pdf', label: 'Summary Report', icon: 'PictureAsPdf' };
    }

    if (entry) {
      results.push(entry);
    }
  }

  return results;
}

export { isBinaryImportFile, classifyFiles };
export default { isBinaryImportFile, classifyFiles };
