# Admin Tools

Administrative tools for Honeycomb EHR - Session management and database administration.

## Installation

This package is included in the Honeycomb framework. No additional installation required.

## Routes

| Route | Description |
|-------|-------------|
| `/sessions` | View and manage Meteor Session variables |
| `/database-admin` | Browse collections and view document counts |

## Features

### Sessions Page (`/sessions`)

- View all active Session variables
- See value types (string, number, boolean, object)
- Copy values to clipboard
- Clear individual session values
- Clear all session values
- View connection status and user ID

### Database Admin Page (`/database-admin`)

- List all registered collections
- View document counts per collection
- Identify FHIR vs standard collections
- Expand to view sample documents (up to 5)
- Copy documents to clipboard
- Search/filter collections by name

## Configuration

Enable/disable in settings:

```json
{
  "public": {
    "modules": {
      "adminTools": {
        "enabled": true
      }
    }
  }
}
```

## Meteor Methods

### `adminTools.getCollectionStats`

Returns array of collection statistics:

```javascript
Meteor.call('adminTools.getCollectionStats', (error, result) => {
  // result = [{ name: 'Patients', count: 100, isFhir: true }, ...]
});
```

### `adminTools.getCollectionDocuments`

Returns sample documents from a collection:

```javascript
Meteor.call('adminTools.getCollectionDocuments', 'Patients', { limit: 5 }, (error, result) => {
  // result = [{ _id: '...', name: [...], ... }, ...]
});
```

### `adminTools.getConnectionInfo`

Returns server-side connection info:

```javascript
Meteor.call('adminTools.getConnectionInfo', (error, result) => {
  // result = { connectionId: '...', clientAddress: '...', userId: '...' }
});
```

## Exports

```javascript
import {
  DynamicRoutes,
  SidebarWorkflows,
  AdminSidebarElements,
  SessionsPage,
  DatabaseAdminPage,
  AdminToolsCollections
} from 'meteor/clinical:admin-tools';
```

## License

MIT
