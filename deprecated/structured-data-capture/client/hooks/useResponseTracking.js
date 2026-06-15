// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/structured-data-capture/client/hooks/useResponseTracking.js

import { useState, useCallback, useEffect } from 'react';
import { get } from 'lodash';

export function useResponseTracking(response, options = {}) {
  const {
    trackTiming = true,
    trackChanges = true,
    trackFocus = true
  } = options;

  // Timing tracking
  const [startTime] = useState(new Date());
  const [focusTimes, setFocusTimes] = useState({});
  const [changeCounts, setChangeCounts] = useState({});

  // Change tracking
  const [changeHistory, setChangeHistory] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Track when an item receives focus
  const trackItemFocus = useCallback(function(linkId) {
    if (!trackFocus) return;

    setFocusTimes(function(prev) {
      const times = { ...prev };
      if (!times[linkId]) {
        times[linkId] = {
          firstFocus: new Date(),
          lastFocus: new Date(),
          focusCount: 1
        };
      } else {
        times[linkId].lastFocus = new Date();
        times[linkId].focusCount++;
      }
      return times;
    });
  }, [trackFocus]);

  // Track when an answer changes
  const trackAnswerChange = useCallback(function(linkId, oldValue, newValue) {
    if (!trackChanges) return;

    const change = {
      linkId,
      timestamp: new Date(),
      oldValue,
      newValue
    };

    setChangeHistory(function(prev) {
      return [...prev, change];
    });

    setChangeCounts(function(prev) {
      const counts = { ...prev };
      counts[linkId] = (counts[linkId] || 0) + 1;
      return counts;
    });

    // Add to undo stack
    setUndoStack(function(prev) {
      return [...prev, { linkId, value: oldValue }];
    });

    // Clear redo stack on new change
    setRedoStack([]);
  }, [trackChanges]);

  // Undo last change
  const undo = useCallback(function() {
    if (undoStack.length === 0) return null;

    const lastChange = undoStack[undoStack.length - 1];
    
    setUndoStack(function(prev) {
      return prev.slice(0, -1);
    });

    setRedoStack(function(prev) {
      return [...prev, lastChange];
    });

    return lastChange;
  }, [undoStack]);

  // Redo last undone change
  const redo = useCallback(function() {
    if (redoStack.length === 0) return null;

    const lastUndo = redoStack[redoStack.length - 1];
    
    setRedoStack(function(prev) {
      return prev.slice(0, -1);
    });

    setUndoStack(function(prev) {
      return [...prev, lastUndo];
    });

    return lastUndo;
  }, [redoStack]);

  // Get statistics
  const getStatistics = useCallback(function() {
    const endTime = new Date();
    const duration = endTime - startTime;

    const stats = {
      startTime,
      endTime,
      duration,
      durationMinutes: Math.round(duration / 60000),
      totalChanges: changeHistory.length,
      uniqueItemsChanged: Object.keys(changeCounts).length,
      changeCounts,
      focusTimes
    };

    if (trackTiming) {
      // Calculate time per item
      const timePerItem = {};
      Object.keys(focusTimes).forEach(function(linkId) {
        const focus = focusTimes[linkId];
        if (focus.lastFocus && focus.firstFocus) {
          timePerItem[linkId] = focus.lastFocus - focus.firstFocus;
        }
      });
      stats.timePerItem = timePerItem;
    }

    return stats;
  }, [startTime, changeHistory, changeCounts, focusTimes, trackTiming]);

  // Export tracking data
  const exportTrackingData = useCallback(function() {
    return {
      response: get(response, 'id'),
      questionnaire: get(response, 'questionnaire'),
      subject: get(response, 'subject'),
      statistics: getStatistics(),
      changeHistory: trackChanges ? changeHistory : undefined,
      focusTimes: trackFocus ? focusTimes : undefined
    };
  }, [response, getStatistics, changeHistory, focusTimes, trackChanges, trackFocus]);

  return {
    trackItemFocus,
    trackAnswerChange,
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    getStatistics,
    exportTrackingData,
    changeHistory,
    focusTimes,
    changeCounts
  };
}