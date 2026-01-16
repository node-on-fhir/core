# Environment Variables

This document lists all environment variables used in the Honeycomb3 FHIR framework.

## Authentication & Security

| Variable | Description | Default | Required | Used In |
|----------|-------------|---------|----------|---------|
| `JWT_SECRET` | Secret key for signing JWT tokens | - | Yes | `/imports/startup/server/core-startup.js` |
| `MOBILE_JWT_SECRET` | JWT secret specifically for mobile authentication | - | No | `/imports/startup/server/middleware-mobile.js` |
| `ENCRYPTION_KEY` | General encryption key for sensitive data | - | Yes | `/imports/startup/server/core-startup.js` |
| `DEV_AUTO_LOGIN` | Enable automatic login in development | `false` | No | `/server/FhirEndpoints.js`, `/imports/accounts/server/dev-autologin.js` |
| `DEV_AUTO_USERNAME` | Username for development auto-login | - | No | `/server/FhirEndpoints.js`, `/imports/accounts/server/dev-autologin.js` |
| `DEV_AUTO_PASSWORD` | Password for development auto-login | - | No | `/server/FhirEndpoints.js`, `/imports/accounts/server/dev-autologin.js` |
| `NOAUTH` | Disable authentication (development only) | `false` | No | `/server/RestHelpers.js`, `/server/FhirEndpoints.js` |
| `REFRESH_TOKEN` | OAuth refresh token configuration | - | No | `/server/OAuthEndpoints.js` |

## Database

| Variable | Description | Default | Required | Used In |
|----------|-------------|---------|----------|---------|
| `MONGO_URL` | MongoDB connection string | - | Yes | `/server/main.js`, `/server/ConsentEngineHttp.js`, `/server/FhirEndpoints.js` |
| `MONGO_OPLOG_URL` | MongoDB oplog URL for real-time updates | - | No | `/imports/startup/server/core-startup.js` |

## Application Configuration

| Variable | Description | Default | Required | Used In |
|----------|-------------|---------|----------|---------|
| `APP_NAME` | Application name | `Honeycomb3` | No | `/imports/startup/server/core-startup.js` |
| `APP_URL` | Base URL of the application | - | Yes | `/imports/startup/server/core-startup.js` |
| `PUBLIC_URL` | Public-facing URL for the application | - | No | `/client/serviceWorker.js` |
| `NODE_ENV` | Node environment | `development` | No | Multiple files |
| `PORT` | Server port | `3000` | No | `/tests/nightwatch/page-objects/` |
| `TZ` | Timezone setting | System default | No | `/imports/startup/server/core-startup.js` |

## Feature Flags

| Variable | Description | Default | Required | Used In |
|----------|-------------|---------|----------|---------|
| `ENABLE_ACCOUNTS` | Enable user accounts system | `true` | No | `/imports/startup/server/core-startup.js` |
| `ENABLE_AUTOPUBLISH` | Enable automatic data publication | `false` | No | `/imports/startup/server/core-startup.js` |
| `ENABLE_HIPAA` | Enable HIPAA compliance features | `false` | No | `/imports/startup/server/core-startup.js` |
| `ENABLE_IPFS` | Enable IPFS integration | `false` | No | `/server/FhirEndpoints.js` |
| `INITIALIZE_CONSENT_ENGINE` | Initialize consent management system | `false` | No | `/server/ConsentEngineMethods.js` |
| `PROXY_RELAY_ENABLED` | Enable proxy relay functionality | `false` | No | `/server/ProxyRelay.js` |

## Debugging & Logging

| Variable | Description | Default | Required | Used In |
|----------|-------------|---------|----------|---------|
| `DEBUG` | Enable debug logging | `false` | No | `/server/main.js`, `/server/RestHelpers.js` |
| `DEBUG_ACCOUNTS` | Debug accounts system | `false` | No | `/server/ConsentEngineHttp.js`, `/server/AccountsMethods.js` |
| `TRACE` | Enable trace-level logging | `false` | No | `/server/RestHelpers.js`, `/server/FhirEndpoints.js` |
| `EXHAUSTIVE` | Enable exhaustive logging/testing | `false` | No | `/server/OAuthEndpoints.js`, `/server/FhirEndpoints.js` |

## External Services

