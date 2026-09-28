// /packages/pacio-core/client/components/RemotePatientBrowser.jsx
//
// Browses the /Patient list of a remote FHIR server (the configured
// inbound-fetch interface) so the user can pick a patient without knowing
// its id.  Selecting a row hands off to the data-importer pipeline:
//   /import-data?tab=rest-api&patient=<id>&next=pacio-dashboard
// which auto-runs $everything, offers dedup review, and redirects to the
// pacio dashboard after import.

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

import { ConnectedServerChip } from './ConnectedServerChip';

const log = (Meteor.Logger ? Meteor.Logger.for('RemotePatientBrowser') : console);

// Inbound-fetch interface base (settings.public.interfaces.default);
// visible on /server-configuration?tab=interfaces.
function getInboundFetchBase() {
  return get(Meteor, 'settings.public.interfaces.default.channel.endpoint', '') ||
    Meteor.absoluteUrl('baseR4');
}

function patientDisplayName(patient) {
  const text = get(patient, 'name.0.text', '');
  if (text) { return text; }
  const given = get(patient, 'name.0.given', []).join(' ');
  const family = get(patient, 'name.0.family', '');
  return (given + ' ' + family).trim() || get(patient, 'id', '');
}

export function RemotePatientBrowser(props) {
  // ?url-editable=true exposes the FHIR Server URL input; the connected
  // server otherwise shows as the chip on the card header.
  const urlEditable = props.urlEditable === true;

  const useNavigate = Meteor.useNavigate;
  const navigate = useNavigate ? useNavigate() : function() {};

  // endpoint prop ({ url, name, source }) comes from PatientFetchPage's
  // resolveFetchEndpoint; fall back to the interface base when rendered
  // standalone.
  const [fhirServerUrl, setFhirServerUrl] = useState(
    get(props, 'endpoint.url') || getInboundFetchBase()
  );
  const [searchText, setSearchText] = useState('');
  const [patients, setPatients] = useState([]);
  const [nextUrl, setNextUrl] = useState(null);
  const [total, setTotal] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);

  function fetchPage(url, append) {
    setIsLoading(true);
    setError(null);
    fetch(url, { headers: { 'Accept': 'application/fhir+json, application/json' } })
      .then(function(response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status + ' from ' + url);
        }
        return response.json();
      })
      .then(function(bundle) {
        const found = get(bundle, 'entry', [])
          .map(function(entry) { return entry.resource; })
          .filter(function(resource) { return resource && resource.resourceType === 'Patient'; });
        setPatients(function(prev) { return append ? prev.concat(found) : found; });
        const next = (get(bundle, 'link', []) || []).find(function(link) { return link.relation === 'next'; });
        setNextUrl(next ? next.url : null);
        setTotal(typeof bundle.total === 'number' ? bundle.total : null);
        setIsLoading(false);
        setHasFetched(true);
      })
      .catch(function(err) {
        log.error('Remote patient search failed', { url: url, error: err.message });
        setError(err.message);
        setIsLoading(false);
        setHasFetched(true);
      });
  }

  function buildSearchUrl() {
    let url = fhirServerUrl.replace(/\/+$/, '') + '/Patient?_count=50';
    if (searchText.trim()) {
      url += '&name=' + encodeURIComponent(searchText.trim());
    }
    return url;
  }

  const initialFetchRef = useRef(false);
  useEffect(function() {
    if (initialFetchRef.current) { return; }
    initialFetchRef.current = true;
    if (fhirServerUrl) {
      fetchPage(buildSearchUrl(), false);
    }
  }, []);

  function handleSearch() {
    fetchPage(buildSearchUrl(), false);
  }

  function handleLoadMore() {
    if (nextUrl) {
      fetchPage(nextUrl, true);
    }
  }

  function handleSelect(patient) {
    const patientId = get(patient, 'id');
    if (!patientId) {
      log.warn('Selected remote patient has no id', { patient: patient });
      return;
    }
    let target = '/import-data?tab=rest-api&patient=' + encodeURIComponent(patientId) + '&next=pacio-dashboard';
    // Under an explicit endpoint override, carry the full $everything URL —
    // RestApiTab's ?url= takes precedence over ?patient= (which would rebuild
    // from the default interface and silently drop the chosen server).
    if (get(props, 'endpoint.source') === 'explicit') {
      const everythingUrl = fhirServerUrl.replace(/\/+$/, '') +
        '/Patient/' + encodeURIComponent(patientId) + '/$everything?_count=200';
      target += '&url=' + encodeURIComponent(everythingUrl);
    }
    navigate(target);
  }

  return (
    <Card id="remotePatientBrowser">
      <CardHeader
        title="Remote Patients"
        action={
          <ConnectedServerChip
            url={fhirServerUrl}
            name={get(props, 'endpoint.name', '')}
            source={get(props, 'endpoint.source', 'interface')}
          />
        }
      />
      <CardContent>
        {urlEditable ? (
          <TextField
            id="remoteFhirServerUrlInput"
            fullWidth
            label="FHIR Server URL"
            value={fhirServerUrl}
            onChange={function(event) { setFhirServerUrl(event.target.value); }}
            helperText="settings.public.interfaces.default.channel.endpoint — see /server-configuration?tab=interfaces"
            sx={{ mb: 2, '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: '0.875rem' } }}
          />
        ) : null}

        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
          <TextField
            id="remotePatientSearchInput"
            fullWidth
            size="small"
            placeholder="Search by name..."
            value={searchText}
            onChange={function(event) { setSearchText(event.target.value); }}
            onKeyDown={function(event) { if (event.key === 'Enter') { handleSearch(); } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />
          <Button
            id="remotePatientSearchButton"
            variant="contained"
            onClick={handleSearch}
            disabled={isLoading || !fhirServerUrl}
          >
            Search
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Could not reach the remote FHIR server: {error}
          </Alert>
        )}

        {isLoading && patients.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table id="remotePatientsTable" size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Gender</TableCell>
                  <TableCell>Birth Date</TableCell>
                  <TableCell>Patient ID</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {patients.map(function(patient) {
                  return (
                    <TableRow
                      key={get(patient, 'id')}
                      onClick={function() { handleSelect(patient); }}
                      sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                    >
                      <TableCell>{patientDisplayName(patient)}</TableCell>
                      <TableCell>{get(patient, 'gender', '')}</TableCell>
                      <TableCell>{get(patient, 'birthDate', '')}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                        {get(patient, 'id', '')}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {hasFetched && !isLoading && patients.length === 0 && !error && (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                        No patients found on the remote server.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            {patients.length > 0 ? (
              'Showing ' + patients.length + (total !== null ? ' of ' + total : '') + ' patients'
            ) : ''}
          </Typography>
          {nextUrl && (
            <Button
              id="remotePatientsLoadMoreButton"
              variant="text"
              onClick={handleLoadMore}
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={14} /> : null}
            >
              Load More
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default RemotePatientBrowser;
