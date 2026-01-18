// imports/ui-fhir/clinicalImpressions/ClinicalImpressionsPage.jsx

import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';

import {
  Grid,
  Container,
  Card,
  CardContent,
  Button,
  Box,
  Typography,
  TextField,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import PersonIcon from '@mui/icons-material/Person';
import CodeIcon from '@mui/icons-material/Code';
import BadgeIcon from '@mui/icons-material/Badge';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import ClinicalImpressionsTable from './ClinicalImpressionsTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';

import { ClinicalImpressions } from '/imports/lib/schemas/SimpleSchemas/ClinicalImpressions';
import { FhirUtilities } from '/imports/lib/FhirUtilities';

// Session defaults
Session.setDefault('selectedClinicalImpressionId', false);
Session.setDefault('clinicalImpressionSearchFilter', '');
Session.setDefault('ClinicalImpressionsPage.onePageLayout', true);
Session.setDefault('ClinicalImpressionsPage.defaultQuery', {});
Session.setDefault('ClinicalImpressionsTable.hideCheckbox', true);
Session.setDefault('ClinicalImpressionsTable.clinicalImpressionsIndex', 0);

export function ClinicalImpressionsPage(props) {
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState('descending');
  const [searchFilter, setSearchFilter] = useState('');
  const [showPatientName, setShowPatientName] = useState(false);
  const [showPatientReference, setShowPatientReference] = useState(false);
  const [showSystemId, setShowSystemId] = useState(false);

  // Clean up debug flag on unmount
  useEffect(() => {
    return () => {
      Session.set('ClinicalImpressionsPage.debugLogged', false);
    };
  }, []);

  // Subscribe to clinical impressions data
  const isLoading = useTracker(() => {
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    let autoPublishEnabled = get(Meteor, 'settings.public.defaults.autopublish', false);

    // Build patient filter query
    let query = {};

    if (selectedPatient || selectedPatientId) {
      const fhirId = get(selectedPatient, 'id');

      if (fhirId) {
        query = FhirUtilities.addPatientFilterToQuery(fhirId);
      } else if (selectedPatientId) {
        query = FhirUtilities.addPatientFilterToQuery(selectedPatientId);
      }
    }

    // Add search filter if present
    if (searchFilter && searchFilter.length > 0) {
      query = {
        $and: [
          query,
          {
            $or: [
              {'_id': searchFilter},
              {'id': searchFilter},
              {'description': {$regex: searchFilter, $options: 'i'}},
              {'summary': {$regex: searchFilter, $options: 'i'}},
              {'status': {$regex: searchFilter, $options: 'i'}},
              {'code.text': {$regex: searchFilter, $options: 'i'}},
              {'code.coding.0.display': {$regex: searchFilter, $options: 'i'}},
              {'subject.display': {$regex: searchFilter, $options: 'i'}}
            ]
          }
        ]
      };
    }

    console.log('ClinicalImpressions subscription - selectedPatientId:', selectedPatientId);
    console.log('ClinicalImpressions subscription query:', query);

    if (autoPublishEnabled) {
      const handle = Meteor.subscribe('autopublish.ClinicalImpressions', query, { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('clinicalimpressions.all');
      return !handle.ready();
    }
  }, [Session.get('selectedPatientId'), searchFilter]);

  let data = {
    currentClinicalImpressionId: '',
    selectedClinicalImpression: null,
    clinicalImpressions: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    clinicalImpressionsIndex: 0
  };

  data.onePageLayout = useTracker(function() {
    return Session.get('ClinicalImpressionsPage.onePageLayout');
  }, []);

  data.hideCheckbox = useTracker(function() {
    return Session.get('ClinicalImpressionsTable.hideCheckbox');
  }, []);

  data.selectedClinicalImpressionId = useTracker(function() {
    return Session.get('selectedClinicalImpressionId');
  }, []);

  data.selectedClinicalImpression = useTracker(function() {
    return ClinicalImpressions.findOne({_id: Session.get('selectedClinicalImpressionId')});
  }, []);

  data.clinicalImpressions = useTracker(function() {
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');

    const fhirId = get(selectedPatient, 'id');
    const patientIdToUse = fhirId || selectedPatientId;

    const query = patientIdToUse ? FhirUtilities.addPatientFilterToQuery(patientIdToUse) : {};

    if (!Session.get('ClinicalImpressionsPage.debugLogged')) {
      Session.set('ClinicalImpressionsPage.debugLogged', true);

      console.log('ClinicalImpressions data - MongoDB _id:', selectedPatientId);
      console.log('ClinicalImpressions data - FHIR id:', fhirId);
      console.log('ClinicalImpressions data - query:', query);

      const allClinicalImpressions = ClinicalImpressions.find().fetch();
      console.log('Total ClinicalImpressions in client collection:', allClinicalImpressions.length);
    }

    const results = ClinicalImpressions.find(query, { sort: { _id: -1 } }).fetch();
    return results;
  }, []);

  data.clinicalImpressionsIndex = useTracker(function() {
    return Session.get('ClinicalImpressionsTable.clinicalImpressionsIndex');
  }, []);

  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();

  function handleAddClinicalImpression() {
    console.log('Add Clinical Impression button clicked');
    navigate('/clinical-impressions/new');
  }

  function handleSortOrderChange(event, newOrder) {
    if (newOrder !== null) {
      setSortOrder(newOrder);
    }
  }

  function renderHeader() {
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Clinical Impressions
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.clinicalImpressions.length} clinical impressions found
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
                  showPatientName && 'patientName',
                  showPatientReference && 'patientReference',
                  showSystemId && 'systemId'
                ].filter(Boolean)}
                onChange={(event, newFormats) => {
                  setShowPatientName(newFormats.includes('patientName'));
                  setShowPatientReference(newFormats.includes('patientReference'));
                  setShowSystemId(newFormats.includes('systemId'));
                }}
                aria-label="display options"
                size="small"
              >
                <ToggleButton value="patientName" aria-label="show patient name">
                  <PersonIcon />
                </ToggleButton>
                <ToggleButton value="patientReference" aria-label="show patient reference">
                  <CodeIcon />
                </ToggleButton>
                <ToggleButton value="systemId" aria-label="show system id">
                  <BadgeIcon />
                </ToggleButton>
              </ToggleButtonGroup>

              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddClinicalImpression}
              >
                Add Clinical Impression
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <TextField
              id="clinicalImpressionSearchInput"
              fullWidth
              placeholder="Search clinical impressions by ID, description, summary, status, or patient..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              variant="outlined"
              size="small"
            />
          </Grid>
        </Grid>
      </Box>
    );
  }

  let layoutContent;
  if (data.clinicalImpressions.length > 0) {
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
        <ClinicalImpressionsTable
          id='clinicalImpressionsTable'
          clinicalImpressions={data.clinicalImpressions}
          count={data.clinicalImpressions.length}
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()}
          hidePatientName={!showPatientName}
          hidePatientReference={!showPatientReference}
          hideBarcode={!showSystemId}
          order={sortOrder}
          onRowClick={function(clinicalImpressionId) {
            console.log('ClinicalImpressionsPage.onRowClick', clinicalImpressionId);
            navigate('/clinical-impressions/' + clinicalImpressionId);
          }}
          onSetPage={function(index) {
            Session.set('ClinicalImpressionsTable.clinicalImpressionsIndex', index);
          }}
          page={data.clinicalImpressionsIndex}
        />
      </CardContent>
    </Card>;
  } else {
    layoutContent = <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        textAlign: 'center'
      }}
    >
      <Card
        className="no-data-card"
        sx={{
          maxWidth: '600px',
          width: '100%',
          borderRadius: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}
      >
        <CardContent sx={{ p: 6 }}>
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 500,
                color: 'text.primary',
                mb: 2
              }}
            >
              {get(Meteor, 'settings.public.defaults.noData.defaultTitle', "No Data Available")}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                lineHeight: 1.7,
                maxWidth: '480px',
                mx: 'auto'
              }}
            >
              {get(Meteor, 'settings.public.defaults.noData.defaultMessage', "No clinical impression records were found. You can create a new clinical impression to document clinical assessments for this patient.")}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddClinicalImpression}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              py: 1,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2
              }
            }}
          >
            Add Your First Clinical Impression
          </Button>
        </CardContent>
      </Card>
    </Box>;
  }

  return (
    <Box
      id="clinicalImpressionsPage"
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      {renderHeader()}
      {layoutContent}
    </Box>
  );
}

export default ClinicalImpressionsPage;