| Variable | Description | Default | Required | Used In |
|----------|-------------|---------|----------|---------|
| `MAIL_URL` | SMTP server URL for sending emails | - | No | `/imports/accounts/server/methods.js` |
| `EMAIL_FROM` | Default from address for emails | - | No | `/imports/startup/server/core-startup.js` |
| `GOOGLE_GEOCODING_API_KEY` | Google Geocoding API key | - | No | `/server/Methods.js` |
| `GOOGLE_MAPS_API_KEY` | Google Maps API key | - | No | `/server/Methods.js` |
| `OPENAI_API_KEY` | OpenAI API key | - | No | `/server/InternationalPatientSummary.js` |
| `OPENAI_KEY` | Alternative OpenAI API key variable | - | No | `/server/InternationalPatientSummary.js` |

## Infrastructure

| Variable | Description | Default | Required | Used In |
|----------|-------------|---------|----------|---------|
| `FORCE_SSL` | Force SSL/HTTPS connections | `false` | No | `/imports/startup/server/core-startup.js` |
| `TRUSTED_PROXIES` | Comma-separated list of trusted proxy IPs | - | No | `/imports/startup/server/core-startup.js` |
| `METEOR_SIGTERM_GRACE_PERIOD_SECONDS` | Grace period for Meteor shutdown | `30` | No | `/server/VaultServer.js` |

## Testing

| Variable | Description | Default | Required | Used In |
|----------|-------------|---------|----------|---------|
| `CHROMEDRIVER_PATH` | Path to ChromeDriver executable | System PATH | No | `/nightwatch.circle.conf.js` |
| `UDAP_TEST` | Enable UDAP testing mode | `false` | No | `/server/OAuthEndpoints.js` |
| `TEST_RUN` | Enable test-specific operations (e.g., patient deletion) | `false` | No | `/imports/api/patients/methods.js` |
| `USE_MONGO_OBJECTID` | Use MongoDB ObjectIDs for new records (for consistency with Synthea data) | `false` | No | `/imports/api/patients/methods.js` |

## Usage Examples

### Development Configuration
```bash
export NODE_ENV=development
export MONGO_URL=mongodb://localhost:27017/honeycomb
export JWT_SECRET=your-secret-key
export ENCRYPTION_KEY=your-encryption-key
export DEBUG=true
export DEV_AUTO_LOGIN=true
export DEV_AUTO_USERNAME=testuser
export DEV_AUTO_PASSWORD=testpass
```

### Testing Configuration
```bash
# Enable test-specific features (like patient deletion)
export TEST_RUN=true

# Start Meteor in test mode
TEST_RUN=true meteor run --settings configs/settings.honeycomb.tdd.json

# In another terminal, run the tests
npx nightwatch tests/nightwatch/honeycomb/enable_autopublish/crud.patients.js
```

### Working with Synthea Data
```bash
# When you need new records to sort consistently with existing Synthea-generated data
export USE_MONGO_OBJECTID=true

# This ensures new patients use MongoDB ObjectIDs like Synthea data
USE_MONGO_OBJECTID=true meteor run --settings configs/settings.synthea.json
```

### Production Configuration
```bash
export NODE_ENV=production
export MONGO_URL=mongodb://username:password@host:port/database
export JWT_SECRET=strong-production-secret
export ENCRYPTION_KEY=strong-encryption-key
export APP_URL=https://your-domain.com
export FORCE_SSL=true
export MAIL_URL=smtp://username:password@smtp.server.com:587
```

### Docker Configuration
```dockerfile
ENV NODE_ENV=production
ENV MONGO_URL=mongodb://mongo:27017/honeycomb
ENV JWT_SECRET=${JWT_SECRET}
ENV ENCRYPTION_KEY=${ENCRYPTION_KEY}
```

## Security Notes

1. **Never commit sensitive environment variables** to version control
2. Use a `.env` file for local development (add to `.gitignore`)
3. For production, use a secure secret management system
4. Rotate `JWT_SECRET` and `ENCRYPTION_KEY` regularly
5. Use strong, randomly generated values for all secrets

## Configuration Precedence

Environment variables are typically loaded in this order:
1. System environment variables
2. `.env` file (if using dotenv)
3. Meteor settings file (specified with `--settings`)
4. Default values in code

Most environment variables are read during startup in `/imports/startup/server/core-startup.js` and stored in `Meteor.settings` for use throughout the application.