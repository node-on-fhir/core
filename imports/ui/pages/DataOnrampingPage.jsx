// imports/ui/pages/DataOnrampingPage.jsx
//
// Data Onramping launcher / hub page (route: /data-onramping).
//
// The "front door" for loading a longitudinal personal health record. Rather
// than making the operator hunt across /import-data, /dicom/upload, /pdf-parser,
// /facebook-import, etc., this page presents a responsive grid of ONRAMP TILES —
// one per data type / loader — each with an icon, supported-formats line, a
// live status chip, and a Launch button that navigates (React Router, never
// window.location) to the appropriate existing surface.
//
// Roadmap item 4 of the personalized-ETL campaign
// (fable/superpowers/specs/2026-08-31-import-patient-attachment-design-v2.md).
//
// Design notes:
//   - The ImportAttachmentBanner sits in the header so the operator sees WHO
//     imports will attach to (selected patient / profile-linked / new record /
//     unlinked warehouse) BEFORE picking an onramp. Tri-state: the preview RPC
//     resolves into `attachmentPreview` (null while loading → banner renders
//     nothing → no flicker).
//   - Extension-backed tiles (PDF, Social Media) are only available when their
//     package is loaded via EXTRA_WORKFLOWS. Availability is detected AT RENDER
//     TIME (never module scope, per the lazy-Package-check rule) by looking for
//     the tile's route in WorkflowRegistry.getRoutes(). Unavailable → the tile
//     is disabled with an explanatory tooltip.
//   - Future sources (Weather, Financial/Receipts, Genomics) render as disabled
//     "Coming soon" tiles so the roadmap is legible to the operator.
//   - Greedy-height per .claude/rules/ui/layout-patterns.md (height:100%, flex
//     cascade, minHeight:0, inner scroll). Theme tokens only.

import React, { useEffect, useState } from 'react';

import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Tooltip,
  Divider,
  Stack
} from '@mui/material';

import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ShareIcon from '@mui/icons-material/Share';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import BiotechIcon from '@mui/icons-material/Biotech';
import HistoryIcon from '@mui/icons-material/History';

import { get } from 'lodash';
import { useNavigate } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import WorkflowRegistry from '/imports/lib/WorkflowRegistry.js';
import ImportAttachmentBanner from '/imports/ui/components/ImportAttachmentBanner.jsx';

const log = (Meteor.Logger ? Meteor.Logger.for('DataOnrampingPage') : console);

// ---------------------------------------------------------------------------
// Onramp tile catalog
//
// `requiresRoute` marks a tile as extension-backed: the tile is only enabled
// when a route with that exact path is registered in WorkflowRegistry (i.e. the
// package is loaded via EXTRA_WORKFLOWS). Tiles without `requiresRoute` are core
// surfaces (data-importer / dicom) that always ship.
//
// `comingSoon: true` renders a permanently-disabled placeholder for a
// roadmap source that isn't built yet.
// ---------------------------------------------------------------------------
const ONRAMP_TILES = [
  {
    key: 'fhir-ehi',
    title: 'FHIR / EHI Export',
    Icon: CloudUploadIcon,
    formats: 'FHIR Bundle JSON, NDJSON, EHI zip',
    to: '/import-data?tab=file-drop',
    chip: { label: 'Core', color: 'primary' }
  },
  {
    key: 'apple-health',
    title: 'Apple Health',
    Icon: LocalHospitalIcon,
    formats: 'export.zip / export.xml',
    to: '/import-data?tab=file-drop',
    chip: { label: 'Core', color: 'primary' }
  },
  {
    key: 'dicom',
    title: 'DICOM Imaging',
    Icon: MonitorHeartIcon,
    formats: '.dcm, ultrasound .mp4',
    to: '/dicom/upload',
    chip: { label: 'Core', color: 'primary' }
  },
  {
    key: 'waveforms',
    title: 'Waveforms',
    Icon: GraphicEqIcon,
    formats: 'ECG / PCG .wav',
    to: '/import-data?tab=file-drop',
    chip: { label: 'Core', color: 'primary' }
  },
  {
    key: 'pdf',
    title: 'PDF Documents',
    Icon: PictureAsPdfIcon,
    formats: 'Lab reports, clinical PDFs',
    to: '/pdf-parser',
    requiresRoute: '/pdf-parser',
    chip: { label: 'Extension', color: 'secondary' }
  },
  {
    key: 'social',
    title: 'Social Media',
    Icon: ShareIcon,
    formats: 'Facebook "Download Your Information"',
    to: '/facebook-import',
    requiresRoute: '/facebook-import',
    chip: { label: 'Extension', color: 'secondary' }
  },
  {
    key: 'fhir-sync',
    title: 'FHIR Server Sync',
    Icon: CloudSyncIcon,
    formats: 'Live FHIR REST endpoint',
    to: '/import-data?tab=rest-api',
    chip: { label: 'Core', color: 'primary' }
  },
  {
    key: 'weather',
    title: 'Weather',
    Icon: WbSunnyIcon,
    formats: 'Environmental / exposure history',
    comingSoon: true
  },
  {
    key: 'financial',
    title: 'Financial / Receipts',
    Icon: ReceiptLongIcon,
    formats: 'Receipts, EOBs, claims',
    comingSoon: true
  },
  {
    key: 'genomics',
    title: 'Genomics',
    Icon: BiotechIcon,
    formats: 'VCF, 23andMe / Ancestry raw',
    comingSoon: true
  }
];

