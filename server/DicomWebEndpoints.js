// server/DicomWebEndpoints.js
//
// Minimal read-only DICOMweb facade over the RIS's own data:
//   QIDO-RS study/series/instance queries built from the ImagingStudies
//   collection, per-instance metadata parsed with dcmjs from the GridFS DICOM
//   files, and WADO-URI part10 retrieval streamed from GridFS.
//
// Purpose: let a DICOMweb consumer (OHIF launched via SMART, see
// extensions/merkalis/scripts/demo-smart-launch.sh) render studies straight
// from the RIS without a separate PACS. Deliberately NOT a full DICOMweb
// implementation — no STOW, no WADO-RS frames (consumers use
// imageRendering: 'wadouri'), no fuzzy matching.
//
// Settings-gated (default OFF):
//   settings.private.dicomweb.enabled — serve the endpoints
//
// Authentication: every request runs the SAME FhirAuth pipeline as the FHIR
// REST endpoints (parseUserAuthorization → isAuthorized → ImagingStudy scope).
// There is deliberately no auth bypass here — in dev deployments that set
// settings.private.fhir.disableOauth, the pipeline itself grants the noauth
// role, which is what lets a local OHIF fetch without credentials.

import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { get } from 'lodash';
import dcmjs from 'dcmjs';

import {
  limiter,
  parseUserAuthorization,
  isAuthorized,
  isResourceScopeAuthorized
} from './lib/FhirAuth.js';

import GridFSManager from './lib/GridFSManager.js';
import { corsMiddleware } from './lib/Cors.js';

const log = (Meteor.Logger ? Meteor.Logger.for('DicomWebEndpoints') : console);
const { DicomMessage } = dcmjs.data;

const dicomwebEnabled = get(Meteor, 'settings.private.dicomweb.enabled', false);

// Parsed-metadata cache: gridfsFileId -> sanitized DICOM JSON dict.
// DICOM headers are immutable per file, so entries never invalidate; the cap
// only bounds memory on large archives.
const metadataCache = new Map();
const METADATA_CACHE_MAX = 500;

// =============================================================================
// DICOM JSON helpers
// =============================================================================

function attr(vr, values) {
  const cleaned = (values || []).filter(function(v) { return v !== undefined && v !== null && v !== ''; });
  if (cleaned.length === 0) return undefined;
  return { vr: vr, Value: cleaned };
}

function pnAttr(name) {
  if (!name) return undefined;
  // FHIR display "Camila Maria Lopez" -> DICOM PN "Lopez^Camila Maria" is
  // lossy guesswork; serve the display string as the Alphabetic group.
  return { vr: 'PN', Value: [{ Alphabetic: name }] };
}

function isoToDa(iso) {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString().substring(0, 10).replace(/-/g, '');
}

function isoToTm(iso) {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString().substring(11, 19).replace(/:/g, '');
}

function bareUid(value) {
  return value ? String(value).replace(/^urn:oid:/, '') : value;
}

function studyUidOf(study) {
  const ident = (get(study, 'identifier') || []).find(function(i) { return i.system === 'urn:dicom:uid'; });
  return bareUid(get(ident, 'value'));
}

function patientIdOf(study) {
  const ref = get(study, 'subject.reference', '');
  return ref.replace(/^Patient\//, '').replace(/^urn:uuid:/, '');
}

function modalitiesOf(study) {
  const codes = (get(study, 'series') || []).map(function(s) { return get(s, 'modality.code'); });
  return Array.from(new Set(codes.filter(Boolean)));
}

function studyToDicomJson(study) {
  const json = {
    '00080020': attr('DA', [isoToDa(get(study, 'started'))]),
    '00080030': attr('TM', [isoToTm(get(study, 'started'))]),
    '00080050': attr('SH', [get(study, 'identifier.1.value')]),
    '00080061': attr('CS', modalitiesOf(study)),
    '00080090': pnAttr(get(study, 'referrer.display')),
    '00081030': attr('LO', [get(study, 'description')]),
    '00100010': pnAttr(get(study, 'subject.display')),
    '00100020': attr('LO', [patientIdOf(study)]),
    '0020000D': attr('UI', [studyUidOf(study)]),
    '00201206': attr('IS', [get(study, 'numberOfSeries')]),
    '00201208': attr('IS', [get(study, 'numberOfInstances')])
  };
  Object.keys(json).forEach(function(k) { if (json[k] === undefined) delete json[k]; });
  return json;
}

function seriesToDicomJson(study, series) {
  const json = {
    '00080060': attr('CS', [get(series, 'modality.code')]),
    '0008103E': attr('LO', [get(series, 'description')]),
    '0020000D': attr('UI', [studyUidOf(study)]),
    '0020000E': attr('UI', [bareUid(get(series, 'uid'))]),
    '00200011': attr('IS', [get(series, 'number')]),
    '00201209': attr('IS', [get(series, 'numberOfInstances', (get(series, 'instance') || []).length)])
  };
  Object.keys(json).forEach(function(k) { if (json[k] === undefined) delete json[k]; });
  return json;
}

function instanceFileId(instance) {
  const ext = (get(instance, 'extension') || []).find(function(e) { return e.url === 'gridfsFileId'; });
  return get(ext, 'valueString');
}

// Tags whose payloads are bulk binary — stripped from /metadata responses
// (consumers fetch pixels via WADO-URI and parse the part10 file themselves).
const BULK_TAGS = ['7FE00010', '7FE00009', '7FE00008', '00542400', '00880200', '7FE00001'];

function jsonSafe(value) {
  if (value === null || value === undefined) return true;
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean') return true;
  if (Array.isArray(value)) return value.every(jsonSafe);
  if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer) return false;
  if (t === 'object') return Object.values(value).every(jsonSafe);
  return false;
}

