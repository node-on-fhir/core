// packages/data-importer/client/DataImportPage.jsx
//
// Tabbed Data Import page with 2 tabs: REST API and File Drop.
// Adapted from merkalis ImportPageNew.jsx — stripped of merkle/FHIRcast tabs.

import React from 'react';
import { Meteor } from 'meteor/meteor';
// useSearchParams replaced with Meteor.useLocation + Meteor.useNavigate
// (Atmosphere packages get a separate react-router-dom bundle without Router context)
import {
  Box,
  Typography,
  Tabs,
  Tab
} from '@mui/material';
import {
  CloudUpload as ImportIcon
} from '@mui/icons-material';

import { ImportStoreProvider } from './ImportStoreContext.jsx';
import { RestApiTab } from './RestApiTab.jsx';
import { FileDropTab } from './FileDropTab.jsx';
import { FhirDropTab } from './FhirDropTab.jsx';

// =============================================================================
// CONSTANTS
// =============================================================================

var TAB_SLUGS = ['file-drop', 'fhir-drop', 'rest-api'];

// =============================================================================
// TAB PANEL
// =============================================================================

function TabPanel(props) {
  var children = props.children;
  var value = props.value;
  var index = props.index;

  if (value !== index) {
    return null;
  }

  return (
    <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {children}
    </Box>
  );
}

// =============================================================================
// DATA IMPORT PAGE
// =============================================================================

function DataImportPage() {
  var useLocation = Meteor.useLocation;
  var useNavigate = Meteor.useNavigate;
  var location = useLocation ? useLocation() : { search: '' };
  var navigate = useNavigate ? useNavigate() : function() {};
  var searchParams = new URLSearchParams(location.search);

  var tabSlug = searchParams.get('tab') || 'file-drop';
  var selectedTab = TAB_SLUGS.indexOf(tabSlug);
  if (selectedTab === -1) selectedTab = 0;

  // Detect dark mode from app theme
  var isDark = false;
  var useAppTheme;
  if (typeof Meteor !== 'undefined' && Meteor.useTheme) {
    useAppTheme = Meteor.useTheme;
  }
  if (useAppTheme) {
    var appTheme = useAppTheme();
    isDark = appTheme.theme === 'dark';
  }

  var pageBgColor = isDark ? '#121212' : '#f6f6f6';
  var cardTextColor = isDark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)';
  var dividerColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';

  function handleTabChange(event, newValue) {
    // Preserve other params (patient, next) across tab switches
    var params = new URLSearchParams(location.search);
    params.set('tab', TAB_SLUGS[newValue]);
    navigate('?' + params.toString(), { replace: true });
  }

  return (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: pageBgColor,
      color: cardTextColor,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        px: 3,
        py: 1.5,
        borderBottom: '1px solid',
        borderColor: dividerColor,
        flexShrink: 0
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ImportIcon sx={{ color: 'primary.main', fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            Data Import
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: '1px solid', borderColor: dividerColor, flexShrink: 0, px: 2 }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
            },
            '& .MuiTab-root.Mui-selected': {
              color: isDark ? '#90caf9' : '#1976d2'
            }
          }}
        >
          <Tab label="File Drop" />
          <Tab label="FHIR Drop" />
          <Tab label="REST API" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <ImportStoreProvider>
        <TabPanel value={selectedTab} index={0}>
          <FileDropTab />
        </TabPanel>

        <TabPanel value={selectedTab} index={1}>
          <FhirDropTab />
        </TabPanel>

        <TabPanel value={selectedTab} index={2}>
          <RestApiTab />
        </TabPanel>
      </ImportStoreProvider>
    </Box>
  );
}

export { DataImportPage };
export default DataImportPage;
