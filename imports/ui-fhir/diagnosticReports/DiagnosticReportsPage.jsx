// /imports/ui-fhir/diagnosticReports/DiagnosticReportsPage.jsx

import React, { useState, useEffect } from 'react';

import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
  Grid,
  Container,
  Button,
  Box,
  Typography,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';

import { get, has } from 'lodash';

import DiagnosticReportsTable from './DiagnosticReportsTable';
import FhirNoData from '../components/FhirNoData.jsx';
import LayoutHelpers from '/imports/lib/LayoutHelpers';
import { DiagnosticReports } from '/imports/lib/schemas/SimpleSchemas/DiagnosticReports';

import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import BadgeIcon from '@mui/icons-material/Badge';
import PersonIcon from '@mui/icons-material/Person';
import CodeIcon from '@mui/icons-material/Code';

Session.setDefault('selectedDiagnosticReportId', false);
Session.setDefault('diagnosticReportPageTabIndex', 0);
Session.setDefault('diagnosticReportsSearchFilter', '');
Session.setDefault('diagnosticReportsSortOrder', 'descending');
Session.setDefault('DiagnosticReportsTable.diagnosticReportsIndex', 0);

const diagnosticServiceCategories = [
  { code: 'AU', display: 'Audiology' },
  { code: 'BG', display: 'Blood Gases' },
  { code: 'BLB', display: 'Blood Bank' },
  { code: 'CG', display: 'Cytogenetics' },
  { code: 'CUS', display: 'Cardiac Ultrasound' },
  { code: 'CTH', display: 'Cardiac Catheterization' },
  { code: 'CT', display: 'CAT Scan' },
  { code: 'CH', display: 'Chemistry' },
  { code: 'CP', display: 'Cytopathology' },
  { code: 'EC', display: 'Electrocardiac (EKG, EEC, Holter)' },
  { code: 'EN', display: 'Electroneuro (EEG, EMG, EP, PSG)' },
  { code: 'GE', display: 'Genetics' },
  { code: 'HM', display: 'Hematology' },
  { code: 'IMG', display: 'Diagnostic Imaging' },
  { code: 'ICU', display: 'Bedside ICU Monitoring' },
  { code: 'IMM', display: 'Immunology' },
  { code: 'LAB', display: 'Laboratory' },
  { code: 'MB', display: 'Microbiology' },
  { code: 'MCB', display: 'Mycobacteriology' },
  { code: 'MYC', display: 'Mycology' },
  { code: 'NMS', display: 'Nuclear Medicine Scan' },
  { code: 'NMR', display: 'Nuclear Magnetic Resonance' },
  { code: 'NRS', display: 'Nursing Service Measures' },
  { code: 'OUS', display: 'OB Ultrasound' },
  { code: 'OT', display: 'Occupational Therapy' },
  { code: 'OTH', display: 'Other' },
  { code: 'OSL', display: 'Outside Lab' },
  { code: 'PAR', display: 'Parasitology' },
  { code: 'PHR', display: 'Pharmacy' },
  { code: 'PAT', display: 'Pathology' },
  { code: 'PT', display: 'Physical Therapy' },
  { code: 'PHY', display: 'Physician (Hx, Dx, Admission Note)' },
  { code: 'PF', display: 'Pulmonary Function' },
  { code: 'RAD', display: 'Radiology' },
  { code: 'RX', display: 'Radiograph' },
  { code: 'RUS', display: 'Radiology Ultrasound' },
  { code: 'RC', display: 'Respiratory Care (Therapy)' },
  { code: 'RT', display: 'Radiation Therapy' },
  { code: 'SR', display: 'Serology' },
  { code: 'SP', display: 'Surgical Pathology' },
  { code: 'TX', display: 'Toxicology' },
  { code: 'VUS', display: 'Vascular Ultrasound' },
  { code: 'VR', display: 'Virology' },
  { code: 'URN', display: 'Urinalysis' },
  { code: 'XRC', display: 'Cineradiograph' }
];