function sanitizeDict(dict) {
  const out = {};
  Object.keys(dict).forEach(function(tag) {
    if (BULK_TAGS.includes(tag)) return;
    const entry = dict[tag];
    if (!entry || !entry.vr) return;
    if (entry.Value !== undefined && !jsonSafe(entry.Value)) return;
    out[tag] = entry;
  });
  return out;
}

async function readGridFsBuffer(fileId) {
  return new Promise(function(resolve, reject) {
    const chunks = [];
    const stream = GridFSManager.openDownloadStream(fileId);
    stream.on('data', function(c) { chunks.push(c); });
    stream.on('error', reject);
    stream.on('end', function() { resolve(Buffer.concat(chunks)); });
  });
}

async function instanceMetadata(fileId) {
  if (metadataCache.has(fileId)) {
    return metadataCache.get(fileId);
  }
  const buf = await readGridFsBuffer(fileId);
  const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const dicomDict = DicomMessage.readFile(arrayBuffer, { ignoreErrors: true });
  const sanitized = sanitizeDict(dicomDict.dict || {});
  // Surface the transfer syntax (group 0002 lives in dicomDict.meta) — some
  // consumers use it as a rendering hint even in wadouri mode.
  const tsn = get(dicomDict, "meta['00020010']");
  if (tsn && !sanitized['00020010']) {
    sanitized['00020010'] = tsn;
  }
  if (metadataCache.size >= METADATA_CACHE_MAX) {
    metadataCache.delete(metadataCache.keys().next().value);
  }
  metadataCache.set(fileId, sanitized);
  return sanitized;
}

// =============================================================================
// Request plumbing
// =============================================================================

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/dicom+json' });
  res.end(JSON.stringify(payload));
}

async function authorize(req, res) {
  const authorizationContext = await parseUserAuthorization(req);
  if (!authorizationContext || !(await isAuthorized(authorizationContext))) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized. Provide a valid session or Bearer token.' }));
    return false;
  }
  if (!isResourceScopeAuthorized(authorizationContext, 'ImagingStudy')) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Insufficient scope for ImagingStudy' }));
    return false;
  }
  return true;
}

function imagingStudiesCollection() {
  return get(global, 'Collections.ImagingStudies') || get(Meteor, 'Collections.ImagingStudies') || null;
}

async function findStudyByUid(studyUID) {
  const ImagingStudies = imagingStudiesCollection();
  if (!ImagingStudies) return null;
  return await ImagingStudies.findOneAsync({
    'identifier.value': { $in: [studyUID, 'urn:oid:' + studyUID] }
  });
}

// =============================================================================
// Endpoints
// =============================================================================

