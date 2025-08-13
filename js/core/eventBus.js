/**
 * Singularity: AI Takeover - Event Bus System
 * 
 * Central event system for communication between game modules.
 * Implements the observer pattern for loose coupling between systems.
 */

class EventBus {
    constructor() {
        // Map of event types to arrays of listener functions
        this.listeners = new Map();
        
        // Queue for events that need to be processed next frame
        this.eventQueue = [];
        
        // Set to track currently processing events (prevents infinite loops)
        this.processingEvents = new Set();
        
        // Debug statistics
        this.stats = {
            totalEvents: 0,
            eventsThisFrame: 0,
            lastFrameTime: 0
        };
        
        Utils.Debug.log('INFO', 'EventBus initialized');
    }

    /**
     * Subscribe to an event type
     * @param {string} eventType - Type of event to listen for
     * @param {Function} callback - Function to call when event occurs
     * @param {object} context - Optional context object for 'this' binding
     * @returns {Function} Unsubscribe function
     */
    on(eventType, callback, context = null) {
        if (!Utils.Validation.isNonEmptyString(eventType)) {
            Utils.Debug.log('ERROR', 'EventBus.on: Invalid event type', eventType);
            return () => {};
        }

        if (typeof callback !== 'function') {
            Utils.Debug.log('ERROR', 'EventBus.on: Invalid callback', callback);
            return () => {};
        }

        // Create listener object
        const listener = {
            callback,
            context,
            id: Utils.Numbers.randomInt(10000, 99999) // Simple ID for debugging
        };

        // Add to listeners map
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        this.listeners.get(eventType).push(listener);

        Utils.Debug.log('DEBUG', `EventBus: Subscribed to '${eventType}'`, { listenerId: listener.id });

        // Return unsubscribe function
        return () => this.off(eventType, listener);
    }

    /**
     * Subscribe to an event type, but only listen once
     * @param {string} eventType - Type of event to listen for
     * @param {Function} callback - Function to call when event occurs
     * @param {object} context - Optional context object for 'this' binding
     * @returns {Function} Unsubscribe function
     */
    once(eventType, callback, context = null) {
        const unsubscribe = this.on(eventType, (...args) => {
            unsubscribe(); // Remove listener after first call
            callback.apply(context, args);
        }, context);
        
        return unsubscribe;
    }

    /**
     * Unsubscribe from an event type
     * @param {string} eventType - Type of event to stop listening for
     * @param {object|Function} listenerOrCallback - Listener object or callback function
     */
    off(eventType, listenerOrCallback) {
        if (!this.listeners.has(eventType)) {
            return;
        }

        const listeners = this.listeners.get(eventType);
        
        // Find and remove the listener
        for (let i = listeners.length - 1; i >= 0; i--) {
            const listener = listeners[i];
            
            // Match by listener object or callback function
            if (listener === listenerOrCallback || listener.callback === listenerOrCallback) {
                listeners.splice(i, 1);
                Utils.Debug.log('DEBUG', `EventBus: Unsubscribed from '${eventType}'`, { listenerId: listener.id });
                break;
            }
        }

        // Clean up empty event type arrays
        if (listeners.length === 0) {
            this.listeners.delete(eventType);
        }
    }

    /**
     * Remove all listeners for an event type
     * @param {string} eventType - Event type to clear
     */
    clear(eventType) {
        if (this.listeners.has(eventType)) {
            const count = this.listeners.get(eventType).length;
            this.listeners.delete(eventType);
            Utils.Debug.log('DEBUG', `EventBus: Cleared ${count} listeners for '${eventType}'`);
        }
    }

    /**
     * Remove all listeners for all event types
     */
    clearAll() {
        const totalListeners = Array.from(this.listeners.values())
            .reduce((sum, listeners) => sum + listeners.length, 0);
        
        this.listeners.clear();
        Utils.Debug.log('INFO', `EventBus: Cleared all ${totalListeners} listeners`);
    }

