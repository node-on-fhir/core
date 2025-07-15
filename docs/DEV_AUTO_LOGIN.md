# Development Auto-Login Feature

## Overview

The development auto-login feature allows developers to automatically log in with a pre-configured account during development, streamlining the development workflow while maintaining security.

## How It Works

### Security Architecture

1. **No Credentials on Client**: The client never receives or stores the actual password
2. **Token-Based Authentication**: Server generates a secure login token
3. **Multiple Safety Layers**:
   - Only works when `NODE_ENV=development`
   - Requires explicit `DEV_AUTO_LOGIN=true`
   - Server-side validation at multiple points
   - Visual indicators when active

### Authentication Flow

```
Client                          Server
  |                               |
  |-- Request Auto-Login Token -->|
  |                               | (Validates environment)
  |                               | (Checks dev user exists)
  |                               | (Generates login token)
  |<-- Returns Token Only ---------|
  |                               |
  |-- Login with Token ---------->|
  |                               | (Standard Meteor auth)
  |<-- Authenticated Session ------|
```

## Configuration

### Environment Variables

Add to your `.env.development` file (make sure it's in `.gitignore`):

```bash
# Enable development auto-login
NODE_ENV=development
DEV_AUTO_LOGIN=true
DEV_AUTO_USERNAME=demouser
DEV_AUTO_PASSWORD=development-only-password-2024
```

### Settings File Alternative

Or add to your development settings file:

```json
{
  "public": {
    "devAutoLoginEnabled": true
  }
}
```

## Usage

1. Set the environment variables
2. Start the application in development mode
3. Navigate to the login page
4. Auto-login will trigger automatically if not already logged in
5. Look for the "DEV AUTO-LOGIN" indicator in the bottom-right corner

## Security Features

### Production Safety

- **Environment Check**: `Meteor.isProduction` blocks all auto-login methods
- **Method Removal**: Production builds can exclude dev methods entirely
- **No Password Transmission**: Password never sent to client
- **Token-Only Auth**: Uses same secure token system as regular login

### Development Indicators

- Console warnings on server startup
- Visual chip indicator on client
- Logged as development account in user profile
- Audit trail of auto-login attempts

### Best Practices

1. **Never commit `.env` files** containing credentials
2. **Use descriptive usernames** like "demouser" or "testaccount"
3. **Rotate passwords** periodically even in development
4. **Monitor logs** for unexpected auto-login attempts
5. **Disable in staging** environments that mirror production

## Comparison with Password-Based Approach

### This Implementation (Token-Based)
✅ Password never touches client code  
✅ Uses Meteor's standard auth flow  
✅ Same security as manual login  
✅ Can be audited and monitored  
✅ Works with existing session management  

### Alternative (Password in Client)
❌ Password visible in browser DevTools  
❌ Risk of accidental logging  
❌ Could be intercepted by browser extensions  
❌ Breaks security best practices  

## Troubleshooting

### Auto-login not working?

1. Check environment variables are set
2. Verify `NODE_ENV=development`
3. Check server console for startup messages
4. Look for errors in browser console
5. Ensure no existing session (try logging out first)

### Security Concerns?

- Review server logs for auto-login attempts
- Check that production deployments don't have `DEV_AUTO_LOGIN=true`
- Verify `.env` files are gitignored
- Run security audit: `npm audit`

## Disabling the Feature

To disable auto-login:

1. Remove or comment out environment variables
2. Or set `DEV_AUTO_LOGIN=false`
3. Restart the application

## Code Locations

- Server-side logic: `/imports/accounts/server/dev-autologin.js`
- Client-side hook: `/imports/accounts/client/hooks/useDevAutoLogin.js`
- Visual indicator: `/imports/accounts/client/components/DevModeIndicator.jsx`
- Environment setup: `/imports/startup/server/core-startup.js`