// imports/ui/components/PatientLinkPanel.jsx
//
// Shared Patient.link management panel (design v2 §C, PR7). Gives Patient.link a
// real read + write UI, closing the write-only gap. Consumed by MyProfilePage
// ("My Linked Records") and any Patient detail page.
//
// Props:
//   patientId  string?  — the record whose set to manage. Omitted → the caller's
//                         own primary set (server resolves it).
//
// Sections:
//   1. Linked records — display name + link-type chips + per-row Unlink (confirm).
//   2. Link a record  — name search (patientLinks.searchCandidates) → pick →
//                       patients.link (seealso).
//   3. Suggested matches — ONLY when @node-on-fhir/patient-matching is present AT
//                          RENDER TIME (feature-detected per the lazy Package
//                          check rule). Scores candidates client-side against the
//                          primary and offers one-click link with a score chip.
//
// All server calls go through Meteor.rpc; every action has a loading state, an
// error Alert, and theme tokens (no hardcoded colors). _id discipline: rows are
// keyed and acted on by MongoDB _id.

import React, { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import LinkIcon from '@mui/icons-material/Link';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';

const log = (Meteor.Logger ? Meteor.Logger.for('PatientLinkPanel') : console);

// Lazy feature-detect the patient-matching package AT CALL TIME (never module
// scope — sibling workflows register into Package after this module loads).
function getPatientMatching() {
  const registry = (typeof Package !== 'undefined' && Package)
    || (typeof globalThis !== 'undefined' ? globalThis.Package : null);
  if (!registry) {
    return null;
  }
  return registry['@node-on-fhir/patient-matching'] || null;
}

function PatientLinkPanel({ patientId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [primaryPatientId, setPrimaryPatientId] = useState(null);
  const [members, setMembers] = useState([]);

  // Link-a-record search state
  const [searchText, setSearchText] = useState('');
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [linkingId, setLinkingId] = useState(null);

  // Unlink confirmation state
  const [unlinkTarget, setUnlinkTarget] = useState(null);
  const [unlinking, setUnlinking] = useState(false);

  // Suggestions state (feature-detected)
  const [suggestions, setSuggestions] = useState([]);
  const [suggestLoading, setSuggestLoading] = useState(false);

  // ── Load the linked set ────────────────────────────────────────────────────
  const loadSet = useCallback(async function() {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (patientId) {
        params.patientId = patientId;
      }
      const result = await Meteor.rpc('patientLinks.getLinkedSet', params);
      setPrimaryPatientId(get(result, 'primaryPatientId', null));
      setMembers(get(result, 'members', []) || []);
    } catch (err) {
      log.debug('getLinkedSet failed', { message: get(err, 'message') });
      setError(get(err, 'reason') || get(err, 'message') || 'Failed to load linked records.');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(function() {
    loadSet();
  }, [loadSet]);

  // ── Candidate search (debounced) ───────────────────────────────────────────
  useEffect(function() {
    const text = searchText.trim();
    if (text.length < 2) {
      setCandidates([]);
      return undefined;
    }
    let cancelled = false;
    setSearching(true);
    const handle = setTimeout(function() {
      Meteor.rpc('patientLinks.searchCandidates', { searchText: text, limit: 10 })
        .then(function(rows) {
          if (!cancelled) {
            setCandidates(Array.isArray(rows) ? rows : []);
          }
        })
        .catch(function(err) {
          if (!cancelled) {
            log.debug('searchCandidates failed', { message: get(err, 'message') });
            setCandidates([]);
          }
        })
        .finally(function() {
          if (!cancelled) {
            setSearching(false);
          }
        });
    }, 350);
    return function() {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [searchText]);

  // ── Link / Unlink actions ──────────────────────────────────────────────────
  async function handleLink(candidate) {
    const targetId = get(candidate, '_id');
    if (!targetId || !primaryPatientId) {
      setError('Cannot link — missing patient reference.');
      return;
    }
    setLinkingId(targetId);
    setError('');
    try {
      await Meteor.rpc('patients.link', {
        patientIdA: primaryPatientId,
        patientIdB: targetId,
        linkType: 'seealso'
      });
      setSearchText('');
      setCandidates([]);
      await loadSet();
      await loadSuggestions();
    } catch (err) {
      log.debug('patients.link failed', { message: get(err, 'message') });
      setError(get(err, 'reason') || get(err, 'message') || 'Failed to link record.');
    } finally {
      setLinkingId(null);
    }
  }

  async function handleConfirmUnlink() {
    const targetId = get(unlinkTarget, '_id');
    if (!targetId || !primaryPatientId) {
      setUnlinkTarget(null);
      return;
    }
    setUnlinking(true);
    setError('');
    try {
      await Meteor.rpc('patients.unlink', {
        patientIdA: primaryPatientId,
        patientIdB: targetId
      });
      setUnlinkTarget(null);
      await loadSet();
      await loadSuggestions();
    } catch (err) {
      log.debug('patients.unlink failed', { message: get(err, 'message') });
      setError(get(err, 'reason') || get(err, 'message') || 'Failed to unlink record.');
    } finally {
      setUnlinking(false);
    }
  }

  // ── Suggested matches (feature-detected) ───────────────────────────────────
  const loadSuggestions = useCallback(async function() {
    const matching = getPatientMatching();
    if (!matching || !get(matching, 'MatchingAlgorithm.calculateMatchScore')) {
      setSuggestions([]);
      return;
    }
    if (!primaryPatientId) {
      setSuggestions([]);
      return;
    }
    setSuggestLoading(true);
    try {
      // Fetch the primary Patient doc + a candidate pool to score against.
      const primaryDoc = await Meteor.rpc('patients.findOne', { patientId: primaryPatientId });
      if (!primaryDoc) {
        setSuggestions([]);
        return;
      }
      // Use the primary's name as a coarse candidate query, then score locally.
      const name = get(primaryDoc, 'name[0].family')
        || get(primaryDoc, 'name[0].text')
        || get(primaryDoc, 'name[0].given[0]', '');
      if (!name || String(name).trim().length < 2) {
        setSuggestions([]);
        return;
      }
      const pool = await Meteor.rpc('patientLinks.searchCandidates', {
        searchText: String(name).trim(),
        limit: 25
      });
      const scored = [];
      const algorithm = matching.MatchingAlgorithm;
      (Array.isArray(pool) ? pool : []).forEach(function(candidate) {
        // searchCandidates returns lean rows; fetch is avoided — score on the
        // lean demographics it carries (birthDate/gender) plus the display name.
        const candidateDoc = {
          name: [{ text: get(candidate, 'display', '') }],
          birthDate: get(candidate, 'birthDate', null),
          gender: get(candidate, 'gender', null)
        };
        const result = algorithm.calculateMatchScore(primaryDoc, candidateDoc);
        const score = get(result, 'score', 0);
        if (score > 0) {
          scored.push({ candidate: candidate, score: score });
        }
      });
      scored.sort(function(a, b) { return b.score - a.score; });
      setSuggestions(scored.slice(0, 5));
    } catch (err) {
      log.debug('loadSuggestions failed', { message: get(err, 'message') });
      setSuggestions([]);
    } finally {
      setSuggestLoading(false);
    }
  }, [primaryPatientId]);

  useEffect(function() {
    loadSuggestions();
  }, [loadSuggestions]);

  const matchingAvailable = !!getPatientMatching();

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Card sx={{ borderColor: 'divider' }} variant="outlined">
      <CardHeader
        avatar={<LinkIcon color="primary" />}
        title="My Linked Records"
        subheader="Patient records reassembled across hospitals and imports"
      />
      <CardContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={function() { setError(''); }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Section 1: linked records */}
            {members.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                No linked records yet. Link records below to reassemble your identity
                across hospitals.
              </Alert>
            ) : (
              <List id="linkedRecordsList" dense>
                {members.map(function(member) {
                  const memberId = get(member, '_id');
                  const isPrimary = String(memberId) === String(primaryPatientId);
                  const linkTypes = get(member, 'linkTypes', []) || [];
                  return (
                    <ListItem
                      key={memberId}
                      divider
                      secondaryAction={
                        isPrimary ? null : (
                          <IconButton
                            id={'unlinkRecordButton-' + memberId}
                            edge="end"
                            aria-label="Unlink record"
                            color="error"
                            onClick={function() { setUnlinkTarget(member); }}
                          >
                            <LinkOffIcon />
                          </IconButton>
                        )
                      }
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="body1">{get(member, 'display', 'Unknown')}</Typography>
                            {isPrimary && (
                              <Chip size="small" label="Primary" color="primary" variant="outlined" />
                            )}
                            {linkTypes.map(function(t) {
                              return <Chip key={t} size="small" label={t} variant="outlined" />;
                            })}
                          </Box>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Section 2: link a record */}
            <Typography variant="subtitle2" gutterBottom>
              Link a record
            </Typography>
            <TextField
              id="linkRecordSearchInput"
              fullWidth
              size="small"
              label="Search patients by name"
              value={searchText}
              onChange={function(e) { setSearchText(e.target.value); }}
              sx={{ mb: 1 }}
              InputProps={{
                endAdornment: searching ? <CircularProgress size={18} /> : null
              }}
            />
            {candidates.length > 0 && (
              <List id="linkCandidatesList" dense>
                {candidates.map(function(candidate) {
                  const candidateId = get(candidate, '_id');
                  return (
                    <ListItem
                      key={candidateId}
                      divider
                      secondaryAction={
                        <Button
                          id={'linkCandidateButton-' + candidateId}
                          size="small"
                          variant="outlined"
                          startIcon={
                            linkingId === candidateId
                              ? <CircularProgress size={16} color="inherit" />
                              : <PersonAddIcon />
                          }
                          disabled={linkingId === candidateId}
                          onClick={function() { handleLink(candidate); }}
                        >
                          Link
                        </Button>
                      }
                    >
                      <ListItemText
                        primary={get(candidate, 'display', 'Unknown')}
                        secondary={[get(candidate, 'gender'), get(candidate, 'birthDate')]
                          .filter(Boolean).join(' · ')}
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}
            {searchText.trim().length >= 2 && !searching && candidates.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No matching records found (records already in your set are excluded).
              </Typography>
            )}

            {/* Section 3: suggested matches (feature-detected) */}
            {matchingAvailable && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Suggested matches
                </Typography>
                {suggestLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : suggestions.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No suggested matches found.
                  </Typography>
                ) : (
                  <List id="suggestedMatchesList" dense>
                    {suggestions.map(function(suggestion) {
                      const candidate = get(suggestion, 'candidate', {});
                      const candidateId = get(candidate, '_id');
                      const pct = Math.round(get(suggestion, 'score', 0) * 100);
                      return (
                        <ListItem
                          key={candidateId}
                          divider
                          secondaryAction={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip
                                size="small"
                                label={pct + '% match'}
                                color={pct >= 85 ? 'success' : 'default'}
                                variant="outlined"
                              />
                              <Button
                                id={'suggestedLinkButton-' + candidateId}
                                size="small"
                                variant="outlined"
                                startIcon={
                                  linkingId === candidateId
                                    ? <CircularProgress size={16} color="inherit" />
                                    : <PersonAddIcon />
                                }
                                disabled={linkingId === candidateId}
                                onClick={function() { handleLink(candidate); }}
                              >
                                Link
                              </Button>
                            </Stack>
                          }
                        >
                          <ListItemText primary={get(candidate, 'display', 'Unknown')} />
                        </ListItem>
                      );
                    })}
                  </List>
                )}
              </>
            )}
          </>
        )}
      </CardContent>

      {/* Unlink confirmation dialog */}
      <Dialog open={!!unlinkTarget} onClose={function() { setUnlinkTarget(null); }}>
        <DialogTitle>Unlink record</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Remove the link to <strong>{get(unlinkTarget, 'display', 'this record')}</strong>?
            This does not delete the record — it only removes it from your linked set.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            id="cancelUnlinkButton"
            onClick={function() { setUnlinkTarget(null); }}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            id="confirmUnlinkButton"
            onClick={handleConfirmUnlink}
            color="error"
            variant="contained"
            disabled={unlinking}
          >
            {unlinking ? 'Unlinking…' : 'Unlink'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

export default PatientLinkPanel;
