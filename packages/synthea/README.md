# clinical:synthea

A Honeycomb package that provides a modern, user-friendly GUI for configuring Synthea - the synthetic patient generator.

## Features

- **Visual Configuration Interface**: Point-and-click interface for all Synthea configuration options
- **Command Generation**: Automatically generates the `run_synthea` command with proper configuration flags
- **Organized Settings**: Configuration options organized into logical tabs:
  - Population settings (size, demographics, location)
  - Clinical settings (providers, care patterns)
  - Insurance & cost configurations
  - Export format options
  - Advanced performance settings
- **Modern Design**: Award-winning Material-UI design with:
  - Responsive layout
  - Clear visual hierarchy
  - Helpful tooltips and information
  - Real-time command preview
- **Export Configuration**: Save your configuration as JSON for later use
- **Copy-to-Clipboard**: One-click copy of generated commands

## Installation

Add the package to your Honeycomb installation:

```bash
meteor add clinical:synthea
```

## Usage

Once installed, navigate to `/synthea-configuration` in your Honeycomb application.

The interface provides comprehensive configuration options including:

1. **Basic Generation Settings**
   - Population size
   - Random seed for reproducibility
   - Gender and age filters

2. **Location Filtering**
   - State and city selection
   - Geographic distribution options

3. **Clinical Configuration**
   - Provider selection behavior
   - Maximum search distance
   - Clinician pool size

4. **Insurance & Costs**
   - Insurance mandate year
   - Employer coverage percentage
   - Cost calculation methods

5. **Export Options**
   - Output format (FHIR, C-CDA, CSV, Text)
   - Output directory
   - FHIR US Core version selection

## Generated Command Example

```bash
run_synthea -p 100 -s 12345 Massachusetts Boston -g M -a 25-65 --config="generate.only_alive_patients=true" --config="exporter.years_of_history=5" --config="exporter.fhir.export=true" --config="exporter.fhir.us_core_version=5.0.1"
```

## Requirements

- Honeycomb 3.0+
- Meteor 3.0+
- React 18+
- Material-UI v5

## Database Utilities (Advanced Feature)

This package includes optional database utilities for converting MongoDB ObjectIDs to strings. This feature is useful when importing Synthea data using MongoDB native tools.

### Security Notice

**These utilities are DISABLED by default** as they can modify your database. Only enable them in development or sandbox environments.

### Enabling Database Utilities

To enable the ObjectID conversion feature, set the environment variable when starting Meteor:

```bash
ENABLE_SYNTHEA_DB_UTILS=true meteor run --settings settings.json
```

When enabled:
- A "Convert ObjectIDs" button appears on the Synthea configuration page
- Server methods for database conversion become available
- Console warnings indicate the feature is active

### ObjectID Conversion Feature

When enabled, you can:
1. Click "Convert ObjectIDs" on the `/synthea-configuration` page
2. Select which collections to process
3. Choose dry-run mode to test without changes
4. Enable automatic backups before conversion
5. Monitor progress in real-time

### Important Warnings

- **Never enable in production** - This feature can modify your entire database
- **Always backup first** - Use the backup option or manually backup your database
- **Test with dry-run** - Always test with dry-run mode first
- **Restricted access** - Only logged-in users can access these utilities

### Disabling

To disable (default), simply don't set the environment variable or set:
```bash
ENABLE_SYNTHEA_DB_UTILS=false
```

## License

See Honeycomb license.