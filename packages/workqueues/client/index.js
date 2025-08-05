// /packages/workqueues/client/index.js

// Export client-side collections
export { WorkQueues, WorkQueueItems } from '../lib/collections';

// Export UI components
export { WorkQueueList } from '../ui/components/WorkQueueList.jsx';
export { WorkItemCard } from '../ui/components/WorkItemCard.jsx';
export { WorkItemDetail } from '../ui/components/WorkItemDetail.jsx';
export { WorkQueueFilters } from '../ui/components/WorkQueueFilters.jsx';
export { QuickAddTask } from '../ui/components/QuickAddTask.jsx';

// Export pages
export { WorkQueuesPage } from '../ui/pages/WorkQueuesPage.jsx';
export { WorkQueuesSimplePage } from '../ui/pages/WorkQueuesSimplePage.jsx';

// Export hooks
export { useWorkQueue } from './hooks/useWorkQueue.js';
export { useWorkQueueItem } from './hooks/useWorkQueueItem.js';

// Export sidebar workflow configuration and routes
export { SidebarWorkflows, WorkQueuesMenuItem, DynamicRoutes } from '../index.jsx';