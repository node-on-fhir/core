// packages/data-importer/client/RestApiTab.jsx
//
// Postman-style REST API interface with request body and response preview.
// Adapted from merkalis RestApiContent.jsx — uses ImportStoreContext + direct fetch().

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Select,
  MenuItem,
  TextField,
  Button,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Send as SendIcon, PlaylistAddCheck as ReviewIcon } from '@mui/icons-material';
import AceEditor from 'react-ace';

import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/theme-github';

import { useImportStore, getInboundFetchBase } from './ImportStoreContext.jsx';
import ResourceListAccordion from './ResourceListAccordion.jsx';

var METHOD_COLORS = {
  GET: '#4caf50',
  POST: '#ff9800',
  PUT: '#2196f3',
  PATCH: '#9c27b0',
  DELETE: '#f44336'
};

function RestApiTab() {
  var storeCtx = useImportStore();
  var state = storeCtx.state;
  var dispatch = storeCtx.dispatch;

  var [requestExpanded, setRequestExpanded] = useState(false);
  var [responseExpanded, setResponseExpanded] = useState(true);

  // 'console' = postman-style Request/Response accordions;
  // 'resources' = the shared Resource List (same component as File Drop)
  var [viewMode, setViewMode] = useState('console');

  // URL params: ?patient=<id> auto-builds and runs a $everything fetch;
  // ?next=<slug> is carried through to the File Drop tab for the
  // redirect-after-import behavior.
  var useLocation = Meteor.useLocation;
  var location = useLocation ? useLocation() : { search: '' };
  var searchParams = new URLSearchParams(location.search);
  var patientParam = searchParams.get('patient');
  var nextParam = searchParams.get('next');
  var urlParam = searchParams.get('url');

  var useNavigate = Meteor.useNavigate;
  var navigate = useNavigate ? useNavigate() : function() {};

  var autoFetchFiredRef = useRef(false);
  var autoSwitchOnBridgeRef = useRef(false);
  var lastAutoFetchedUrlRef = useRef(null);

  // Detect dark mode from app theme
  var isDark = false;
  var useAppTheme = null;
  if (typeof Meteor !== 'undefined' && Meteor.useTheme) {
    useAppTheme = Meteor.useTheme;
  }
  if (useAppTheme) {
    var appTheme = useAppTheme();
    isDark = appTheme.theme === 'dark';
  }

  var cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  var cardTextColor = isDark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)';
  var dividerColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
  var textSecondary = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';

  useEffect(function() {
    dispatch({ type: 'SET_IS_DARK', payload: isDark });
  }, [isDark, dispatch]);

  var DynamicFhirViews = Meteor.DynamicFhirViews;
  var DynamicFhirDetail = Meteor.DynamicFhirDetail;

  // Push a fetched FHIR payload into the shared import pipeline so the
  // File Drop tab's dedup review + ImportDialog can take over (same
  // contract as FhirDropTab's validate handler).
  function bridgeToImportPipeline(parsed) {
    var resources = [];
    if (parsed && parsed.resourceType === 'Bundle' && Array.isArray(parsed.entry)) {
      resources = parsed.entry.map(function(entry) { return entry.resource; }).filter(Boolean);
    } else if (parsed && parsed.resourceType && parsed.resourceType !== 'OperationOutcome') {
      resources = [parsed];
    }
    if (resources.length > 0) {
      Session.set('importBuffer', resources);
      Session.set('fileExtension', 'json');
      dispatch({ type: 'SET_RESOURCE_LIST', payload: { resources: resources, source: 'rest-api' } });
      // The ?patient auto-fetch lands straight on the resource list view
      if (autoSwitchOnBridgeRef.current) {
        autoSwitchOnBridgeRef.current = false;
        setViewMode('resources');
      }
    }
  }

  // HTTP send using direct fetch().  GET responses that are paged searchset
  // Bundles are accumulated by following link[relation=next] (capped) so
  // $everything results arrive complete.
  function executeFetch(targetUrl, method) {
    if (!targetUrl) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    var fetchOptions = {
      method: method,
      headers: {
        'Accept': 'application/fhir+json, application/json',
        'Content-Type': 'application/fhir+json'
      }
    };

    if (method !== 'GET' && method !== 'DELETE' && state.patientJson !== '{}') {
      fetchOptions.body = state.patientJson;
    }

    fetch(targetUrl, fetchOptions)
      .then(function(response) {
        return response.text().then(function(text) {
          return { status: response.status, text: text };
        });
      })
      .then(async function(result) {
        // Try to pretty-print JSON response
        try {
          var parsed = JSON.parse(result.text);

          if (method === 'GET' && parsed.resourceType === 'Bundle') {
            var entries = Array.isArray(parsed.entry) ? parsed.entry.slice() : [];
            var nextLink = (parsed.link || []).find(function(l) { return l.relation === 'next'; });
            var pagesFetched = 1;
            var MAX_PAGES = 25;
            while (nextLink && nextLink.url && pagesFetched < MAX_PAGES) {
              var pageResponse = await fetch(nextLink.url, { headers: fetchOptions.headers });
              var pageBundle = await pageResponse.json();
              if (Array.isArray(pageBundle.entry)) {
                entries = entries.concat(pageBundle.entry);
              }
              nextLink = (pageBundle.link || []).find(function(l) { return l.relation === 'next'; });
              pagesFetched++;
            }
            if (pagesFetched > 1) {
              console.log('[RestApiTab] Accumulated ' + entries.length + ' entries across ' + pagesFetched + ' pages');
              parsed = Object.assign({}, parsed, { entry: entries, link: [], total: entries.length });
            }
          }

          if (method === 'GET' && result.status >= 200 && result.status < 300) {
            bridgeToImportPipeline(parsed);
          }

          dispatch({ type: 'SET_RESPONSE_JSON', payload: JSON.stringify(parsed, null, 2) });
        } catch (e) {
          dispatch({ type: 'SET_RESPONSE_JSON', payload: result.text });
        }
        dispatch({ type: 'SET_LOADING', payload: false });
      })
      .catch(function(err) {
        console.error('[RestApiTab] Fetch error:', err);
        dispatch({ type: 'SET_ERROR', payload: err.message });
        dispatch({ type: 'SET_RESPONSE_JSON', payload: JSON.stringify({ error: err.message }, null, 2) });
        dispatch({ type: 'SET_LOADING', payload: false });
      });
  }

  function handleSend() {
    executeFetch(state.httpUrl, state.httpMethod);
  }

  // ?url=<fhir-url> → fetch that URL directly (e.g. a DocumentReference
  // attachment pointing at a Bundle). Takes precedence over ?patient=, and
  // re-fires when the param changes (in-place navigation from a Detail form).
  useEffect(function() {
    if (!urlParam || lastAutoFetchedUrlRef.current === urlParam) { return; }
    lastAutoFetchedUrlRef.current = urlParam;
    autoFetchFiredRef.current = true;
    autoSwitchOnBridgeRef.current = true;
    console.log('[RestApiTab] Auto-fetching from URL param:', urlParam);
    dispatch({ type: 'SET_HTTP_METHOD', payload: 'GET' });
    dispatch({ type: 'SET_HTTP_URL', payload: urlParam });
    executeFetch(urlParam, 'GET');
  }, [urlParam]);

  // ?patient=<id> → build the $everything URL from the configured inbound
  // fetch interface and run it immediately (once per mount).
  useEffect(function() {
    if (!patientParam || autoFetchFiredRef.current) { return; }
    autoFetchFiredRef.current = true;
    autoSwitchOnBridgeRef.current = true;
    var base = getInboundFetchBase().replace(/\/+$/, '');
    var url = base + '/Patient/' + encodeURIComponent(patientParam) + '/$everything?_count=200';
    console.log('[RestApiTab] Auto-fetching patient from URL param:', url);
    dispatch({ type: 'SET_HTTP_METHOD', payload: 'GET' });
    dispatch({ type: 'SET_HTTP_URL', payload: url });
    executeFetch(url, 'GET');
  }, [patientParam]);

  // Jump to the File Drop tab (dedup review + Load Data), carrying ?next=
  // so the post-import redirect still works.
  function handleReviewImport() {
    var target = '?tab=file-drop';
    if (patientParam) { target += '&patient=' + encodeURIComponent(patientParam); }
    if (nextParam) { target += '&next=' + encodeURIComponent(nextParam); }
    navigate(target);
  }

  // Selecting a resource in the list loads it into the Request Body editor
  // and the Response Preview panel; re-clicking the same row deselects,
  // restoring the default first-bundle-entry preview.
  function handleSelectResource(index, resource) {
    if (state.selectedResourceIndex === index) {
      dispatch({ type: 'SET_SELECTED_RESOURCE_INDEX', payload: -1 });
      return;
    }
    dispatch({ type: 'SET_SELECTED_RESOURCE_INDEX', payload: index });
    dispatch({ type: 'SET_PATIENT_JSON', payload: JSON.stringify(resource, null, 2) });
  }

  function handleMethodChange(e) {
    dispatch({ type: 'SET_HTTP_METHOD', payload: e.target.value });
  }

  function handleUrlChange(e) {
    dispatch({ type: 'SET_HTTP_URL', payload: e.target.value });
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      handleSend();
    }
  }

  var methodColor = METHOD_COLORS[state.httpMethod] || '#4caf50';

  var parsedResponse = useMemo(function() {
    try {
      if (!state.responseJson) return null;
      var parsed = JSON.parse(state.responseJson);
      if (parsed.resourceType === 'Bundle' && parsed.entry && parsed.entry.length > 0) {
        return parsed.entry[0].resource || parsed;
      }
      return parsed;
    } catch (e) {
      return null;
    }
  }, [state.responseJson]);

  // Resource selected via the > arrow in the resource list; takes precedence
  // over the first-bundle-entry response preview.
  var selectedResource = (state.selectedResourceIndex >= 0 && state.resourceList[state.selectedResourceIndex]) || null;

  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
      gap: 2,
      p: 2,
      flex: 1,
      minHeight: 0,
      overflow: 'hidden'
    }}>
      {/* Left Column: REST API */}
      <Card sx={{
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        bgcolor: cardBgColor, color: cardTextColor,
        '& .MuiCardHeader-title': { color: cardTextColor },
        '& .MuiOutlinedInput-notchedOutline': { borderColor: dividerColor },
        '& .MuiInputBase-root': { color: cardTextColor }
      }}>
        <CardHeader
          title="REST API"
          action={
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              size="small"
              onChange={function(event, newMode) {
                if (newMode !== null) { setViewMode(newMode); }
              }}
            >
              <ToggleButton id="restApiConsoleViewToggle" value="console">
                Request / Response
              </ToggleButton>
              <ToggleButton id="restApiResourcesViewToggle" value="resources" disabled={state.resourceList.length === 0}>
                Resource List{state.resourceList.length > 0 ? ' (' + state.resourceList.length + ')' : ''}
              </ToggleButton>
            </ToggleButtonGroup>
          }
          sx={{
            borderBottom: 1,
            borderColor: dividerColor,
            flexShrink: 0,
            '& .MuiCardHeader-title': { fontSize: '1.1rem' },
            '& .MuiCardHeader-action': { alignSelf: 'center', m: 0 }
          }}
        />
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', p: 2 }}>
          {/* Inline HTTP Controls */}
          <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
            <Select
              value={state.httpMethod}
              onChange={handleMethodChange}
              size="small"
              sx={{
                minWidth: 90,
                fontWeight: 600,
                color: methodColor,
                '& .MuiSelect-select': { py: 0.75 }
              }}
            >
              <MenuItem value="GET" sx={{ color: METHOD_COLORS.GET, fontWeight: 600 }}>GET</MenuItem>
              <MenuItem value="POST" sx={{ color: METHOD_COLORS.POST, fontWeight: 600 }}>POST</MenuItem>
              <MenuItem value="PUT" sx={{ color: METHOD_COLORS.PUT, fontWeight: 600 }}>PUT</MenuItem>
              <MenuItem value="PATCH" sx={{ color: METHOD_COLORS.PATCH, fontWeight: 600 }}>PATCH</MenuItem>
              <MenuItem value="DELETE" sx={{ color: METHOD_COLORS.DELETE, fontWeight: 600 }}>DELETE</MenuItem>
            </Select>

            <TextField
              placeholder="https://hapi.fhir.org/baseR4/Patient/example"
              value={state.httpUrl}
              onChange={handleUrlChange}
              onKeyDown={handleKeyDown}
              size="small"
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontFamily: 'monospace',
                  fontSize: '0.8125rem'
                }
              }}
            />

            <Button
              variant="contained"
              onClick={handleSend}
              disabled={!state.httpUrl || state.isLoading}
              startIcon={state.isLoading ? <CircularProgress size={16} /> : <SendIcon />}
              sx={{
                minWidth: 80,
                bgcolor: methodColor,
                '&:hover': { bgcolor: methodColor, filter: 'brightness(0.85)' }
              }}
            >
              Send
            </Button>
          </Box>

          {state.resourceListSource === 'rest-api' && state.resourceList.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
              <Button
                id="reviewAndImportButton"
                variant="outlined"
                color="success"
                onClick={handleReviewImport}
                startIcon={<ReviewIcon />}
              >
                Review &amp; Import ({state.resourceList.length} resources)
              </Button>
            </Box>
          )}

          {viewMode === 'resources' ? (
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', mt: 1 }}>
              <ResourceListAccordion
                resources={state.resourceList}
                selectedIndex={state.selectedResourceIndex}
                onSelectResource={handleSelectResource}
              />
            </Box>
          ) : (
          <>
          {/* Request Body */}
          <Accordion
            expanded={requestExpanded}
            onChange={function(e, isExpanded) { setRequestExpanded(isExpanded); }}
            disableGutters
            sx={{
              mt: 1, bgcolor: cardBgColor, '&:before': { display: 'none' },
              ...(requestExpanded && { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }),
              '& .MuiCollapse-entered': { flex: 1, minHeight: 0 },
              '& .MuiCollapse-entered .MuiCollapse-wrapper': { height: '100%' },
              '& .MuiCollapse-entered .MuiCollapse-wrapperInner': { height: '100%' },
              '& .MuiCollapse-entered .MuiAccordion-region': { height: '100%', display: 'flex', flexDirection: 'column' }
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="caption" sx={{ color: textSecondary }}>
                Request Body
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ flex: 1, minHeight: 200, display: 'flex', flexDirection: 'column' }}>
                <AceEditor
                  mode="json"
                  theme={state.isDark ? 'monokai' : 'github'}
                  value={state.patientJson}
                  onChange={function(val) { dispatch({ type: 'SET_PATIENT_JSON', payload: val }); }}
                  name="request-body-editor"
                  editorProps={{ $blockScrolling: true }}
                  width="100%"
                  height="100%"
                  fontSize={12}
                  showPrintMargin={false}
                  showGutter={true}
                  highlightActiveLine={true}
                  wrapEnabled={true}
                  setOptions={{
                    enableBasicAutocompletion: false,
                    enableLiveAutocompletion: false,
                    showLineNumbers: true,
                    tabSize: 2,
                    useWorker: false
                  }}
                  style={{ flex: 1, minHeight: 200 }}
                />
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Response Body */}
          <Accordion
            expanded={responseExpanded}
            onChange={function(e, isExpanded) { setResponseExpanded(isExpanded); }}
            disableGutters
            sx={{
              mt: 1, bgcolor: cardBgColor, '&:before': { display: 'none' },
              ...(responseExpanded && { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }),
              '& .MuiCollapse-entered': { flex: 1, minHeight: 0 },
              '& .MuiCollapse-entered .MuiCollapse-wrapper': { height: '100%' },
              '& .MuiCollapse-entered .MuiCollapse-wrapperInner': { height: '100%' },
              '& .MuiCollapse-entered .MuiAccordion-region': { height: '100%', display: 'flex', flexDirection: 'column' }
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="caption" sx={{ color: textSecondary }}>
                Response Body
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <AceEditor
                mode="json"
                theme={state.isDark ? 'monokai' : 'github'}
                value={state.responseJson}
                readOnly={true}
                name="response-json-editor"
                editorProps={{ $blockScrolling: true }}
                width="100%"
                height="100%"
                fontSize={12}
                showPrintMargin={false}
                showGutter={true}
                highlightActiveLine={false}
                wrapEnabled={true}
                setOptions={{
                  enableBasicAutocompletion: false,
                  enableLiveAutocompletion: false,
                  showLineNumbers: true,
                  tabSize: 2,
                  useWorker: false
                }}
                style={{ flex: 1, minHeight: 200 }}
              />
            </AccordionDetails>
          </Accordion>
          </>
          )}
        </CardContent>
      </Card>

      {/* Right Column: Response Preview */}
      <Card sx={{
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        bgcolor: cardBgColor, color: cardTextColor,
        '& .MuiCardHeader-title': { color: cardTextColor }
      }}>
        <CardHeader
          title="Response Preview"
          sx={{
            borderBottom: 1,
            borderColor: dividerColor,
            flexShrink: 0,
            '& .MuiCardHeader-title': { fontSize: '1.1rem' }
          }}
        />
        <CardContent sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          {selectedResource && DynamicFhirDetail ? (
            <DynamicFhirDetail fhirResource={selectedResource} />
          ) : parsedResponse && DynamicFhirViews ? (
            <DynamicFhirViews
              fhirResource={parsedResponse}
              embedded={true}
              isDark={isDark}
            />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography variant="body2" sx={{ color: textSecondary }}>
                Send a request to preview the response here.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export { RestApiTab };
export default RestApiTab;
