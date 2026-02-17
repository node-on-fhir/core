// imports/ui/DICOM/StudyListPage.jsx
// DICOM Management page with tabbed interface for Files, Studies, and Key Images

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import {
  Card,
  CardHeader,
  CardContent,
  Box,
  Button,
  Tabs,
  Tab
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Storage as FilesIcon,
  LocalHospital as StudiesIcon,
  Image as KeyImagesIcon
} from '@mui/icons-material';

// Import table components
import DicomFilesTable from './components/DicomFilesTable';
import ImagingStudiesTable from './components/ImagingStudiesTable';
import KeyImagesTable from './components/KeyImagesTable';

let useAppTheme;
let useNavigate;
let useSearchParams;

Meteor.startup(function() {
  useAppTheme = Meteor.useTheme;
  if (window.ReactRouter) {
    useNavigate = window.ReactRouter.useNavigate;
    useSearchParams = window.ReactRouter.useSearchParams;
  }
});

// Tab name to index mapping
const TAB_NAMES = ['files', 'studies', 'keys'];
const TAB_INDICES = {
  'files': 0,
  'studies': 1,
  'keys': 2
};

/**
 * StudyListPage - DICOM Management with tabbed interface
 *
 * Tabs:
 * - DICOM Files: Raw GridFS file metadata (dicom.files)
 * - Imaging Studies: FHIR ImagingStudy resources
 * - Key Images: DocumentReference resources for saved images
 *
 * URL sync: /dicom/studies?tab=files|studies|keys
 */
export default function StudyListPage() {
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';
  const navigate = useNavigate ? useNavigate() : null;

  // URL search params for tab sync
  let searchParams = null;
  let setSearchParams = null;

  if (useSearchParams) {
    const result = useSearchParams();
    searchParams = result[0];
    setSearchParams = result[1];
  }

  // Extract patient/servicerequest params for forwarding to upload page
  var patientParam = searchParams ? searchParams.get('patient') : null;
  var serviceRequestParam = searchParams ? searchParams.get('servicerequest') : null;

  var forwardParams = '';
  if (patientParam) {
    forwardParams += '?patient=' + encodeURIComponent(patientParam);
  }
  if (serviceRequestParam) {
    forwardParams += (forwardParams ? '&' : '?') + 'servicerequest=' + encodeURIComponent(serviceRequestParam);
  }

  // Get initial tab from URL or default to 'studies'
  function getInitialTab() {
    if (searchParams) {
      const tabParam = searchParams.get('tab');
      if (tabParam && TAB_INDICES[tabParam] !== undefined) {
        return TAB_INDICES[tabParam];
      }
    }
    return 1; // Default to 'studies' tab
  }

  const [activeTab, setActiveTab] = useState(getInitialTab);

  // Sync URL when tab changes (merge with existing params to preserve patient/servicerequest)
  useEffect(function() {
    if (setSearchParams) {
      const tabName = TAB_NAMES[activeTab];
      setSearchParams(function(prev) {
        prev.set('tab', tabName);
        return prev;
      });
    }
  }, [activeTab, setSearchParams]);

  // Handle tab change
  function handleTabChange(event, newValue) {
    setActiveTab(newValue);
  }

  // Get theme colors from settings
  const cardBgColor = isDark
    ? get(Meteor, 'settings.public.theme.palette.cardColor', '#1e1e1e')
    : '#ffffff';
  const cardTextColor = isDark
    ? get(Meteor, 'settings.public.theme.palette.cardTextColor', 'rgba(255, 255, 255, 0.87)')
    : 'rgba(0, 0, 0, 0.87)';
  const paperBgColor = isDark
    ? get(Meteor, 'settings.public.theme.palette.paperColor', '#1e1e1e')
    : '#ffffff';
  const subheaderColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';

  // Theme props to pass to table components
  const themeProps = {
    isDark,
    cardTextColor,
    subheaderColor,
    paperBgColor
  };

  return (
    <Box
      id="dicomStudyListPage"
      sx={{
        minHeight: '100vh',
        py: 4
      }}
    >
      <Card sx={{
        mx: 3,
        mb: 3,
        bgcolor: cardBgColor,
        color: cardTextColor
      }}>
        <CardHeader
          title="DICOM Management"
          subheader="Manage DICOM files, imaging studies, and key images"
          action={
            navigate && (
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={function() { navigate('/dicom/upload' + forwardParams); }}
              >
                Upload Image(s)
              </Button>
            )
          }
          sx={{
            '& .MuiCardHeader-title': {
              color: cardTextColor
            },
            '& .MuiCardHeader-subheader': {
              color: subheaderColor
            }
          }}
        />

        {/* Tab Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="DICOM management tabs"
            sx={{
              '& .MuiTab-root': {
                color: subheaderColor,
                '&.Mui-selected': {
                  color: isDark ? '#90caf9' : '#1976d2'
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: isDark ? '#90caf9' : '#1976d2'
              }
            }}
          >
            <Tab
              icon={<FilesIcon />}
              iconPosition="start"
              label="DICOM Files"
              id="tab-files"
              aria-controls="tabpanel-files"
            />
            <Tab
              icon={<StudiesIcon />}
              iconPosition="start"
              label="Imaging Studies"
              id="tab-studies"
              aria-controls="tabpanel-studies"
            />
            <Tab
              icon={<KeyImagesIcon />}
              iconPosition="start"
              label="Key Images"
              id="tab-keys"
              aria-controls="tabpanel-keys"
            />
          </Tabs>
        </Box>

        <CardContent>
          {/* DICOM Files Tab */}
          <Box
            role="tabpanel"
            hidden={activeTab !== 0}
            id="tabpanel-files"
            aria-labelledby="tab-files"
          >
            {activeTab === 0 && (
              <DicomFilesTable {...themeProps} />
            )}
          </Box>

          {/* Imaging Studies Tab */}
          <Box
            role="tabpanel"
            hidden={activeTab !== 1}
            id="tabpanel-studies"
            aria-labelledby="tab-studies"
          >
            {activeTab === 1 && (
              <ImagingStudiesTable {...themeProps} />
            )}
          </Box>

          {/* Key Images Tab */}
          <Box
            role="tabpanel"
            hidden={activeTab !== 2}
            id="tabpanel-keys"
            aria-labelledby="tab-keys"
          >
            {activeTab === 2 && (
              <KeyImagesTable {...themeProps} />
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
