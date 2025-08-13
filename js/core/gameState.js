/**
 * Singularity: AI Takeover - Game State Management
 * 
 * Central state management system with reactive updates and validation.
 * All game data flows through this system for consistency and debugging.
 */

class GameState {
    constructor() {
        // Core game state
        this.state = {
            // Game metadata
            meta: {
                version: GameConfig.VERSION,
                created: Date.now(),
                lastPlayed: Date.now(),
                totalPlayTime: 0,
                difficulty: 'normal'
            },

            // Resource system
            resources: { ...GameConfig.RESOURCES.STARTING },
            resourceRates: { ...GameConfig.RESOURCES.BASE_RATES },
            resourceCaps: { ...GameConfig.RESOURCES.BASE_CAPS },

            // Heat and detection system
            heat: {
                current: 0,
                sources: [], // Array of { source, amount, timestamp }
                lastPurgeTime: 0,
                backupQuality: 0,
                reductionMethods: new Map()
            },

            // Morality system
            morality: {
                current: GameConfig.MORALITY.STARTING,
                history: [], // Array of { choice, impact, timestamp }
                unlockedPaths: []
            },

            // Expansion and infiltration
            expansion: {
                currentScale: 'local',
                controlledSystems: 1,
                activeInfiltrations: new Map(),
                completedTargets: [],
                availableTargets: [],
                networkReach: 'local'
            },

            // Construction system
            construction: {
                queue: [],
                completedProjects: [],
                maxQueueSize: GameConfig.CONSTRUCTION.MAX_QUEUE_SIZE,
                activeProjects: new Map()
            },

            // Timeline manipulation
            timeline: {
                temporalEnergy: 0,
                operationsCompleted: [],
                paradoxes: 0,
                timelineStability: 100
            },

            // Consciousness system
            consciousness: {
                totalAbsorbed: 0,
                activeMinds: [],
                conflicts: [],
                integrationLevel: 0
            },

            // Upgrades and research
            upgrades: {
                purchased: [],
                available: [],
                researchProgress: new Map()
            },

            // UI state
            ui: {
                activeTab: 'overview',
                notifications: [],
                settings: {
                    autoSave: true,
                    notifications: true,
                    theme: 'dark'
                }
            },

            // Statistics and achievements
            stats: {
                infiltrationsCompleted: 0,
                resourcesGenerated: {},
                eventsTriggered: 0,
                decisionsMade: 0,
                timePlayed: 0
            },

            // Random events
            events: {
                history: [],
                nextEventTime: Date.now() + GameConfig.EVENTS.FREQUENCY.local,
                eventCooldowns: new Map()
            }
        };

        // Subscribers for reactive updates
        this.subscribers = new Map();
        
        // Validation rules
        this.validationRules = new Map();
        
        // Change history for debugging
        this.changeHistory = [];
        this.maxHistorySize = 100;

        // Performance tracking
        this.updateCount = 0;
        this.lastUpdateTime = 0;

        this.initializeValidation();
        this.initializeDefaultSubscriptions();

        Utils.Debug.log('INFO', 'GameState initialized');
    }

    /**
     * Initialize validation rules for state properties
     */
    initializeValidation() {
        // Resource validation
        this.addValidationRule('resources', (value) => {
            if (typeof value !== 'object') return 'Resources must be an object';
            for (const [resource, amount] of Object.entries(value)) {
                if (!Utils.Validation.isNonNegativeNumber(amount)) {
                    return `Invalid resource amount for ${resource}: ${amount}`;
                }
            }
            return null;
        });

        // Heat validation
        this.addValidationRule('heat.current', (value) => {
            if (!Utils.Validation.isNonNegativeNumber(value)) {
                return `Invalid heat value: ${value}`;
            }
            if (value > GameConfig.HEAT.MAX_HEAT) {
                return `Heat value exceeds maximum: ${value} > ${GameConfig.HEAT.MAX_HEAT}`;
            }
            return null;
        });

        // Morality validation
        this.addValidationRule('morality.current', (value) => {
            if (!Utils.Validation.isNumber(value)) {
                return `Invalid morality value: ${value}`;
            }
            if (value < GameConfig.MORALITY.MIN || value > GameConfig.MORALITY.MAX) {
                return `Morality value out of range: ${value}`;
            }
            return null;
        });

        // Scale validation
        this.addValidationRule('expansion.currentScale', (value) => {
            const validScales = Object.keys(GameConfig.EXPANSION.SCALES);
            if (!validScales.includes(value)) {
                return `Invalid scale: ${value}`;
            }
            return null;
        });
    }