if (dicomwebEnabled) {

  WebApp.connectHandlers.use('/dicomweb', corsMiddleware());

  WebApp.connectHandlers.use('/dicomweb', async function(req, res) {
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    if (req.method !== 'GET') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    try {
      const hasTokens = await limiter.tryRemoveTokens(1);
      if (!hasTokens) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Rate limit exceeded' }));
        return;
      }

      if (!(await authorize(req, res))) return;

      const url = new URL(req.url, 'http://localhost');
      const path = url.pathname.replace(/\/+$/, '');
      const ImagingStudies = imagingStudiesCollection();
      if (!ImagingStudies) {
        sendJson(res, 503, { error: 'ImagingStudies collection unavailable' });
        return;
      }

      // ---- WADO-URI: /dicomweb/wado?requestType=WADO&studyUID=&seriesUID=&objectUID=
      if (path === '/wado') {
        const studyUID = bareUid(url.searchParams.get('studyUID'));
        const seriesUID = bareUid(url.searchParams.get('seriesUID'));
        const objectUID = bareUid(url.searchParams.get('objectUID'));
        const study = await findStudyByUid(studyUID);
        if (!study) { sendJson(res, 404, { error: 'Study not found: ' + studyUID }); return; }

        let fileId = null;
        (get(study, 'series') || []).forEach(function(series) {
          if (seriesUID && bareUid(series.uid) !== seriesUID) return;
          (get(series, 'instance') || []).forEach(function(instance) {
            if (bareUid(instance.uid) === objectUID) {
              fileId = instanceFileId(instance);
            }
          });
        });
        if (!fileId) { sendJson(res, 404, { error: 'Instance not found: ' + objectUID }); return; }

        const fileMeta = await GridFSManager.findFile(fileId);
        if (!fileMeta) { sendJson(res, 404, { error: 'DICOM file missing from GridFS: ' + fileId }); return; }

        res.writeHead(200, {
          'Content-Type': 'application/dicom',
          'Content-Length': fileMeta.length || 0,
          'Accept-Ranges': 'bytes'
        });
        const stream = GridFSManager.openDownloadStream(fileId);
        stream.on('error', function(error) {
          log.error('WADO-URI stream error', { fileId, error: error.message });
          if (!res.headersSent) { sendJson(res, 500, { error: 'Stream failed' }); }
        });
        stream.pipe(res);
        return;
      }

      // ---- QIDO: /dicomweb/studies
      if (path === '/studies') {
        const uidFilter = bareUid(url.searchParams.get('StudyInstanceUID'));
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10) || 100, 1000);
        let docs;
        if (uidFilter) {
          const one = await findStudyByUid(uidFilter);
          docs = one ? [one] : [];
        } else {
          docs = await ImagingStudies.find(
            { 'identifier.system': 'urn:dicom:uid' },
            { limit: limit }
          ).fetchAsync();
        }
        sendJson(res, 200, docs.filter(studyUidOf).map(studyToDicomJson));
        return;
      }

      // ---- /dicomweb/studies/<uid>/series[...]
      const seriesMatch = path.match(/^\/studies\/([^/]+)\/series$/);
      const instancesMatch = path.match(/^\/studies\/([^/]+)\/series\/([^/]+)\/instances$/);
      const metadataMatch = path.match(/^\/studies\/([^/]+)\/series\/([^/]+)\/metadata$/);
      const studyMetadataMatch = path.match(/^\/studies\/([^/]+)\/metadata$/);

      if (seriesMatch || instancesMatch || metadataMatch || studyMetadataMatch) {
        const studyUID = bareUid(decodeURIComponent((seriesMatch || instancesMatch || metadataMatch || studyMetadataMatch)[1]));
        const study = await findStudyByUid(studyUID);
        if (!study) { sendJson(res, 404, { error: 'Study not found: ' + studyUID }); return; }

        if (seriesMatch) {
          sendJson(res, 200, (get(study, 'series') || []).map(function(s) { return seriesToDicomJson(study, s); }));
          return;
        }

        const wantedSeriesUID = metadataMatch || instancesMatch
          ? bareUid(decodeURIComponent((metadataMatch || instancesMatch)[2]))
          : null;
        const seriesList = (get(study, 'series') || []).filter(function(s) {
          return !wantedSeriesUID || bareUid(s.uid) === wantedSeriesUID;
        });
        if (wantedSeriesUID && seriesList.length === 0) {
          sendJson(res, 404, { error: 'Series not found: ' + wantedSeriesUID });
          return;
        }

        if (instancesMatch) {
          const out = [];
          seriesList.forEach(function(series) {
            (get(series, 'instance') || []).forEach(function(instance) {
              out.push({
                '00080016': attr('UI', [bareUid(get(instance, 'sopClass.code'))]),
                '00080018': attr('UI', [bareUid(instance.uid)]),
                '0020000D': attr('UI', [studyUID]),
                '0020000E': attr('UI', [bareUid(series.uid)]),
                '00200013': attr('IS', [get(instance, 'number')])
              });
            });
          });
          sendJson(res, 200, out);
          return;
        }

        // metadata (series-level or study-level): parse each instance file
        const out = [];
        for (const series of seriesList) {
          for (const instance of (get(series, 'instance') || [])) {
            const fileId = instanceFileId(instance);
            if (!fileId) {
              log.warn('Instance has no gridfsFileId — skipping in metadata', { studyUID, instanceUid: instance.uid });
              continue;
            }
            try {
              out.push(await instanceMetadata(fileId));
            } catch (parseError) {
              log.error('DICOM metadata parse failed', { fileId, error: parseError.message });
            }
          }
        }
        if (out.length === 0) {
          sendJson(res, 404, { error: 'No parsable instances for study ' + studyUID });
          return;
        }
        sendJson(res, 200, out);
        return;
      }

      sendJson(res, 404, { error: 'Unknown DICOMweb path: ' + path });
    } catch (error) {
      log.error('DICOMweb request failed', { url: req.url, error: error.message });
      if (!res.headersSent) {
        sendJson(res, 500, { error: 'DICOMweb request failed: ' + error.message });
      }
    }
  });

  console.log('[DicomWebEndpoints] Read-only DICOMweb facade registered at /dicomweb (FhirAuth pipeline enforced)');
} else {
  log.debug('DICOMweb facade disabled (settings.private.dicomweb.enabled is not true)');
}
