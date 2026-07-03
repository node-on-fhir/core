// packages/data-importer/lib/WavHeaderParser.js
//
// Parses WAV file RIFF header client-side to extract metadata
// before upload. Returns null if the buffer is not a valid WAV file.

/**
 * Parse the RIFF/WAV header from an ArrayBuffer.
 *
 * WAV header layout (minimum 44 bytes):
 *   Bytes 0-3:   "RIFF"
 *   Bytes 4-7:   file size – 8
 *   Bytes 8-11:  "WAVE"
 *   Bytes 12-15: "fmt " subchunk ID
 *   Bytes 16-19: fmt subchunk size (16 for PCM)
 *   Bytes 20-21: audio format (1 = PCM)
 *   Bytes 22-23: numChannels
 *   Bytes 24-27: sampleRate
 *   Bytes 28-31: byteRate
 *   Bytes 32-33: blockAlign
 *   Bytes 34-35: bitsPerSample
 *   ... then one or more subchunks; we scan for "data" subchunk.
 *
 * @param {ArrayBuffer} arrayBuffer
 * @returns {{ channels: number, sampleRateHz: number, bitsPerSample: number, dataSize: number, durationSec: number } | null}
 */
function parseWavHeader(arrayBuffer) {
  if (!arrayBuffer || arrayBuffer.byteLength < 44) return null;

  var view = new DataView(arrayBuffer);

  // Check RIFF magic (bytes 0-3)
  var riff = String.fromCharCode(
    view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3)
  );
  if (riff !== 'RIFF') return null;

  // Check WAVE format (bytes 8-11)
  var wave = String.fromCharCode(
    view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11)
  );
  if (wave !== 'WAVE') return null;

  // Read fmt subchunk fields (little-endian)
  var channels = view.getUint16(22, true);
  var sampleRateHz = view.getUint32(24, true);
  var byteRate = view.getUint32(28, true);
  var bitsPerSample = view.getUint16(34, true);

  // Scan for "data" subchunk to get data size
  var dataSize = 0;
  var offset = 36;
  var maxScan = Math.min(arrayBuffer.byteLength, 1024); // Only scan first 1 KB

  while (offset + 8 <= maxScan) {
    var chunkId = String.fromCharCode(
      view.getUint8(offset), view.getUint8(offset + 1),
      view.getUint8(offset + 2), view.getUint8(offset + 3)
    );
    var chunkSize = view.getUint32(offset + 4, true);

    if (chunkId === 'data') {
      dataSize = chunkSize;
      break;
    }

    // Move to next subchunk (8 bytes header + chunkSize, word-aligned)
    offset += 8 + chunkSize;
    if (chunkSize % 2 !== 0) offset += 1; // Padding byte
  }

  // Calculate duration
  var durationSec = 0;
  if (byteRate > 0 && dataSize > 0) {
    durationSec = Math.round((dataSize / byteRate) * 10) / 10;
  }

  return {
    channels: channels,
    sampleRateHz: sampleRateHz,
    bitsPerSample: bitsPerSample,
    dataSize: dataSize,
    durationSec: durationSec
  };
}

/**
 * Parse full WAV file and extract PCM sample data.
 *
 * Reads the complete ArrayBuffer, validates PCM format, and returns decoded
 * integer samples from channel 0. Multi-channel files extract channel 0 only.
 * Truncates to options.maxSeconds (default 3) to keep payload manageable.
 *
 * @param {ArrayBuffer} arrayBuffer - Full WAV file contents
 * @param {object} [options]
 * @param {number} [options.maxSeconds=3] - Maximum seconds of samples to extract
 * @returns {{ channels: number, sampleRateHz: number, bitsPerSample: number, dataSize: number, durationSec: number, samples: number[], totalSamples: number, extractedSeconds: number } | null}
 */
function parseWavSamples(arrayBuffer, options) {
  if (!arrayBuffer || arrayBuffer.byteLength < 44) return null;

  var opts = options || {};
  var maxSeconds = typeof opts.maxSeconds === 'number' ? opts.maxSeconds : 3;

  var view = new DataView(arrayBuffer);

  // Check RIFF magic (bytes 0-3)
  var riff = String.fromCharCode(
    view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3)
  );
  if (riff !== 'RIFF') return null;

  // Check WAVE format (bytes 8-11)
  var wave = String.fromCharCode(
    view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11)
  );
  if (wave !== 'WAVE') return null;

  // Read fmt subchunk fields (little-endian)
  var audioFormat = view.getUint16(20, true);
  var channels = view.getUint16(22, true);
  var sampleRateHz = view.getUint32(24, true);
  var byteRate = view.getUint32(28, true);
  var blockAlign = view.getUint16(32, true);
  var bitsPerSample = view.getUint16(34, true);

  // Only support PCM (audioFormat === 1)
  if (audioFormat !== 1) return null;

  // Scan full file for "data" subchunk
  var dataOffset = -1;
  var dataSize = 0;
  var offset = 36;

  while (offset + 8 <= arrayBuffer.byteLength) {
    var chunkId = String.fromCharCode(
      view.getUint8(offset), view.getUint8(offset + 1),
      view.getUint8(offset + 2), view.getUint8(offset + 3)
    );
    var chunkSize = view.getUint32(offset + 4, true);

    if (chunkId === 'data') {
      dataOffset = offset + 8;
      dataSize = chunkSize;
      break;
    }

    // Move to next subchunk (8 bytes header + chunkSize, word-aligned)
    offset += 8 + chunkSize;
    if (chunkSize % 2 !== 0) offset += 1; // Padding byte
  }

  if (dataOffset < 0 || dataSize === 0) return null;

  // Calculate total frames and duration
  var bytesPerFrame = blockAlign || (channels * (bitsPerSample / 8));
  var totalFrames = Math.floor(dataSize / bytesPerFrame);
  var totalDurationSec = sampleRateHz > 0 ? totalFrames / sampleRateHz : 0;

  // Limit to maxSeconds
  var maxFrames = Math.floor(maxSeconds * sampleRateHz);
  var framesToRead = Math.min(totalFrames, maxFrames);
  var extractedSeconds = sampleRateHz > 0
    ? Math.round((framesToRead / sampleRateHz) * 100) / 100
    : 0;

  // Extract samples (channel 0 only)
  var samples = [];
  var bytesPerSample = bitsPerSample / 8;

  for (var i = 0; i < framesToRead; i++) {
    var frameOffset = dataOffset + (i * bytesPerFrame);
    if (frameOffset + bytesPerSample > arrayBuffer.byteLength) break;

    var sample;
    if (bitsPerSample === 16) {
      sample = view.getInt16(frameOffset, true); // Little-endian signed 16-bit
    } else if (bitsPerSample === 8) {
      sample = view.getUint8(frameOffset) - 128; // Unsigned 8-bit, center at 0
    } else {
      // Unsupported bit depth
      return null;
    }
    samples.push(sample);
  }

  return {
    channels: channels,
    sampleRateHz: sampleRateHz,
    bitsPerSample: bitsPerSample,
    dataSize: dataSize,
    durationSec: Math.round(totalDurationSec * 10) / 10,
    samples: samples,
    totalSamples: totalFrames,
    extractedSeconds: extractedSeconds
  };
}

export { parseWavHeader, parseWavSamples };
export default { parseWavHeader, parseWavSamples };