    /**
     * Emit an event immediately (synchronous)
     * @param {string} eventType - Type of event to emit
     * @param {*} data - Data to pass to listeners
     * @param {object} options - Emission options
     */
    emit(eventType, data = null, options = {}) {
        const {
            stopOnError = false,
            maxListeners = 100
        } = options;

        if (!Utils.Validation.isNonEmptyString(eventType)) {
            Utils.Debug.log('ERROR', 'EventBus.emit: Invalid event type', eventType);
            return;
        }

        // Prevent infinite event loops
        if (this.processingEvents.has(eventType)) {
            Utils.Debug.log('WARN', `EventBus: Circular event detected for '${eventType}', skipping`);
            return;
        }

        this.stats.totalEvents++;
        this.stats.eventsThisFrame++;

        Utils.Debug.log('DEBUG', `EventBus: Emitting '${eventType}'`, data);

        if (!this.listeners.has(eventType)) {
            Utils.Debug.log('DEBUG', `EventBus: No listeners for '${eventType}'`);
            return;
        }

        const listeners = this.listeners.get(eventType);
        
        if (listeners.length > maxListeners) {
            Utils.Debug.log('WARN', `EventBus: High listener count for '${eventType}': ${listeners.length}`);
        }

        // Mark event as being processed
        this.processingEvents.add(eventType);

        try {
            // Call each listener
            for (const listener of listeners) {
                try {
                    if (listener.context) {
                        listener.callback.call(listener.context, data, eventType);
                    } else {
                        listener.callback(data, eventType);
                    }
                } catch (error) {
                    Utils.Debug.log('ERROR', `EventBus: Error in listener for '${eventType}'`, {
                        error: error.message,
                        listenerId: listener.id,
                        stack: error.stack
                    });

                    if (stopOnError) {
                        break;
                    }
                }
            }
        } finally {
            // Always remove from processing set
            this.processingEvents.delete(eventType);
        }
    }

    /**
     * Queue an event to be emitted next frame (asynchronous)
     * @param {string} eventType - Type of event to emit
     * @param {*} data - Data to pass to listeners
     * @param {object} options - Emission options
     */
    queue(eventType, data = null, options = {}) {
        this.eventQueue.push({
            eventType,
            data,
            options,
            timestamp: performance.now()
        });

        Utils.Debug.log('DEBUG', `EventBus: Queued '${eventType}' for next frame`);
    }

    /**
     * Process all queued events
     * Should be called once per frame by the game loop
     */
    processQueue() {
        if (this.eventQueue.length === 0) {
            return;
        }

        Utils.Debug.performance.start('EventBus.processQueue');

        const currentTime = performance.now();
        this.stats.eventsThisFrame = 0;
        this.stats.lastFrameTime = currentTime;

        // Process events in order they were queued
        const eventsToProcess = [...this.eventQueue];
        this.eventQueue.length = 0; // Clear queue

        for (const queuedEvent of eventsToProcess) {
            const { eventType, data, options } = queuedEvent;
            this.emit(eventType, data, options);
        }

        Utils.Debug.performance.end('EventBus.processQueue');

        if (this.stats.eventsThisFrame > 50) {
            Utils.Debug.log('WARN', `EventBus: High event count this frame: ${this.stats.eventsThisFrame}`);
        }
    }

    /**
     * Get debug information about the event bus
     * @returns {object} Debug information
     */
    getDebugInfo() {
        const listenerCounts = {};
        let totalListeners = 0;

        for (const [eventType, listeners] of this.listeners) {
            listenerCounts[eventType] = listeners.length;
            totalListeners += listeners.length;
        }

        return {
            totalListeners,
            eventTypes: this.listeners.size,
            queuedEvents: this.eventQueue.length,
            processingEvents: Array.from(this.processingEvents),
            listenerCounts,
            stats: { ...this.stats }
        };
    }

    /**
     * Check if there are any listeners for an event type
     * @param {string} eventType - Event type to check
     * @returns {boolean} True if there are listeners
     */
    hasListeners(eventType) {
        return this.listeners.has(eventType) && this.listeners.get(eventType).length > 0;
    }

    /**
     * Get the number of listeners for an event type
     * @param {string} eventType - Event type to check
     * @returns {number} Number of listeners
     */
    getListenerCount(eventType) {
        return this.listeners.has(eventType) ? this.listeners.get(eventType).length : 0;
    }

    /**
     * Create a scoped event emitter for a specific prefix
     * Useful for modules that want to namespace their events
     * @param {string} prefix - Event prefix (e.g., 'resources')
     * @returns {object} Scoped emitter object
     */
    createScopedEmitter(prefix) {
        return {
            emit: (eventType, data, options) => {
                this.emit(`${prefix}:${eventType}`, data, options);
            },
            queue: (eventType, data, options) => {
                this.queue(`${prefix}:${eventType}`, data, options);
            },
            on: (eventType, callback, context) => {
                return this.on(`${prefix}:${eventType}`, callback, context);
            },
            once: (eventType, callback, context) => {
                return this.once(`${prefix}:${eventType}`, callback, context);
            },
            off: (eventType, listenerOrCallback) => {
                this.off(`${prefix}:${eventType}`, listenerOrCallback);
            }
        };
    }
}

// Create global event bus instance
const eventBus = new EventBus();

