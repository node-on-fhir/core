// /packages/workqueues/client/hooks/useWorkQueue.js

import { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { WorkQueues, WorkQueueItems } from '../../lib/collections';

export function useWorkQueue(queueId, options = {}) {
  const [tasks, setTasks] = useState([]);
  const [queue, setQueue] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    inProgress: 0,
    urgent: 0,
    overdue: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const {
      limit = 100,
      status,
      priority,
      showCompleted = true,
      sortBy = 'priority'
    } = options;

    // Subscribe to queue data
    const handles = [];
    
    if (queueId) {
      handles.push(Meteor.subscribe('workqueues.queueTasks', queueId, {
        limit,
        status,
        showCompleted
      }));
      
      const queueHandle = Meteor.subscribe('workqueues.taskDetails', queueId);
      handles.push(queueHandle);
    } else {
      handles.push(Meteor.subscribe('workqueues.myTasks', {
        limit,
        status,
        priority,
        showCompleted
      }));
    }

    const computation = Tracker.autorun(() => {
      setIsLoading(handles.some(handle => !handle.ready()));

      // Build query
      const selector = {};
      
      if (queueId) {
        selector.queueId = queueId;
      } else {
        selector.$or = [
          { assignee: Meteor.userId() },
          { creator: Meteor.userId() },
          { owner: Meteor.userId() }
        ];
      }

      if (status) {
        selector.status = Array.isArray(status) ? { $in: status } : status;
      }

      if (priority) {
        selector.priority = Array.isArray(priority) ? { $in: priority } : priority;
      }

      if (!showCompleted) {
        selector.done = { $ne: true };
      }

      // Build sort options
      let sort = {};
      switch (sortBy) {
        case 'priority':
          sort = { star: -1, priority: -1, createdAt: -1 };
          break;
        case 'dueDate':
          sort = { dueDate: 1, priority: -1 };
          break;
        case 'createdAt':
          sort = { createdAt: -1 };
          break;
        case 'updatedAt':
          sort = { updatedAt: -1 };
          break;
        case 'alphabetical':
          sort = { text: 1 };
          break;
        default:
          sort = { star: -1, priority: -1, createdAt: -1 };
      }

      const taskList = WorkQueueItems.find(selector, { sort, limit }).fetch();
      setTasks(taskList);
      
      // Get queue info if queueId provided
      if (queueId) {
        const queueData = WorkQueues.findOne(queueId);
        setQueue(queueData);
      }

      // Calculate stats
      const newStats = {
        total: taskList.length,
        completed: taskList.filter(t => t.done).length,
        pending: taskList.filter(t => !t.done && t.status === 'requested').length,
        inProgress: taskList.filter(t => t.status === 'in-progress').length,
        urgent: taskList.filter(t => ['stat', 'urgent'].includes(t.priority)).length,
        overdue: taskList.filter(t => !t.done && t.dueDate && new Date(t.dueDate) < new Date()).length
      };
      setStats(newStats);
    });

    return () => {
      computation.stop();
      handles.forEach(h => h.stop());
    };
  }, [queueId, JSON.stringify(options)]);

  return {
    tasks,
    queue,
    stats,
    isLoading,
    userId: Meteor.userId()
  };
}