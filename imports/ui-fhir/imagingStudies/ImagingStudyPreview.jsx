// imports/ui-fhir/imagingStudies/ImagingStudyPreview.jsx

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';

import {
  Chip,
  Divider,
  Typography,
  Box,
  Stack,
  CircularProgress,
  Alert
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';

import ErrorBoundary from '/imports/ui/ErrorBoundary';

const SimpleDicomViewport = React.lazy(function() {
  return import('/imports/ui/DICOM/components/SimpleDicomViewport');
});

const statusOptions = [
  { value: 'registered', label: 'Registered' },
  { value: 'available', label: 'Available' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'entered-in-error', label: 'Entered in Error' },
  { value: 'unknown', label: 'Unknown' }
];

const statusColorMap = {
  'registered': 'info',
  'available': 'success',
  'cancelled': 'default',
  'entered-in-error': 'error',
  'unknown': 'warning'
};

function ImagingStudyPreview({ resource, resourceId, embedded, viewerOnly }) {
  var imagingStudy = resource || {};

  // Settings guard for DICOM viewer
  var dicomViewerSetting = get(Meteor, 'settings.public.modules.DicomViewer', false);
  var dicomViewerEnabled = dicomViewerSetting === true || get(dicomViewerSetting, 'enabled', false) === true;

  // Extract gridfsFileIds from study series/instances
  function getGridfsFileIdsFromStudy(studyData) {
    var fileIds = [];
    if (studyData && studyData.series) {
      for (var i = 0; i < studyData.series.length; i++) {
        var series = studyData.series[i];
        if (series.instance) {
          for (var j = 0; j < series.instance.length; j++) {
            var instance = series.instance[j];
            var extensions = instance.extension || [];
            for (var k = 0; k < extensions.length; k++) {
              if (extensions[k].url === 'gridfsFileId' && extensions[k].valueString) {
                fileIds.push(extensions[k].valueString);
              }
            }
          }
        }
      }
    }
    return fileIds;
  }

  var gridfsFileIds = getGridfsFileIdsFromStudy(imagingStudy);

  // Import-time studies carry transient localBlobUrl extensions (the
  // dropped File, pre-upload) — usable directly, no authenticated fetch
  function getLocalBlobUrlsFromStudy(studyData) {
    var urls = [];
    (get(studyData, 'series', []) || []).forEach(function(series) {
      (get(series, 'instance', []) || []).forEach(function(instance) {
        (get(instance, 'extension', []) || []).forEach(function(extension) {
          if (extension.url === 'localBlobUrl' && extension.valueString) {
            urls.push(extension.valueString);
          }
        });
      });
    });
    return urls;
  }

  var localBlobUrls = getLocalBlobUrlsFromStudy(imagingStudy);

  // Fetch DICOM files and convert to blob URLs
  var [dicomFileUrls, setDicomFileUrls] = useState([]);
  var [dicomFetchError, setDicomFetchError] = useState(null);

  useEffect(function() {
    if (!dicomViewerEnabled) {
      setDicomFileUrls([]);
      return;
    }

    // Pre-upload path: local blob URLs from the import page win — the
    // GridFS fileIds are still empty placeholders at this point
    if (localBlobUrls.length > 0) {
      setDicomFileUrls(localBlobUrls);
      return;
    }

    if (gridfsFileIds.length === 0) {
      setDicomFileUrls([]);
      return;
    }

    var revoked = false;
    var blobUrls = [];

    async function fetchDicomFiles() {
      try {
        var loginToken = localStorage.getItem('Meteor.loginToken');
        var headers = {};
        if (loginToken) {
          headers['Authorization'] = 'Bearer ' + loginToken;
        }

        var fetchedUrls = [];

        for (var i = 0; i < gridfsFileIds.length; i++) {
          if (revoked) break;

          var fileId = gridfsFileIds[i];
          var fileUrl = '/api/dicom/files/' + fileId;

          console.log('[ImagingStudyPreview] Fetching DICOM file', i + 1, 'of', gridfsFileIds.length, ':', fileId);

          var response = await fetch(fileUrl, { headers: headers });
          if (!response.ok) {
            console.warn('[ImagingStudyPreview] Skipping file', fileId, ':', response.status);
            continue;
          }

          var blob = await response.blob();
          var blobUrl = URL.createObjectURL(blob);
          fetchedUrls.push(blobUrl);
          blobUrls.push(blobUrl);
        }

        if (!revoked) {
          console.log('[ImagingStudyPreview] Loaded', fetchedUrls.length, 'DICOM file(s)');
          setDicomFileUrls(fetchedUrls);
        }
      } catch (err) {
        console.error('[ImagingStudyPreview] Error fetching DICOM files:', err);
        if (!revoked) {
          setDicomFetchError(err.message);
        }
      }
    }

    fetchDicomFiles();

    return function() {
      revoked = true;
      blobUrls.forEach(function(url) {
        URL.revokeObjectURL(url);
      });
    };
  }, [JSON.stringify(gridfsFileIds), JSON.stringify(localBlobUrls), dicomViewerEnabled]);

  var description = get(imagingStudy, 'description', 'Untitled Imaging Study');
  var statusValue = get(imagingStudy, 'status', 'unknown');
  var statusLabel = get(statusOptions.find(function(opt) { return opt.value === statusValue; }), 'label', statusValue);
  var statusColor = get(statusColorMap, statusValue, 'default');
  var modalityDisplay = get(imagingStudy, 'modality[0].display', '');
  var modalityCode = get(imagingStudy, 'modality[0].code', '');
  var startedDate = get(imagingStudy, 'started', '');
  var formattedStarted = startedDate ? moment(startedDate).format('MMMM D, YYYY [at] h:mm A') : '';
  var patientDisplay = get(imagingStudy, 'subject.display', '');
  var patientReference = get(imagingStudy, 'subject.reference', '');
  var referrerDisplay = get(imagingStudy, 'referrer.display', '');
  var locationDisplay = get(imagingStudy, 'location.display', '');
  var numberOfSeries = get(imagingStudy, 'numberOfSeries', '');
  var numberOfInstances = get(imagingStudy, 'numberOfInstances', '');
  var procedureCode = get(imagingStudy, 'procedureCode[0].coding[0].code', '');
  var procedureDisplay = get(imagingStudy, 'procedureCode[0].coding[0].display', '') ||
                           get(imagingStudy, 'procedureCode[0].text', '');
  var interpreterDisplay = get(imagingStudy, 'interpreter[0].display', '');
  var endpointDisplay = get(imagingStudy, 'endpoint[0].display', '');
  var reasonCode = get(imagingStudy, 'reasonCode[0].coding[0].code', '');
  var reasonDisplay = get(imagingStudy, 'reasonCode[0].coding[0].display', '') ||
                        get(imagingStudy, 'reasonCode[0].text', '');
  var noteText = get(imagingStudy, 'note[0].text', '');

  // viewerOnly: render just the DICOM viewer block — used by
  // ImagingStudyDetail's form/embedded views beneath the form fields,
  // where the text summary would duplicate the form content.
  if (viewerOnly) {
    if (!dicomViewerEnabled || (dicomFileUrls.length === 0 && !dicomFetchError)) {
      return null;
    }
    return (
      <Box sx={{ py: 2 }}>
        <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          DICOM Viewer
        </Typography>
        {dicomFetchError ? (
          <Alert severity="warning">Could not load DICOM files: {dicomFetchError}</Alert>
        ) : (
          <ErrorBoundary fallback={
            <Alert severity="warning">DICOM viewer failed to load. Try refreshing the page.</Alert>
          }>
            <React.Suspense fallback={
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <CircularProgress />
              </Box>
            }>
              <SimpleDicomViewport dicomUrls={dicomFileUrls} />
            </React.Suspense>
          </ErrorBoundary>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Title (description) + Status Chip */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          {description}
        </Typography>
        <Chip label={statusLabel} color={statusColor} size="small" />
      </Box>

      {/* Subtitle: modality display + code */}
      {modalityDisplay && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          {modalityDisplay}{modalityCode ? ' (' + modalityCode + ')' : ''}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata: Patient/Referrer (left), Started/Location (right) */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          {patientDisplay && (
            <>
              <Typography variant="overline" color="text.secondary">
                Patient
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {patientDisplay}
              </Typography>
            </>
          )}
          {patientReference && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              {patientReference}
            </Typography>
          )}
          {referrerDisplay && (
            <>
              <Typography variant="overline" color="text.secondary">
                Referrer
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {referrerDisplay}
              </Typography>
            </>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          {formattedStarted && (
            <>
              <Typography variant="overline" color="text.secondary">
                Started
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {formattedStarted}
              </Typography>
            </>
          )}
          {locationDisplay && (
            <>
              <Typography variant="overline" color="text.secondary">
                Location
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {locationDisplay}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      {/* DICOM Viewer — settings-gated, only when study has linked files */}
      {dicomViewerEnabled && dicomFileUrls.length > 0 && (
        <>
          <Divider />
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              DICOM Viewer
            </Typography>
            <ErrorBoundary fallback={
              <Alert severity="warning">DICOM viewer failed to load. Try refreshing the page.</Alert>
            }>
              <React.Suspense fallback={
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                  <CircularProgress />
                </Box>
              }>
                <SimpleDicomViewport
                  dicomUrls={dicomFileUrls}
                />
              </React.Suspense>
            </ErrorBoundary>
          </Box>
        </>
      )}

      {/* DICOM fetch error */}
      {dicomViewerEnabled && dicomFetchError && (
        <>
          <Divider />
          <Box sx={{ py: 2 }}>
            <Alert severity="error">
              Failed to load DICOM files: {dicomFetchError}
            </Alert>
          </Box>
        </>
      )}

      <Divider />

      {/* Series / Instances / Procedure section */}
      {(numberOfSeries || numberOfInstances || procedureDisplay) && (
        <>
          <Box sx={{ py: 2 }}>
            <Stack direction="row" spacing={4}>
              {numberOfSeries && (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Series
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {numberOfSeries}
                  </Typography>
                </Box>
              )}
              {numberOfInstances && (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Instances
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {numberOfInstances}
                  </Typography>
                </Box>
              )}
              {procedureDisplay && (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Procedure
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {procedureDisplay}{procedureCode ? ' (' + procedureCode + ')' : ''}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
          <Divider />
        </>
      )}

      {/* Interpreter / Endpoint section */}
      {(interpreterDisplay || endpointDisplay) && (
        <>
          <Box sx={{ py: 2 }}>
            <Stack direction="row" spacing={4}>
              {interpreterDisplay && (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Interpreter
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {interpreterDisplay}
                  </Typography>
                </Box>
              )}
              {endpointDisplay && (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Endpoint
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {endpointDisplay}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
          <Divider />
        </>
      )}

      {/* Reason section */}
      {(reasonDisplay || reasonCode) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Reason
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {reasonDisplay}{reasonCode ? ' (' + reasonCode + ')' : ''}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Notes section */}
      <Box sx={{ py: 3 }}>
        <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Notes
        </Typography>
        <Typography
          variant="body1"
          sx={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.8,
            minHeight: '100px'
          }}
        >
          {noteText || 'No notes provided.'}
        </Typography>
      </Box>

      <Divider />

      {/* Footer with study ID */}
      {resourceId && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Imaging Study ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default ImagingStudyPreview;
