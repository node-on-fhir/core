// imports/accounts/client/components/AuthCard.jsx
//
// The one-door auth card (design handoff 2026-11-01). One component, one
// useReducer (authCardReducer.js): email first, then the card morphs into
// sign-in or sign-up based on auth.lookupIdentifier. /signin mounts it in
// 'email', /signup in 'create' (email editable); returning-user navigation
// passes { email, step: 'password' } via route state. Preserves the repo's
// TOTP/backup-code 2FA flow. A correct first-time user never sees red.

import React, { useReducer, useRef, useEffect, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { get } from 'lodash';
import { logger } from '../../lib/AccountsLogger';
import { authCardReducer, initialAuthCardState } from '../authCardReducer';
import { writeLastUser } from '../lastUser';
import { meetsMinimumAge } from '../../lib/ageGate';

const METER_BUCKETS = [12, 16, 20, 24];

function meterLabel(length) {
  if (length === 0) return 'Minimum 12 characters.';
  if (length < 12) return length + '/12 characters minimum';
  if (length < 16) return 'Good · ' + length + ' characters. No confirm step — you can see it.';
  return 'Strong · ' + length + ' characters. No confirm step — you can see it.';
}

// Step headline copy — also announced via the aria-live region so screen
// readers hear the morph.
function stepHeadline(step) {
  switch (step) {
    case 'password': return 'Welcome back.';
    case 'create': return "Looks like you're new. Let's set you up.";
    case 'twofactor': return 'One more step.';
    case 'welcome': return "You're in.";
    default: return 'Sign in or create an account';
  }
}

export function AuthCard({ initialMode = 'signin', initialEmail = '', initialStep, onSuccess, onForgotPassword }) {
  const [state, dispatch] = useReducer(
    authCardReducer,
    { mode: initialMode, email: initialEmail, step: initialStep },
    initialAuthCardState
  );
  const [passphraseVisible, setPassphraseVisible] = React.useState(true);
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const collapseTimeout = prefersReducedMotion ? 0 : 200;

  const requireAgeGate = get(Meteor, 'settings.public.accounts.requireAgeGate', false);
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthDateError, setBirthDateError] = useState('');

  const passphraseRef = useRef(null);
  const usernameRef = useRef(null);
  const codeRef = useRef(null);

  // Focus follows the morph: password/create reveal focuses their first field
  useEffect(function() {
    if (state.step === 'password' && passphraseRef.current) {
      passphraseRef.current.focus();
    } else if (state.step === 'create' && state.emailLocked && usernameRef.current) {
      usernameRef.current.focus();
    } else if (state.step === 'twofactor' && codeRef.current) {
      codeRef.current.focus();
    }
  }, [state.step, state.emailLocked]);

  // Focus moves to the errored field (errors are field-level, never a banner)
  useEffect(function() {
    if (!state.error) { return; }
    if (state.error.field === 'passphrase' && passphraseRef.current) {
      passphraseRef.current.focus();
    } else if (state.error.field === 'username' && usernameRef.current) {
      usernameRef.current.focus();
    } else if (state.error.field === 'twoFactorCode' && codeRef.current) {
      codeRef.current.focus();
    }
  }, [state.error]);

  function setField(field) {
    return function(event) {
      dispatch({ type: 'SET_FIELD', field: field, value: event.target.value });
    };
  }

  function fieldError(field) {
    return state.error && state.error.field === field ? state.error.message : undefined;
  }

  // ---- server interactions -------------------------------------------------

  async function handleEmailSubmit(event) {
    event.preventDefault();
    const before = state.email;
    dispatch({ type: 'SUBMIT_EMAIL' });
    const email = (before || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { return; } // reducer kept us on email with the error
    try {
      const result = await Meteor.rpc('auth.lookupIdentifier', { identifier: email });
      if (get(result, 'exists')) {
        dispatch({ type: 'EMAIL_EXISTS' });
      } else {
        dispatch({ type: 'EMAIL_UNKNOWN', suggestedUsername: get(result, 'suggestedUsername') });
      }
    } catch (err) {
      logger.error('auth.lookupIdentifier failed:', err);
      dispatch({ type: 'CHECK_FAILED' });
    }
  }

  function finishLogin() {
    const user = Meteor.user();
    writeLastUser({
      userId: Meteor.userId(),
      email: state.email,
      username: get(user, 'username'),
      displayName: get(user, 'profile.name') || get(user, 'username')
    });
    dispatch({ type: 'LOGIN_OK' });
    if (onSuccess) { onSuccess(); }
  }

  function handlePasswordSubmit(event) {
    event.preventDefault();
    if (!state.passphrase) { dispatch({ type: 'SUBMIT_PASSWORD' }); return; }
    dispatch({ type: 'SUBMIT_PASSWORD' });
    Meteor.loginWithPassword(state.email, state.passphrase, function(error) {
      if (!error) { finishLogin(); return; }
      if (error.error === 'no-2fa-code') {
        dispatch({ type: 'LOGIN_2FA_REQUIRED' });
        return;
      }
      logger.error('Login failed:', error);
      dispatch({ type: 'LOGIN_FAILED' });
    });
  }

  function handleTwoFactorSubmit(event) {
    event.preventDefault();
    if (!state.twoFactorCode) { dispatch({ type: 'SUBMIT_2FA' }); return; }
    const code = state.twoFactorCode.trim();
    dispatch({ type: 'SUBMIT_2FA' });
    if (state.useBackupCode) {
      Meteor.call('accounts.useBackupCodeForLogin', state.email, state.passphrase, code, function(error) {
        if (error) {
          logger.error('Backup code failed:', error);
          dispatch({ type: 'LOGIN_FAILED', invalidCode: true });
          return;
        }
        Meteor.loginWithPassword(state.email, state.passphrase, function(loginError) {
          if (loginError) { dispatch({ type: 'LOGIN_FAILED', invalidCode: true }); return; }
          finishLogin();
        });
      });
    } else {
      Meteor.loginWithPasswordAnd2faCode(state.email, state.passphrase, code, function(error) {
        if (error) {
          logger.error('2FA login failed:', error);
          dispatch({ type: 'LOGIN_FAILED', invalidCode: true });
          return;
        }
        finishLogin();
      });
    }
  }

  function handleCreateSubmit(event) {
    event.preventDefault();
    const ageOk = !requireAgeGate || meetsMinimumAge(birthDate, new Date());
    const invalid =
      (!state.emailLocked && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((state.email || '').trim().toLowerCase())) ||
      !/^[a-z0-9_.-]{3,30}$/.test(state.username) ||
      !state.passphrase || state.passphrase.length < 12 ||
      !fullName.trim() ||
      !ageOk;
    dispatch({ type: 'SUBMIT_CREATE' });
    if (!ageOk) {
      const ageError = 'You must be at least 13 years old to create an account.';
      setBirthDateError(ageError);
      dispatch({ type: 'CREATE_FAILED', field: 'birthDate', message: ageError });
      return;
    }
    if (invalid) { return; }
    const createOptions = {
      username: state.username,
      email: (state.email || '').trim().toLowerCase(),
      password: state.passphrase,
      profile: { name: fullName.trim() }
    };
    if (requireAgeGate) {
      createOptions.profile.birthDate = birthDate;
    }
    Accounts.createUser(createOptions, function(error) {
      if (!error) {
        writeLastUser({
          userId: Meteor.userId(),
          email: (state.email || '').trim().toLowerCase(),
          username: state.username
        });
        if (!prefersReducedMotion && typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(10);
        }
        dispatch({ type: 'CREATE_OK' });
        return;
      }
      logger.error('createUser failed:', error);
      const reason = get(error, 'reason', '') || '';
      if (reason.includes('Username')) {
        dispatch({ type: 'CREATE_FAILED', field: 'username', message: 'That username is taken — try another' });
      } else if (reason.includes('Email')) {
        dispatch({ type: 'CREATE_FAILED', field: 'email', emailExists: true, message: 'Looks like you do have an account' });
      } else if (reason.includes('13 years')) {
        setBirthDateError(reason);
        dispatch({ type: 'CREATE_FAILED', field: 'birthDate', message: reason });
      } else {
        // Accounts ambiguousErrorMessages collapses duplicates to a generic
        // 403. Attribute the failure to a field via the existing
        // availability check (the app already exposes existence through
        // auth.lookupIdentifier — no new leak).
        Meteor.call('accounts.checkAvailability', state.username, (state.email || '').trim().toLowerCase(), function(availError, availability) {
          if (!availError && availability && availability.usernameAvailable === false) {
            dispatch({ type: 'CREATE_FAILED', field: 'username', message: 'That username is taken — try another' });
          } else if (!availError && availability && availability.emailAvailable === false) {
            dispatch({ type: 'CREATE_FAILED', field: 'email', emailExists: true, message: 'Looks like you do have an account' });
          } else {
            dispatch({ type: 'CREATE_FAILED', field: 'passphrase', message: reason || 'Could not create the account' });
          }
        });
      }
    });
  }

  function handleOpenWorkstation() {
    dispatch({ type: 'OPEN_WORKSTATION' });
    if (onSuccess) { onSuccess(); }
  }

  // ---- shared bits ---------------------------------------------------------

  const emailChip = (
    <Paper
      variant="outlined"
      data-testid="auth-email-chip"
      sx={{
        display: 'flex', alignItems: 'center', gap: 1.5,
        px: 2, py: 0.5, mb: 3, minHeight: 56
      }}
    >
      <CheckIcon fontSize="small" color="success" />
      <Typography sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {state.email}
      </Typography>
      <Button
        type="button"
        variant="text"
        data-testid="auth-change-email"
        onClick={function() { dispatch({ type: 'CHANGE_EMAIL' }); }}
        sx={{ minHeight: 40 }}
      >
        Change
      </Button>
    </Paper>
  );

  // Email input stays MOUNTED (readOnly) when chipped so password managers
  // associate email + passphrase on save; visually replaced by the chip.
  const hiddenEmailInput = (
    <input
      type="email"
      name="email"
      autoComplete="username"
      value={state.email}
      readOnly
      aria-hidden="true"
      tabIndex={-1}
      style={{ position: 'absolute', opacity: 0, height: 0, width: 0, border: 0, padding: 0 }}
    />
  );

  const busySpinner = <CircularProgress size={22} color="inherit" />;

  const passphraseField = function({ isNew }) {
    return (
      <Box sx={{ mb: isNew ? 1 : 3 }}>
        <TextField
          fullWidth
          inputRef={passphraseRef}
          label={isNew ? 'Create a passphrase' : 'Passphrase'}
          placeholder={isNew ? 'correct horse battery staple' : 'Enter your passphrase'}
          name="password"
          id="password"
          type={isNew ? (passphraseVisible ? 'text' : 'password') : 'password'}
          value={state.passphrase}
          onChange={setField('passphrase')}
          required
          autoComplete={isNew ? 'new-password' : 'current-password'}
          inputProps={{
            enterKeyHint: 'go',
            'aria-describedby': isNew ? 'passphrase-meter-text' : undefined
          }}
          error={!!fieldError('passphrase')}
          helperText={fieldError('passphrase')}
          InputProps={isNew ? {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  data-testid="auth-pass-toggle"
                  aria-label={passphraseVisible ? 'Hide passphrase' : 'Show passphrase'}
                  aria-pressed={!passphraseVisible}
                  onClick={function() { setPassphraseVisible(!passphraseVisible); }}
                  edge="end"
                  sx={{ width: 44, height: 44, m: '6px' }}
                >
                  {passphraseVisible ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          } : undefined}
        />
        {isNew && (
          <>
            <Stack direction="row" spacing={1} data-testid="auth-pass-meter" sx={{ mt: 1.5 }}>
              {METER_BUCKETS.map(function(bucket) {
                return (
                  <LinearProgress
                    key={bucket}
                    variant="determinate"
                    value={state.passphrase.length >= bucket ? 100 : 0}
                    color={state.passphrase.length >= 12 ? 'success' : 'primary'}
                    sx={{ flex: 1 }}
                  />
                );
              })}
            </Stack>
            <Typography
              id="passphrase-meter-text"
              variant="caption"
              sx={{
                display: 'block', mt: 0.75,
                color: state.passphrase.length >= 12 ? 'success.main' : 'text.secondary'
              }}
            >
              {meterLabel(state.passphrase.length)}
            </Typography>
          </>
        )}
      </Box>
    );
  };

  // ---- steps ---------------------------------------------------------------

  const emailStep = (
    <form noValidate onSubmit={handleEmailSubmit}>
      <Typography variant="h5" sx={{ mb: 1 }}>Sign in or create an account</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Start with your email. We'll take it from there.
      </Typography>
      <TextField
        fullWidth
        label="Email"
        placeholder="you@hospital.org"
        name="email"
        id="email"
        type="email"
        value={state.email}
        onChange={setField('email')}
        required
        autoComplete="username"
        autoFocus
        inputProps={{ inputMode: 'email', enterKeyHint: 'next' }}
        error={!!fieldError('email')}
        helperText={fieldError('email')}
        disabled={state.step === 'checking'}
        sx={{ mb: 3 }}
      />
      <Button
        type="submit"
        fullWidth
        variant="contained"
        color="primary"
        data-testid="auth-submit"
        disabled={state.busy}
        sx={{ minWidth: 200 }}
      >
        {state.step === 'checking' ? busySpinner : 'Continue →'}
      </Button>
      {get(Meteor, 'settings.public.features.passkeys') === true && (
        <>
          <Divider sx={{ my: 2 }}>or</Divider>
          <Button type="button" fullWidth variant="outlined">Sign in with a passkey</Button>
        </>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center', fontSize: 14 }}>
        By continuing you agree to the Terms and Privacy Policy.
      </Typography>
    </form>
  );

  const passwordStep = (
    <form noValidate onSubmit={handlePasswordSubmit}>
      {hiddenEmailInput}
      {emailChip}
      <Collapse in timeout={collapseTimeout} appear>
        <Box>
          {passphraseField({ isNew: false })}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            data-testid="auth-submit"
            disabled={state.busy}
            sx={{ mb: 2, minWidth: 200 }}
          >
            {state.step === 'signingIn' ? busySpinner : 'Sign in'}
          </Button>
          <Button
            type="button"
            fullWidth
            variant="outlined"
            onClick={function() {
              if (onForgotPassword) { onForgotPassword(); }
            }}
          >
            Forgot passphrase?
          </Button>
        </Box>
      </Collapse>
    </form>
  );

  const createStep = (
    <form noValidate onSubmit={handleCreateSubmit}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Chip
          label="NEW HERE"
          size="small"
          data-testid="auth-new-badge"
          sx={{ bgcolor: '#2C3A33', color: 'success.main' }}
        />
        <Typography variant="caption" color="text.secondary">Step 1 of 2</Typography>
      </Box>
      <Typography variant="h5" sx={{ mb: 3 }}>{stepHeadline('create')}</Typography>

      {state.emailLocked ? (
        <>
          {hiddenEmailInput}
          {emailChip}
        </>
      ) : (
        <TextField
          fullWidth
          label="Email"
          placeholder="you@hospital.org"
          name="email"
          id="email"
          type="email"
          value={state.email}
          onChange={setField('email')}
          required
          autoComplete="username"
          autoFocus
          inputProps={{ inputMode: 'email', enterKeyHint: 'next' }}
          error={!!fieldError('email')}
          helperText={fieldError('email')}
          sx={{ mb: 3 }}
        />
      )}

      <Collapse in timeout={collapseTimeout} appear>
        <Box>
          <TextField
            fullWidth
            inputRef={usernameRef}
            label="Username"
            name="username"
            id="username"
            value={state.username}
            onChange={setField('username')}
            required
            autoComplete="username"
            inputProps={{ enterKeyHint: 'next', autoCapitalize: 'none', spellCheck: false }}
            error={!!fieldError('username')}
            helperText={fieldError('username') || 'Suggested from your email — change it if you like.'}
            sx={{ mb: 3 }}
          />
          <TextField
            fullWidth
            label="Full Name"
            name="fullName"
            id="fullName"
            value={fullName}
            onChange={function(event) { setFullName(event.target.value); }}
            required
            autoComplete="name"
            inputProps={{ enterKeyHint: 'next' }}
            helperText="Shown on your profile."
            sx={{ mb: 3 }}
          />
          {requireAgeGate && (
            <TextField
              fullWidth
              label="Date of birth"
              name="birthDate"
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={function(event) { setBirthDate(event.target.value); setBirthDateError(''); }}
              required
              InputLabelProps={{ shrink: true }}
              error={!!birthDateError}
              helperText={birthDateError || 'Used once to confirm account eligibility — we keep only the year.'}
              sx={{ mb: 3 }}
            />
          )}
          {passphraseField({ isNew: true })}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            data-testid="auth-submit"
            disabled={state.busy || state.passphrase.length < 12 || !fullName.trim() || (requireAgeGate && !birthDate)}
            sx={{ mt: 2, minWidth: 200 }}
          >
            {state.step === 'creating' ? busySpinner : 'Create my account'}
          </Button>
          <Button
            type="button"
            fullWidth
            variant="text"
            data-testid="auth-have-account"
            onClick={function() { dispatch({ type: 'CHANGE_EMAIL' }); }}
            sx={{ mt: 1 }}
          >
            Already have an account with a different email?
          </Button>
        </Box>
      </Collapse>
    </form>
  );

  const twoFactorStep = (
    <form noValidate onSubmit={handleTwoFactorSubmit}>
      {hiddenEmailInput}
      {emailChip}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {state.useBackupCode
          ? 'Enter one of your backup codes to sign in.'
          : 'Enter the 6-digit code from your authenticator app.'}
      </Typography>
      <TextField
        fullWidth
        inputRef={codeRef}
        label={state.useBackupCode ? 'Backup code' : 'Authentication code'}
        value={state.twoFactorCode}
        onChange={function(event) {
          const raw = event.target.value;
          const value = state.useBackupCode ? raw.slice(0, 8) : raw.replace(/\D/g, '').slice(0, 6);
          dispatch({ type: 'SET_FIELD', field: 'twoFactorCode', value: value });
        }}
        autoComplete="one-time-code"
        inputProps={{
          inputMode: state.useBackupCode ? 'text' : 'numeric',
          enterKeyHint: 'go',
          style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.3em', fontFamily: 'monospace' }
        }}
        error={!!fieldError('twoFactorCode')}
        helperText={fieldError('twoFactorCode')}
        sx={{ mb: 3 }}
      />
      <Button
        type="submit"
        fullWidth
        variant="contained"
        color="primary"
        data-testid="auth-submit"
        disabled={state.busy || !state.twoFactorCode}
        sx={{ mb: 2, minWidth: 200 }}
      >
        {state.step === 'signingIn' ? busySpinner : 'Verify'}
      </Button>
      <Button
        type="button"
        fullWidth
        variant="text"
        onClick={function() {
          dispatch({ type: 'SET_FIELD', field: 'useBackupCode', value: !state.useBackupCode });
        }}
      >
        {state.useBackupCode ? 'Use authenticator app instead' : 'Use a backup code'}
      </Button>
    </form>
  );

  const welcomeStep = (
    <Box>
      <Box
        sx={{
          width: 72, height: 72, borderRadius: '50%', mb: 3,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '3px solid', borderColor: 'success.main'
        }}
      >
        <CheckIcon sx={{ fontSize: 40, color: 'success.main' }} />
      </Box>
      <Typography variant="h5" sx={{ mb: 1 }}>
        You're in, {state.username || state.email.split('@')[0]}.
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Your account is ready and this device is remembered. Next time, one tap.
      </Typography>
      <Stack spacing={1.5} sx={{ mb: 4 }}>
        <Paper variant="outlined" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5 }}>
          <CheckIcon fontSize="small" color="success" />
          <Typography variant="body2">Account created · {state.email}</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5 }}>
          <CheckIcon fontSize="small" color="success" />
          <Typography variant="body2">Signed in on this device</Typography>
        </Paper>
        {get(Meteor, 'settings.public.features.passkeys') === true && (
          <Paper variant="outlined" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5 }}>
            <Typography variant="body2" sx={{ flex: 1 }}>
              Add a passkey — skip the passphrase next time
            </Typography>
            <Button type="button" variant="outlined" size="small">Set up</Button>
          </Paper>
        )}
      </Stack>
      <Stack direction="row" spacing={2} alignItems="center">
        <Button
          type="button"
          variant="contained"
          color="primary"
          data-testid="welcome-open"
          onClick={handleOpenWorkstation}
        >
          Open my workstation →
        </Button>
        <Button type="button" variant="text">Take the 60-second tour</Button>
      </Stack>
    </Box>
  );

  const stepContent = {
    email: emailStep,
    checking: emailStep,
    password: passwordStep,
    signingIn: state.from2fa ? twoFactorStep : passwordStep,
    create: createStep,
    creating: createStep,
    twofactor: twoFactorStep,
    welcome: welcomeStep,
    signedIn: passwordStep,
    done: welcomeStep
  }[state.step] || emailStep;

  return (
    <Paper
      elevation={0}
      data-testid="auth-card"
      data-step={state.step}
      sx={{
        p: '36px',
        width: { xs: '100%', md: 440 },
        maxWidth: '100%',
        mx: 'auto',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      {/* Screen readers hear the morph */}
      <Box aria-live="polite" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
        {stepHeadline(state.step)}
      </Box>
      {stepContent}
      <Snackbar
        open={!!state.toast}
        autoHideDuration={5000}
        onClose={function() { dispatch({ type: 'SET_FIELD', field: 'toast', value: null }); }}
        message={state.toast || ''}
      />
    </Paper>
  );
}

export default AuthCard;
