// packages/data-importer/client/ResourceListAccordion.jsx
//
// Collapsible resource sections grouped by resourceType.
// Each resource is an MUI Alert with an action button to load it into the editor.
// Adapted from merkalis ResourceListAccordion — uses useImportStore, no merkle state.

import React, { useState, useImperativeHandle, forwardRef } from 'react';
import {
  Box,
  Typography,
  Alert,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { get } from 'lodash';
import { getResourceEmoji, getResourceSummary, getResourceAlertSeverity } from '../lib/resourceSummary.js';
import { useImportStore } from './ImportStoreContext.jsx';

var ResourceListAccordion = forwardRef(function ResourceListAccordion(props, ref) {
  var resources = props.resources || [];
  var selectedIndex = props.selectedIndex;
  var onSelectResource = props.onSelectResource;

  var storeCtx = useImportStore();
  var state = storeCtx.state;
  var isDark = state.isDark;
  var textSecondary = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
  var cardTextColor = isDark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)';

  // Dark mode overrides for MUI Alert backgrounds (MUI theme doesn't sync with Meteor.useTheme)
  var alertDarkBg = {
    success: isDark ? 'rgba(46, 125, 50, 0.15)' : undefined,
    info: isDark ? 'rgba(33, 150, 243, 0.15)' : undefined,
    warning: isDark ? 'rgba(237, 108, 2, 0.15)' : undefined,
    error: isDark ? 'rgba(211, 47, 47, 0.15)' : undefined
  };
  var alertDarkIcon = {
    success: isDark ? '#66bb6a' : undefined,
    info: isDark ? '#90caf9' : undefined,
    warning: isDark ? '#ff9800' : undefined,
    error: isDark ? '#f44336' : undefined
  };

  // Group resources by resourceType
  var groups = {};
  var groupOrder = [];
  resources.forEach(function(resource, idx) {
    var type = get(resource, 'resourceType', 'Unknown');
    if (!groups[type]) {
      groups[type] = [];
      groupOrder.push(type);
    }
    groups[type].push({ resource: resource, originalIndex: idx });
  });

  // Track which groups are expanded
  var initialExpanded = {};
  groupOrder.forEach(function(type) { initialExpanded[type] = true; });
  var expandedState = useState(initialExpanded);
  var expanded = expandedState[0];
  var setExpanded = expandedState[1];

  // Track which individual entries show raw JSON
  var entryExpandedState = useState({});
  var entryExpanded = entryExpandedState[0];
  var setEntryExpanded = entryExpandedState[1];

  // Expose expand/collapse all via imperative handle
  useImperativeHandle(ref, function() {
    return {
      expandAll: function() {
        var newExpanded = {};
        groupOrder.forEach(function(type) { newExpanded[type] = true; });
        setExpanded(newExpanded);
        var newEntry = {};
        resources.forEach(function(r, idx) { newEntry[idx] = true; });
        setEntryExpanded(newEntry);
      },
      collapseAll: function() {
        var newExpanded = {};
        groupOrder.forEach(function(type) { newExpanded[type] = false; });
        setExpanded(newExpanded);
        setEntryExpanded({});
      }
    };
  }, [groupOrder, resources]);

  function toggleGroup(type) {
    setExpanded(function(prev) {
      var next = Object.assign({}, prev);
      next[type] = !prev[type];
      return next;
    });
  }

  function toggleEntry(idx) {
    setEntryExpanded(function(prev) {
      var next = Object.assign({}, prev);
      next[idx] = !prev[idx];
      return next;
    });
  }

  return (
    <Box sx={{ overflow: 'auto', flex: 1 }}>
      {groupOrder.map(function(type) {
        var items = groups[type];
        var emoji = getResourceEmoji(type);
        var severity = getResourceAlertSeverity(type);

        return (
          <Accordion
            key={type}
            expanded={expanded[type] || false}
            onChange={function() { toggleGroup(type); }}
            disableGutters
            sx={{
              bgcolor: 'transparent',
              '&:before': { display: 'none' },
              boxShadow: 'none'
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: cardTextColor }} />} sx={{ minHeight: 36, px: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, color: cardTextColor }}>
                  {emoji} {type}
                </Typography>
                <Chip label={items.length} size="small" sx={{
                  height: 18, fontSize: '0.7rem',
                  bgcolor: isDark ? 'rgba(255,255,255,0.12)' : undefined,
                  color: isDark ? 'rgba(255,255,255,0.87)' : undefined
                }} />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0.5 }}>
              {items.map(function(item) {
                var resource = item.resource;
                var idx = item.originalIndex;
                var summary = getResourceSummary(resource);
                var isSelected = selectedIndex === idx;

                return (
                  <Alert
                    key={idx}
                    severity={severity}
                    action={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Tooltip title="Load into editor">
                          <IconButton
                            size="small"
                            sx={{ color: isDark ? 'rgba(255,255,255,0.7)' : undefined }}
                            onClick={function(e) {
                              e.stopPropagation();
                              if (onSelectResource) {
                                onSelectResource(idx, resource);
                              }
                            }}
                          >
                            <ChevronRightIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    }
                    sx={{
                      mb: 0.5,
                      py: 0,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      border: isSelected ? '2px solid' : '1px solid transparent',
                      borderColor: isSelected ? 'primary.main' : 'transparent',
                      '& .MuiAlert-message': { width: '100%', overflow: 'hidden' },
                      bgcolor: alertDarkBg[severity],
                      color: isDark ? cardTextColor : undefined,
                      '& .MuiAlert-icon': { color: alertDarkIcon[severity] }
                    }}
                    onClick={function() { toggleEntry(idx); }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
                      <Chip
                        label={get(resource, 'resourceType', 'Unknown')}
                        size="small"
                        sx={{
                          height: 18, fontSize: '0.65rem', flexShrink: 0,
                          bgcolor: isDark ? 'rgba(255,255,255,0.12)' : undefined,
                          color: isDark ? 'rgba(255,255,255,0.87)' : undefined
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1
                        }}
                      >
                        {summary}
                      </Typography>
                    </Box>
                    <Collapse in={entryExpanded[idx] || false}>
                      <Typography
                        component="pre"
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.65rem',
                          mt: 0.5,
                          p: 0.5,
                          bgcolor: state.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
                          borderRadius: 1,
                          overflow: 'auto',
                          maxHeight: 200,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        }}
                      >
                        {JSON.stringify(resource, null, 2)}
                      </Typography>
                    </Collapse>
                  </Alert>
                );
              })}
            </AccordionDetails>
          </Accordion>
        );
      })}

      {resources.length === 0 && (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: textSecondary }}>
            No resources loaded. Import NDJSON, a Bundle, or load from a collection.
          </Typography>
        </Box>
      )}
    </Box>
  );
});

export { ResourceListAccordion };
export default ResourceListAccordion;
