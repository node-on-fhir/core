# Patient Correction Requests - Logging Documentation

## Overview

The Patient Correction Requests module includes comprehensive logging throughout the client and server components to aid in debugging, performance monitoring, and user behavior analysis.

## Logging Components

### 1. Client-Side Logging

#### CorrectionRequestsPage
- **Route initialization**: Logs when component mounts/unmounts
- **Subscription tracking**: Monitors publication readiness and timeouts
- **Data queries**: Logs MongoDB queries and result counts
- **User interactions**: Tracks tab changes, button clicks, navigation
- **Performance metrics**: Measures query execution times

#### NewCorrectionRequestPage
- **Form validation**: Logs validation state and errors
- **Preview actions**: Tracks when users preview their requests
- **Submission flow**: Detailed logging of the submission process
- **Error handling**: Captures and logs submission failures

### 2. Server-Side Logging

#### Publications (correctionRequests.js)
- **Subscription setup**: Logs patient ID, query construction, timing
- **Data fetching**: Tracks task and communication queries
- **Performance**: Measures publication setup time

#### Methods (correctionRequests.js)
- **Request creation**: Logs all parameters, CMO assignment, endpoint submission
- **Task management**: Tracks which collection (Tasks vs CorrectionTasks) is used
- **Response handling**: Logs patient responses and disagreements
- **Error tracking**: Detailed error logging with context

### 3. Centralized Logger (lib/logger.js)

A utility class providing consistent logging methods:

```javascript
import { Logger } from '../lib/logger';

// Debug logging
Logger.debug('ComponentName', 'Message', { data });

// Info logging
Logger.info('ComponentName', 'User clicked button', { buttonId });

// Warning logging
Logger.warn('ComponentName', 'Subscription timeout', { patientId });

// Error logging
Logger.error('ComponentName', 'Failed to save', error, { context });

// Performance tracking
Logger.startPerformance('query-tasks');
// ... perform operation
Logger.endPerformance('query-tasks', 'ComponentName', 'Task query completed');

// Grouped logging
Logger.group('ComponentName', 'Initialization', () => {
  console.log('Setting up component...');
  console.log('Loading data...');
});
```

## Log Output Format

All logs follow a consistent format:

```
[ComponentName] Message {
  timestamp: "2024-01-15T10:30:45.123Z",
  userId: "user123",
  ...additionalData
}
```

## Configuration

### Enable/Disable Logging

Configure logging in your Meteor settings:

```json
{
  "public": {
    "debug": {
      "correctionRequests": true,  // Enable correction request logging
      "performance": false         // Enable performance metrics
    }
  }
}
```

### Log Levels

The logger supports multiple levels:
- **DEBUG**: Detailed debugging information
- **INFO**: General informational messages
- **WARN**: Warning messages for potential issues
- **ERROR**: Error messages with stack traces

## Common Log Patterns

### 1. Subscription Monitoring

```javascript
[CorrectionRequestsPage] Subscribe - patientId: patient123
[CorrectionRequestsPage] correctionRequests.patient ready? false
[CorrectionRequestsPage] Subscription timed out, assuming no data
```

### 2. Data Operations

```javascript
[CorrectionRequestsPage] Data Tracker
  Patient ID: patient123
  Tab Value: 0
  Full Query: { "for.reference": "Patient/patient123", "status": { "$in": ["ready", "in-progress"] } }
  Found in main Tasks collection: 5
  Query execution time: 12ms
```

### 3. User Actions

```javascript
[NewCorrectionRequestPage] User action: Submit {
  timestamp: "2024-01-15T10:30:45.123Z",
  patientId: "patient123",
  requestType: "correction",
  urgency: "routine",
  endpoint: "http://localhost:3000/baseR4/$correction-request"
}
```

### 4. Server Method Execution

```javascript
[correctionRequests.create] Starting creation with data: {
  patientId: "patient123",
  requestType: "correction",
  endpoint: "http://localhost:3000/baseR4/$correction-request",
  userId: "user123",
  timestamp: "2024-01-15T10:30:45.123Z"
}
[correctionRequests.create] Communication created with ID: comm456
[correctionRequests.create] Assigning to CMO: chief-medical-officer
[correctionRequests.create] Using main Tasks collection
[correctionRequests.create] Task created with ID: task789
[correctionRequests.create] Successfully created correction request
```

## Debugging Tips

### 1. Subscription Issues

If subscriptions are slow or timing out:
1. Check server logs for publication errors
2. Look for `count()` vs `countAsync()` errors in Meteor v3
3. Verify the patient ID format matches FHIR references

### 2. Data Not Appearing

If correction requests aren't showing:
1. Check the Full Query log to ensure filters are correct
2. Verify both Tasks and CorrectionTasks collections are checked
3. Look for "Sample task" logs to see data structure

### 3. Submission Failures

For failed submissions:
1. Check client-side validation logs
2. Review server method logs for specific errors
3. Verify endpoint URL configuration

### 4. Performance Issues

To diagnose slow operations:
1. Enable performance logging in settings
2. Look for "Query execution time" logs
3. Check "Publication setup completed in Xms" messages

## Browser Console Commands

Useful console commands for debugging:

```javascript
// Check current patient
Session.get('selectedPatientId')
Session.get('selectedPatient')

// View correction tasks
Collections.Tasks.find({'code.coding.code': 'patient-correction'}).fetch()

// Check subscriptions
Meteor.connection._subscriptions

// View settings
Meteor.settings.public

// Enable verbose logging temporarily
Logger.debugEnabled = true
Logger.performanceEnabled = true
```

## Production Considerations

1. **Disable debug logging** in production for performance
2. **Use log aggregation** services to collect server logs
3. **Implement rate limiting** for log-heavy operations
4. **Consider HIPAA compliance** when logging patient data
5. **Rotate logs** regularly to manage disk space

## Future Enhancements

- [ ] Integration with external logging services (e.g., Loggly, Papertrail)
- [ ] User activity analytics dashboard
- [ ] Performance monitoring dashboard
- [ ] Automated error alerting
- [ ] Log export functionality for debugging