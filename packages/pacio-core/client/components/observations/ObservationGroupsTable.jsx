// /packages/pacio-core/client/components/observations/ObservationGroupsTable.jsx

import React, { useState, useMemo } from 'react';
import { 
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  Assessment as CategoryIcon,
  LocalHospital as ClinicalIcon,
  Science as LaboratoryIcon,
  MonitorHeart as VitalSignIcon
} from '@mui/icons-material';
import { get } from 'lodash';
import moment from 'moment';
import { ObservationsTable } from '/imports/ui-fhir/Observations/ObservationsTable';

export function ObservationGroupsTable(props) {
  const {
    observations = [],
    groupBy = 'category', // 'category', 'domain', 'code', 'date'
    onRowClick,
    showGroupCounts = true,
    showGroupSummary = true,
    expandedByDefault = false,
    tableProps = {}
  } = props;
  
  const [expandedGroups, setExpandedGroups] = useState(
    expandedByDefault ? ['all'] : []
  );
  
  // Group observations based on groupBy parameter
  const groupedObservations = useMemo(function() {
    const groups = {};
    
    observations.forEach(function(obs) {
      let groupKey = 'Other';
      
      if (groupBy === 'category') {
        groupKey = get(obs, 'category[0].coding[0].display', 
                       get(obs, 'category[0].coding[0].code', 'Other'));
      } else if (groupBy === 'domain') {
        // Custom domain logic based on category code
        const categoryCode = get(obs, 'category[0].coding[0].code');
        groupKey = determineObservationDomain(categoryCode);
      } else if (groupBy === 'code') {
        groupKey = get(obs, 'code.coding[0].display', 
                       get(obs, 'code.coding[0].code', 'Other'));
      } else if (groupBy === 'date') {
        const date = get(obs, 'effectiveDateTime', get(obs, 'issued'));
        groupKey = date ? moment(date).format('MMMM YYYY') : 'Unknown Date';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(obs);
    });
    
    // Sort groups by key
    const sortedGroups = {};
    Object.keys(groups).sort().forEach(function(key) {
      sortedGroups[key] = groups[key];
    });
    
    return sortedGroups;
  }, [observations, groupBy]);
  
  function determineObservationDomain(categoryCode) {
    // Map category codes to domains
    const domainMap = {
      'vital-signs': 'Vital Signs',
      'laboratory': 'Laboratory',
      'imaging': 'Imaging',
      'procedure': 'Procedures',
      'survey': 'Surveys',
      'exam': 'Physical Exams',
      'therapy': 'Therapy',
      'activity': 'Activity',
      'social-history': 'Social History'
    };
    
    return domainMap[categoryCode] || 'Clinical';
  }
  
  function getGroupIcon(groupName) {
    const lowerGroupName = groupName.toLowerCase();
    
    if (lowerGroupName.includes('vital')) {
      return <VitalSignIcon />;
    } else if (lowerGroupName.includes('lab')) {
      return <LaboratoryIcon />;
    } else if (lowerGroupName.includes('clinical')) {
      return <ClinicalIcon />;
    } else {
      return <CategoryIcon />;
    }
  }
  
  function handleAccordionChange(groupName) {
    return function(event, isExpanded) {
      setExpandedGroups(function(prev) {
        if (isExpanded) {
          return [...prev, groupName];
        } else {
          return prev.filter(function(g) { return g !== groupName; });
        }
      });
    };
  }
  
  function renderGroupSummary(groupName, groupObservations) {
    if (!showGroupSummary) return null;
    
    // Calculate summary statistics
    const uniqueCodes = new Set();
    let latestDate = null;
    let oldestDate = null;
    
    groupObservations.forEach(function(obs) {
      const code = get(obs, 'code.coding[0].code');
      if (code) uniqueCodes.add(code);
      
      const date = get(obs, 'effectiveDateTime', get(obs, 'issued'));
      if (date) {
        const momentDate = moment(date);
        if (!latestDate || momentDate.isAfter(latestDate)) {
          latestDate = momentDate;
        }
        if (!oldestDate || momentDate.isBefore(oldestDate)) {
          oldestDate = momentDate;
        }
      }
    });
    
    return (
      <Box display="flex" gap={2} flexWrap="wrap">
        <Typography variant="caption" color="textSecondary">
          {uniqueCodes.size} unique types
        </Typography>
        {latestDate && (
          <Typography variant="caption" color="textSecondary">
            Latest: {latestDate.format('MMM D, YYYY')}
          </Typography>
        )}
        {oldestDate && latestDate && !oldestDate.isSame(latestDate, 'day') && (
          <Typography variant="caption" color="textSecondary">
            Oldest: {oldestDate.format('MMM D, YYYY')}
          </Typography>
        )}
      </Box>
    );
  }
  
  function renderGroupedTable() {
    return Object.entries(groupedObservations).map(function([groupName, groupObs]) {
      const isExpanded = expandedByDefault || expandedGroups.includes(groupName);
      
      return (
        <Accordion 
          key={groupName}
          expanded={isExpanded}
          onChange={handleAccordionChange(groupName)}
          style={{ marginBottom: 8 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={2} width="100%">
              <Box display="flex" alignItems="center" gap={1}>
                {getGroupIcon(groupName)}
                <Typography variant="h6">
                  {groupName}
                </Typography>
              </Box>
              
              {showGroupCounts && (
                <Chip 
                  label={groupObs.length} 
                  size="small" 
                  color="primary"
                />
              )}
              
              <Box flexGrow={1} />
              
              {renderGroupSummary(groupName, groupObs)}
            </Box>
          </AccordionSummary>
          
          <AccordionDetails>
            <Box width="100%">
              <ObservationsTable
                observations={groupObs}
                onRowClick={onRowClick}
                {...tableProps}
              />
            </Box>
          </AccordionDetails>
        </Accordion>
      );
    });
  }
  
  function renderSummaryStats() {
    const totalObservations = observations.length;
    const groupCount = Object.keys(groupedObservations).length;
    
    return (
      <Box mb={2} p={2} bgcolor="grey.50" borderRadius={1}>
        <Typography variant="subtitle2">
          Summary: {totalObservations} observations in {groupCount} {groupBy === 'category' ? 'categories' : 'groups'}
        </Typography>
      </Box>
    );
  }
  
  if (observations.length === 0) {
    return (
      <Paper variant="outlined" style={{ padding: 16 }}>
        <Typography variant="body1" color="textSecondary" align="center">
          No observations to display
        </Typography>
      </Paper>
    );
  }
  
  return (
    <Box>
      {showGroupSummary && renderSummaryStats()}
      {renderGroupedTable()}
    </Box>
  );
}