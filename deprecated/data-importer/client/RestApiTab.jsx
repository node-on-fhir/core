// packages/data-importer/client/RestApiTab.jsx
//
// Postman-style REST API interface with request body and response preview.
// Adapted from merkalis RestApiContent.jsx — uses ImportStoreContext + direct fetch().

import React, { useState, useEffect, useMemo } from 'react';
import { Meteor } from 'meteor/meteor';
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
  CircularProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Send as SendIcon } from '@mui/icons-material';
import AceEditor from 'react-ace';

import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/theme-github';

import { useImportStore } from './ImportStoreContext.jsx';

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

  // HTTP send using direct fetch()
  function handleSend() {
    if (!state.httpUrl) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    var fetchOptions = {
      method: state.httpMethod,
      headers: {
        'Accept': 'application/fhir+json, application/json',
        'Content-Type': 'application/fhir+json'
      }
    };

    if (state.httpMethod !== 'GET' && state.httpMethod !== 'DELETE' && state.patientJson !== '{}') {
      fetchOptions.body = state.patientJson;
    }

    fetch(state.httpUrl, fetchOptions)
      .then(function(response) {
        return response.text().then(function(text) {
          return { status: response.status, text: text };
        });
      })
      .then(function(result) {
        // Try to pretty-print JSON response
        try {
          var parsed = JSON.parse(result.text);
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
          sx={{
            borderBottom: 1,
            borderColor: dividerColor,
            flexShrink: 0,
            '& .MuiCardHeader-title': { fontSize: '1.1rem' }
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

          {/* Request Body */}
          <Accordion
            expanded={requestExpanded}
            onChange={function(e, isExpanded) { setRequestExpanded(isExpanded); }}
            disableGutters
            sx={{
              mt: 1, bgcolor: cardBgColor, '&:before': { display: 'none' },
              ...(requestExpanded && { flex: 1, display: 'flex', flexDirection: 'column' })
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="caption" sx={{ color: textSecondary }}>
                Request Body
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
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
            sx={{ mt: 1, flex: 1, display: 'flex', flexDirection: 'column', bgcolor: cardBgColor, '&:before': { display: 'none' } }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="caption" sx={{ color: textSecondary }}>
                Response Body
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
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
          {parsedResponse && DynamicFhirViews ? (
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
