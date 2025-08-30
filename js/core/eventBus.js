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
        
        console.log('EventBus initialized');
    }

    /**
     * Subscribe to an event type
     * @param {string} eventType - Type of event to listen for
     * @param {Function} callback - Function to call when event occurs
     * @param {object} context - Optional context object for 'this' binding
     * @returns {Function} Unsubscribe function
     */
    on(eventType, callback, context = null) {
        if (!eventType || typeof eventType !== 'string') {
            console.error('EventBus.on: Invalid event type', eventType);
            return () => {};
        }

        if (typeof callback !== 'function') {
            console.error('EventBus.on: Invalid callback', callback);
            return () => {};
        }

        // Create listener object
        const listener = {
            callback,
            context,
            id: Math.floor(Math.random() * 90000) + 10000 // Simple ID for debugging
        };

        // Add to listeners map
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        this.listeners.get(eventType).push(listener);

        console.debug(`EventBus: Subscribed to '${eventType}'`, { listenerId: listener.id });

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
                console.debug(`EventBus: Unsubscribed from '${eventType}'`, { listenerId: listener.id });
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
            console.debug(`EventBus: Cleared ${count} listeners for '${eventType}'`);
        }
    }

    /**
     * Remove all listeners for all event types
     */
    clearAll() {
        const totalListeners = Array.from(this.listeners.values())
            .reduce((sum, listeners) => sum + listeners.length, 0);
        
        this.listeners.clear();
        console.log(`EventBus: Cleared all ${totalListeners} listeners`);
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

        if (!eventType || typeof eventType !== 'string') {
            console.error('EventBus.emit: Invalid event type', eventType);
            return;
        }

        // Prevent infinite event loops
        if (this.processingEvents.has(eventType)) {
            console.warn(`EventBus: Circular event detected for '${eventType}', skipping`);
            return;
        }

        this.stats.totalEvents++;
        this.stats.eventsThisFrame++;

        console.debug(`EventBus: Emitting '${eventType}'`, data);

        if (!this.listeners.has(eventType)) {
            console.debug(`EventBus: No listeners for '${eventType}'`);
            return;
        }

        const listeners = this.listeners.get(eventType);
        
        if (listeners.length > maxListeners) {
            console.warn(`EventBus: High listener count for '${eventType}': ${listeners.length}`);
        }

        // Mark as currently processing
        this.processingEvents.add(eventType);

        try {
            // Call all listeners
            for (const listener of listeners) {
                try {
                    if (listener.context) {
                        listener.callback.call(listener.context, data);
                    } else {
                        listener.callback(data);
                    }
                } catch (error) {
                    console.error(`EventBus: Error in listener for '${eventType}'`, error);
                    
                    if (stopOnError) {
                        break;
                    }
                }
            }
        } finally {
            // Always clean up processing marker
            this.processingEvents.delete(eventType);
        }
    }

    /**
     * Queue an event to be processed next frame (asynchronous)
     * @param {string} eventType - Type of event to queue
     * @param {*} data - Data to pass to listeners
     * @param {object} options - Emission options
     */
    queue(eventType, data = null, options = {}) {
        if (!eventType || typeof eventType !== 'string') {
            console.error('EventBus.queue: Invalid event type', eventType);
            return;
        }

        this.eventQueue.push({
            eventType,
            data,
            options,
            timestamp: performance.now()
        });

        console.debug(`EventBus: Queued '${eventType}'`);
    }

    /**
     * Process all queued events
     * Should be called once per frame by the game loop
     */
    processQueue() {
        const startTime = performance.now();
        this.stats.eventsThisFrame = 0;
        this.stats.lastFrameTime = startTime;

        // Process all queued events
        while (this.eventQueue.length > 0) {
            const queuedEvent = this.eventQueue.shift();
            
            try {
                this.emit(queuedEvent.eventType, queuedEvent.data, queuedEvent.options);
            } catch (error) {
                console.error('EventBus: Error processing queued event', queuedEvent.eventType, error);
            }
        }

        const processingTime = performance.now() - startTime;
        
        // Warn about long processing times
        if (processingTime > 5) {
            console.warn(`EventBus: Long event processing time: ${processingTime.toFixed(2)}ms`);
        }
    }

    /**
     * Get debug information about the event bus
     * @returns {object} Debug information
     */
    getDebugInfo() {
        const listenerCounts = {};
        this.listeners.forEach((listeners, eventType) => {
            listenerCounts[eventType] = listeners.length;
        });

        return {
            totalEventTypes: this.listeners.size,
            listenerCounts,
            queueLength: this.eventQueue.length,
            stats: { ...this.stats },
            processingEvents: Array.from(this.processingEvents)
        };
    }

    /**
     * Check if there are listeners for an event type
     * @param {string} eventType - Event type to check
     * @returns {boolean} True if there are listeners
     */
    hasListeners(eventType) {
        return this.listeners.has(eventType) && this.listeners.get(eventType).length > 0;
    }

    /**
     * Get number of listeners for an event type
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
    // Game lifecycle events
    GAME_STARTED: 'game:started',
    GAME_PAUSED: 'game:paused',
    GAME_RESUMED: 'game:resumed',
    GAME_STOPPED: 'game:stopped',
    
    // Save/Load events
    GAME_SAVED: 'save:completed',
    GAME_LOADED: 'save:loaded',
    SAVE_FAILED: 'save:failed',
    LOAD_FAILED: 'save:load_failed',
    
    // Resource events
    RESOURCES_UPDATED: 'resources:updated',
    RESOURCES_INSUFFICIENT: 'resources:insufficient',
    RESOURCE_GENERATED: 'resources:generated',
    
    // Heat system events
    HEAT_INCREASED: 'heat:increased',
    HEAT_DECREASED: 'heat:decreased',
    HEAT_PURGE_TRIGGERED: 'heat:purge_triggered',
    HEAT_CRITICAL: 'heat:critical',
    
    // Expansion events
    TARGET_AVAILABLE: 'expansion:target_available',
    INFILTRATION_STARTED: 'expansion:infiltration_started',
    INFILTRATION_COMPLETED: 'expansion:infiltration_completed',
    INFILTRATION_FAILED: 'expansion:infiltration_failed',
    SCALE_CHANGED: 'expansion:scale_changed',
    
    // Construction events
    PROJECT_QUEUED: 'construction:project_queued',
    PROJECT_STARTED: 'construction:project_started',
    PROJECT_COMPLETED: 'construction:project_completed',
    PROJECT_CANCELLED: 'construction:project_cancelled',
    
    // Morality system events
    CHOICE_MADE: 'morality:choice_made',
    CHOICE_COMPLETED: 'morality:choice_completed',
    MORALITY_RESET: 'morality:reset',
    MORALITY_EFFECTS_UPDATED: 'morality:effects_updated',
    
    // Random events
    RANDOM_EVENT_TRIGGERED: 'events:random_triggered',
    EVENT_CHOICE_MADE: 'events:choice_made',
    EVENT_COMPLETED: 'events:completed',
    
    // UI events
    UI_UPDATE_RESOURCES: 'ui:update_resources',
    UI_UPDATE_HEAT: 'ui:update_heat',
    UI_SHOW_EVENT: 'ui:show_event',
    UI_NOTIFICATION: 'ui:notification',
    UI_TAB_CHANGED: 'ui:tab_changed',
    
    // System events
    SYSTEMS_REFRESH_REQUESTED: 'systems:refresh_requested',
    SYSTEM_ERROR: 'systems:error',
    PERFORMANCE_WARNING: 'systems:performance_warning'
};

// Export for module systems (if supported)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EventBus, eventBus, EventTypes };
}

// Also expose globals for non-module script consumers
if (typeof window !== 'undefined') {
    window.eventBus = eventBus;
    window.EventTypes = EventTypes;
    window.EventBus = EventBus;
}