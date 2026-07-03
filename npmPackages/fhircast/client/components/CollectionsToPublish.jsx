// npmPackages/fhircast-module/client/components/CollectionsToPublish.jsx

import React, { useState, useEffect } from 'react';
import {
  Card, CardHeader, CardContent,
  Typography, IconButton, Snackbar, Alert, Box,
  Switch, FormControlLabel, Autocomplete, TextField, Chip,
  CircularProgress, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CastIcon from '@mui/icons-material/Cast';
import TagIcon from '@mui/icons-material/Tag';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { useTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';

import { DEFAULT_TOPIC } from '../../client/lib/constants.js';
import {
  AllLifecycleEvents,
  LifecycleToFhircast
} from '../../../record-lifecycle/lib/RecordLifecycleEvents';
import PublishEvent from './PublishEvent.jsx';

// =============================================================================
// CONSTANTS
// =============================================================================

var FHIRCAST_ELIGIBLE_TYPES = ['Patient', 'ImagingStudy', 'DiagnosticReport', 'Encounter'];

// Lifecycle events that have a FHIRcast mapping (non-null)
var PUBLISHABLE_LIFECYCLE_EVENTS = AllLifecycleEvents.filter(function(evt) {
  return LifecycleToFhircast[evt] !== null && LifecycleToFhircast[evt] !== undefined;
});

// =============================================================================
// COLLECTIONS TO PUBLISH
// =============================================================================

function CollectionsToPublish({ isPublishAllowed, onPublishEvent }) {
  var [copySuccess, setCopySuccess] = useState(false);
  var [config, setConfig] = useState(null);
  var [loading, setLoading] = useState(true);
  var [topic, setTopic] = useState(get(Meteor, 'settings.public.fhircast.topic', DEFAULT_TOPIC));
  var [topicMode, setTopicMode] = useState(get(Meteor, 'settings.public.fhircast.topicMode', 'custom'));
  var [publishMode, setPublishMode] = useState('auto');

  var selectedPatientId = useTracker(function() {
    return Session.get('selectedPatientId');
  }, []);

  var hubUrl = get(Meteor, 'settings.public.fhircast.hubUrl', '') || (window.location.origin + '/api/hub');

  function handleTopicChange(event) {
    var newTopic = event.target.value;
    setTopic(newTopic);
    Meteor.call('fhircast.setTopic', newTopic, function(error) {
      if (error) {
        console.error('[CollectionsToPublish] Error updating topic:', error.reason);
      }
    });
  }

  function handleTopicModeChange(e, newMode) {
    if (newMode === null) return;
    setTopicMode(newMode);
    Meteor.call('fhircast.setTopicMode', newMode, function(error) {
      if (error) {
        console.error('[CollectionsToPublish] Error updating topic mode:', error.reason);
      }
    });
  }

  function handleCopyHubUrl() {
    navigator.clipboard.writeText(hubUrl).then(function() {
      setCopySuccess(true);
    }, function(err) {
      console.error('Could not copy hub URL: ', err);
    });
  }

  // Load config from server on mount
  useEffect(function() {
    Meteor.call('fhircast.getPublishConfig', function(error, result) {
      if (error) {
        console.warn('[CollectionsToPublish] Error loading config:', error.reason);
        // Initialize with defaults
        var defaults = {};
        FHIRCAST_ELIGIBLE_TYPES.forEach(function(rt) {
          defaults[rt] = { publish: false, events: [] };
        });
        setConfig(defaults);
      } else {
        setConfig(result);
      }
      setLoading(false);
    });
  }, []);

  function handleTogglePublish(resourceType) {
    var currentConfig = get(config, resourceType, { publish: false, events: [] });
    var newConfig = {
      publish: !currentConfig.publish,
      events: currentConfig.events || []
    };

    // Optimistic update
    setConfig(function(prev) {
      var updated = Object.assign({}, prev);
      updated[resourceType] = newConfig;
      return updated;
    });

    Meteor.call('fhircast.setResourceFhircast', resourceType, newConfig, function(error) {
      if (error) {
        console.error('[CollectionsToPublish] Error updating config:', error.reason);
        // Revert on error
        setConfig(function(prev) {
          var reverted = Object.assign({}, prev);
          reverted[resourceType] = currentConfig;
          return reverted;
        });
      }
    });
  }

  function handleEventsChange(resourceType, newEvents) {
    var currentConfig = get(config, resourceType, { publish: false, events: [] });
    var newConfig = {
      publish: currentConfig.publish,
      events: newEvents
    };

    setConfig(function(prev) {
      var updated = Object.assign({}, prev);
      updated[resourceType] = newConfig;
      return updated;
    });

    Meteor.call('fhircast.setResourceFhircast', resourceType, newConfig, function(error) {
      if (error) {
        console.error('[CollectionsToPublish] Error updating events:', error.reason);
        setConfig(function(prev) {
          var reverted = Object.assign({}, prev);
          reverted[resourceType] = currentConfig;
          return reverted;
        });
      }
    });
  }

  return (
    <>
      <Card sx={{ bgcolor: 'background.paper', mb: 2 }}>
        <CardHeader
          avatar={<CastIcon color="primary" />}
          title="FHIRCast Hub URL"
          action={
            <IconButton onClick={handleCopyHubUrl} size="small" title="Copy Hub URL">
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          }
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiCardHeader-title': {
              fontSize: '1.1rem'
            }
          }}
        />
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="body1"
              sx={{
                fontFamily: 'monospace',
                bgcolor: 'action.hover',
                px: 2,
                py: 1,
                borderRadius: 1,
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {hubUrl}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ bgcolor: 'background.paper', mb: 2 }}>
        <CardHeader
          avatar={<TagIcon color="primary" />}
          title="Topic"
          action={
            <ToggleButtonGroup
              value={topicMode}
              exclusive
              onChange={handleTopicModeChange}
              size="small"
            >
              <ToggleButton value="patientId">Patient ID</ToggleButton>
              <ToggleButton value="custom">Custom</ToggleButton>
            </ToggleButtonGroup>
          }
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiCardHeader-title': {
              fontSize: '1.1rem'
            }
          }}
        />
        <CardContent>
          {topicMode === 'patientId' ? (
            <Typography
              variant="body1"
              sx={{
                fontFamily: 'monospace',
                bgcolor: 'action.hover',
                px: 2,
                py: 1,
                borderRadius: 1,
                color: selectedPatientId ? 'text.primary' : 'text.disabled'
              }}
            >
              {selectedPatientId || 'No patient selected'}
            </Typography>
          ) : (
            <TextField
              fullWidth
              size="small"
              value={topic}
              onChange={handleTopicChange}
              placeholder="DrXRay"
            />
          )}
        </CardContent>
      </Card>

      <Card sx={{ bgcolor: 'background.paper' }}>
        <CardHeader
          title="FHIRcast Publish Config"
          action={
            <ToggleButtonGroup
              value={publishMode}
              exclusive
              onChange={function(e, val) { if (val !== null) setPublishMode(val); }}
              size="small"
            >
              <ToggleButton value="auto">Auto</ToggleButton>
              <ToggleButton value="adhoc">Ad-Hoc</ToggleButton>
            </ToggleButtonGroup>
          }
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiCardHeader-title': {
              fontSize: '1.1rem'
            }
          }}
        />
        <CardContent>
          {publishMode === 'auto' ? (
            loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              FHIRCAST_ELIGIBLE_TYPES.map(function(resourceType) {
                var rtConfig = get(config, resourceType, { publish: false, events: [] });
                var isEnabled = rtConfig.publish === true;
                var selectedEvents = rtConfig.events || [];

                return (
                  <Box key={resourceType} sx={{ mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider', '&:last-child': { mb: 0, pb: 0, borderBottom: 0 } }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isEnabled}
                          onChange={function() { handleTogglePublish(resourceType); }}
                          color="primary"
                        />
                      }
                      label={
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {resourceType}
                        </Typography>
                      }
                    />
                    {isEnabled ? (
                      <Box sx={{ mt: 1, ml: 4 }}>
                        <Autocomplete
                          multiple
                          size="small"
                          options={PUBLISHABLE_LIFECYCLE_EVENTS}
                          value={selectedEvents}
                          onChange={function(event, newValue) {
                            handleEventsChange(resourceType, newValue);
                          }}
                          getOptionLabel={function(option) {
                            var fhircastAction = LifecycleToFhircast[option];
                            return option + (fhircastAction ? ' \u2192 ' + fhircastAction : '');
                          }}
                          renderTags={function(value, getTagProps) {
                            return value.map(function(option, index) {
                              return (
                                <Chip
                                  key={option}
                                  label={option}
                                  size="small"
                                  color="info"
                                  {...getTagProps({ index: index })}
                                />
                              );
                            });
                          }}
                          renderInput={function(params) {
                            return <TextField {...params} label="Lifecycle Events" placeholder="Add events..." />;
                          }}
                        />
                      </Box>
                    ) : null}
                  </Box>
                );
              })
            )
          ) : (
            <PublishEvent
              embedded
              isPublishAllowed={isPublishAllowed}
              onPublishEvent={onPublishEvent}
            />
          )}
        </CardContent>
      </Card>

      <Snackbar
        open={copySuccess}
        autoHideDuration={3000}
        onClose={function() { setCopySuccess(false); }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={function() { setCopySuccess(false); }} severity="success" sx={{ width: '100%' }}>
          Copied to clipboard!
        </Alert>
      </Snackbar>
    </>
  );
}

export default CollectionsToPublish;
