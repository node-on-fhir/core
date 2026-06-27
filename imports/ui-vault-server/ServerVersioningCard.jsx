// imports/ui-vault-server/ServerVersioningCard.jsx
//
// Read-only summary of per-resource-type FHIR versioning mode, sourced from the
// server's CapabilityStatement (/metadata) — the safe, client-visible authority
// (private settings never reach the client). Shows which resource types keep
// version history ("versioned") vs overwrite in place ("no-version"). Surfaced in
// the Server Configuration → FHIR Infrastructure tab so operators can see which
// mode the server is running in (this is what data imports honor).

import React, { useState, useEffect } from 'react';
import { get } from 'lodash';
import {
  Card,
  CardHeader,
  CardContent,
  Chip,
  Stack,
  Typography,
  CircularProgress,
  Box
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';

function ServerVersioningCard() {
  var loadingState = useState(true);
  var loading = loadingState[0];
  var setLoading = loadingState[1];

  var modesState = useState({});
  var modes = modesState[0];
  var setModes = modesState[1];

  useEffect(function() {
    var cancelled = false;
    fetch('/metadata', { headers: { Accept: 'application/fhir+json' } })
      .then(function(response) {
        if (!response.ok) throw new Error('metadata ' + response.status);
        return response.json();
      })
      .then(function(capabilityStatement) {
        var result = {};
        get(capabilityStatement, 'rest', []).forEach(function(restEntry) {
          get(restEntry, 'resource', []).forEach(function(resource) {
            var type = get(resource, 'type');
            if (type) result[type] = get(resource, 'versioning', 'no-version');
          });
        });
        if (!cancelled) { setModes(result); setLoading(false); }
      })
      .catch(function(error) {
        console.warn('[ServerVersioningCard] Could not load /metadata:', error);
        if (!cancelled) { setLoading(false); }
      });
    return function() { cancelled = true; };
  }, []);

  var versionedTypes = Object.keys(modes).filter(function(t) { return modes[t] === 'versioned'; }).sort();
  var noVersionTypes = Object.keys(modes).filter(function(t) { return modes[t] !== 'versioned'; }).sort();

  return (
    <Card sx={{ mb: 2, width: '100%' }}>
      <CardHeader
        avatar={<HistoryIcon />}
        title="Resource Versioning"
        subheader="Which resource types keep version history — data imports honor this mode"
      />
      <CardContent>
        {loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={18} />
            <Typography variant="body2" color="text.secondary">Reading server capabilities…</Typography>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Versioned ({versionedTypes.length}) — history preserved
              </Typography>
              {versionedTypes.length ? (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {versionedTypes.map(function(type) {
                    return <Chip key={type} size="small" color="info" label={type} />;
                  })}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No resource types are versioned. Same-id updates and re-imports overwrite in place.
                  Set <code>private.fhir.rest.&lt;Type&gt;.versioning</code> to <code>"versioned"</code> to keep history.
                </Typography>
              )}
            </Box>
            {noVersionTypes.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  No-version ({noVersionTypes.length}) — overwrite in place
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {noVersionTypes.map(function(type) {
                    return <Chip key={type} size="small" variant="outlined" label={type} />;
                  })}
                </Stack>
              </Box>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

export default ServerVersioningCard;
export { ServerVersioningCard };