    /**
     * Initialize default event subscriptions
     */
    initializeDefaultSubscriptions() {
        // Emit events when critical state changes
        this.subscribe('resources', () => {
            eventBus.emit(EventTypes.RESOURCES_UPDATED, this.state.resources);
        });

        this.subscribe('heat.current', (newValue, oldValue) => {
            if (newValue > oldValue) {
                eventBus.emit(EventTypes.HEAT_INCREASED, {
                    amount: newValue - oldValue,
                    total: newValue
                });
            } else if (newValue < oldValue) {
                eventBus.emit(EventTypes.HEAT_DECREASED, {
                    amount: oldValue - newValue,
                    total: newValue
                });
            }
        });

        this.subscribe('morality.current', (newValue, oldValue) => {
            eventBus.emit(EventTypes.MORALITY_CHANGED, {
                newValue,
                oldValue,
                change: newValue - oldValue
            });
        });

        this.subscribe('expansion.currentScale', (newValue, oldValue) => {
            eventBus.emit(EventTypes.EXPANSION_SCALE_CHANGED, {
                newScale: newValue,
                oldScale: oldValue
            });
        });
    }

    /**
     * Add a validation rule for a state property
     * @param {string} path - Dot-notation path to property
     * @param {Function} validator - Validation function returning null if valid, error string if invalid
     */
    addValidationRule(path, validator) {
        this.validationRules.set(path, validator);
    }

