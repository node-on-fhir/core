# clinical:workqueues

Clinical workqueues and task management system for healthcare environments. Originally inspired by the Microsoft "Day of Glass" concept and PACS radiology workstations.

## Overview

This package provides a comprehensive task and workqueue management system designed specifically for clinical environments. It includes:

- Task/workitem creation and management
- Real-time collaborative features
- FHIR Task resource integration
- Touch-optimized UI components
- Healthcare-specific workflows
- Audit logging for HIPAA compliance

## Installation

```bash
meteor add clinical:workqueues
```

## Features

### Core Functionality
- **Task Management**: Create, update, delete, and complete clinical tasks
- **Priority System**: Star/flag urgent items
- **Categorization**: Tag-based task organization
- **Filtering & Sorting**: Multiple view options for task lists
- **Real-time Updates**: Live synchronization across users

### Clinical Features
- **FHIR Task Integration**: Maps to FHIR R4 Task resources
- **Audit Trail**: HIPAA-compliant activity logging
- **Role-based Access**: Configurable permissions
- **Clinical Workflows**: Pre-built patterns for common healthcare scenarios

### UI Components
- **WorkQueueList**: Main task list component
- **WorkItemDetail**: Detailed task view/edit component
- **WorkQueueFilters**: Filtering and sorting controls
- **WorkItemCard**: Compact task display component

## Usage

### Basic Setup

```javascript
import { WorkQueues, WorkQueueItems } from 'meteor/clinical:workqueues';
import { WorkQueueList, WorkItemDetail } from 'meteor/clinical:workqueues/ui';

// In your React component
function MyWorkQueue() {
  return (
    <WorkQueueList 
      userId={Meteor.userId()}
      department="radiology"
      showCompleted={false}
    />
  );
}
```

### Creating Tasks

```javascript
// Create a new task
WorkQueueItems.insert({
  text: "Review chest X-ray for patient #12345",
  priority: "urgent",
  category: "imaging",
  assignee: userId,
  dueDate: new Date(Date.now() + 3600000), // 1 hour from now
  fhirTask: {
    resourceType: "Task",
    status: "requested",
    intent: "order",
    priority: "urgent"
  }
});
```

### Configuration

```javascript
// In settings.json
{
  "public": {
    "workqueues": {
      "enableAuditLog": true,
      "defaultView": "myTasks",
      "allowDelegation": true,
      "categories": ["imaging", "labs", "consults", "procedures"]
    }
  }
}
```

## API

### Collections

#### WorkQueues
Main collection for workqueue definitions
- `name`: Queue name
- `department`: Associated department
- `active`: Boolean status
- `settings`: Queue-specific configuration

#### WorkQueueItems
Individual tasks/work items
- `text`: Task description
- `priority`: urgent|routine|stat
- `status`: pending|in-progress|completed|cancelled
- `assignee`: User ID
- `category`: Task category
- `tags`: Array of tags
- `dueDate`: Due date/time
- `completedAt`: Completion timestamp
- `fhirTask`: Associated FHIR Task resource

### Methods

- `workqueues.createTask(taskData)`
- `workqueues.updateTask(taskId, updates)`
- `workqueues.completeTask(taskId)`
- `workqueues.assignTask(taskId, userId)`
- `workqueues.deleteTask(taskId)`

### Publications

- `workqueues.myTasks` - Current user's tasks
- `workqueues.departmentTasks` - Department-wide tasks
- `workqueues.allTasks` - All tasks (admin only)

## License

This package is licensed under the Artistic License 2.0. See LICENSE file for details.

## Contributing

Contributions are welcome! Please see CONTRIBUTING.md for guidelines.