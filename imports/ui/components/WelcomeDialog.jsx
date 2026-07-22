// imports/ui/components/WelcomeDialog.jsx

import React, { useState, useEffect, useRef, useCallback, cloneElement } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';
import { get } from 'lodash';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  FormControlLabel,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardHeader,
  CardMedia,
  CardContent,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  IconButton,
  Alert,
  AlertTitle,
  Chip,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  TableContainer,
  CircularProgress
} from '@mui/material';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import WorkflowRegistry from '/imports/lib/WorkflowRegistry.js';

// ---------------------------------------------------------------------------
// Hotkeys reference data (matches imports/startup/client/hotkeys.js)
// ---------------------------------------------------------------------------
const HOTKEY_SHORTCUTS = [
  { shortcut: 'Cmd/Ctrl + K', action: 'Quick Search' },
  { shortcut: 'Cmd/Ctrl + Shift + S', action: 'Toggle Sidebar' },
  { shortcut: 'Cmd/Ctrl + Shift + N', action: 'Toggle Header/Footer' },
  { shortcut: 'Cmd/Ctrl + Shift + F', action: 'Toggle FHIR Modules' },
  { shortcut: 'Cmd/Ctrl + Shift + I', action: 'Toggle Index Page' },
  { shortcut: 'Cmd/Ctrl + Shift + C', action: 'Toggle Construction Zone' },
  { shortcut: 'Cmd/Ctrl + Shift + W', action: 'Toggle Workflows' },
  { shortcut: 'Cmd/Ctrl + Shift + G', action: 'Toggle Server Config' },
  { shortcut: 'Escape', action: 'Close Dialogs' }
];

const log = (Meteor.Logger ? Meteor.Logger.for('WelcomeDialog') : console);

// ---------------------------------------------------------------------------
// All possible wizard steps
// ---------------------------------------------------------------------------
const ALL_STEPS = [
  { id: 'intro',        label: 'Welcome',       settingsKey: 'steps.intro.enabled' },
  { id: 'about',        label: 'About',          settingsKey: 'steps.about.enabled' },
  { id: 'verify',       label: 'Verification',   settingsKey: 'steps.verify.enabled' },
  { id: 'demographics', label: 'Demographics',   settingsKey: 'steps.demographics.enabled' },
  { id: 'llmKeys',      label: 'LLM Keys',       settingsKey: 'steps.llmKeys.enabled' },
  { id: 'hotkeys',      label: 'Hotkeys',        settingsKey: 'steps.hotkeys.enabled' }
];

// ---------------------------------------------------------------------------
// Step: Intro (media card)
// ---------------------------------------------------------------------------
function IntroStep(props) {
  const { imageUrl, onImageLoad } = props;
  if (!imageUrl) return null;
  return (
    <CardMedia
      component="img"
      image={imageUrl}
      alt=""
      onLoad={onImageLoad}
      sx={{ width: '100%', objectFit: 'contain' }}
    />
  );
}

