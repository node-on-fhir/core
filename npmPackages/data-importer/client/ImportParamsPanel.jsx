// npmPackages/data-importer/client/ImportParamsPanel.jsx
//
// "Import & Dedup" card body for the /import-data right column (top of the stack).
// Renders deduplication stats, patient clusters (with per-cluster merge strategy),
// non-Patient duplicate groups, global import options, and the server's versioning
// mode. All state lives in ImportStoreContext; analysis is produced by
// @node-on-fhir/patient-matching's Deduplicator (feature-detected). When that package
// isn't loaded, the panel degrades to an "install to enable" notice.

import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Alert,
  AlertTitle,
  Divider,
  Stack,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Tooltip
} from '@mui/material';
import { get } from 'lodash';
import { useImportStore } from './ImportStoreContext.jsx';

var CONFIDENCE_COLOR = {
  certain: 'success',
  probable: 'warning',
  possible: 'info',
  'certainly-not': 'default'
};

function patientLabel(resource) {
  var name = get(resource, 'name.0');
  if (!name) return get(resource, 'id', 'unknown');
  var given = (get(name, 'given', []) || []).join(' ');
  var family = get(name, 'family', '');
  var text = get(name, 'text');
  return text || ((given + ' ' + family).trim() || get(resource, 'id', 'unknown'));
}

