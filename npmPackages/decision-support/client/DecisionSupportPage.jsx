// npmPackages/decision-support/client/DecisionSupportPage.jsx
//
// DSI console (§ 170.315(b)(11)): Catalog (author/select interventions),
// Firing Log (GuidanceResponse/DetectedIssue), Feedback (capture + computable
// export).

import React, { useState } from 'react';
import {
  Container, Card, CardHeader, CardContent, Box, Tabs, Tab, Button, Switch,
  Table, TableHead, TableBody, TableRow, TableCell, Chip, Typography, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';

import FeedbackDialog from './components/FeedbackDialog.jsx';
import { DecisionSupportFeedback } from '../lib/collections.js';
import { getSourceAttributes, getCriteria } from '../lib/DsiModel.js';

function col(name) { return get(Meteor, 'Collections.' + name); }

function DecisionSupportPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [feedbackFor, setFeedbackFor] = useState(null);
  const [exportText, setExportText] = useState(null);
  const [notice, setNotice] = useState(null);

  const patientId = useTracker(function() { return Session.get('selectedPatientId'); }, []);

  const interventions = useTracker(function() {
    Meteor.subscribe('decisionSupport.interventions');
    const PlanDefinitions = col('PlanDefinitions');
    return PlanDefinitions ? PlanDefinitions.find({ 'type.coding.code': 'eca-rule' }).fetch() : [];
  }, []);

  const firings = useTracker(function() {
    Meteor.subscribe('decisionSupport.firings', patientId || undefined);
    const DetectedIssues = col('DetectedIssues');
    if (!DetectedIssues) return [];
    const selector = patientId ? { 'patient.reference': 'Patient/' + patientId } : {};
    return DetectedIssues.find(selector, { sort: { identifiedDateTime: -1 } }).fetch();
  }, [patientId]);

  const feedback = useTracker(function() {
    Meteor.subscribe('decisionSupport.feedback', patientId || undefined);
    const selector = patientId ? { patientId: patientId } : {};
    return DecisionSupportFeedback.find(selector, { sort: { date: -1 } }).fetch();
  }, [patientId]);

  function setStatus(id, status) {
    Meteor.call('decisionSupport.setInterventionStatus', id, status, function(err) {
      if (err) setNotice(get(err, 'reason', err.message));
    });
  }
  function seed() {
    Meteor.call('decisionSupport.seedSampleInterventions', function(err, res) {
      setNotice(err ? get(err, 'reason', err.message) : ('Seeded ' + get(res, 'inserted', 0) + ' sample intervention(s).'));
    });
  }
  function openFeedback(di) {
    setFeedbackFor({
      interventionId: String(get(di, 'reference', '')).replace('PlanDefinition/', ''),
      title: get(di, 'code.text', 'Decision support'),
      serviceRequestId: String(get(di, 'implicated.0.reference', '')).replace('ServiceRequest/', ''),
      patientId: String(get(di, 'patient.reference', '')).replace('Patient/', '')
    });
  }
  function exportFeedback() {
    Meteor.call('decisionSupport.exportFeedback', patientId ? { patientId: patientId } : {}, function(err, res) {
      if (err) setNotice(get(err, 'reason', err.message));
      else setExportText(get(res, 'ndjson', '') || '(no feedback records)');
    });
  }

  return (
    <Container id="decisionSupportPage" maxWidth="lg" sx={{ py: 4 }}>
      <Card sx={{ mb: 3, bgcolor: 'background.paper' }}>
        <CardHeader
          avatar={<LightbulbIcon />}
          title="Decision Support"
          subheader="Decision Support Interventions · § 170.315(b)(11)"
          sx={{
            bgcolor: 'primary.main', color: 'primary.contrastText',
            '& .MuiCardHeader-subheader': { color: 'primary.contrastText' },
            '& .MuiCardHeader-avatar': { color: 'primary.contrastText' }
          }}
        />
      </Card>

      {notice ? <Alert severity="info" sx={{ mb: 2 }} onClose={function() { setNotice(null); }}>{notice}</Alert> : null}

      <Tabs value={tab} onChange={function(e, v) { setTab(v); }} sx={{ mb: 2 }}>
        <Tab label={'Catalog (' + interventions.length + ')'} />
        <Tab label={'Firing Log (' + firings.length + ')'} />
        <Tab label={'Feedback (' + feedback.length + ')'} />
      </Tabs>

      {/* CATALOG */}
      {tab === 0 ? (
        <Card sx={{ bgcolor: 'background.paper' }}>
          <CardHeader
            title="Intervention Catalog"
            action={
              <Box sx={{ display: 'flex', gap: 1, pr: 1, pt: 1 }}>
                <Button onClick={seed}>Seed samples</Button>
                <Button variant="contained" startIcon={<AddIcon />} onClick={function() { navigate('/decision-support/interventions/new'); }}>
                  New
                </Button>
              </Box>
            }
          />
          <CardContent>
            {interventions.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No interventions yet. Use "Seed samples" or "New".</Typography>
            ) : (
              <Table id="decisionSupportCatalogTable" size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Active</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Data categories</TableCell>
                    <TableCell>Source attributes used</TableCell>
                    <TableCell>Trigger</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {interventions.map(function(dsi) {
                    const sa = getSourceAttributes(dsi);
                    const crit = getCriteria(dsi);
                    const active = get(dsi, 'status') === 'active';
                    return (
                      <TableRow key={get(dsi, '_id')} hover>
                        <TableCell>
                          <Switch
                            id={'dsi-active-' + get(dsi, '_id')}
                            checked={active}
                            onChange={function() { setStatus(get(dsi, '_id'), active ? 'retired' : 'active'); }}
                          />
                        </TableCell>
                        <TableCell><Typography variant="body2" color="text.primary">{get(dsi, 'title')}</Typography></TableCell>
                        <TableCell>{(sa.usesDataCategories || []).join(', ') || '—'}</TableCell>
                        <TableCell>
                          {(sa.usesSourceAttributes || []).length
                            ? sa.usesSourceAttributes.map(function(k) { return <Chip key={k} size="small" label={k} sx={{ mr: 0.5 }} />; })
                            : <Typography variant="caption" color="text.secondary">none</Typography>}
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {get(crit, 'trigger.categories', []).join(',') || 'any'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Button size="small" onClick={function() { navigate('/decision-support/interventions/' + get(dsi, '_id')); }}>Edit</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* FIRING LOG */}
      {tab === 1 ? (
        <Card sx={{ bgcolor: 'background.paper' }}>
          <CardHeader title="Firing Log" subheader={patientId ? 'Selected patient' : 'All patients'} />
          <CardContent>
            {firings.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No decision-support firings recorded.</Typography>
            ) : (
              <Table id="decisionSupportFiringTable" size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>When</TableCell>
                    <TableCell>Intervention</TableCell>
                    <TableCell>Detail</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {firings.map(function(di) {
                    return (
                      <TableRow key={get(di, '_id')} hover>
                        <TableCell>{String(get(di, 'identifiedDateTime', '')).slice(0, 19).replace('T', ' ')}</TableCell>
                        <TableCell>{get(di, 'code.text', '—')}</TableCell>
                        <TableCell><Typography variant="body2" color="text.primary">{get(di, 'detail', '')}</Typography></TableCell>
                        <TableCell><Chip size="small" label={get(di, 'severity', 'moderate')} color="warning" variant="outlined" /></TableCell>
                        <TableCell align="right"><Button size="small" onClick={function() { openFeedback(di); }}>Feedback</Button></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* FEEDBACK */}
      {tab === 2 ? (
        <Card sx={{ bgcolor: 'background.paper' }}>
          <CardHeader
            title="Feedback"
            action={<Button sx={{ mt: 1, mr: 1 }} variant="outlined" onClick={exportFeedback}>Export (computable)</Button>}
          />
          <CardContent>
            {feedback.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No feedback captured yet.</Typography>
            ) : (
              <Table id="decisionSupportFeedbackTable" size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Intervention</TableCell>
                    <TableCell>Action taken</TableCell>
                    <TableCell>Feedback</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Location</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {feedback.map(function(f) {
                    return (
                      <TableRow key={get(f, '_id')} hover>
                        <TableCell>{String(get(f, 'date', '')).slice(0, 19).replace('T', ' ')}</TableCell>
                        <TableCell>{get(f, 'interventionTitle', get(f, 'interventionId'))}</TableCell>
                        <TableCell>{get(f, 'actionTaken')}</TableCell>
                        <TableCell>{get(f, 'userFeedback')}</TableCell>
                        <TableCell>{get(f, 'userId')}</TableCell>
                        <TableCell>{get(f, 'location')}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : null}

      <FeedbackDialog
        open={!!feedbackFor}
        firing={feedbackFor}
        onClose={function() { setFeedbackFor(null); }}
      />

      <Dialog open={!!exportText} onClose={function() { setExportText(null); }} fullWidth maxWidth="md">
        <DialogTitle>Feedback export (NDJSON)</DialogTitle>
        <DialogContent>
          <Box component="pre" sx={{ p: 2, bgcolor: 'background.default', color: 'text.primary', borderRadius: 1, overflow: 'auto', fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
            {exportText}
          </Box>
        </DialogContent>
        <DialogActions><Button onClick={function() { setExportText(null); }}>Close</Button></DialogActions>
      </Dialog>
    </Container>
  );
}

export default DecisionSupportPage;
