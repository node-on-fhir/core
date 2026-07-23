// packages/pacio-core/client/pages/PfeAssessmentListPage.jsx
//
// Lists PFE QuestionnaireResponses for the selected patient.
// Allows navigating to capture a new PROMIS-10 assessment or view existing ones.

import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useNavigate } from 'react-router-dom';
import { get } from 'lodash';
import moment from 'moment';

import {
  Container,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import AssessmentIcon from '@mui/icons-material/Assessment';

function PfeAssessmentListPage() {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  const patient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);

  const patientId = useTracker(function() {
    return Session.get('selectedPatientId');
  }, []);

  useEffect(function() {
    if (!patientId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    async function fetchAssessments() {
      try {
        const result = await Meteor.rpc('pacio.pfeAssessment.getAssessments', { patientId: patientId });
        setAssessments(result || []);
      } catch (error) {
        console.error('[PfeAssessmentListPage] Error fetching assessments:', error);
        setAssessments([]);
      }
      setLoading(false);
    }
    fetchAssessments();
  }, [patientId]);

  if (!patient) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="warning">
          No patient selected. Please select a patient from the sidebar.
        </Alert>
      </Container>
    );
  }

  function getStatusColor(status) {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'warning';
      case 'amended': return 'info';
      default: return 'default';
    }
  }

  function getQuestionnaireLabel(questionnaire) {
    if (!questionnaire) return 'Unknown';
    if (questionnaire.includes('61577-3')) return 'PROMIS-10 Global Health';
    if (questionnaire.includes('71130-9')) return 'BIMS';
    if (questionnaire.includes('44249-1')) return 'PHQ-9';
    return questionnaire;
  }

  function handleRowClick(qr) {
    navigate('/pfe-assessment/' + get(qr, '_id'));
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon color="primary" />
          <Typography variant="h5">
            PFE Assessments
          </Typography>
        </Box>
        <Button
          id="startNewAssessmentButton"
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={function() { navigate('/pfe-assessment/new'); }}
        >
          Start New Assessment
        </Button>
      </Box>

      <Card sx={{ bgcolor: 'background.paper' }}>
        <CardHeader
          title="Completed Assessments"
          subheader={get(patient, 'name[0].text', get(patient, 'name[0].family', 'Patient'))}
        />
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : assessments.length === 0 ? (
            <Alert severity="info">
              No PFE assessments found for this patient. Click "Start New Assessment" to begin.
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table id="pfeAssessmentsTable">
                <TableHead>
                  <TableRow>
                    <TableCell>Assessment Type</TableCell>
                    <TableCell>Date Completed</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Items</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assessments.map(function(qr) {
                    return (
                      <TableRow
                        key={get(qr, '_id')}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={function() { handleRowClick(qr); }}
                      >
                        <TableCell>
                          {getQuestionnaireLabel(get(qr, 'questionnaire', ''))}
                        </TableCell>
                        <TableCell>
                          {get(qr, 'authored') ? moment(qr.authored).format('YYYY-MM-DD HH:mm') : '—'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={get(qr, 'status', 'unknown')}
                            color={getStatusColor(get(qr, 'status'))}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {get(qr, 'item', []).length} items
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}

export default PfeAssessmentListPage;
