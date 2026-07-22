// /packages/workqueues/client/hooks/useWorkQueueItem.js

import { useState, useCallback, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { WorkQueueItems } from '../../lib/collections';

export function useWorkQueueItem(taskId) {
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!taskId) {
      setTask(null);
      setIsLoading(false);
      return;
    }

    const handle = Meteor.subscribe('workqueues.taskDetails', taskId);
    
    const computation = Tracker.autorun(() => {
      setIsLoading(!handle.ready());
      const taskData = WorkQueueItems.findOne(taskId);
      setTask(taskData);
    });

    return () => {
      computation.stop();
      handle.stop();
    };
  }, [taskId]);

  const updateTask = useCallback(async (updates) => {
    if (!taskId) return;
    
    setIsUpdating(true);
    setError(null);
    
    try {
      await Meteor.rpc('workqueues.updateTask', { taskId: taskId, updates: updates });
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [taskId]);

  const completeTask = useCallback(async () => {
    return updateTask({ done: true, status: 'completed' });
  }, [updateTask]);

  const assignTask = useCallback(async (userId) => {
    if (!taskId) return;
    
    setIsUpdating(true);
    setError(null);
    
    try {
      await Meteor.rpc('workqueues.assignTask', { taskId: taskId, userId: userId });
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [taskId]);

  const deleteTask = useCallback(async () => {
    if (!taskId) return;
    
    setIsUpdating(true);
    setError(null);
    
    try {
      await Meteor.rpc('workqueues.deleteTask', { taskId: taskId });
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [taskId]);

  const addNote = useCallback(async (noteText) => {
    if (!taskId) return;
    
    setIsUpdating(true);
    setError(null);
    
    try {
      await Meteor.rpc('workqueues.addNote', { taskId: taskId, noteText: noteText });
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [taskId]);

  const toggleStar = useCallback(async () => {
    if (!task) return;
    return updateTask({ star: !task.star, priority: !task.star ? 'urgent' : 'routine' });
  }, [task, updateTask]);

  const toggleDone = useCallback(async () => {
    if (!task) return;
    return updateTask({ done: !task.done });
  }, [task, updateTask]);

  return {
    task,
    isLoading,
    isUpdating,
    error,
    updateTask,
    completeTask,
    assignTask,
    deleteTask,
    addNote,
    toggleStar,
    toggleDone
  };
}