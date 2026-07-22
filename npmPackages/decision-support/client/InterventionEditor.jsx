// npmPackages/decision-support/client/InterventionEditor.jsx
//
// Author / edit an evidence-based DSI (§ 170.315(b)(11)). Captures the plain-
// language source attributes (iv)(A), the USCDI data categories it uses, the
// demographic/SDOH categories it uses (constrained to the allowed policy), and
// the JSON criteria (lib/criteria.js).

import React, { useState, useEffect } from 'react';
import {
  Container, Card, CardHeader, CardContent, Grid, TextField, MenuItem,
  FormGroup, FormControlLabel, Checkbox, Button, Box, Alert, Typography, Tooltip
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';

import { getCriteria } from '../lib/DsiModel.js';
import {
  SOURCE_ATTRIBUTE_KEYS, SOURCE_ATTRIBUTE_LABELS, DSI_DATA_CATEGORIES
} from '../lib/sourceAttributes.js';

function col(name) { return get(Meteor, 'Collections.' + name); }

function extMap(dsi) {
  const ext = get(dsi, 'extension', []).find(function(e) { return get(e, 'url', '').indexOf('dsi-source-attributes') > -1; });
  const map = {};
  get(ext, 'extension', []).forEach(function(e) { map[get(e, 'url')] = get(e, 'valueString', ''); });
  return map;
}
function csv(v) { return String(v || '').split(',').map(function(s) { return s.trim(); }).filter(Boolean); }

const BLANK = {
  title: '', description: '', status: 'draft',
  developer: '', publisher: '', fundingSource: '',
  bibliographicCitation: '', citationUrl: '', releaseDate: '', revisionDate: '',
  usesDataCategories: [], usesSourceAttributes: [],
  criteria: JSON.stringify({ trigger: { categories: ['imaging'] }, conditions: [] }, null, 2),
  actionMessage: ''
};

function InterventionEditor() {
  const navigate = useNavigate();
  const params = useParams();
  const isNew = !params.id || params.id === 'new';

  const [form, setForm] = useState(BLANK);
  const [policy, setPolicy] = useState({});
  const [error, setError] = useState(null);

  useEffect(function() {
    (async function() {
      try {
        const res = await Meteor.rpc('decisionSupport.getSourceAttributePolicy');
        setPolicy(get(res, 'sourceAttributes', {}));
      } catch (err) { /* leave policy default on failure */ }
    })();
  }, []);

  const existing = useTracker(function() {
    if (isNew) return null;
    Meteor.subscribe('decisionSupport.interventions');
    const PlanDefinitions = col('PlanDefinitions');
    return PlanDefinitions ? PlanDefinitions.findOne({ _id: params.id }) : null;
  }, [params.id]);

  useEffect(function() {
    if (!existing) return;
    const ext = extMap(existing);
    const citationArtifact = get(existing, 'relatedArtifact', []).find(function(a) { return get(a, 'type') === 'citation'; });
    setForm({
      title: get(existing, 'title', ''),
      description: get(existing, 'description', ''),
      status: get(existing, 'status', 'draft'),
      developer: get(ext, 'developer', ''),
      publisher: get(existing, 'publisher', ''),
      fundingSource: get(ext, 'fundingSource', ''),
      bibliographicCitation: get(ext, 'bibliographicCitation', get(citationArtifact, 'citation', '')),
      citationUrl: get(citationArtifact, 'document.url', ''),
      releaseDate: get(existing, 'approvalDate', ''),
      revisionDate: get(existing, 'lastReviewDate', ''),
      usesDataCategories: csv(get(ext, 'usesDataCategories')),
      usesSourceAttributes: csv(get(ext, 'usesSourceAttributes')),
      criteria: JSON.stringify(getCriteria(existing), null, 2),
      actionMessage: get(existing, 'action.0.dynamicValue.0.expression.expression', '')
    });
  }, [existing]);

  function setField(key, value) { setForm(function(p) { return Object.assign({}, p, { [key]: value }); }); }
  function toggleArray(key, value) {
    setForm(function(p) {
      const arr = p[key].slice();
      const idx = arr.indexOf(value);
      if (idx > -1) arr.splice(idx, 1); else arr.push(value);
      return Object.assign({}, p, { [key]: arr });
    });
  }

  async function handleSave() {
    setError(null);
    let criteria;
    try { criteria = JSON.parse(form.criteria); }
    catch (e) { setError('Criteria is not valid JSON: ' + e.message); return; }

    const disallowed = form.usesSourceAttributes.filter(function(k) { return policy[k] === false; });
    if (disallowed.length) {
      setError('These source attributes are not allowed by the current policy: ' + disallowed.join(', '));
      return;
    }

    const input = {
      id: isNew ? undefined : params.id,
      title: form.title, description: form.description, status: form.status,
      developer: form.developer, publisher: form.publisher, fundingSource: form.fundingSource,
      bibliographicCitation: form.bibliographicCitation, citationUrl: form.citationUrl,
      releaseDate: form.releaseDate, revisionDate: form.revisionDate,
      usesDataCategories: form.usesDataCategories, usesSourceAttributes: form.usesSourceAttributes,
      criteria: criteria,
      action: { title: form.title, message: form.actionMessage }
    };
    try {
      await Meteor.rpc('decisionSupport.upsertIntervention', { input: input });
      navigate('/decision-support');
    } catch (err) {
      setError(get(err, 'reason', err.message));
    }
  }

  return (
    <Container id="decisionSupportInterventionEditor" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ bgcolor: 'background.paper' }}>
        <CardHeader title={isNew ? 'New Decision Support Intervention' : 'Edit Intervention'}
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }} />
        <CardContent>
          {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField fullWidth size="small" label="Title" value={form.title}
                onChange={function(e) { setField('title', e.target.value); }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField select fullWidth size="small" label="Status" value={form.status}
                onChange={function(e) { setField('status', e.target.value); }}>
                <MenuItem value="draft">draft</MenuItem>
                <MenuItem value="active">active (selected)</MenuItem>
                <MenuItem value="retired">retired</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Description" value={form.description}
                onChange={function(e) { setField('description', e.target.value); }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" multiline minRows={2} label="Alert message"
                value={form.actionMessage} onChange={function(e) { setField('actionMessage', e.target.value); }} />
            </Grid>

            <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Source attributes (§ (iv)(A))</Typography></Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Bibliographic citation" value={form.bibliographicCitation}
                onChange={function(e) { setField('bibliographicCitation', e.target.value); }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Citation URL" value={form.citationUrl}
                onChange={function(e) { setField('citationUrl', e.target.value); }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Developer of intervention" value={form.developer}
                onChange={function(e) { setField('developer', e.target.value); }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Funding source" value={form.fundingSource}
                onChange={function(e) { setField('fundingSource', e.target.value); }} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" label="Release date" placeholder="YYYY-MM-DD" value={form.releaseDate}
                onChange={function(e) { setField('releaseDate', e.target.value); }} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" label="Revision date" placeholder="YYYY-MM-DD" value={form.revisionDate}
                onChange={function(e) { setField('revisionDate', e.target.value); }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">USCDI data categories used</Typography>
              <FormGroup>
                {DSI_DATA_CATEGORIES.map(function(cat) {
                  return (
                    <FormControlLabel key={cat}
                      control={<Checkbox size="small" checked={form.usesDataCategories.indexOf(cat) > -1}
                        onChange={function() { toggleArray('usesDataCategories', cat); }} />}
                      label={<Typography variant="body2" color="text.primary">{cat}</Typography>} />
                  );
                })}
              </FormGroup>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">Demographic / SDOH used (disabled = not allowed by policy)</Typography>
              <FormGroup>
                {SOURCE_ATTRIBUTE_KEYS.map(function(key) {
                  const allowed = policy[key] !== false;
                  const control = (
                    <FormControlLabel key={key} disabled={!allowed}
                      control={<Checkbox size="small" checked={form.usesSourceAttributes.indexOf(key) > -1}
                        onChange={function() { toggleArray('usesSourceAttributes', key); }} />}
                      label={<Typography variant="body2" color={allowed ? 'text.primary' : 'text.disabled'}>{SOURCE_ATTRIBUTE_LABELS[key]}</Typography>} />
                  );
                  return allowed ? control : <Tooltip key={key} title="Not allowed by deployment policy"><span>{control}</span></Tooltip>;
                })}
              </FormGroup>
            </Grid>

            <Grid item xs={12}>
              <TextField fullWidth size="small" multiline minRows={6} label="Criteria (JSON — see lib/criteria.js)"
                value={form.criteria} onChange={function(e) { setField('criteria', e.target.value); }}
                sx={{ fontFamily: 'monospace' }} />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
            <Button onClick={function() { navigate('/decision-support'); }}>Cancel</Button>
            <Button id="dsi-save-intervention" variant="contained" onClick={handleSave}>Save</Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}

export default InterventionEditor;