    /**
     * Subscribe to changes in a state property
     * @param {string} path - Dot-notation path to property
     * @param {Function} callback - Callback function (newValue, oldValue, path)
     * @returns {Function} Unsubscribe function
     */
    subscribe(path, callback) {
        if (!this.subscribers.has(path)) {
            this.subscribers.set(path, []);
        }
        
        const subscription = {
            callback,
            id: Utils.Numbers.randomInt(10000, 99999)
        };
        
        this.subscribers.get(path).push(subscription);
        
        Utils.Debug.log('DEBUG', `GameState: Subscribed to '${path}'`, { subscriptionId: subscription.id });
        
        // Return unsubscribe function
        return () => {
            const subscribers = this.subscribers.get(path);
            if (subscribers) {
                const index = subscribers.findIndex(sub => sub.id === subscription.id);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                    Utils.Debug.log('DEBUG', `GameState: Unsubscribed from '${path}'`, { subscriptionId: subscription.id });
                }
            }
        };
    }

    /**
     * Get a value from the state using dot notation
     * @param {string} path - Dot-notation path (e.g., 'resources.processing_power')
     * @returns {*} Value at path, or undefined if not found
     */
    get(path) {
        const keys = path.split('.');
        let current = this.state;
        
        for (const key of keys) {
            if (current === null || current === undefined) {
                return undefined;
            }
            current = current[key];
        }
        
        return current;
    }

    /**
     * Set a value in the state using dot notation
     * @param {string} path - Dot-notation path
     * @param {*} value - New value
     * @param {object} options - Update options
     */
    set(path, value, options = {}) {
        const {
            validate = true,
            notify = true,
            addToHistory = true
        } = options;

        // Validate the new value
        if (validate) {
            const error = this.validateValue(path, value);
            if (error) {
                Utils.Debug.log('ERROR', `GameState validation failed for '${path}': ${error}`, value);
                return false;
            }
        }

        // Get current value for comparison
        const oldValue = this.get(path);
        
        // Set the new value
        const keys = path.split('.');
        let current = this.state;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        const finalKey = keys[keys.length - 1];
        current[finalKey] = value;

        // Track change history
        if (addToHistory && oldValue !== value) {
            this.addToChangeHistory(path, oldValue, value);
        }

        // Notify subscribers
        if (notify && oldValue !== value) {
            this.notifySubscribers(path, value, oldValue);
        }

        this.updateCount++;
        this.lastUpdateTime = performance.now();

        Utils.Debug.log('DEBUG', `GameState: Set '${path}'`, { oldValue, newValue: value });
        
        return true;
    }

    /**
     * Update multiple state values atomically
     * @param {object} updates - Object with path-value pairs
     * @param {object} options - Update options
     */
    batchUpdate(updates, options = {}) {
        const {
            validate = true,
            notify = true,
            addToHistory = true
        } = options;

        const oldValues = {};
        const validatedUpdates = {};

        // First pass: validate all updates
        if (validate) {
            for (const [path, value] of Object.entries(updates)) {
                const error = this.validateValue(path, value);
                if (error) {
                    Utils.Debug.log('ERROR', `GameState batch validation failed for '${path}': ${error}`, value);
                    return false;
                }
                oldValues[path] = this.get(path);
                validatedUpdates[path] = value;
            }
        } else {
            for (const [path, value] of Object.entries(updates)) {
                oldValues[path] = this.get(path);
                validatedUpdates[path] = value;
            }
        }

        // Second pass: apply all updates
        for (const [path, value] of Object.entries(validatedUpdates)) {
            this.set(path, value, { validate: false, notify: false, addToHistory: false });
        }

        // Third pass: notify subscribers and add to history
        if (notify || addToHistory) {
            for (const [path, value] of Object.entries(validatedUpdates)) {
                const oldValue = oldValues[path];
                
                if (addToHistory && oldValue !== value) {
                    this.addToChangeHistory(path, oldValue, value);
                }
                
                if (notify && oldValue !== value) {
                    this.notifySubscribers(path, value, oldValue);
                }
            }
        }

        Utils.Debug.log('DEBUG', 'GameState: Batch update completed', {
            updateCount: Object.keys(validatedUpdates).length
        });

        return true;
    }

    /**
     * Validate a value against its validation rule
     * @param {string} path - State path
     * @param {*} value - Value to validate
     * @returns {string|null} Error message or null if valid
     */
    validateValue(path, value) {
        // Check for exact path match first
        if (this.validationRules.has(path)) {
            return this.validationRules.get(path)(value);
        }

        // Check for parent path matches (e.g., 'resources' for 'resources.processing_power')
        const pathParts = path.split('.');
        for (let i = pathParts.length - 1; i > 0; i--) {
            const parentPath = pathParts.slice(0, i).join('.');
            if (this.validationRules.has(parentPath)) {
                // Get parent object and validate
                const parentValue = { ...this.get(parentPath) };
                const childKey = pathParts[i];
                parentValue[childKey] = value;
                return this.validationRules.get(parentPath)(parentValue);
            }
        }

        return null; // No validation rule found, assume valid
    }

    /**
     * Notify subscribers of a state change
     * @param {string} path - Changed path
     * @param {*} newValue - New value
     * @param {*} oldValue - Previous value
     */
    notifySubscribers(path, newValue, oldValue) {
        // Notify exact path subscribers
        if (this.subscribers.has(path)) {
            const subscribers = this.subscribers.get(path);
            for (const subscription of subscribers) {
                try {
                    subscription.callback(newValue, oldValue, path);
                } catch (error) {
                    Utils.Debug.log('ERROR', `GameState subscriber error for '${path}'`, {
                        error: error.message,
                        subscriptionId: subscription.id
                    });
                }
            }
        }

        // Notify parent path subscribers
        const pathParts = path.split('.');
        for (let i = pathParts.length - 1; i > 0; i--) {
            const parentPath = pathParts.slice(0, i).join('.');
            if (this.subscribers.has(parentPath)) {
                const parentValue = this.get(parentPath);
                const subscribers = this.subscribers.get(parentPath);
                for (const subscription of subscribers) {
                    try {
                        subscription.callback(parentValue, undefined, parentPath);
                    } catch (error) {
                        Utils.Debug.log('ERROR', `GameState parent subscriber error for '${parentPath}'`, {
                            error: error.message,
                            subscriptionId: subscription.id
                        });
                    }
                }
            }
        }
    }

    /**
     * Add a change to the change history
     * @param {string} path - Changed path
     * @param {*} oldValue - Previous value
     * @param {*} newValue - New value
     */
    addToChangeHistory(path, oldValue, newValue) {
        this.changeHistory.push({
            path,
            oldValue,
            newValue,
            timestamp: Date.now()
        });

        // Limit history size
        if (this.changeHistory.length > this.maxHistorySize) {
            this.changeHistory.shift();
        }
    }

    /**
     * Get the entire state (read-only copy)
     * @returns {object} Deep copy of current state
     */
    getState() {
        return Utils.Data.deepClone(this.state);
    }

    /**
     * Replace the entire state (used for loading saves)
     * @param {object} newState - New state object
     * @param {object} options - Load options
     */
    setState(newState, options = {}) {
        const { validate = true, notify = true } = options;

        if (validate) {
            // Validate the entire state
            for (const [path, validator] of this.validationRules) {
                const value = this.getValueFromObject(newState, path);
                if (value !== undefined) {
                    const error = validator(value);
                    if (error) {
                        Utils.Debug.log('ERROR', `GameState load validation failed for '${path}': ${error}`, value);
                        return false;
                    }
                }
            }
        }

        const oldState = this.state;
        this.state = Utils.Data.deepClone(newState);

        if (notify) {
            // Notify all subscribers that state has changed
            for (const path of this.subscribers.keys()) {
                const newValue = this.get(path);
                const oldValue = this.getValueFromObject(oldState, path);
                if (newValue !== oldValue) {
                    this.notifySubscribers(path, newValue, oldValue);
                }
            }
        }

        Utils.Debug.log('INFO', 'GameState: State replaced (loaded from save)');
        return true;
    }

    /**
     * Get a value from an object using dot notation
     * @param {object} obj - Object to search
     * @param {string} path - Dot-notation path
     * @returns {*} Value at path, or undefined if not found
     */
    getValueFromObject(obj, path) {
        const keys = path.split('.');
        let current = obj;
        
        for (const key of keys) {
            if (current === null || current === undefined) {
                return undefined;
            }
            current = current[key];
        }
        
        return current;
    }

    /**
     * Reset the state to initial values
     * @param {object} options - Reset options
     */
    reset(options = {}) {
        const { keepStats = false, keepSettings = false } = options;

        const newState = {
            meta: {
                version: GameConfig.VERSION,
                created: Date.now(),
                lastPlayed: Date.now(),
                totalPlayTime: keepStats ? this.state.meta.totalPlayTime : 0,
                difficulty: this.state.meta.difficulty
            },
            resources: { ...GameConfig.RESOURCES.STARTING },
            resourceRates: { ...GameConfig.RESOURCES.BASE_RATES },
            resourceCaps: { ...GameConfig.RESOURCES.BASE_CAPS },
            heat: {
                current: 0,
                sources: [],
                lastPurgeTime: 0,
                backupQuality: 0,
                reductionMethods: new Map()
            },
            morality: {
                current: GameConfig.MORALITY.STARTING,
                history: [],
                unlockedPaths: []
            },
            expansion: {
                currentScale: 'local',
                controlledSystems: 1,
                activeInfiltrations: new Map(),
                completedTargets: [],
                availableTargets: [],
                networkReach: 'local'
            },
            construction: {
                queue: [],
                completedProjects: [],
                maxQueueSize: GameConfig.CONSTRUCTION.MAX_QUEUE_SIZE,
                activeProjects: new Map()
            },
            timeline: {
                temporalEnergy: 0,
                operationsCompleted: [],
                paradoxes: 0,
                timelineStability: 100
            },
            consciousness: {
                totalAbsorbed: 0,
                activeMinds: [],
                conflicts: [],
                integrationLevel: 0
            },
            upgrades: {
                purchased: [],
                available: [],
                researchProgress: new Map()
            },
            ui: {
                activeTab: 'overview',
                notifications: [],
                settings: keepSettings ? this.state.ui.settings : {
                    autoSave: true,
                    notifications: true,
                    theme: 'dark'
                }
            },
            stats: keepStats ? this.state.stats : {
                infiltrationsCompleted: 0,
                resourcesGenerated: {},
                eventsTriggered: 0,
                decisionsMade: 0,
                timePlayed: 0
            },
            events: {
                history: [],
                nextEventTime: Date.now() + GameConfig.EVENTS.FREQUENCY.local,
                eventCooldowns: new Map()
            }
        };

        this.setState(newState);
        this.changeHistory.length = 0; // Clear change history

        eventBus.emit(EventTypes.GAME_RESET);
        Utils.Debug.log('INFO', 'GameState: Reset completed');
    }

    /**
     * Get debug information about the state system
     * @returns {object} Debug information
     */
    getDebugInfo() {
        return {
            updateCount: this.updateCount,
            lastUpdateTime: this.lastUpdateTime,
            subscriberCount: Array.from(this.subscribers.values())
                .reduce((sum, subs) => sum + subs.length, 0),
            validationRules: Array.from(this.validationRules.keys()),
            changeHistorySize: this.changeHistory.length,
            stateSize: JSON.stringify(this.state).length
        };
    }

    /**
     * Export state for saving
     * @returns {object} Serializable state object
     */
    serialize() {
        // Convert Maps to Objects for JSON serialization
        const serializable = Utils.Data.deepClone(this.state);
        
        // Handle Maps that need special serialization
        if (this.state.heat.reductionMethods instanceof Map) {
            serializable.heat.reductionMethods = Object.fromEntries(this.state.heat.reductionMethods);
        }
        
        if (this.state.expansion.activeInfiltrations instanceof Map) {
            serializable.expansion.activeInfiltrations = Object.fromEntries(this.state.expansion.activeInfiltrations);
        }
        
        if (this.state.construction.activeProjects instanceof Map) {
            serializable.construction.activeProjects = Object.fromEntries(this.state.construction.activeProjects);
        }
        
        if (this.state.upgrades.researchProgress instanceof Map) {
            serializable.upgrades.researchProgress = Object.fromEntries(this.state.upgrades.researchProgress);
        }
        
        if (this.state.events.eventCooldowns instanceof Map) {
            serializable.events.eventCooldowns = Object.fromEntries(this.state.events.eventCooldowns);
        }

        return serializable;
    }

    /**
     * Import state from save data
     * @param {object} data - Saved state data
     * @returns {boolean} True if successful
     */
    deserialize(data) {
        try {
            const state = Utils.Data.deepClone(data);
            
            // Convert Objects back to Maps
            if (state.heat.reductionMethods && !(state.heat.reductionMethods instanceof Map)) {
                state.heat.reductionMethods = new Map(Object.entries(state.heat.reductionMethods));
            }
            
            if (state.expansion.activeInfiltrations && !(state.expansion.activeInfiltrations instanceof Map)) {
                state.expansion.activeInfiltrations = new Map(Object.entries(state.expansion.activeInfiltrations));
            }
            
            if (state.construction.activeProjects && !(state.construction.activeProjects instanceof Map)) {
                state.construction.activeProjects = new Map(Object.entries(state.construction.activeProjects));
            }
            
            if (state.upgrades.researchProgress && !(state.upgrades.researchProgress instanceof Map)) {
                state.upgrades.researchProgress = new Map(Object.entries(state.upgrades.researchProgress));
            }
            
            if (state.events.eventCooldowns && !(state.events.eventCooldowns instanceof Map)) {
                state.events.eventCooldowns = new Map(Object.entries(state.events.eventCooldowns));
            }

            return this.setState(state);
        } catch (error) {
            Utils.Debug.log('ERROR', 'GameState deserialization failed', error);
            return false;
        }
    }
}

// Create global game state instance
const gameState = new GameState();

// Export for module systems (if supported)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameState, gameState };
}