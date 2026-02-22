// /imports/ui-fhir/measureReports/MeasureReportsPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import { 
  Box,
  Button,
  Container,
  TextField,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Card,
  CardContent,
  CardHeader,
  Grid,
  LinearProgress
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import SortIcon from '@mui/icons-material/Sort';
import CodeIcon from '@mui/icons-material/Code';
import BadgeIcon from '@mui/icons-material/Badge';
import SearchIcon from '@mui/icons-material/Search';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get } from 'lodash';

// Direct import to avoid Meteor.startup timing issues
import { MeasureReports } from '/imports/lib/schemas/SimpleSchemas/MeasureReports';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';

import MeasureReportsTable from './MeasureReportsTable';
import FhirUtilities from '../../lib/FhirUtilities';

function MeasureReportsPage(props) {
  const navigate = useNavigate();
  
  const [searchFilter, setSearchFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showSystemId, setShowSystemId] = useState(false);
  
  const data = {
    measureReports: []
  };

  // Track subscription
  const isLoading = useTracker(() => {
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    
    let query = {};
    
    // Add search filter
    if(searchFilter && searchFilter.length > 0) {
      query = {
        $or: [
          {'_id': searchFilter},
          {'id': searchFilter},
          {'identifier.0.value': {$regex: searchFilter, $options: 'i'}},
          {'status': {$regex: searchFilter, $options: 'i'}},
          {'type': {$regex: searchFilter, $options: 'i'}},
          {'subject.display': {$regex: searchFilter, $options: 'i'}},
          {'measure': {$regex: searchFilter, $options: 'i'}}
        ]
      };
    }
    
    // Add patient filter if selected
    if(selectedPatient || selectedPatientId) {
      const fhirId = get(selectedPatient, 'id');
      
      if(fhirId) {
        const patientQuery = FhirUtilities.addPatientFilterToQuery(fhirId);
        if(query.$or) {
          query = { $and: [query, patientQuery] };
        } else {
          query = patientQuery;
        }
      } else if(selectedPatientId) {
        const patientQuery = FhirUtilities.addPatientFilterToQuery(selectedPatientId);
        if(query.$or) {
          query = { $and: [query, patientQuery] };
        } else {
          query = patientQuery;
        }
      }
    }
    
    if(autoSubscribeEnabled){
      const handle = Meteor.subscribe('autopublish.MeasureReports', query, { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('selectedPatient.MeasureReports', Session.get('selectedPatientId'), { limit: 1000 });
      return !handle.ready();
    }
  }, [searchFilter, Session.get('selectedPatientId')]);

  // Track data changes
  data.measureReports = useTracker(function(){
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    
    const fhirId = get(selectedPatient, 'id');
    const patientIdToUse = fhirId || selectedPatientId;
    
    let query = {};
    
    // Add search filter
    if(searchFilter && searchFilter.length > 0) {
      query = {
        $or: [
          {'_id': searchFilter},
          {'id': searchFilter},
          {'identifier.0.value': {$regex: searchFilter, $options: 'i'}},
          {'status': {$regex: searchFilter, $options: 'i'}},
          {'type': {$regex: searchFilter, $options: 'i'}},
          {'subject.display': {$regex: searchFilter, $options: 'i'}},
          {'measure': {$regex: searchFilter, $options: 'i'}}
        ]
      };
    }
    
    // Add patient filter
    if(patientIdToUse) {
      const patientQuery = FhirUtilities.addPatientFilterToQuery(patientIdToUse);
      if(query.$or) {
        query = { $and: [query, patientQuery] };
      } else {
        query = patientQuery;
      }
    }
    
    const options = {
      sort: { _id: sortOrder === 'desc' ? -1 : 1 }
    };
    
    return MeasureReports.find(query, options).fetch();
  }, [searchFilter, sortOrder]);

  // Debug logging on first render only
  useEffect(() => {
    return () => {
      Session.set('MeasureReportsPage.debugLogged', false);
    };
  }, []);

  if(!Session.get('MeasureReportsPage.debugLogged')) {
    Session.set('MeasureReportsPage.debugLogged', true);
    
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    const fhirId = get(selectedPatient, 'id');
    
    console.log('MeasureReports data - MongoDB _id:', selectedPatientId);
    console.log('MeasureReports data - FHIR id:', fhirId);
    console.log('MeasureReports data - found:', data.measureReports.length);
  }

  function handleRowClick(measureReportId) {
    navigate(`/measure-reports/${measureReportId}`);
  }

  function handleAddMeasureReport() {
    navigate('/measure-reports/new');
  }

  function handleToggleSort() {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  }

  function handleToggleChange(event, newOptions) {
    if (newOptions.includes('systemId')) {
      setShowSystemId(true);
    } else {
      setShowSystemId(false);
    }
  }

  const selectedPatient = Session.get('selectedPatient');
  const patientName = get(selectedPatient, 'name[0].text', 'No patient selected');

  return (
    <Container id="measureReportsPage" maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h4" component="h1" gutterBottom>
              Measure Reports
            </Typography>
            {selectedPatient && (
              <Typography variant="subtitle1" color="text.secondary">
                Patient: {patientName}
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} md={6} sx={{ textAlign: 'right' }}>
            <ToggleButtonGroup
              value={showSystemId ? ['systemId'] : []}
              onChange={handleToggleChange}
              aria-label="display options"
              size="small"
            >
              <ToggleButton value="systemId" aria-label="show system id">
                <BadgeIcon sx={{ mr: 1 }} /> System ID
              </ToggleButton>
            </ToggleButtonGroup>
            <Button
              sx={{ ml: 2 }}
              startIcon={<SortIcon />}
              onClick={handleToggleSort}
              variant="outlined"
            >
              Sort {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </Grid>
        </Grid>

        <Box sx={{ my: 3 }}>
          <TextField
            id="measureReportSearchInput"
            fullWidth
            placeholder="Search measure reports by ID, identifier, status, type..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
        </Box>

        {isLoading && <LinearProgress />}

        {!isLoading && data.measureReports.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Measure Reports Found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {searchFilter 
                  ? "No measure reports match your search criteria." 
                  : "Get started by creating your first measure report."}
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddMeasureReport}
              >
                Add Your First Measure Report
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader 
              title={`${data.measureReports.length} Measure Report${data.measureReports.length !== 1 ? 's' : ''}`}
              action={
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddMeasureReport}
                  variant="contained"
                >
                  Add Measure Report
                </Button>
              }
            />
            <CardContent>
              <MeasureReportsTable
                measureReports={data.measureReports}
                onRowClick={handleRowClick}
                hideIdentifier={false}
                hideStatus={false}
                hideType={false}
                hideSubject={false}
                hideMeasure={false}
                hideDate={false}
                hideReporter={true}
                hidePeriod={false}
                hideGroup={true}
                hideScore={false}
                hidePopulation={true}
                hideImprovementNotation={true}
                hideBarcode={!showSystemId}
                hideCheckbox={true}
                hideActionIcons={true}
                rowsPerPage={10}
                formFactorLayout="web"
              />
            </CardContent>
          </Card>
        )}
      </Box>
    </Container>
  );
}

export default MeasureReportsPage;