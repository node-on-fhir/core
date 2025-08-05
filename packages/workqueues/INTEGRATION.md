# Integration Guide - Clinical Workqueues

This guide shows how to integrate the clinical:workqueues package into your Honeycomb application.

## Installation

```bash
# From your Honeycomb app root
cd packages/workqueues
meteor npm install
```

## Basic Integration

### 1. Add Package to Your App

In your main app's `.meteor/packages` file:
```
clinical:workqueues
```

Or in your package.js if integrating into another package:
```javascript
api.use('clinical:workqueues');
```

### 2. Add Routes

In your app's routing configuration (e.g., `/imports/ui/App.jsx`):

```javascript
import { WorkQueuesPage } from 'meteor/clinical:workqueues';

// In your routes
<Route path="/workqueues" element={<WorkQueuesPage />} />
```

### 3. Add Navigation

Add a menu item to your navigation:

```javascript
import { 
  Assignment as AssignmentIcon,
  Badge
} from '@mui/icons-material';
import { useWorkQueue } from 'meteor/clinical:workqueues';

// In your navigation component
const { stats } = useWorkQueue(null, { showCompleted: false });

<ListItem button component={Link} to="/workqueues">
  <ListItemIcon>
    <Badge badgeContent={stats?.active || 0} color="primary">
      <AssignmentIcon />
    </Badge>
  </ListItemIcon>
  <ListItemText primary="Work Queues" />
</ListItem>
```

### 4. Embed Components

You can embed workqueue components in other pages:

```javascript
import { 
  WorkQueueList, 
  QuickAddTask,
  useWorkQueue 
} from 'meteor/clinical:workqueues';

function PatientChart({ patientId }) {
  const { tasks } = useWorkQueue(null, {
    filters: { patientId },
    showCompleted: false
  });

  return (
    <div>
      <h3>Patient Tasks ({tasks.length})</h3>
      <QuickAddTask 
        defaultPriority="routine"
        patientId={patientId}
      />
      <WorkQueueList
        filters={{ patientId }}
        showActions={true}
      />
    </div>
  );
}
```

## Advanced Integration

### Custom Task Creation

```javascript
import { Meteor } from 'meteor/meteor';

// Create a task programmatically
async function createLabTask(patientId, labOrderId) {
  const taskId = await Meteor.callAsync('workqueues.createTask', {
    text: `Review lab results for order ${labOrderId}`,
    priority: 'routine',
    category: 'laboratory',
    patientReference: `Patient/${patientId}`,
    tags: ['lab-review', 'results'],
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  });
  
  return taskId;
}
```

### FHIR Integration

```javascript
// Create task via FHIR API
const fhirTask = {
  resourceType: 'Task',
  status: 'requested',
  intent: 'order',
  priority: 'urgent',
  description: 'Review critical lab results',
  for: {
    reference: 'Patient/12345'
  },
  restriction: {
    period: {
      end: new Date(Date.now() + 3600000).toISOString() // 1 hour
    }
  }
};

const response = await fetch('/fhir/Task', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/fhir+json',
    'Authorization': `Bearer ${authToken}`
  },
  body: JSON.stringify(fhirTask)
});
```

### Custom Workflows

```javascript
// Radiology workflow example
import { WorkQueueItems } from 'meteor/clinical:workqueues';

// Auto-create tasks when imaging orders are placed
ImagingOrders.after.insert(async function(userId, doc) {
  await Meteor.callAsync('workqueues.createTask', {
    text: `Perform ${doc.procedure} for ${doc.patientName}`,
    priority: doc.stat ? 'stat' : 'routine',
    category: 'imaging',
    patientReference: `Patient/${doc.patientId}`,
    encounterReference: `Encounter/${doc.encounterId}`,
    tags: [doc.modality, doc.bodyPart],
    metadata: {
      orderId: doc._id,
      accessionNumber: doc.accessionNumber
    }
  });
});

// Auto-complete tasks when results are finalized
ImagingResults.after.update(async function(userId, doc) {
  if (doc.status === 'final') {
    const task = await WorkQueueItems.findOneAsync({
      'metadata.orderId': doc.orderId,
      done: false
    });
    
    if (task) {
      await Meteor.callAsync('workqueues.completeTask', task._id);
    }
  }
});
```

### Notifications

```javascript
// Send notifications for urgent tasks
import { Notifications } from '/imports/api/notifications';

WorkQueueItems.after.insert(async function(userId, doc) {
  if (doc.priority === 'stat' || doc.priority === 'urgent') {
    await Notifications.send({
      to: doc.assignee,
      type: 'urgent-task',
      title: 'Urgent Task Assigned',
      body: doc.text,
      data: { taskId: doc._id }
    });
  }
});
```

### Analytics Dashboard

```javascript
import { useTracker } from 'meteor/react-meteor-data';
import { WorkQueueItems } from 'meteor/clinical:workqueues';

function WorkQueueAnalytics() {
  const stats = useTracker(() => {
    const tasks = WorkQueueItems.find({}).fetch();
    
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.done).length,
      avgCompletionTime: calculateAvgCompletionTime(tasks),
      byPriority: groupBy(tasks, 'priority'),
      byCategory: groupBy(tasks, 'category'),
      overdue: tasks.filter(t => !t.done && t.dueDate < new Date()).length
    };
  });

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <MetricCard title="Total Tasks" value={stats.total} />
      </Grid>
      <Grid item xs={12} md={3}>
        <MetricCard 
          title="Completion Rate" 
          value={`${Math.round(stats.completed / stats.total * 100)}%`} 
        />
      </Grid>
      {/* More metrics... */}
    </Grid>
  );
}
```

## Configuration

### Settings.json

```json
{
  "public": {
    "workqueues": {
      "defaultPriority": "routine",
      "enableNotifications": true,
      "categories": [
        "imaging",
        "laboratory", 
        "pharmacy",
        "consultation",
        "procedure",
        "administrative"
      ],
      "priorityLevels": [
        { "value": "stat", "label": "STAT", "color": "error" },
        { "value": "urgent", "label": "Urgent", "color": "warning" },
        { "value": "asap", "label": "ASAP", "color": "info" },
        { "value": "routine", "label": "Routine", "color": "default" }
      ]
    }
  }
}
```

### Environment Variables

```bash
# Enable work queue features
WORKQUEUE_ENABLE_NOTIFICATIONS=true
WORKQUEUE_AUTO_ASSIGNMENT=true
WORKQUEUE_MAX_ITEMS_PER_USER=50
```

## Best Practices

1. **Task Naming**: Use clear, actionable language
   - ✅ "Review chest X-ray for patient John Doe"
   - ❌ "X-ray"

2. **Priority Usage**:
   - STAT: Life-threatening, immediate action required
   - Urgent: Time-sensitive, within hours
   - ASAP: Important but not critical
   - Routine: Normal workflow

3. **Categories**: Use consistent categories across your organization

4. **Patient Context**: Always include patient/encounter references when applicable

5. **Audit Trail**: All actions are logged for compliance

## Troubleshooting

### Tasks not appearing
- Check subscription is ready: `handle.ready()`
- Verify user permissions
- Check filters aren't too restrictive

### Performance issues
- Limit task queries with proper filters
- Use pagination for large lists
- Enable MongoDB indexes (automatic on package install)

### FHIR sync issues
- Verify FHIR Task resource format
- Check patient/practitioner references exist
- Review server logs for validation errors