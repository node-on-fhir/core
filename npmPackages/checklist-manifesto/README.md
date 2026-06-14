# clinical:checklist-manifesto

FHIR-compliant checklist and protocol management system for healthcare workflows. Based on Atul Gawande's "The Checklist Manifesto" principles.

## Overview

This package provides a comprehensive task and checklist management system designed for clinical workflows. It includes:

- FHIR Task resource management
- FHIR List resource for grouping tasks
- Protocol library with reusable checklists
- Real-time collaborative features
- Import/export capabilities

## Installation

```bash
meteor add clinical:checklist-manifesto
```

## Features

### Core Functionality
- **Task Management**: Create, update, delete, and complete clinical tasks
- **List Organization**: Group related tasks into lists
- **Protocol Library**: Pre-defined checklists for common procedures
- **Priority System**: Support for routine, urgent, ASAP, and STAT priorities
- **Real-time Updates**: Live synchronization across users
- **FHIR Compliance**: Full FHIR R4 Task and List resource support

### Built-in Protocols
- Collect Blood Specimen
- MRI Safety Checklist
- Change Bed Linens
- Incident Response Checklist

### Clinical Features
- Task assignment and ownership
- Due date tracking
- Progress monitoring
- Note/comment system
- Audit trail for compliance

## Usage

### Basic Setup

```javascript
import { ChecklistManifestoPage } from 'meteor/clinical:checklist-manifesto';

// Add to your routes
<Route path="/checklists" element={<ChecklistManifestoPage />} />
```

### Creating Tasks Programmatically

```javascript
import { ChecklistTasks } from 'meteor/clinical:checklist-manifesto';

// Create a new task
const taskId = await Meteor.callAsync('checklist.tasks.insert', {
  description: 'Administer medication',
  priority: 'routine',
  dueDate: new Date(Date.now() + 3600000)
});

// Update task status
await Meteor.callAsync('checklist.tasks.updateStatus', taskId, 'in-progress');
```

### Working with Lists

```javascript
import { ChecklistLists } from 'meteor/clinical:checklist-manifesto';

// Create a new list
const listId = await Meteor.callAsync('checklist.lists.insert', {
  title: 'Morning Rounds Checklist',
  mode: 'working'
});

// Add task to list
await Meteor.callAsync('checklist.tasks.insert', {
  description: 'Check patient vitals',
  listId: listId
});
```

### Using Protocols

```javascript
// Get available protocols
const protocols = await Meteor.callAsync('checklist.protocols.list');

// Clone a protocol for use
await Meteor.callAsync('checklist.protocols.clone', protocolId);
```

## API

### Collections

#### ChecklistTasks
FHIR Task resources with additional fields:
- `listId`: Associated list ID
- `ordinal`: Task order within list
- `isTemplate`: Whether this is a protocol template

#### ChecklistLists  
FHIR List resources for grouping tasks:
- `incompleteCount`: Number of incomplete tasks
- `isProtocol`: Whether this is a reusable protocol

### Methods

#### Task Methods
- `checklist.tasks.insert(task)`
- `checklist.tasks.update(taskId, updates)`
- `checklist.tasks.updateStatus(taskId, status)`
- `checklist.tasks.remove(taskId)`
- `checklist.tasks.toggleComplete(taskId)`

#### List Methods
- `checklist.lists.insert(list)`
- `checklist.lists.update(listId, updates)`
- `checklist.lists.remove(listId)`
- `checklist.lists.updateIncompleteCount(listId)`

#### Protocol Methods
- `checklist.protocols.list()`
- `checklist.protocols.clone(protocolId)`

### Publications

- `checklist.tasks` - User's tasks with filters
- `checklist.lists` - User's lists
- `checklist.protocols` - Available protocols
- `checklist.taskDetails` - Single task with full details

## Configuration

```javascript
// In settings.json
{
  "public": {
    "checklistManifesto": {
      "enableProtocols": true,
      "defaultPriority": "routine",
      "allowPublicSharing": false
    }
  }
}
```

## License

This package is licensed under the MIT License.