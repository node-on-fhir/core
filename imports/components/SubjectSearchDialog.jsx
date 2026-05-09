// imports/components/SubjectSearchDialog.jsx

import React, { useState, useEffect } from 'react';

import {
  DialogContent,
  DialogTitle,
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  Chip,
  Button,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';

import PatientSearchDialog from '/imports/components/PatientSearchDialog';

// Get the Groups collection
let Groups;
let useAppTheme;
Meteor.startup(function(){
  if (Meteor.Collections?.Groups) {
    Groups = Meteor.Collections.Groups;
  }
  useAppTheme = Meteor.useTheme;
});

function SubjectSearchDialog(props) {
  var {
    onPatientSelect,
    onGroupSelect,
    defaultSearchTerm,
    defaultMode
  } = props;

  var initialMode = defaultMode || 'patient';

  var appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  var isDark = appTheme.theme === 'dark';

  var [mode, setMode] = useState(initialMode);
  var [groupSearchTerm, setGroupSearchTerm] = useState('');
  var [debouncedGroupSearch, setDebouncedGroupSearch] = useState('');
  var [expandedAccordion, setExpandedAccordion] = useState(false);

  // Debounce group search term
  useEffect(function() {
    var timer = setTimeout(function() {
      setDebouncedGroupSearch(groupSearchTerm);
    }, 300);
    return function() { clearTimeout(timer); };
  }, [groupSearchTerm]);

  // Subscribe to groups with search query
  var isGroupsReady = useTracker(function() {
    if (mode !== 'group') return true;

    var query = {};
    if (debouncedGroupSearch && debouncedGroupSearch.trim() !== '') {
      var searchPattern = debouncedGroupSearch.trim();
      query = {
        $or: [
          { 'name': { $regex: searchPattern, $options: 'i' } },
          { 'description': { $regex: searchPattern, $options: 'i' } }
        ]
      };
    }

    var handle = Meteor.subscribe('selectedPatient.Groups', null, { limit: 100 });
    return handle.ready();
  }, [mode]);

  // Fetch groups from local collection
  var groups = useTracker(function() {
    if (mode !== 'group' || !Groups || !isGroupsReady) return [];

    var searchQuery = {};
    if (debouncedGroupSearch && debouncedGroupSearch.trim() !== '') {
      var searchRegex = new RegExp(debouncedGroupSearch.trim(), 'i');
      searchQuery = {
        $or: [
          { 'name': { $regex: searchRegex } },
          { 'description': { $regex: searchRegex } }
        ]
      };
    }

    return Groups.find(searchQuery).fetch();
  }, [mode, debouncedGroupSearch, isGroupsReady]);

  function handleModeChange(event, newMode) {
    if (newMode !== null) {
      setMode(newMode);
      setExpandedAccordion(false);
    }
  }

  function handleGroupSearchChange(event) {
    setGroupSearchTerm(event.target.value);
  }

  function handleAccordionChange(groupId) {
    return function(event, isExpanded) {
      setExpandedAccordion(isExpanded ? groupId : false);
    };
  }

  function handleSelectGroup(group) {
    if (typeof onGroupSelect === 'function') {
      var groupId = get(group, '_id');
      onGroupSelect(groupId, group);
    }
  }

  function renderGroupMembers(group) {
    var members = get(group, 'member', []);

    if (!members || members.length === 0) {
      return (
        <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', py: 1 }}>
          No members assigned
        </Typography>
      );
    }

    return (
      <List dense disablePadding>
        {members.map(function(member, idx) {
          var entityDisplay = get(member, 'entity.display', '');
          var entityReference = get(member, 'entity.reference', '');
          var isInactive = get(member, 'inactive', false);

          return (
            <ListItem key={idx} sx={{ pl: 0, opacity: isInactive ? 0.5 : 1 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <PersonIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              </ListItemIcon>
              <ListItemText
                primary={entityDisplay || entityReference || 'Unknown member'}
                secondary={entityReference}
                primaryTypographyProps={{ variant: 'body2', color: 'text.primary' }}
                secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
              />
              {isInactive && (
                <Chip label="Inactive" size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
              )}
            </ListItem>
          );
        })}
      </List>
    );
  }

  function renderGroupSearch() {
    return (
      <Box>
        <Box sx={{ mb: 2 }}>
          <TextField
            id="groupSearchField"
            placeholder="Search groups by name or description..."
            onChange={handleGroupSearchChange}
            value={groupSearchTerm}
            fullWidth
            variant="outlined"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton aria-label="search groups" edge="end">
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Box>

        {!isGroupsReady ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
            <CircularProgress />
          </Box>
        ) : groups.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
            <Typography variant="h6" sx={{ color: 'text.secondary' }}>
              {groupSearchTerm ? 'No groups found matching your search' : 'No groups available'}
            </Typography>
          </Box>
        ) : (
          <Box>
            {groups.map(function(group) {
              var groupId = get(group, '_id');
              var groupName = get(group, 'name', 'Unnamed Group');
              var groupType = get(group, 'type', '');
              var groupDescription = get(group, 'description', '');
              var memberCount = get(group, 'member', []).length;
              var quantity = get(group, 'quantity', memberCount);

              return (
                <Accordion
                  key={groupId}
                  expanded={expandedAccordion === groupId}
                  onChange={handleAccordionChange(groupId)}
                  sx={{
                    mb: 1,
                    bgcolor: 'background.paper',
                    '&:before': { display: 'none' },
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: '4px !important',
                    '&.Mui-expanded': { margin: '0 0 8px 0' }
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', pr: 1 }}>
                      <GroupIcon sx={{ color: 'text.secondary', fontSize: 22 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 500 }}>
                          {groupName}
                        </Typography>
                        {groupDescription && (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                            {groupDescription}
                          </Typography>
                        )}
                      </Box>
                      {groupType && (
                        <Chip
                          label={groupType}
                          size="small"
                          variant="outlined"
                          sx={{ height: 22, fontSize: '0.7rem' }}
                        />
                      )}
                      <Chip
                        label={memberCount + (memberCount === 1 ? ' member' : ' members')}
                        size="small"
                        sx={{ height: 22, fontSize: '0.7rem', bgcolor: 'action.hover' }}
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ borderTop: 1, borderColor: 'divider', pt: 1 }}>
                    {renderGroupMembers(group)}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<CheckCircleIcon />}
                        onClick={function() { handleSelectGroup(group); }}
                      >
                        Select Group
                      </Button>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        )}
      </Box>
    );
  }

  return (
    <>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="span">
            Search Subject
          </Typography>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={handleModeChange}
            size="small"
          >
            <ToggleButton value="patient">
              <Tooltip title="Search Patients">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PersonIcon sx={{ fontSize: 18 }} />
                  <Typography variant="body2">Patients</Typography>
                </Box>
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="group">
              <Tooltip title="Search Groups">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <GroupIcon sx={{ fontSize: 18 }} />
                  <Typography variant="body2">Groups</Typography>
                </Box>
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </DialogTitle>

      {mode === 'patient' ? (
        <PatientSearchDialog
          onSelect={onPatientSelect}
          defaultSearchTerm={defaultSearchTerm}
        />
      ) : (
        <DialogContent dividers sx={{ minHeight: '650px' }}>
          {renderGroupSearch()}
        </DialogContent>
      )}
    </>
  );
}

export default SubjectSearchDialog;
