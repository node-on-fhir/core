# Authentication Tests Update

## Overview
The Nightwatch tests have been updated to match the new authentication workflow that includes:
- Progressive login flow with user existence checking
- Inline registration when a user doesn't exist
- Real-time username/email availability checking
- Enhanced password requirements (12 character minimum per NIST 800-63B)

## Test Files Updated

### 1. `accounts.auth-flow.js` (NEW)
Comprehensive test suite for the new authentication flow:
- **Direct Registration**: Tests landing directly on `/register`
- **Login Flow with Account Creation**: Tests the full flow of attempting login, creating account inline, logout, and re-login
- **Edge Cases**: Tests various error scenarios including validation errors, SQL injection attempts, XSS attempts
- **Username Availability**: Tests real-time username checking
- **Forgot Password**: Tests conditional display of forgot password link

### 2. `accounts.login.js` (UPDATED)
Updated to handle the progressive login flow:
- Password field is disabled when user doesn't exist
- Shows inline registration option for new users
- Handles both username and email login
- Updated error message checks to be more flexible

### 3. `accounts.signup.js` (UPDATED)
Updated for new validation requirements:
- Password minimum is now 12 characters (not 8)
- Confirm password field name is `confirm` (not `confirmPassword`)
- Real-time username/email availability checking
- Password strength indicators

## Key Changes to Note

### Form Field Names
- Confirm password field: `name="confirm"` (not `confirmPassword`)
- All other fields remain the same: `username`, `email`, `password`

### Validation Rules
- Username: minimum 3 characters
- Password: minimum 12 characters (NIST 800-63B recommendation)
- Email: standard email validation
- Real-time availability checking for username and email

### Progressive Flow
- When a username/email is entered in login:
  - If user exists: password field is enabled
  - If user doesn't exist: shows inline registration option
- Registration can happen inline or on dedicated `/register` page

### Test Execution
To run the authentication tests:
```bash
# Run all auth tests
npx nightwatch tests/nightwatch/honeycomb/accounts.*.js

# Run specific test file
npx nightwatch tests/nightwatch/honeycomb/accounts.auth-flow.js
```

## Known Issues and Workarounds

1. **Availability Indicators**: The tests no longer wait for specific SVG icons (CheckCircle, Cancel) as these may not always appear. Instead, they wait for the operation to complete and check for text messages.

2. **Password Field State**: In the login form, the password field state depends on user existence check. Tests now handle both enabled and disabled states.

3. **Error Messages**: Error message checks use partial text matching to be more resilient to wording changes.

4. **Inline Registration Flow**: When a user doesn't exist in login:
   - First shows "No account found" message with "CREATE A NEW ACCOUNT" button
   - Clicking button reveals confirm password field first
   - After passwords match, username field appears
   - No separate email field (email was entered in username field)

5. **Tab Order**: The confirm password field may be skipped in tab order if password requirements aren't met.

## Test Data
Tests use timestamped usernames and emails to avoid conflicts:
- Username format: `testuser${timestamp}`
- Email format: `test${timestamp}@example.com`

This ensures tests can run repeatedly without cleanup issues.