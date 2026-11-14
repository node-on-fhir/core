// imports/accounts/client/authCardReducer.js
//
// Pure state machine for the one-door AuthCard (design handoff 2026-11-01,
// plus the repo's 2FA extension). No Meteor/React imports — unit-tested
// directly with node --test (tests/unit/imports/accounts/).
//
// Steps: email → checking → password/create → signingIn/creating →
//        signedIn/welcome → done, with twofactor between signingIn retries.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-z0-9_.-]{3,30}$/;

export function isValidEmail(value) {
  return typeof value === 'string' && EMAIL_RE.test(value.trim());
}

export function isValidUsername(value) {
  return typeof value === 'string' && USERNAME_RE.test(value);
}

// initial = { mode: 'signin' | 'signup', email?, step? }
// 'signup' opens directly in create with the email field still editable;
// returning-user navigation passes { email, step: 'password' } to open with
// the chip filled and focus on the passphrase.
export function initialAuthCardState(initial) {
  const mode = (initial && initial.mode) || 'signin';
  const presetEmail = (initial && initial.email) || '';
  const presetStep = initial && initial.step;

  let step = mode === 'signup' ? 'create' : 'email';
  let emailLocked = false;

  if (presetStep === 'password' && presetEmail) {
    step = 'password';
    emailLocked = true;
  }

  return {
    step: step,
    email: presetEmail,
    emailLocked: emailLocked,
    username: '',
    passphrase: '',
    twoFactorCode: '',
    useBackupCode: false,
    error: null,
    toast: null,
    busy: false
  };
}

export function authCardReducer(state, action) {
  switch (action.type) {

    case 'SET_FIELD': {
      const next = Object.assign({}, state, { toast: null });
      next[action.field] = action.value;
      // Editing a field clears its error (and any stale one — one error at a time)
      next.error = null;
      return next;
    }

    case 'SUBMIT_EMAIL': {
      const email = (state.email || '').trim().toLowerCase();
      if (!isValidEmail(email)) {
        return Object.assign({}, state, {
          error: { field: 'email', message: 'Enter a valid email address' }
        });
      }
      return Object.assign({}, state, { email: email, step: 'checking', busy: true, error: null, toast: null });
    }

    case 'EMAIL_EXISTS':
      return Object.assign({}, state, { step: 'password', emailLocked: true, busy: false, error: null });

    case 'EMAIL_UNKNOWN':
      return Object.assign({}, state, {
        step: 'create',
        emailLocked: true,
        busy: false,
        error: null,
        username: action.suggestedUsername || state.username
      });

    case 'CHECK_FAILED':
      return Object.assign({}, state, {
        step: 'email', busy: false, toast: "Couldn't reach the server"
      });

    case 'SUBMIT_PASSWORD': {
      if (!state.passphrase || state.passphrase.length < 1) {
        return Object.assign({}, state, {
          error: { field: 'passphrase', message: 'Enter your passphrase' }
        });
      }
      return Object.assign({}, state, { step: 'signingIn', busy: true, error: null, from2fa: false });
    }

    case 'SUBMIT_2FA': {
      if (!state.twoFactorCode) {
        return Object.assign({}, state, {
          error: { field: 'twoFactorCode', message: 'Enter a code' }
        });
      }
      return Object.assign({}, state, { step: 'signingIn', busy: true, error: null, from2fa: true });
    }

    case 'LOGIN_OK':
      return Object.assign({}, state, { step: 'signedIn', busy: false, error: null });

    case 'LOGIN_2FA_REQUIRED':
      return Object.assign({}, state, { step: 'twofactor', busy: false, error: null });

    case 'LOGIN_FAILED': {
      if (state.from2fa || action.invalidCode) {
        return Object.assign({}, state, {
          step: 'twofactor',
          busy: false,
          twoFactorCode: '',
          error: { field: 'twoFactorCode', message: 'Invalid code. Please try again.' }
        });
      }
      return Object.assign({}, state, {
        step: 'password',
        busy: false,
        passphrase: '',
        error: { field: 'passphrase', message: "That passphrase didn't match. Try again or reset it." }
      });
    }

    case 'SUBMIT_CREATE': {
      if (!state.emailLocked && !isValidEmail((state.email || '').trim().toLowerCase())) {
        return Object.assign({}, state, {
          error: { field: 'email', message: 'Enter a valid email address' }
        });
      }
      if (!isValidUsername(state.username)) {
        return Object.assign({}, state, {
          error: { field: 'username', message: 'Username must be 3-30 characters: lowercase letters, numbers, dot, dash, underscore' }
        });
      }
      if (!state.passphrase || state.passphrase.length < 12) {
        return Object.assign({}, state, {
          error: { field: 'passphrase', message: 'Passphrase must be at least 12 characters' }
        });
      }
      return Object.assign({}, state, {
        email: (state.email || '').trim().toLowerCase(),
        step: 'creating', busy: true, error: null
      });
    }

    case 'CREATE_OK':
      return Object.assign({}, state, { step: 'welcome', busy: false, error: null });

    case 'CREATE_FAILED': {
      // Email raced into existence between the lookup and create → the happy
      // path is signing in, not an error wall. Auto-switch per the handoff.
      if (action.emailExists) {
        return Object.assign({}, state, {
          step: 'password', busy: false,
          error: { field: 'passphrase', message: action.message || 'Looks like you do have an account — sign in' }
        });
      }
      return Object.assign({}, state, {
        step: 'create',
        busy: false,
        error: { field: action.field || 'username', message: action.message || 'Could not create the account' }
      });
    }

    case 'CHANGE_EMAIL':
      // Email VALUE kept — user edits, not retypes
      return Object.assign({}, state, {
        step: 'email', emailLocked: false, busy: false, error: null
      });

    case 'OPEN_WORKSTATION':
      return Object.assign({}, state, { step: 'done' });

    default:
      return state;
  }
}

export default authCardReducer;