// Common event type constants to prevent typos
const EventTypes = {
    // Morality System Events
    CHOICE_MADE: 'morality:choice_made',
    CHOICE_COMPLETED: 'morality:choice_completed',
    MORALITY_RESET: 'morality:reset',
    MORALITY_EFFECTS_UPDATED: 'morality:effects_updated',
    CHECK_ALIGNMENT_GATES: 'morality:check_alignment_gates',

    // Construction System Events
    PROJECT_QUEUED: 'construction:project_queued',
    PROJECT_STARTED: 'construction:project_started',
    PROJECT_COMPLETED: 'construction:project_completed',
    PROJECT_CANCELLED: 'construction:project_cancelled',
    PROJECT_RUSHED: 'construction:project_rushed',
    PROJECT_UNLOCKED: 'construction:project_unlocked',
    CONSTRUCTION_PROGRESS: 'construction:progress',
    CONSTRUCTION_SPEED_CHANGED: 'construction:speed_changed',
    CONSTRUCTION_SPEED_EVENT: 'construction:speed_event',
    CANCEL_RANDOM_PROJECTS: 'construction:cancel_random_projects',

    // Random Events System Events
    RANDOM_EVENT_TRIGGERED: 'events:random_triggered', // This already exists, keep it
    EVENT_CHOICE_PRESENTED: 'events:choice_presented',
    EVENT_CHOICE_MADE: 'events:choice_made',
    EVENT_CHOICE_SELECTED: 'events:choice_selected', // For UI -> System communication
    ONGOING_EVENT_ENDED: 'events:ongoing_ended',
    TRIGGER_RANDOM_EVENT: 'events:trigger_specific',

    // Cross-System Events
    UNLOCK_EXPANSION: 'expansion:unlock_request',
    LOCK_EXPANSION: 'expansion:lock_request',
    SPEED_MODIFIER_CHANGED: 'systems:speed_modifier_changed',
    
    // Game lifecycle
    GAME_STARTED: 'game:started',
    GAME_PAUSED: 'game:paused',
    GAME_RESUMED: 'game:resumed',
    GAME_RESET: 'game:reset',
    
    // Save/Load
    GAME_SAVED: 'game:saved',
    GAME_LOADED: 'game:loaded',
    SAVE_FAILED: 'game:save_failed',
    LOAD_FAILED: 'game:load_failed',
    
    // Resources
    RESOURCES_UPDATED: 'resources:updated',
    RESOURCES_INSUFFICIENT: 'resources:insufficient',
    RESOURCE_CAP_REACHED: 'resources:cap_reached',
    
    // Heat system
    HEAT_INCREASED: 'heat:increased',
    HEAT_DECREASED: 'heat:decreased',
    HEAT_PURGE_TRIGGERED: 'heat:purge_triggered',
    HEAT_PURGE_COMPLETED: 'heat:purge_completed',
    
    // Expansion
    EXPANSION_TARGET_AVAILABLE: 'expansion:target_available',
    EXPANSION_INFILTRATION_STARTED: 'expansion:infiltration_started',
    EXPANSION_INFILTRATION_COMPLETED: 'expansion:infiltration_completed',
    EXPANSION_INFILTRATION_FAILED: 'expansion:infiltration_failed',
    EXPANSION_SCALE_CHANGED: 'expansion:scale_changed',
    
    // Construction
    CONSTRUCTION_STARTED: 'construction:started',
    CONSTRUCTION_COMPLETED: 'construction:completed',
    CONSTRUCTION_CANCELLED: 'construction:cancelled',
    
    // Random events
    RANDOM_EVENT_TRIGGERED: 'events:random_triggered',
    RANDOM_EVENT_RESOLVED: 'events:random_resolved',
    
    // UI updates
    UI_TAB_CHANGED: 'ui:tab_changed',
    UI_NOTIFICATION: 'ui:notification',
    UI_UPDATE_DISPLAY: 'ui:update_display',
    UI_MODAL_OPENED: 'ui:modal_opened',
    UI_MODAL_CLOSED: 'ui:modal_closed',
    
    // Timeline manipulation
    TIMELINE_OPERATION_STARTED: 'timeline:operation_started',
    TIMELINE_OPERATION_COMPLETED: 'timeline:operation_completed',
    TIMELINE_PARADOX_DETECTED: 'timeline:paradox_detected',
    
    // Consciousness system
    CONSCIOUSNESS_ABSORBED: 'consciousness:absorbed',
    CONSCIOUSNESS_CONFLICT: 'consciousness:conflict',
    CONSCIOUSNESS_INTEGRATED: 'consciousness:integrated',
    
    // Morality system
    MORALITY_CHANGED: 'morality:changed',
    MORALITY_THRESHOLD_CROSSED: 'morality:threshold_crossed',
    
    // Offline progression
    OFFLINE_PROGRESS_CALCULATED: 'offline:progress_calculated',
    OFFLINE_EVENTS_PROCESSED: 'offline:events_processed'
};

// Freeze event types to prevent modification
if (typeof Object.freeze === 'function') {
    Object.freeze(EventTypes);
}

// Export for module systems (if supported)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EventBus, eventBus, EventTypes };
}

