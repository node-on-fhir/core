// npmPackages/implantable-devices/client/add-a-device/AddADevicePage.jsx
//
// /add-a-device — guided device-linking flow (design handoff screen 2a).
// Three source branches (device in hand / app or export / brochure or name),
// a live "Will be saved as" summary rail, and an inline confirmation pane.
// State lives here; branches are presentational. Server work is a single
// implantableDevices.linkDevice call (Device + DeviceUseStatement + optional
// Consent/Procedure).

import React, { useMemo, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { Box, Alert, Button } from '@mui/material';
import { get } from 'lodash';

import { buildProfileVars } from '/imports/ui/profile/profileVars.js';

import { parseGs1, normalizeScanToHrf } from '../../lib/udi.js';
import { findCatalogEntryByDi, findCatalogEntryById, searchCatalog } from '../../lib/deviceCatalog.js';
import { findService } from '../../lib/services.js';
import { isScanCapableDevice } from '../../lib/scanCapability.js';

import { ADD_DEVICE_STATIC_CSS, BTN_PRIMARY_SX } from './addDeviceStyles.js';
import LeftRail from './LeftRail.jsx';
import BranchDeviceInHand from './BranchDeviceInHand.jsx';
import BranchAppExport from './BranchAppExport.jsx';
import BranchCatalogSearch from './BranchCatalogSearch.jsx';
import ConfirmationPane from './ConfirmationPane.jsx';

const log = (Meteor.Logger ? Meteor.Logger.for('add-a-device') : console);

const EMPTY_OPTIONAL = { serial: '', implantDate: '', bodySite: '', managingClinic: '', inUseSince: '' };
const EMPTY_MANUAL = { make: '', model: '', kind: 'Not sure' };

function AddADevicePage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const scanCapable = useMemo(isScanCapableDevice, []);

  // ── Patient identity (self-linking first; selected patient as fallback) ──
  const { patientId, patientDisplay } = useTracker(function() {
    const user = Meteor.user();
    const linkedPatientId = get(user, 'patientId');
    if (linkedPatientId) {
      return {
        patientId: linkedPatientId,
        patientDisplay: get(user, 'profile.name.text', get(user, 'username', ''))
      };
    }
    const selected = Session.get('selectedPatient');
    return {
      patientId: Session.get('selectedPatientId') || '',
      patientDisplay: get(selected, 'name.0.text',
        (get(selected, 'name.0.given.0', '') + ' ' + get(selected, 'name.0.family', '')).trim())
    };
  }, []);

  // ── Flow state ───────────────────────────────────────────────────────────
  const [src, setSrc] = useState('app');
  const [mode, setMode] = useState(scanCapable ? 'scan' : 'type');
  const [udi, setUdi] = useState('');
  const [pick, setPick] = useState(null);
  const [app, setApp] = useState(null);
  const [appDeviceName, setAppDeviceName] = useState('');
  const [query, setQuery] = useState('');
  const [manual, setManual] = useState(false);
  const [manualFields, setManualFields] = useState(EMPTY_MANUAL);
  const [optional, setOptional] = useState(EMPTY_OPTIONAL);
  const [streamOverride, setStreamOverride] = useState(null);  // null = defaults
  const [consent, setConsent] = useState(true);
  const [done, setDone] = useState(null);  // { variant, deviceId, consentId }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // ── Derivations ──────────────────────────────────────────────────────────
  const parsed = useMemo(function() { return parseGs1(udi); }, [udi]);
  const matchA = useMemo(function() { return findCatalogEntryByDi(parsed.di); }, [parsed.di]);
  const pickedEntry = useMemo(function() { return findCatalogEntryById(pick); }, [pick]);
  const results = useMemo(function() { return searchCatalog(query); }, [query]);
  const service = useMemo(function() { return findService(app); }, [app]);

  const availableStreams =
    src === 'device' ? get(matchA, 'device.streams', [])
      : src === 'app' ? get(service, 'streams', [])
        : get(pickedEntry, 'device.streams', []);
  const selectedStreams = streamOverride === null ? availableStreams : streamOverride;

  function toggleStream(stream) {
    const current = selectedStreams.slice();
    const index = current.indexOf(stream);
    if (index === -1) { current.push(stream); } else { current.splice(index, 1); }
    setStreamOverride(current);
  }

  const summary = useMemo(function() {
    if (done) {
      const status = done.variant === 'incomplete' ? 'incomplete'
        : (done.variant === 'linked' ? 'active' : 'awaiting data');
      return { name: done.name, sub: done.sub, udiShort: done.udiShort, status: status, live: done.variant === 'linked' };
    }
    if (src === 'device') {
      if (matchA) {
        return {
          name: matchA.device.name,
          sub: matchA.device.manufacturer + ' · ' + matchA.device.model,
          udiShort: parsed.di,
          status: 'ready to link',
          live: true
        };
      }
      return { name: udi.trim() ? 'Unknown device' : '', sub: '', udiShort: parsed.di, status: 'draft', live: false };
    }
    if (src === 'app') {
      if (service) {
        return {
          name: appDeviceName || service.device || 'Consumer device',
          sub: 'via ' + service.name,
          udiShort: 'n/a — consumer device',
          status: 'awaiting data',
          live: false
        };
      }
      return { name: '', sub: '', udiShort: 'n/a — consumer device', status: 'draft', live: false };
    }
    // paper
    if (pickedEntry) {
      return {
        name: pickedEntry.device.name,
        sub: pickedEntry.device.manufacturer + ' · ' + pickedEntry.device.model,
        udiShort: 'add later',
        status: 'ready to link',
        live: false
      };
    }
    if (manual && manualFields.make.trim() && manualFields.model.trim()) {
      return {
        name: (manualFields.make + ' ' + manualFields.model).trim(),
        sub: manualFields.kind,
        udiShort: 'add later',
        status: 'ready to link',
        live: false
      };
    }
    return { name: '', sub: '', udiShort: 'add later', status: 'draft', live: false };
  }, [done, src, matchA, parsed.di, udi, service, appDeviceName, pickedEntry, manual, manualFields]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  function selectSrc(nextSrc) {
    setSrc(nextSrc);
    setStreamOverride(null);
    setError(null);
  }

  function handleUdi(value) {
    setUdi(normalizeScanToHrf(value) || value);
    setStreamOverride(null);
  }

  function handleApp(serviceId) {
    setApp(serviceId);
    setAppDeviceName(get(findService(serviceId), 'device', ''));
    setStreamOverride(null);
  }

  function handlePick(deviceId) {
    setPick(deviceId);
    setStreamOverride(null);
  }

  function resetFlow() {
    setUdi(''); setPick(null); setApp(null); setAppDeviceName('');
    setQuery(''); setManual(false); setManualFields(EMPTY_MANUAL);
    setOptional(EMPTY_OPTIONAL); setStreamOverride(null); setConsent(true);
    setDone(null); setError(null);
  }

  async function handleLink({ variant, payload }) {
    setBusy(true);
    setError(null);
    try {
      const result = await Meteor.rpc('implantableDevices.linkDevice', Object.assign({
        patientId: patientId,
        patientDisplay: patientDisplay,
        consent: consent,
        streams: selectedStreams
      }, payload));

      Session.set('deviceJustLinked', { name: summary.name || 'Device', id: result.deviceId });
      setDone({
        variant: variant,
        deviceId: result.deviceId,
        consentId: result.consentId,
        name: summary.name || 'Device',
        sub: summary.sub,
        udiShort: summary.udiShort
      });
      log.info('device linked', { deviceId: result.deviceId, variant: variant });
    } catch (err) {
      log.error('linkDevice failed', { error: err.reason || err.message });
      setError(err.reason || err.message || 'Linking failed');
    } finally {
      setBusy(false);
    }
  }

  function deviceBranchPayload(extra) {
    return Object.assign({
      source: 'udi',
      udi: udi,
      parsed: {
        di: parsed.di,
        serialNumber: parsed.serialNumber,
        lotNumber: parsed.lotNumber,
        expirationDate: parsed.expirationDate
      },
      catalogDeviceId: get(matchA, 'device.id'),
      implantDate: optional.implantDate,
      bodySite: optional.bodySite,
      managingClinic: optional.managingClinic
    }, extra);
  }

  function appBranchPayload(extra) {
    return Object.assign({
      source: 'app',
      service: app,
      deviceName: appDeviceName || get(service, 'device', 'Consumer device'),
      manufacturer: get(service, 'name', ''),
      kind: 'Wearable',
      implantDate: optional.inUseSince,
      awaitingData: true
    }, extra);
  }

  function paperBranchPayload(extra) {
    const base = manual
      ? {
          source: 'manual',
          deviceName: (manualFields.make + ' ' + manualFields.model).trim(),
          manufacturer: manualFields.make,
          modelNumber: manualFields.model,
          kind: manualFields.kind === 'Not sure' ? '' : manualFields.kind,
          serial: optional.serial
        }
      : {
          source: 'catalog',
          catalogDeviceId: pick
        };
    return Object.assign(base, {
      implantDate: optional.implantDate,
      bodySite: optional.bodySite,
      managingClinic: optional.managingClinic
    }, extra);
  }

  // ── Guards ───────────────────────────────────────────────────────────────
  if (!patientId) {
    return (
      <Box className="profile-page adv-page">
        <style>{buildProfileVars(theme)}</style>
        <style>{ADD_DEVICE_STATIC_CSS}</style>
        <Box sx={{ maxWidth: 560, mx: 'auto', pt: 8, px: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Link a Patient record to your account first — devices attach to your
            patient record, not your login.
          </Alert>
          <Button variant="outlined" sx={BTN_PRIMARY_SX} onClick={function() { navigate('/my-profile'); }}>
            Go to My Profile
          </Button>
        </Box>
      </Box>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Box className="profile-page adv-page" id="addADevicePage">
      <style>{buildProfileVars(theme)}</style>
      <style>{ADD_DEVICE_STATIC_CSS}</style>

      {/* Page header above the grid so both columns start flush at the cards line */}
      <Box className="adv-header">
        <Box component="h1" className="adv-h1">Add a device</Box>
        <Box component="p" className="adv-subtitle">What do you have in front of you right now?</Box>
      </Box>

      <Box className="adv-grid">
        <LeftRail src={src} onSelectSrc={selectSrc} summary={summary} patientDisplay={patientDisplay} />

        {error && !done && (
          <Box sx={{ gridColumn: '1 / -1', order: -1 }}>
            <Alert severity="error" onClose={function() { setError(null); }}>{error}</Alert>
          </Box>
        )}

        {done ? (
          <ConfirmationPane
            done={done}
            summary={{ name: done.name, sub: done.sub }}
            patientId={patientId}
            consentGranted={Boolean(done.consentId)}
            onAddAnother={resetFlow}
          />
        ) : src === 'device' ? (
          <BranchDeviceInHand
            mode={mode}
            onMode={function(next) { setMode(next); if (next === 'type') { setUdi(''); } }}
            udi={udi}
            onUdi={handleUdi}
            parsed={parsed}
            match={matchA}
            optional={optional}
            onOptional={function(changes) { setOptional(Object.assign({}, optional, changes)); }}
            availableStreams={availableStreams}
            selectedStreams={selectedStreams}
            onToggleStream={toggleStream}
            consent={consent}
            onConsent={setConsent}
            busy={busy}
            scanCapable={scanCapable}
            onLink={function() { handleLink({ variant: 'linked', payload: deviceBranchPayload({}) }); }}
            onSaveIncomplete={function() {
              handleLink({ variant: 'incomplete', payload: deviceBranchPayload({ incomplete: true }) });
            }}
          />
        ) : src === 'app' ? (
          <BranchAppExport
            app={app}
            onApp={handleApp}
            service={service}
            deviceName={appDeviceName}
            onDeviceName={setAppDeviceName}
            optional={optional}
            onOptional={function(changes) { setOptional(Object.assign({}, optional, changes)); }}
            availableStreams={availableStreams}
            selectedStreams={selectedStreams}
            onToggleStream={toggleStream}
            consent={consent}
            onConsent={setConsent}
            busy={busy}
            onLinkAndImport={function() { handleLink({ variant: 'import', payload: appBranchPayload({}) }); }}
            onLinkOnly={function() { handleLink({ variant: 'registered', payload: appBranchPayload({}) }); }}
          />
        ) : (
          <BranchCatalogSearch
            query={query}
            onQuery={setQuery}
            results={results}
            pick={pick}
            onPick={handlePick}
            manual={manual}
            onManual={setManual}
            manualFields={manualFields}
            onManualFields={function(changes) { setManualFields(Object.assign({}, manualFields, changes)); }}
            optional={optional}
            onOptional={function(changes) { setOptional(Object.assign({}, optional, changes)); }}
            availableStreams={availableStreams}
            selectedStreams={selectedStreams}
            onToggleStream={toggleStream}
            consent={consent}
            onConsent={setConsent}
            busy={busy}
            onLink={function() { handleLink({ variant: 'linked', payload: paperBranchPayload({}) }); }}
            onSaveIncomplete={function() {
              handleLink({ variant: 'incomplete', payload: paperBranchPayload({ incomplete: true }) });
            }}
          />
        )}
      </Box>
    </Box>
  );
}

export default AddADevicePage;
