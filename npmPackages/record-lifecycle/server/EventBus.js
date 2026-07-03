// npmPackages/record-lifecycle/server/EventBus.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { EventEmitter } from 'events';

// =============================================================================
// Record Lifecycle Event Bus — Singleton
// =============================================================================
//
// Central event bus for Record Lifecycle Events. Collection hooks emit to this
// bus, and subscribers (HIPAA logger, FHIRcast bridge, debug UI) consume from it.
//
// Settings-gated via Meteor.settings.private.recordLifecycle.enabled
//
// Channels:
//   'lifecycle'             — catch-all channel (receives every event)
//   'lifecycle:{eventType}' — per-event-type channel (e.g., 'lifecycle:originate')
//
// Maintains a circular buffer of recent events for the debug UI.
// =============================================================================

const BUFFER_SIZE = 500;

class RecordLifecycleEventBus extends EventEmitter {
  constructor() {
    super();
    this._buffer = [];
    this._totalEmitted = 0;
    this._subscriberCount = 0;
    this._enabled = false;
    this._initialized = false;

    // Increase max listeners to avoid warnings with multiple subscribers
    this.setMaxListeners(50);
  }

  /**
   * Initialize the event bus. Reads enabled state from settings.
   * Called once during server startup.
   */
  initialize() {
    if (this._initialized) {
      return;
    }

    this._enabled = get(Meteor, 'settings.private.recordLifecycle.enabled', false);
    this._initialized = true;

    if (this._enabled) {
      console.log('[record-lifecycle] EventBus initialized (enabled)');
    } else {
      console.log('[record-lifecycle] EventBus initialized (disabled — set settings.private.recordLifecycle.enabled to true)');
    }
  }

  /**
   * Check if the event bus is enabled.
   * @returns {boolean}
   */
  isEnabled() {
    return this._enabled;
  }

  /**
   * Emit a lifecycle event to all subscribers.
   *
   * @param {Object} payload - Unified event payload from buildEventPayload()
   */
  emitLifecycleEvent(payload) {
    if (!this._enabled) {
      return;
    }

    if (!payload || !payload.lifecycleEvent) {
      console.warn('[record-lifecycle] EventBus.emitLifecycleEvent called with invalid payload');
      return;
    }

    // Add to circular buffer
    this._buffer.push(payload);
    if (this._buffer.length > BUFFER_SIZE) {
      this._buffer.shift();
    }
    this._totalEmitted++;

    // Emit on catch-all channel
    this.emit('lifecycle', payload);

    // Emit on per-event-type channel
    this.emit(`lifecycle:${payload.lifecycleEvent}`, payload);
  }

  /**
   * Get recent events from the circular buffer.
   *
   * @param {number} [limit=50] - Max number of events to return
   * @returns {Object[]} Recent events, newest first
   */
  getRecentEvents(limit) {
    const count = limit || 50;
    // Return newest first
    return this._buffer.slice(-count).reverse();
  }

  /**
   * Get event bus status for the debug UI.
   *
   * @returns {Object} Status object
   */
  getStatus() {
    return {
      enabled: this._enabled,
      initialized: this._initialized,
      totalEmitted: this._totalEmitted,
      bufferSize: this._buffer.length,
      bufferCapacity: BUFFER_SIZE,
      subscriberCount: this.listenerCount('lifecycle')
    };
  }

  /**
   * Register a named subscriber on the catch-all channel.
   * Tracks subscriber count for status reporting.
   *
   * @param {string} name - Subscriber name (for logging)
   * @param {Function} handler - Event handler function
   */
  subscribe(name, handler) {
    this.on('lifecycle', handler);
    this._subscriberCount++;
    console.log(`[record-lifecycle] Subscriber registered: ${name} (total: ${this.listenerCount('lifecycle')})`);
  }

  /**
   * Clear the event buffer (for testing).
   */
  clearBuffer() {
    this._buffer = [];
    this._totalEmitted = 0;
  }
}

// Create singleton instance
const EventBus = new RecordLifecycleEventBus();

export { EventBus };
