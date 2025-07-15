
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Honeycomb3 is a full-stack FHIR (Fast Healthcare Interoperability Resources) framework built on Meteor.js for creating healthcare applications. It provides a TEFCA-compliant FHIR server, consent management, and support for SMART on FHIR applications.

## Key Commands

### Development
```bash
# Run the application locally
meteor run --settings configs/settings.honeycomb.localhost.json

# Run with specific settings (choose appropriate config file)
meteor run --settings configs/settings.consent.localhost.json
meteor run --settings configs/settings.fhir.localhost.json
```

### Testing
```bash
# Run unit tests
meteor test --once --driver-package meteortesting:mocha

# Run full app tests
meteor test --full-app --driver-package meteortesting:mocha

# Run Nightwatch E2E tests
npm test  # or meteor npm test
```

### Build & Deploy
```bash
# Production build with bundle visualization
meteor --production --extra-packages bundle-visualizer

# Build desktop app (Electron)
meteor-desktop
```

## Architecture Overview

### Technology Stack
- **Framework**: Meteor.js (real-time web framework)
- **Frontend**: React 18, Material-UI v5, React Router v6
- **Backend**: Node.js, MongoDB, Express.js for REST endpoints
- **Data Standard**: FHIR R4
- **Testing**: Mocha (unit), Nightwatch (E2E)

### Core Components

1. **FHIR Server** (`/server/fhir/`)
   - REST API endpoints for 40+ FHIR resources
   - OAuth 2.0 authentication server
   - CDS Hooks implementation
   - UDAP certificate handling

2. **Client UI** (`/imports/ui/`)
   - Patient chart components
   - FHIR resource management interfaces
   - Consent management system
   - SMART app launcher and debugger

3. **Data Layer** (`/imports/lib/`)
   - SimpleSchema definitions for FHIR resources
   - Validated Meteor methods for data operations
   - FHIR utility functions and transformers

4. **Plugin System** (`/packages/`)
   - Modular architecture for extending functionality
   - Starter packages for common use cases

### Key Patterns

- **Methods**: Use Meteor's validated methods pattern for data operations (see `/imports/methods/`)
- **Schemas**: All FHIR resources have SimpleSchema definitions in `/imports/lib/schemas/`
- **Routing**: React Router v6 configuration in `/imports/ui/App.jsx`
- **Testing**: Page Object Model for E2E tests in `/tests/nightwatch/pages/`

## Important Notes

- Replace all "QWERTY" placeholders before deployment
- Settings files in `/configs/` control different deployment modes (FHIR server, consent engine, etc.)
- The application supports HIPAA compliance and has undergone security audits
- When adding new FHIR resources, follow the existing pattern in schemas and UI components
- Use the FHIR dehydrator functions when transforming between FHIR and internal formats

- Style guide:  we are writing a Meteor v3 app, using React and MaterialUI app.  

- Add the path and name of the file as the first line of each file (commented out)

- We are using the Meteor v3 toolchain, with ES6 style async/await patterns. We prefer function() syntax instead of ES6 style => arrow syntax. 

- We use the lodash library for circuit breaker pattern when accessing JSON objects, so feel free to generously use get() and set() functions and specify default values.  Do *not* import the _ function; do explicitly import each function.

- For date time operations, use the moment library.  

- We are writing a 12 Factor app, so will wish to specify key configuration params via environment variables, which then get attached to the Meteor.settings on server startup, and later accessed elsewhere in the app.  

- When possible, files should be written in such a way that they can be refactored into an Atmosphere.js package later.

- IMPORTANT:  On the server, be sure to use Meteor v3 API, including getTextAsync, findAsync, insertAsync, updateAsync, removeAsync, countAsync, etc.

- Development environment is MacOS ARM64.  When multiple clients are run, they will likely be run on the same machine, using ports 3000 and 4000 respectively.  

- When returning code, check with the user, whether a script, bash commands, or javascript file is desired.  

- Use the meteor/fetch package for HTTP calls.

- Don't ever suggest webpack, vite, or other bundlers.  

- Avoid directory index.js files.

- When routing between pages, always use the useNavigate hook; Don't use window.location.href

- Strive to always balance conditional if/then statements, and give a console message during the negative case.  Don't silently swallow the conditional.  

- Do use the full gamut of console messages:  console.warn, console.error, console.group, etc.

- Always use IDE diagnostics to validate code after implementation