function DiagnosticReportsPage(props){
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortOrder, setSortOrder] = useState('descending');
  const [showSystemId, setShowSystemId] = useState(false);
  const [showPatientReference, setShowPatientReference] = useState(false);
  const [showPatientName, setShowPatientName] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');

  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();

  let data = {
    selectedDiagnosticReportId: '',
    selectedDiagnosticReport: false,
    diagnosticReports: [],
    diagnosticReportsIndex: 0
  };

  // Track selected report
  data.selectedDiagnosticReportId = useTracker(function(){
    return Session.get('selectedDiagnosticReportId');
  }, []);
  
  data.selectedDiagnosticReport = useTracker(function(){
    return DiagnosticReports.findOne(Session.get('selectedDiagnosticReportId'));
  }, []);
  
  data.diagnosticReportsIndex = useTracker(function(){
    return Session.get('DiagnosticReportsTable.diagnosticReportsIndex');
  }, []);

  // Subscribe and filter data
  const isLoading = useTracker(() => {
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');

    let query = {};

    // Add patient filter using FhirUtilities
    if(selectedPatient || selectedPatientId) {
      const fhirId = get(selectedPatient, 'id');
      if(fhirId) {
        query = FhirUtilities.addPatientFilterToQuery(fhirId);
      } else if(selectedPatientId) {
        query = FhirUtilities.addPatientFilterToQuery(selectedPatientId);
      }
    }

    // Add category filter
    if(selectedCategory){
      const categoryFilter = {
        $or: [
          {'category.coding.code': selectedCategory},
          {'category.0.coding.0.code': selectedCategory}
        ]
      };
      if(Object.keys(query).length > 0){
        query = { $and: [query, categoryFilter] };
      } else {
        query = categoryFilter;
      }
    }

    // Add search filter
    if(searchFilter && searchFilter.length > 0){
      const searchQuery = {
        $or: [
          {'_id': searchFilter},
          {'id': searchFilter},
          {'code.text': {$regex: searchFilter, $options: 'i'}},
          {'code.coding.0.display': {$regex: searchFilter, $options: 'i'}},
          {'category.0.text': {$regex: searchFilter, $options: 'i'}},
          {'conclusion': {$regex: searchFilter, $options: 'i'}}
        ]
      };

      // Combine with existing query
      if(Object.keys(query).length > 0) {
        query = {
          $and: Array.isArray(query.$and)
            ? [...query.$and, searchQuery]
            : [query, searchQuery]
        };
      } else {
        query = searchQuery;
      }
    }

    if(autoSubscribeEnabled){
      const handle = Meteor.subscribe('autopublish.DiagnosticReports', query, { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('selectedPatient.DiagnosticReports', Session.get('selectedPatientId'), { limit: 1000 });
      return !handle.ready();
    }
  }, [searchFilter, selectedCategory]);

  data.diagnosticReports = useTracker(function(){
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');

    let query = {};

    // Add patient filter using FhirUtilities
    if(selectedPatient || selectedPatientId) {
      const fhirId = get(selectedPatient, 'id');
      if(fhirId) {
        query = FhirUtilities.addPatientFilterToQuery(fhirId);
      } else if(selectedPatientId) {
        query = FhirUtilities.addPatientFilterToQuery(selectedPatientId);
      }
    }

    // Add category filter
    if(selectedCategory){
      const categoryFilter = {
        $or: [
          {'category.coding.code': selectedCategory},
          {'category.0.coding.0.code': selectedCategory}
        ]
      };
      if(Object.keys(query).length > 0){
        query = { $and: [query, categoryFilter] };
      } else {
        query = categoryFilter;
      }
    }

    // Add search filter
    if(searchFilter && searchFilter.length > 0){
      const searchQuery = {
        $or: [
          {'_id': searchFilter},
          {'id': searchFilter},
          {'code.text': {$regex: searchFilter, $options: 'i'}},
          {'code.coding.0.display': {$regex: searchFilter, $options: 'i'}},
          {'category.0.text': {$regex: searchFilter, $options: 'i'}},
          {'conclusion': {$regex: searchFilter, $options: 'i'}}
        ]
      };

      // Combine with existing query
      if(Object.keys(query).length > 0) {
        query = {
          $and: Array.isArray(query.$and)
            ? [...query.$and, searchQuery]
            : [query, searchQuery]
        };
      } else {
        query = searchQuery;
      }
    }

    // Sort by most recent first
    return DiagnosticReports.find(query, {
      sort: { _id: -1 }
    }).fetch();
  }, [searchFilter, selectedCategory]);

  function handleRowClick(diagnosticReportId){
    console.log('DiagnosticReportsPage.onRowClick', diagnosticReportId);
    navigate('/diagnostic-reports/' + diagnosticReportId);
  }

  function handleAddDiagnosticReport(){
    console.log('Add Diagnostic Report button clicked');
    navigate('/diagnostic-reports/new');
  }

  function handleCategoryChange(event){
    const value = event.target.value;
    setSelectedCategory(value);
    if(value){
      setSearchParams({ category: value });
    } else {
      setSearchParams({});
    }
  }

  function handleSortOrderChange(event, newOrder){
    if(newOrder !== null){
      setSortOrder(newOrder);
    }
  }

  function renderHeader() {
    const selectedPatient = Session.get('selectedPatient');
    let patientName = 'All Patients';
    if (selectedPatient) {
      if (get(selectedPatient, 'name[0].text')) {
        patientName = get(selectedPatient, 'name[0].text');
      } else if (get(selectedPatient, 'name[0]')) {
        const given = get(selectedPatient, 'name[0].given', []).join(' ');
        const family = get(selectedPatient, 'name[0].family', '');
        patientName = `${given} ${family}`.trim();
      }
    }
    
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Diagnostic Reports
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.diagnosticReports.length} reports found for {patientName}
            </Typography>
          </Grid>
          <Grid item>
            <Box display="flex" gap={2} alignItems="center">
              <ToggleButtonGroup
                value={sortOrder}
                exclusive
                onChange={handleSortOrderChange}
                aria-label="sort order"
                size="small"
              >
                <ToggleButton value="ascending" aria-label="ascending order">
                  <ArrowUpwardIcon />
                </ToggleButton>
                <ToggleButton value="descending" aria-label="descending order">
                  <ArrowDownwardIcon />
                </ToggleButton>
              </ToggleButtonGroup>
              
              <ToggleButtonGroup
                value={[
                  ...(showSystemId ? ['systemId'] : []),
                  ...(showPatientName ? ['patientName'] : []),
                  ...(showPatientReference ? ['patientReference'] : [])
                ]}
                onChange={(event, newFormats) => {
                  setShowSystemId(newFormats.includes('systemId'));
                  setShowPatientName(newFormats.includes('patientName'));
                  setShowPatientReference(newFormats.includes('patientReference'));
                }}
                aria-label="display options"
                size="small"
              >
                <ToggleButton value="systemId" aria-label="show system id">
                  <BadgeIcon />
                </ToggleButton>
                <ToggleButton value="patientName" aria-label="show patient name">
                  <PersonIcon />
                </ToggleButton>
                <ToggleButton value="patientReference" aria-label="show patient reference">
                  <CodeIcon />
                </ToggleButton>
              </ToggleButtonGroup>

              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="category-filter-label">Category</InputLabel>
                <Select
                  labelId="category-filter-label"
                  id="categoryFilter"
                  value={selectedCategory}
                  label="Category"
                  onChange={handleCategoryChange}
                >
                  <MenuItem value="">
                    <em>All Categories</em>
                  </MenuItem>
                  {diagnosticServiceCategories.map(function(cat){
                    return (
                      <MenuItem key={cat.code} value={cat.code}>
                        {cat.display}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddDiagnosticReport}
              >
                Add Report
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Box mt={2}>
          <TextField
            id="diagnosticReportSearchInput"
            fullWidth
            placeholder="Search reports by ID, code, category, or conclusion..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            variant="outlined"
            size="small"
          />
        </Box>
      </Box>
    );
  }

  let layoutContent;
  if(isLoading) {
    layoutContent = <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography>Loading diagnostic reports...</Typography>
    </Box>
  } else if(data.diagnosticReports.length > 0){
    layoutContent = <Card 
      sx={{ 
        width: '100%',
        borderRadius: 3,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden'
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <DiagnosticReportsTable 
          id='diagnosticReportsTable'
          diagnosticReports={data.diagnosticReports}
          count={data.diagnosticReports.length}
          formFactorLayout={formFactor}
          rowsPerPage={10}
          hideBarcode={!showSystemId}
          hideSubject={!showPatientName}
          hidePatientReference={!showPatientReference}
          order={sortOrder}
          onRowClick={handleRowClick}
          onSetPage={function(index){
            Session.set('DiagnosticReportsTable.diagnosticReportsIndex', index);
          }}                
          page={data.diagnosticReportsIndex}
        />
      </CardContent>
    </Card>
  } else {
    layoutContent = <FhirNoData
      resourceType="DiagnosticReport"
      searchFilter={searchFilter}
      onAdd={handleAddDiagnosticReport}
      onClearSearch={function() { setSearchFilter(''); }}
    />
  }

  return (
    <Box 
      id="diagnosticReportsPage" 
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { renderHeader() }
      { layoutContent }
    </Box>
  );
}

export default DiagnosticReportsPage;