// Map an importType/origin from a run to a short chip color.
function runStatusColor(status) {
  switch (status) {
    case 'completed': return 'success';
    case 'active': return 'info';
    case 'flushed': return 'default';
    case 'failed': return 'error';
    default: return 'default';
  }
}

function totalOfCounts(counts) {
  return Object.keys(counts || {}).reduce(function(sum, key) {
    return sum + (counts[key] || 0);
  }, 0);
}

function formatWhen(value) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

// ---------------------------------------------------------------------------
// Onramp tile
// ---------------------------------------------------------------------------
function OnrampTile(props) {
  const tile = props.tile;
  const available = props.available;
  const onLaunch = props.onLaunch;
  const Icon = tile.Icon;

  const comingSoon = !!tile.comingSoon;
  const disabled = comingSoon || !available;

  // Chip: coming-soon > unavailable-extension > declared chip.
  let chip;
  if (comingSoon) {
    chip = { label: 'Coming soon', color: 'default' };
  } else if (!available) {
    chip = { label: 'Not loaded', color: 'warning' };
  } else {
    chip = tile.chip;
  }

  const buttonId = 'onramp-' + tile.key + '-launch-btn';

  const launchButton = (
    <Button
      id={buttonId}
      variant="contained"
      size="small"
      disabled={disabled}
      onClick={function() { if (!disabled) { onLaunch(tile.to); } }}
    >
      Launch
    </Button>
  );

  // Tooltip explaining why an extension tile is disabled.
  const wrappedButton = (!comingSoon && !available)
    ? (
      <Tooltip title="Extension not loaded (EXTRA_WORKFLOWS)">
        <span>{launchButton}</span>
      </Tooltip>
    )
    : launchButton;

  return (
    <Card
      variant="outlined"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'background.paper',
        borderColor: 'divider',
        opacity: disabled ? 0.6 : 1
      }}
    >
      <CardContent sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Icon sx={{ color: disabled ? 'text.disabled' : 'primary.main' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {tile.title}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
          {tile.formats}
        </Typography>
        {chip ? (
          <Chip size="small" label={chip.label} color={chip.color} variant="outlined" />
        ) : null}
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
        {wrappedButton}
      </CardActions>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Recent import runs strip
// ---------------------------------------------------------------------------
function RecentRunsStrip(props) {
  const runs = props.runs;
  const onManage = props.onManage;

  return (
    <Box sx={{ flexShrink: 0, mt: 2 }}>
      <Divider sx={{ mb: 1.5 }} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <HistoryIcon fontSize="small" sx={{ color: 'text.secondary' }} />
        <Typography variant="subtitle2" sx={{ color: 'text.primary', flex: 1 }}>
          Recent Import Runs
        </Typography>
        <Button
          id="onramp-manage-runs-btn"
          size="small"
          variant="text"
          onClick={onManage}
        >
          Manage Runs
        </Button>
      </Box>

      {(!runs || runs.length === 0) ? (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          No import runs yet.
        </Typography>
      ) : (
        <Stack spacing={0.5}>
          {runs.map(function(run) {
            return (
              <Box
                key={run._id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  py: 0.5,
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 160 }}>
                  {formatWhen(run.createdAt)}
                </Typography>
                <Chip size="small" label={run.importType || 'unknown'} />
                <Chip
                  size="small"
                  variant="outlined"
                  color={runStatusColor(run.status)}
                  label={run.status || '—'}
                />
                <Typography variant="caption" sx={{ color: 'text.secondary', ml: 'auto' }}>
                  {totalOfCounts(run.resourceCounts)} resources
                </Typography>
              </Box>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
function DataOnrampingPage() {
  const navigate = useNavigate();

  // Tri-state attachment preview: null = loading/unresolved, object = resolved.
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [recentRuns, setRecentRuns] = useState([]);

  // Read the set of registered route paths AT RENDER TIME (lazy — never module
  // scope). This is what makes extension-backed tiles light up only when their
  // package is loaded via EXTRA_WORKFLOWS.
  const registeredPaths = WorkflowRegistry.getRoutes().map(function(r) { return r.path; });
  function routeAvailable(path) {
    return registeredPaths.indexOf(path) !== -1;
  }

  // Attachment preview — side-effect-free RPC; non-fatal on error (banner hidden).
  useEffect(function() {
    let cancelled = false;
    Meteor.rpc('importAttachment.preview', {
      clientPatientId: Session.get('selectedPatientId') || null,
      payloadPatients: []
    }).then(function(result) {
      if (!cancelled) { setAttachmentPreview(result); }
    }).catch(function(error) {
      log.warn('Attachment preview failed (banner hidden)', { message: get(error, 'message') });
      if (!cancelled) { setAttachmentPreview(null); }
    });
    return function() { cancelled = true; };
  }, []);

  // Recent import runs — non-fatal on error (strip shows empty state).
  useEffect(function() {
    let cancelled = false;
    Meteor.rpc('importRuns.list', { options: { limit: 5 } }).then(function(result) {
      if (!cancelled) { setRecentRuns(get(result, 'runs', [])); }
    }).catch(function(error) {
      log.warn('Could not list recent import runs', { message: get(error, 'message') });
      if (!cancelled) { setRecentRuns([]); }
    });
    return function() { cancelled = true; };
  }, []);

  function handleLaunch(to) {
    navigate(to);
  }

  function handleManageRuns() {
    navigate('/import-data?tab=runs');
  }

  return (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      p: 3
    }}>
      {/* Fixed header ------------------------------------------------------ */}
      <Box sx={{ flexShrink: 0 }}>
        <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 600 }}>
          Data Onramping
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5, mb: 2 }}>
          The front door for loading your longitudinal personal record. Pick an
          onramp below to bring in health data — EHI exports, imaging, wearables,
          documents, and more.
        </Typography>

        <ImportAttachmentBanner
          attachmentSource={get(attachmentPreview, 'attachmentSource')}
          display={get(attachmentPreview, 'display')}
          willCreatePatient={get(attachmentPreview, 'willCreatePatient')}
          sx={{ mb: 2 }}
        />
      </Box>

      {/* Greedy scroll region: the tile grid ------------------------------- */}
      <Box sx={{
        flex: 1,
        minHeight: 0,
        overflow: 'auto',
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(4, 1fr)'
        },
        gap: 2,
        alignContent: 'start'
      }}>
        {ONRAMP_TILES.map(function(tile) {
          const available = tile.requiresRoute
            ? routeAvailable(tile.requiresRoute)
            : true;
          return (
            <OnrampTile
              key={tile.key}
              tile={tile}
              available={available}
              onLaunch={handleLaunch}
            />
          );
        })}
      </Box>

      {/* Fixed footer strip: recent runs ----------------------------------- */}
      <RecentRunsStrip runs={recentRuns} onManage={handleManageRuns} />
    </Box>
  );
}

export default DataOnrampingPage;
