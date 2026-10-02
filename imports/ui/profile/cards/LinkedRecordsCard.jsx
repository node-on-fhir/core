// imports/ui/profile/cards/LinkedRecordsCard.jsx
//
// Nocturne dense-row version of the Patient.link management panel. Same server
// contract as PatientLinkPanel (patientLinks.getLinkedSet/searchCandidates,
// patients.link/unlink) — that component stays untouched for its other
// consumers; this one renders the handoff's row grid + add-row pattern.

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, TextField, Button, IconButton, CircularProgress,
  List, ListItem, ListItemText
} from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import CheckIcon from '@mui/icons-material/Check';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';

import ProfileBarcode from '../ProfileBarcode.jsx';
import { ProfileCardHeader, AddRow, AccentChip, NeutralChip, ConfirmDialog } from '../ProfilePrimitives.jsx';

const log = (Meteor.Logger ? Meteor.Logger.for('LinkedRecordsCard') : console);

// Lazy feature-detect patient-matching (never at module scope).
function getPatientMatching() {
  const registry = (typeof Package !== 'undefined' && Package)
    || (typeof globalThis !== 'undefined' ? globalThis.Package : null);
  if (!registry) { return null; }
  return registry['@node-on-fhir/patient-matching'] || null;
}

export default function LinkedRecordsCard({ onMembersChange }) {
  const [loading, setLoading] = useState(true);
  const [primaryPatientId, setPrimaryPatientId] = useState(null);
  const [members, setMembers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [linkingId, setLinkingId] = useState(null);
  const [unlinkTarget, setUnlinkTarget] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  const loadSet = useCallback(async function() {
    setLoading(true);
    try {
      const result = await Meteor.rpc('patientLinks.getLinkedSet', {});
      const loadedMembers = get(result, 'members', []) || [];
      setPrimaryPatientId(get(result, 'primaryPatientId', null));
      setMembers(loadedMembers);
      if (onMembersChange) { onMembersChange(loadedMembers, get(result, 'primaryPatientId', null)); }
    } catch (err) {
      log.debug('getLinkedSet failed', { message: get(err, 'message') });
      setMembers([]);
      if (onMembersChange) { onMembersChange([], null); }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(function() { loadSet(); }, [loadSet]);

  // Debounced candidate search
  useEffect(function() {
    const text = searchText.trim();
    if (text.length < 2) { setCandidates([]); return undefined; }
    let cancelled = false;
    setSearching(true);
    const handle = setTimeout(function() {
      Meteor.rpc('patientLinks.searchCandidates', { searchText: text, limit: 10 })
        .then(function(rows) { if (!cancelled) { setCandidates(Array.isArray(rows) ? rows : []); } })
        .catch(function() { if (!cancelled) { setCandidates([]); } })
        .finally(function() { if (!cancelled) { setSearching(false); } });
    }, 350);
    return function() { cancelled = true; clearTimeout(handle); };
  }, [searchText]);

  // Suggested matches (feature-detected, same approach as PatientLinkPanel)
  const loadSuggestions = useCallback(async function() {
    const matching = getPatientMatching();
    if (!matching || !get(matching, 'MatchingAlgorithm.calculateMatchScore') || !primaryPatientId) {
      setSuggestions([]);
      return;
    }
    try {
      const primaryDoc = await Meteor.rpc('patients.findOne', { patientId: primaryPatientId });
      const name = get(primaryDoc, 'name[0].family') || get(primaryDoc, 'name[0].text') || get(primaryDoc, 'name[0].given[0]', '');
      if (!name || String(name).trim().length < 2) { setSuggestions([]); return; }
      const pool = await Meteor.rpc('patientLinks.searchCandidates', { searchText: String(name).trim(), limit: 25 });
      const scored = [];
      (Array.isArray(pool) ? pool : []).forEach(function(candidate) {
        const candidateDoc = {
          name: [{ text: get(candidate, 'display', '') }],
          birthDate: get(candidate, 'birthDate', null),
          gender: get(candidate, 'gender', null)
        };
        const result = matching.MatchingAlgorithm.calculateMatchScore(primaryDoc, candidateDoc);
        const score = get(result, 'score', 0);
        if (score > 0) { scored.push({ candidate: candidate, score: score }); }
      });
      scored.sort(function(a, b) { return b.score - a.score; });
      setSuggestions(scored.slice(0, 5));
    } catch (err) {
      log.debug('loadSuggestions failed', { message: get(err, 'message') });
      setSuggestions([]);
    }
  }, [primaryPatientId]);

  useEffect(function() { loadSuggestions(); }, [loadSuggestions]);

  async function handleLink(candidate) {
    const targetId = get(candidate, '_id');
    if (!targetId || !primaryPatientId) { return; }
    setLinkingId(targetId);
    try {
      await Meteor.rpc('patients.link', { patientIdA: primaryPatientId, patientIdB: targetId, linkType: 'seealso' });
      setSearchText('');
      setCandidates([]);
      await loadSet();
      await loadSuggestions();
    } catch (err) {
      log.debug('patients.link failed', { message: get(err, 'message') });
    } finally {
      setLinkingId(null);
    }
  }

  async function handleConfirmUnlink() {
    const targetId = get(unlinkTarget, '_id');
    if (!targetId || !primaryPatientId) { return; }
    try {
      await Meteor.rpc('patients.unlink', { patientIdA: primaryPatientId, patientIdB: targetId });
      await loadSet();
      await loadSuggestions();
    } catch (err) {
      log.debug('patients.unlink failed', { message: get(err, 'message') });
    }
  }

  const externalMembers = members.filter(function(m) {
    return String(get(m, '_id')) !== String(primaryPatientId);
  });

  const searchBody = (
    <Box sx={{ px: 1.75, pb: 1 }}>
      <TextField
        id="linkRecordSearchInput"
        fullWidth
        size="small"
        placeholder="Search patients by name"
        value={searchText}
        onChange={function(e) { setSearchText(e.target.value); }}
        InputProps={{ endAdornment: searching ? <CircularProgress size={16} /> : null }}
        sx={{ mb: 1 }}
      />
      {candidates.length > 0 && (
        <List id="linkCandidatesList" dense disablePadding>
          {candidates.map(function(candidate) {
            const candidateId = get(candidate, '_id');
            return (
              <ListItem
                key={candidateId}
                className="pf-row"
                secondaryAction={
                  <Button
                    id={'linkCandidateButton-' + candidateId}
                    size="small"
                    variant="outlined"
                    startIcon={linkingId === candidateId ? <CircularProgress size={14} color="inherit" /> : <PersonAddIcon sx={{ fontSize: 14 }} />}
                    disabled={linkingId === candidateId}
                    onClick={function() { handleLink(candidate); }}
                    sx={{ fontSize: 11, borderRadius: '8px' }}
                  >
                    Link
                  </Button>
                }
              >
                <ListItemText
                  primary={<Typography sx={{ fontSize: 13, color: 'var(--pf-ink)' }}>{get(candidate, 'display', 'Unknown')}</Typography>}
                  secondary={<Typography sx={{ fontSize: 12, color: 'var(--pf-ink-dim)' }}>{[get(candidate, 'gender'), get(candidate, 'birthDate')].filter(Boolean).join(' · ')}</Typography>}
                />
              </ListItem>
            );
          })}
        </List>
      )}
      {suggestions.length > 0 && (
        <>
          <Typography className="pf-kicker" sx={{ mt: 1, mb: 0.5, display: 'block' }}>Suggested matches</Typography>
          <List id="suggestedMatchesList" dense disablePadding>
            {suggestions.map(function(suggestion) {
              const candidate = get(suggestion, 'candidate', {});
              const candidateId = get(candidate, '_id');
              const pct = Math.round(get(suggestion, 'score', 0) * 100);
              return (
                <ListItem
                  key={candidateId}
                  className="pf-row"
                  secondaryAction={
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      {pct >= 90
                        ? <AccentChip icon={<CheckIcon />} label={pct + '% match'} />
                        : <NeutralChip icon={<HelpOutlineIcon />} label={pct + '% match'} />}
                      <Button
                        id={'suggestedLinkButton-' + candidateId}
                        size="small"
                        variant="outlined"
                        disabled={linkingId === candidateId}
                        onClick={function() { handleLink(candidate); }}
                        sx={{ fontSize: 11, borderRadius: '8px' }}
                      >
                        Link
                      </Button>
                    </Box>
                  }
                >
                  <ListItemText primary={<Typography sx={{ fontSize: 13, color: 'var(--pf-ink)' }}>{get(candidate, 'display', 'Unknown')}</Typography>} />
                </ListItem>
              );
            })}
          </List>
        </>
      )}
    </Box>
  );

  // Eligible-but-empty → single add-row, no card frame
  if (!loading && externalMembers.length === 0) {
    return (
      <AddRow
        id="linkedRecordsAddRow"
        icon={<LinkIcon />}
        label="Search patients by name to link another record"
        rightText={suggestions.length > 0 ? `${suggestions.length} suggested match${suggestions.length > 1 ? 'es' : ''} →` : null}
      >
        {searchBody}
      </AddRow>
    );
  }

  return (
    <Box className="pf-card" id="linkedRecordsCard">
      <ProfileCardHeader
        icon={<LinkIcon />}
        title="Linked records"
        kicker={`reassembled across ${members.length} source${members.length === 1 ? '' : 's'}`}
      />
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress size={20} /></Box>
      ) : (
        <Box sx={{ pt: 0.5 }}>
          {externalMembers.map(function(member) {
            const memberId = get(member, '_id');
            const linkTypes = get(member, 'linkTypes', []) || [];
            return (
              <Box
                key={memberId}
                className="pf-row"
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '22px minmax(0, 1fr) 150px 110px 28px',
                  alignItems: 'center',
                  gap: 1,
                  p: '9px 14px',
                  fontSize: 13
                }}
              >
                <LocalHospitalIcon sx={{ fontSize: 16, color: 'var(--pf-ink-mid)' }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 13, color: 'var(--pf-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {get(member, 'display', 'Unknown record')}
                  </Typography>
                  <Typography className="pf-mono" sx={{ color: 'var(--pf-ink-dim)' }}>
                    {[get(member, 'gender'), get(member, 'birthDate')].filter(Boolean).join(' · ') || ' '}
                  </Typography>
                </Box>
                <ProfileBarcode value={memberId} width={140} height={14} color="var(--pf-ink-dim)" />
                <Box>
                  {linkTypes.map(function(t) {
                    return <NeutralChip key={t} label={t} sx={{ mr: 0.5 }} />;
                  })}
                </Box>
                <IconButton
                  id={'unlinkRecordButton-' + memberId}
                  size="small"
                  onClick={function() { setUnlinkTarget(member); }}
                  sx={{ width: 28, height: 28, color: 'var(--pf-ink-mid)', '&:hover': { bgcolor: 'var(--pf-accent-tint)', color: 'var(--pf-accent)' } }}
                >
                  <LinkOffIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            );
          })}
          <Box sx={{ p: '6px 14px 14px' }}>
            <AddRow
              icon={<SearchIcon />}
              label="Search patients by name to link another record"
              rightText={suggestions.length > 0 ? `${suggestions.length} suggested match${suggestions.length > 1 ? 'es' : ''} →` : null}
            >
              {searchBody}
            </AddRow>
          </Box>
        </Box>
      )}

      <ConfirmDialog
        open={!!unlinkTarget}
        title="Unlink record"
        message={`Remove the link to ${get(unlinkTarget, 'display', 'this record')}? This does not delete the record — it only removes it from your linked set.`}
        confirmLabel="Unlink"
        destructive
        onConfirm={handleConfirmUnlink}
        onClose={function() { setUnlinkTarget(null); }}
      />
    </Box>
  );
}
