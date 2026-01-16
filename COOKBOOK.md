# Honeycomb Cookbook

Practical recipes for common deployment and configuration tasks.

## Table of Contents

1. [Setting Up an Open Sandbox Server](#setting-up-an-open-sandbox-server)
2. [PM2 Deployment Configuration](#pm2-deployment-configuration)

---

## Setting Up an Open Sandbox Server

### Overview

Honeycomb uses a **double-latch guard** pattern to prevent accidental exposure of unauthenticated endpoints. You must set multiple environment variables to enable NOAUTH mode.

This design is intentional. Healthcare applications require strict access controls, but developers and researchers need open sandboxes for testing and demonstrations. The double-latch pattern ensures NOAUTH can never be enabled accidentally.

### Required Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `NOAUTH` | `true` | Primary flag to enable no-auth mode |
| `SANDBOX_MODE` | `true` | Secondary confirmation (double-latch) |
| `NOAUTH_ALLOWED_DOMAINS` | `your-domain.com,localhost` | Comma-separated list of allowed domains |

### Optional Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NOAUTH_EXPIRES_HOURS` | `24` | Auto-expire NOAUTH after this many hours |
| `PRODUCTION_MODE` | (unset) | Must NOT be `true` for NOAUTH to work |

### Example: PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "honeycomb-sandbox",
      script: "meteor",
      args: "run --production --port 3000",
      cwd: "/home/ubuntu/honeycomb-ehr",
      interpreter: "none",
      env: {
        PORT: 3000,
        ROOT_URL: "https://sandbox.example.com",
        MONGO_URL: "mongodb://...",
        METEOR_SETTINGS: JSON.stringify(require("./settings.json")),

        // Sandbox authentication settings
        NOAUTH: true,
        SANDBOX_MODE: true,
        NOAUTH_ALLOWED_DOMAINS: "sandbox.example.com,localhost",
        NOAUTH_EXPIRES_HOURS: 72
      }
    }
  ]
}
```

### Security Features

The SafeNoAuth module (`/server/SafeNoAuth.js`) provides:

1. **Compound checks** - Both `NOAUTH` AND `SANDBOX_MODE` must be set
2. **Time limits** - Mode auto-expires after configured hours
3. **Domain restrictions** - Only works on whitelisted domains
4. **Aggressive logging** - All NOAUTH requests logged to AuditEvents
5. **Startup warnings** - Console alerts when NOAUTH is active

### Troubleshooting

**Still getting 401 errors?**

Check the server logs for messages like:

```
NOAUTH request from unauthorized domain!
Host: your-domain.com
Allowed: localhost
```

This means you need to add your domain to `NOAUTH_ALLOWED_DOMAINS`.

**Common issues:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| 401 Unauthorized | `NOAUTH_ALLOWED_DOMAINS` doesn't include your domain | Add your domain to the list |
| 401 after 24 hours | NOAUTH expired | Restart the app or increase `NOAUTH_EXPIRES_HOURS` |
| NOAUTH not activating | `PRODUCTION_MODE=true` is set | Remove or set to `false` |
| NOAUTH not activating | Missing `SANDBOX_MODE=true` | Add the second latch variable |

### Verification

After configuration, test with:

```bash
curl https://your-sandbox.com/baseR4/Patient?_count=1
```

Should return a FHIR Bundle (not 401 Unauthorized).

You can also check the startup logs for the warning banner:

```
████████████████████████████████████████████████████████████
█                                                          █
█  ⚠️   WARNING: NOAUTH MODE IS ENABLED  ⚠️                 █
█                                                          █
█  Authentication is DISABLED for sandbox testing.         █
█  This mode will expire in 72 hours.                      █
█                                                          █
█  Allowed domains: sandbox.example.com,localhost          █
█                                                          █
█  DO NOT USE IN PRODUCTION!                               █
█                                                          █
████████████████████████████████████████████████████████████
```

---

## PM2 Deployment Configuration

### Basic PM2 Setup

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "honeycomb-ehr",
      script: "meteor",
      args: "run --production --port 3000 --extra-packages 'clinical:pacio-core'",
      cwd: "/home/ubuntu/honeycomb-ehr",
      interpreter: "none",
      env: {
        PORT: 3000,
        ROOT_URL: "https://your-domain.com",
        MONGO_URL: "mongodb+srv://...",
        METEOR_SETTINGS: JSON.stringify(require("./settings.json")),
        INITIALIZE_CONSENT_ENGINE: true,
        INITIALIZE_SEARCH_PARAMETERS: true
      }
    }
  ]
}
```

### PM2 Commands

```bash
# Start the application
pm2 start ecosystem.config.js

# View logs
pm2 logs honeycomb-ehr

# Restart after config changes
pm2 restart honeycomb-ehr

# Stop the application
pm2 stop honeycomb-ehr

# Save current process list (survives reboot)
pm2 save

# Setup startup script
pm2 startup
```

### Environment Variable Tips

- **Boolean values**: Use strings (`"true"` not `true`) for environment variables
- **JSON settings**: Use `JSON.stringify()` for `METEOR_SETTINGS`
- **Paths**: Use absolute paths for `cwd` and config files

---

## See Also

- [ENVIRONMENT_VARIABLES.MD](./ENVIRONMENT_VARIABLES.MD) - Complete list of environment variables
- [INSTALLATION.md](./INSTALLATION.md) - Initial setup instructions
- [SETTINGS.MD](./SETTINGS.MD) - Meteor settings file configuration