function ImportParamsPanel() {
  var store = useImportStore();
  var state = store.state;
  var dispatch = store.dispatch;

  var analysis = state.dedupAnalysis;
  var options = state.importOptions;
  var versioningModes = state.versioningModes || {};

  function setOption(patch) {
    dispatch({ type: 'SET_IMPORT_OPTIONS', payload: patch });
  }
  function setClusterStrategy(representativeId, strategy) {
    dispatch({ type: 'SET_CLUSTER_STRATEGY', payload: { representativeId: representativeId, strategy: strategy } });
  }

  // ---- Not available: graceful notice ----
  if (!state.dedupAvailable) {
    return (
      <Alert severity="info" sx={{ m: 1 }}>
        <AlertTitle>Deduplication unavailable</AlertTitle>
        Install and enable <code>@node-on-fhir/patient-matching</code> to detect and
        merge duplicate patients and resources at import time. Import still works
        without it — resources are inserted as-is.
      </Alert>
    );
  }

  // ---- Running ----
  if (state.dedupRunning && !analysis) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2 }}>
        <CircularProgress size={18} />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Analyzing {state.resourceList.length} resources for duplicates…
        </Typography>
      </Box>
    );
  }

  if (!analysis) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Drop FHIR resources to analyze them for duplicate patients and records.
        </Typography>
      </Box>
    );
  }

  var stats = get(analysis, 'stats', {});
  var patientClusters = (get(analysis, 'patientClusters', []) || []).filter(function(c) { return c.size > 1; });
  var duplicateGroups = get(analysis, 'duplicateGroups', []) || [];
  var versionedTypes = Object.keys(versioningModes).filter(function(t) { return versioningModes[t] === 'versioned'; });

  // Summarize non-Patient duplicate groups by resourceType + reason.
  var groupSummary = {};
  duplicateGroups.forEach(function(group) {
    var key = group.resourceType + '|' + group.reason;
    if (!groupSummary[key]) {
      groupSummary[key] = { resourceType: group.resourceType, reason: group.reason, groups: 0, redundant: 0 };
    }
    groupSummary[key].groups += 1;
    groupSummary[key].redundant += (group.indices.length - 1);
  });
  var groupSummaryList = Object.keys(groupSummary).map(function(k) { return groupSummary[k]; });

  return (
    <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>

      {/* Headline stats */}
      <Box>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Chip size="small" label={get(stats, 'total', 0) + ' resources'} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>→</Typography>
          <Chip size="small" color="primary" label={'~' + get(stats, 'estimatedAfterDedup', 0) + ' after dedup'} />
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
          {get(stats, 'patientDuplicates', 0) > 0 && (
            <Chip size="small" color="warning" variant="outlined"
              label={get(stats, 'patientDuplicates') + ' duplicate patient record(s)'} />
          )}
          {get(stats, 'childDuplicates', 0) > 0 && (
            <Chip size="small" color="warning" variant="outlined"
              label={get(stats, 'childDuplicates') + ' duplicate record(s)'} />
          )}
          {get(stats, 'patientDuplicates', 0) === 0 && get(stats, 'childDuplicates', 0) === 0 && (
            <Chip size="small" color="success" variant="outlined" label="No duplicates detected" />
          )}
        </Stack>
        {get(stats, 'clusteringSkipped', false) && (
          <Alert severity="warning" sx={{ mt: 1 }} variant="outlined">
            Too many patients to compare safely in the browser — patient clustering was
            skipped. Exact/identifier duplicate collapsing still applies.
          </Alert>
        )}
      </Box>

      {/* Patient clusters */}
      {patientClusters.length > 0 && (
        <Box>
          <Divider textAlign="left" sx={{ mb: 1 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>
              Patient identity clusters
            </Typography>
          </Divider>
          <Stack spacing={1}>
            {patientClusters.map(function(cluster) {
              var rep = get(cluster, 'members', []).find(function(m) { return m.index === cluster.representativeIndex; });
              var repResource = rep ? rep.resource : get(cluster, 'members.0.resource');
              var strategy = get(options, ['clusterStrategies', cluster.representativeId]) || get(options, 'patientStrategy', 'merge');
              return (
                <Box key={cluster.representativeId}
                  sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {patientLabel(repResource)}
                    </Typography>
                    <Chip size="small" label={'×' + cluster.size} />
                    <Chip size="small" color={CONFIDENCE_COLOR[cluster.confidence] || 'default'}
                      label={cluster.confidence} />
                    <Box sx={{ flexGrow: 1 }} />
                    <FormControl size="small" sx={{ minWidth: 130 }}>
                      <Select
                        value={strategy}
                        onChange={function(e) { setClusterStrategy(cluster.representativeId, e.target.value); }}
                      >
                        <MenuItem value="merge">Merge composite</MenuItem>
                        <MenuItem value="keep-newest">Keep newest</MenuItem>
                        <MenuItem value="keep-all">Keep all</MenuItem>
                      </Select>
                    </FormControl>
                  </Stack>
                  {get(cluster, 'conflicts', []).length > 0 && (
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                      Conflicting fields (newest wins, older kept as <code>old</code>):{' '}
                      {cluster.conflicts.join(', ')}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Stack>
        </Box>
      )}

      {/* Non-Patient duplicate groups */}
      {groupSummaryList.length > 0 && (
        <Box>
          <Divider textAlign="left" sx={{ mb: 1 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>
              Duplicate records
            </Typography>
          </Divider>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {groupSummaryList.map(function(entry) {
              var isVersioned = versioningModes[entry.resourceType] === 'versioned';
              var label = entry.resourceType + ' · ' + entry.redundant + ' dup';
              return (
                <Tooltip key={entry.resourceType + entry.reason}
                  title={(entry.reason === 'content' ? 'Content-identical' : 'Shared identifier') +
                    (isVersioned && entry.reason === 'identifier' ? ' — kept as version history (server is versioned)' : '')}>
                  <Chip size="small" variant="outlined"
                    color={entry.reason === 'content' ? 'default' : 'secondary'}
                    label={label + (isVersioned && entry.reason === 'identifier' ? ' (versions)' : '')} />
                </Tooltip>
              );
            })}
          </Stack>
        </Box>
      )}

      {/* Import options */}
      <Box>
        <Divider textAlign="left" sx={{ mb: 1 }}>
          <Typography variant="overline" sx={{ color: 'text.secondary' }}>
            Import options
          </Typography>
        </Divider>
        <Stack spacing={0.5}>
          <FormControl size="small" sx={{ minWidth: 200, mb: 0.5 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2">Default patient strategy</Typography>
              <Select
                value={get(options, 'patientStrategy', 'merge')}
                onChange={function(e) { setOption({ patientStrategy: e.target.value }); }}
              >
                <MenuItem value="merge">Merge composite</MenuItem>
                <MenuItem value="keep-newest">Keep newest</MenuItem>
                <MenuItem value="keep-all">Keep all</MenuItem>
              </Select>
            </Stack>
          </FormControl>
          <FormControlLabel
            control={<Checkbox size="small" checked={!!get(options, 'collapseExact', true)}
              onChange={function(e) { setOption({ collapseExact: e.target.checked }); }} />}
            label={<Typography variant="body2">Collapse content-identical duplicates</Typography>}
          />
          <FormControlLabel
            control={<Checkbox size="small" checked={!!get(options, 'dedupeChildrenByIdentifier', true)}
              onChange={function(e) { setOption({ dedupeChildrenByIdentifier: e.target.checked }); }} />}
            label={<Typography variant="body2">Collapse records sharing a business identifier</Typography>}
          />
          <FormControlLabel
            control={<Checkbox size="small" checked={!!get(options, 'honorVersioning', true)}
              onChange={function(e) { setOption({ honorVersioning: e.target.checked }); }} />}
            label={<Typography variant="body2">Honor server versioning (keep history for versioned types)</Typography>}
          />
        </Stack>
      </Box>

      {/* Versioning hint */}
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {versionedTypes.length > 0
          ? 'Server keeps version history for: ' + versionedTypes.join(', ') + '.'
          : 'Server is in no-version mode — same-id imports overwrite in place.'}
      </Typography>
    </Box>
  );
}

export default ImportParamsPanel;
export { ImportParamsPanel };