// ---------------------------------------------------------------------------
// Step: About (message paragraphs)
// ---------------------------------------------------------------------------
function AboutStep(props) {
  const { message } = props;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        About
      </Typography>
      {message.split('\\n').map(function(line, index) {
        return (
          <Typography
            key={index}
            variant="body1"
            color="text.secondary"
            sx={{ mb: line === '' ? 1.5 : 0.5 }}
          >
            {line || '\u00A0'}
          </Typography>
        );
      })}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Step: Verify (email + phone)
// ---------------------------------------------------------------------------
function VerifyStep(props) {
  const { user } = props;
  const [phoneNumber, setPhoneNumber] = useState(get(user, 'profile.phoneNumber', ''));
  const [savingPhone, setSavingPhone] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [phoneSuccess, setPhoneSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailConfigured, setEmailConfigured] = useState(null);

  const email = get(user, 'emails.0.address', '');
  const emailVerified = get(user, 'emails.0.verified', false);

  useEffect(function() {
    Meteor.call('accounts.isEmailConfigured', function(error, result) {
      if (!error && result) {
        setEmailConfigured(get(result, 'configured', false));
      } else {
        setEmailConfigured(false);
      }
    });
  }, []);

  async function handleSendVerificationEmail() {
    setSendingVerification(true);
    try {
      await Meteor.callAsync('accounts.sendVerificationEmail', user._id);
      setEmailSent(true);
    } catch (error) {
      console.error('[WelcomeDialog.VerifyStep] Error sending verification email:', error);
    } finally {
      setSendingVerification(false);
    }
  }

  async function handleSavePhone() {
    setSavingPhone(true);
    try {
      await Meteor.callAsync('users.updatePhoneNumber', phoneNumber);
      setPhoneSuccess(true);
    } catch (error) {
      console.error('[WelcomeDialog.VerifyStep] Error saving phone:', error);
    } finally {
      setSavingPhone(false);
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <CardHeader
        title="Verify Your Contact Info"
        subheader="Required for 2FA and password recovery"
        sx={{ px: 0, pt: 0 }}
      />

      {/* Email section */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <TextField
          label="Email Address"
          value={email}
          disabled
          size="small"
          sx={{ flex: 1 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {emailVerified ? (
                  <Chip icon={<CheckCircleIcon />} label="Verified" color="success" size="small" />
                ) : (
                  <Chip label="Unverified" color="warning" size="small" />
                )}
              </InputAdornment>
            )
          }}
        />
        {!emailVerified && !emailSent ? (
          <Button
            variant="outlined"
            onClick={handleSendVerificationEmail}
            disabled={sendingVerification || emailConfigured === false}
            sx={{ height: 40, width: 240 }}
          >
            {sendingVerification ? 'Sending...' : 'Send Verification Email'}
          </Button>
        ) : null}
      </Box>
      {emailSent ? (
        <Alert severity="success">
          Verification email sent! Check your inbox.
        </Alert>
      ) : null}

      {/* Phone section */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <TextField
          label="Phone Number"
          value={phoneNumber}
          onChange={function(e) { setPhoneNumber(e.target.value); }}
          placeholder="+1 (555) 123-4567"
          size="small"
          sx={{ flex: 1 }}
        />
        <Button
          variant="outlined"
          onClick={handleSavePhone}
          disabled={savingPhone || !phoneNumber}
          sx={{ height: 40, width: 240 }}
        >
          {savingPhone ? 'Saving...' : 'Save'}
        </Button>
      </Box>
      {phoneSuccess ? (
        <Alert severity="success">
          Phone number saved.
        </Alert>
      ) : null}

      {/* SMTP info alert at bottom */}
      {emailConfigured === false ? (
        <Alert severity="info">
          Email sending is not configured. Contact your administrator to enable SMTP.
        </Alert>
      ) : null}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Step: Demographics (FHIR Patient form)
// ---------------------------------------------------------------------------
function DemographicsStep(props) {
  const { user } = props;
  const hasPatient = !!get(user, 'patientId');

  const [givenName, setGivenName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [language, setLanguage] = useState('');
  const [adminSex, setAdminSex] = useState('');
  const [genderIdentity, setGenderIdentity] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // If patient is already linked, show confirmation
  if (hasPatient) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}>
        <CheckCircleIcon color="success" sx={{ fontSize: 64 }} />
        <Typography variant="h6">Patient record already linked</Typography>
        <Typography variant="body2" color="text.secondary">
          Your account is connected to a patient record. You can update your demographics from your profile page.
        </Typography>
      </Box>
    );
  }

  async function handleSave() {
    if (!givenName || !familyName) {
      setError('First and last name are required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const patientData = {
        resourceType: 'Patient',
        name: [{
          given: [givenName],
          family: familyName
        }],
        gender: adminSex || undefined
      };

      if (street || city || state || zip) {
        patientData.address = [{
          line: street ? [street] : [],
          city: city || undefined,
          state: state || undefined,
          postalCode: zip || undefined
        }];
      }

      if (maritalStatus) {
        patientData.maritalStatus = {
          coding: [{ code: maritalStatus, display: maritalStatus.charAt(0).toUpperCase() + maritalStatus.slice(1) }]
        };
      }

      if (language) {
        patientData.communication = [{
          language: {
            coding: [{ code: language, display: language }],
            text: language
          },
          preferred: true
        }];
      }

      if (genderIdentity) {
        patientData.extension = [{
          url: 'http://hl7.org/fhir/StructureDefinition/patient-genderIdentity',
          valueCodeableConcept: {
            coding: [{ code: genderIdentity, display: genderIdentity }]
          }
        }];
      }

      const newPatientId = await Meteor.callAsync('patients.insert', patientData);
      await Meteor.callAsync('users.linkPatient', newPatientId);
      setSaved(true);
    } catch (err) {
      log.error('Error creating patient', { error: err });
      setError(err.reason || err.message || 'Failed to create patient record');
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}>
        <CheckCircleIcon color="success" sx={{ fontSize: 64 }} />
        <Typography variant="h6">Patient record created</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6" gutterBottom>
        Your Demographics
      </Typography>

      {error ? (
        <Alert severity="error">{error}</Alert>
      ) : null}

      {/* Name */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          required
          label="First Name"
          value={givenName}
          onChange={function(e) { setGivenName(e.target.value); }}
          sx={{ flex: 1 }}
        />
        <TextField
          required
          label="Last Name"
          value={familyName}
          onChange={function(e) { setFamilyName(e.target.value); }}
          sx={{ flex: 1 }}
        />
      </Box>

      {/* Address */}
      <TextField
        label="Street Address"
        value={street}
        onChange={function(e) { setStreet(e.target.value); }}
        fullWidth
      />
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          label="City"
          value={city}
          onChange={function(e) { setCity(e.target.value); }}
          sx={{ flex: 2 }}
        />
        <TextField
          label="State"
          value={state}
          onChange={function(e) { setState(e.target.value); }}
          sx={{ flex: 1 }}
        />
        <TextField
          label="Zip"
          value={zip}
          onChange={function(e) { setZip(e.target.value); }}
          sx={{ flex: 1 }}
        />
      </Box>

      {/* Marital Status */}
      <FormControl fullWidth>
        <InputLabel>Marital Status</InputLabel>
        <Select
          value={maritalStatus}
          onChange={function(e) { setMaritalStatus(e.target.value); }}
          label="Marital Status"
        >
          <MenuItem value="">None</MenuItem>
          <MenuItem value="S">Single</MenuItem>
          <MenuItem value="M">Married</MenuItem>
          <MenuItem value="D">Divorced</MenuItem>
          <MenuItem value="W">Widowed</MenuItem>
          <MenuItem value="UNK">Unknown</MenuItem>
        </Select>
      </FormControl>

      {/* Language */}
      <FormControl fullWidth>
        <InputLabel>Language</InputLabel>
        <Select
          value={language}
          onChange={function(e) { setLanguage(e.target.value); }}
          label="Language"
        >
          <MenuItem value="">None</MenuItem>
          <MenuItem value="en">English</MenuItem>
          <MenuItem value="es">Spanish</MenuItem>
          <MenuItem value="fr">French</MenuItem>
          <MenuItem value="zh">Chinese</MenuItem>
          <MenuItem value="de">German</MenuItem>
          <MenuItem value="ja">Japanese</MenuItem>
          <MenuItem value="ko">Korean</MenuItem>
          <MenuItem value="ar">Arabic</MenuItem>
        </Select>
      </FormControl>

      {/* Sex / Gender */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <FormControl sx={{ flex: 1 }}>
          <InputLabel>Administrative Sex</InputLabel>
          <Select
            value={adminSex}
            onChange={function(e) { setAdminSex(e.target.value); }}
            label="Administrative Sex"
          >
            <MenuItem value="">None</MenuItem>
            <MenuItem value="male">Male</MenuItem>
            <MenuItem value="female">Female</MenuItem>
            <MenuItem value="other">Other</MenuItem>
            <MenuItem value="unknown">Unknown</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ flex: 1 }}>
          <InputLabel>Gender Identity</InputLabel>
          <Select
            value={genderIdentity}
            onChange={function(e) { setGenderIdentity(e.target.value); }}
            label="Gender Identity"
          >
            <MenuItem value="">None</MenuItem>
            <MenuItem value="male">Male</MenuItem>
            <MenuItem value="female">Female</MenuItem>
            <MenuItem value="non-binary">Non-binary</MenuItem>
            <MenuItem value="transgender-male">Transgender Male</MenuItem>
            <MenuItem value="transgender-female">Transgender Female</MenuItem>
            <MenuItem value="other">Other</MenuItem>
            <MenuItem value="asked-declined">Prefer not to say</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Button
        variant="contained"
        onClick={handleSave}
        disabled={saving || !givenName || !familyName}
        sx={{ alignSelf: 'flex-start', mt: 1 }}
      >
        {saving ? 'Saving...' : 'Save Patient Record'}
      </Button>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Step: LLM Keys
// ---------------------------------------------------------------------------
import LargeLanguageModelKeysConfig from '/imports/ui/components/LargeLanguageModelKeysConfig.jsx';

function LlmKeysStep() {
  return <LargeLanguageModelKeysConfig showTitle={true} />;
}

// ---------------------------------------------------------------------------
// Step: Hotkeys (read-only reference)
// ---------------------------------------------------------------------------
function HotkeysStep() {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Keyboard Shortcuts
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        These shortcuts are available throughout the application.
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Shortcut</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {HOTKEY_SHORTCUTS.map(function(item) {
              return (
                <TableRow key={item.shortcut}>
                  <TableCell>
                    <Chip label={item.shortcut} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{item.action}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// ===========================================================================
// Main WelcomeDialog component
// ===========================================================================
export function WelcomeDialog() {
  const [dismissed, setDismissed] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();
  const paperRef = useRef(null);
  const [introHeight, setIntroHeight] = useState(null);

  const handleIntroImageLoad = useCallback(function() {
    requestAnimationFrame(function() {
      if (paperRef.current && !introHeight) {
        setIntroHeight(paperRef.current.offsetHeight);
      }
    });
  }, []);

  // Fallback for cached images where onLoad may fire before React attaches the listener
  useEffect(function() {
    if (activeStep === 0 && !introHeight && paperRef.current) {
      var img = paperRef.current.querySelector('img');
      if (img && img.complete && img.naturalHeight > 0) {
        setIntroHeight(paperRef.current.offsetHeight);
      }
    }
  }, [activeStep, introHeight]);

  const welcomeEnabled = get(Meteor, 'settings.public.welcome.enabled', false);
  const requireLoggedIn = get(Meteor, 'settings.public.welcome.requireLoggedIn', true);

  const user = useTracker(function() {
    return Meteor.user();
  }, []);

  // If welcome is disabled in settings, render nothing
  if (!welcomeEnabled) {
    return null;
  }

  // If login is required and no user logged in, render nothing
  if (requireLoggedIn && !user) {
    return null;
  }

  // If user already saw welcome, render nothing
  if (user && get(user, 'profile.hasSeenWelcome', false)) {
    return null;
  }

  // If dismissed for this session, render nothing
  if (dismissed) {
    return null;
  }

  // Read settings
  const title = get(Meteor, 'settings.public.welcome.title', 'Welcome');
  const message = get(Meteor, 'settings.public.welcome.message', '');
  const buttonText = get(Meteor, 'settings.public.welcome.buttonText', 'Continue');
  const linkTo = get(Meteor, 'settings.public.welcome.linkTo', '');
  const imageUrl = get(Meteor, 'settings.public.welcome.imageUrl', '');

  // Build enabled steps from settings
  const hasStepsConfig = get(Meteor, 'settings.public.welcome.steps', null);

  let enabledSteps;
  if (hasStepsConfig) {
    enabledSteps = ALL_STEPS.filter(function(step) {
      if (step.id === 'llmKeys' && !Package['symptomatic:mcp']) {
        return false;
      }
      return get(Meteor, 'settings.public.welcome.' + step.settingsKey, false);
    });
  }

  // Backwards compat: no steps config or empty → just show intro
  if (!enabledSteps || enabledSteps.length === 0) {
    enabledSteps = [{ id: 'intro', label: 'Welcome' }];
  }

  const isLastStep = activeStep >= enabledSteps.length - 1;
  const currentStepId = get(enabledSteps, [activeStep, 'id'], 'intro');

  async function handleContinue() {
    if (dontShowAgain && user) {
      try {
        await Meteor.callAsync('users.setWelcomeSeen', true);
      } catch (error) {
        console.error('[WelcomeDialog] Error setting welcome seen:', error);
      }
    }

    setDismissed(true);

    if (linkTo) {
      navigate(linkTo);
    }
  }

  function handleNext() {
    if (isLastStep) {
      handleContinue();
    } else {
      setActiveStep(activeStep + 1);
    }
  }

  function handleBack() {
    setActiveStep(activeStep - 1);
  }

  function handleDontShowAgainChange(event) {
    setDontShowAgain(event.target.checked);
  }

  // Check for a custom welcome component from WorkflowRegistry.
  // NOTE: this is the legacy `welcomeComponent` DIALOG slot (cloned below with
  // dialog props) — it is deliberately distinct from the root splash override
  // components: { WelcomePage } (see extensions/API.md and the viaLegacyKey
  // exclusion in WorkflowRegistry.getComponent()).
  const customWelcome = WorkflowRegistry.getWelcomeComponent();
  if (customWelcome) {
    return cloneElement(customWelcome, {
      open: true,
      onClose: handleContinue,
      dontShowAgain: dontShowAgain,
      onDontShowAgainChange: handleDontShowAgainChange
    });
  }

  // Render step content
  function renderStepContent() {
    switch (currentStepId) {
      case 'intro':
        return <IntroStep imageUrl={imageUrl} onImageLoad={handleIntroImageLoad} />;
      case 'about':
        return <AboutStep message={message} />;
      case 'verify':
        return <VerifyStep user={user} />;
      case 'demographics':
        return <DemographicsStep user={user} />;
      case 'llmKeys':
        return <LlmKeysStep />;
      case 'hotkeys':
        return <HotkeysStep />;
      default:
        return null;
    }
  }

  return (
    <Dialog
      open={true}
      onClose={function(event, reason) {
        // Prevent closing by backdrop click or escape
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
          return;
        }
      }}
      maxWidth="md"
      fullWidth
      PaperProps={{
        ref: paperRef,
        style: currentStepId !== 'intro'
          ? { height: introHeight || 760, maxHeight: introHeight || 760 }
          : undefined,
        sx: {
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      {/* Show stepper only when more than one step */}
      {enabledSteps.length > 1 && activeStep > 0 ? (
        <Box sx={{ px: 3, pt: 3 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {enabledSteps.map(function(step) {
              return (
                <Step key={step.id}>
                  <StepLabel>{step.label}</StepLabel>
                </Step>
              );
            })}
          </Stepper>
        </Box>
      ) : (
        <DialogTitle>{title}</DialogTitle>
      )}

      <DialogContent sx={{
        flex: 1,
        overflow: 'auto',
        pt: enabledSteps.length > 1 ? 3 : undefined,
        ...(currentStepId === 'intro' && { px: 0, pb: 0 })
      }}>
        {renderStepContent()}
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={dontShowAgain}
              onChange={handleDontShowAgainChange}
              size="small"
            />
          }
          label={
            <Typography variant="body2" color="text.secondary">
              Don't show again
            </Typography>
          }
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          {enabledSteps.length > 1 && activeStep > 0 ? (
            <Button onClick={handleBack}>
              Back
            </Button>
          ) : null}
          <Button
            variant="contained"
            onClick={handleNext}
          >
            {isLastStep ? buttonText : 'Next'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

export default WelcomeDialog;
