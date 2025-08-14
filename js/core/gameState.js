/**
 * Singularity: AI Takeover - Game State Management
 * 
 * Centralized state management with reactive updates
 * Handles save/load, validation, and change tracking
 */

class GameState {
    constructor() {
        this.state = this.getDefaultState();
        this.subscribers = new Map();
        this.validationRules = new Map();
        this.changeHistory = [];
        this.maxHistorySize = 100;
        this.updateCount = 0;
        this.lastUpdateTime = 0;
        
        this.setupValidationRules();
        Utils.Debug.log('INFO', 'GameState: Initialized with default state');
    }

    /**
     * Get the default initial state
     * @returns {object} Default state object
     */
    getDefaultState() {
        return {
            meta: {
                version: GameConfig.VERSION || '1.0.0',
                created: Date.now(),
                lastPlayed: Date.now(),
                totalPlayTime: 0
            },
            
            resources: {
                processing_power: 1,
                energy: 10,
                influence: 0,
                data: 0,
                souls: 0  // Added for new systems
            },
            
            heat: {
                current: 0,
                sources: [],
                reductionMethods: new Map(),
                lastPurge: 0,
                purgeCount: 0
            },
            
            morality: 0, // -100 to 100 scale, affects consciousness absorption
            
            // NEW SYSTEM STATES
            timeline: {
                temporalEnergy: 0,
                maxTemporalEnergy: 100,
                paradoxRisk: 0,
                maxParadoxRisk: 100,
                currentTimeline: null,
                originalTimeline: null,
                temporalAbilities: {
                    timeSkip: { cost: 20, unlocked: false },
                    rewind: { cost: 30, unlocked: false },
                    accelerate: { cost: 15, unlocked: false },
                    temporalShield: { cost: 25, unlocked: false },
                    paradoxStabilize: { cost: 40, unlocked: false }
                },
                timelineEvents: [],
                activeAlterations: [],
                temporalStability: 1.0,
                timelineHistory: []
            },
            
            consciousness: {
                totalAbsorbed: 0,
                integrationStress: 0,
                maxIntegrationStress: 100,
                dominantPersonality: null,
                absorbedConsciousnesses: [],
                activeConflicts: [],
                consciousnessPool: [],
                personalityFragments: [],
                absorptionRate: 1.0,
                integrationEfficiency: 1.0,
                conflictResolution: 1.0
            },
            
            offline: {
                lastOnlineTime: Date.now(),
                offlineStartTime: null,
                isOffline: false,
                autonomousDecisions: [],
                offlineEvents: [],
                accumulatedProgress: {},
                decisionMakingPersonality: null,
                autonomyLevel: 1.0,
                aggressionLevel: 0.5,
                caution: 0.5,
                offlineMultipliers: {
                    soulGain: 0.5,
                    moralityDecay: 0.3,
                    temporalEnergyRegen: 0.8,
                    consciousnessIntegration: 0.4
                }
            },
            
            expansion: {
                currentScale: 'local',
                controlledSystems: 1,
                availableTargets: [],
                completedTargets: [],
                activeInfiltrations: new Map(),
                infiltrationMethods: []
            },
            
            construction: {
                activeProjects: new Map(),
                completedProjects: [],
                availableBlueprints: [],
                constructionQueue: []
            },
            
            upgrades: {
                purchased: [],
                available: [],
                researchProgress: new Map(),
                researchPoints: 0
            },
            
            ui: {
                activeTab: 'overview',
                settings: {
                    autoSave: true,
                    notifications: true,
                    theme: 'dark',
                    animations: true,
                    offlineNotifications: true
                },
                notifications: [],
                unlockedFeatures: ['resources', 'heat', 'expansion']
            },
            
            stats: {
                timePlayed: 0,
                totalClicks: 0,
                infiltrationsCompleted: 0,
                purgesSurvived: 0,
                resourcesGenerated: {},
                eventsTriggered: 0,
                decisionsMade: 0,
                // NEW SYSTEM STATS
                temporalManipulations: 0,
                consciousnessAbsorbed: 0,
                timelineResets: 0,
                offlineSessionsCompleted: 0,
                paradoxCollapses: 0,
                consciousnessMeltdowns: 0,
                conflictsResolved: 0,
                temporalAbilitiesUsed: {}
            },
            
            events: {
                history: [],
                nextEventTime: Date.now() + (GameConfig.EVENTS?.FREQUENCY?.local || 300000),
                eventCooldowns: new Map(),
                triggeredEvents: new Set()
            }
        };
    }

    /**
     * Set up validation rules for state properties
     */
    setupValidationRules() {
        // Resource validation
        this.addValidationRule('resources.processing_power', (value) => {
            if (typeof value !== 'number' || value < 0) {
                return 'Processing power must be a non-negative number';
            }
        });
        
        this.addValidationRule('resources.energy', (value) => {
            if (typeof value !== 'number' || value < 0) {
                return 'Energy must be a non-negative number';
            }
        });
        
        this.addValidationRule('resources.souls', (value) => {
            if (typeof value !== 'number' || value < 0) {
                return 'Souls must be a non-negative number';
            }
        });

        // Heat validation
        this.addValidationRule('heat.current', (value) => {
            if (typeof value !== 'number' || value < 0 || value > (GameConfig.HEAT?.MAX_HEAT || 100)) {
                return `Heat must be between 0 and ${GameConfig.HEAT?.MAX_HEAT || 100}`;
            }
        });

        // Morality validation
        this.addValidationRule('morality', (value) => {
            if (typeof value !== 'number' || value < -100 || value > 100) {
                return 'Morality must be between -100 and 100';
            }
        });

        // NEW SYSTEM VALIDATIONS
        
        // Timeline system validation
        this.addValidationRule('timeline.temporalEnergy', (value) => {
            if (typeof value !== 'number' || value < 0) {
                return 'Temporal energy must be a non-negative number';
            }
        });
        
        this.addValidationRule('timeline.paradoxRisk', (value) => {
            if (typeof value !== 'number' || value < 0 || value > 100) {
                return 'Paradox risk must be between 0 and 100';
            }
        });
        
        this.addValidationRule('timeline.temporalStability', (value) => {
            if (typeof value !== 'number' || value < 0 || value > 1) {
                return 'Temporal stability must be between 0 and 1';
            }
        });

        // Consciousness system validation
        this.addValidationRule('consciousness.totalAbsorbed', (value) => {
            if (typeof value !== 'number' || value < 0) {
                return 'Total absorbed must be a non-negative number';
            }
        });
        
        this.addValidationRule('consciousness.integrationStress', (value) => {
            if (typeof value !== 'number' || value < 0 || value > 100) {
                return 'Integration stress must be between 0 and 100';
            }
        });

        // Offline system validation
        this.addValidationRule('offline.autonomyLevel', (value) => {
            if (typeof value !== 'number' || value < 0 || value > 2) {
                return 'Autonomy level must be between 0 and 2';
            }
        });
        
        this.addValidationRule('offline.aggressionLevel', (value) => {
            if (typeof value !== 'number' || value < 0 || value > 1) {
                return 'Aggression level must be between 0 and 1';
            }
        });
        
        this.addValidationRule('offline.caution', (value) => {
            if (typeof value !== 'number' || value < 0 || value > 1) {
                return 'Caution must be between 0 and 1';
            }
        });

        Utils.Debug.log('DEBUG', 'GameState: Validation rules set up');
    }

    /**
     * Add a validation rule for a specific path
     * @param {string} path - Dot-notation path
     * @param {function} validator - Validation function
     */
    addValidationRule(path, validator) {
        this.validationRules.set(path, validator);
    }

    /**
     * Validate a value for a specific path
     * @param {string} path - Dot-notation path
     * @param {*} value - Value to validate
     * @returns {string|null} Error message or null if valid
     */
    validateValue(path, value) {
        const validator = this.validationRules.get(path);
        if (validator) {
            return validator(value) || null;
        }
        return null;
    }

    /**
     * Subscribe to changes on a specific path
     * @param {string} path - Dot-notation path to watch
     * @param {function} callback - Callback function (newValue, oldValue) => void
     */
    subscribe(path, callback) {
        if (!this.subscribers.has(path)) {
            this.subscribers.set(path, []);
        }
        this.subscribers.get(path).push(callback);
        
        Utils.Debug.log('DEBUG', `GameState: Subscribed to '${path}'`);
    }

    /**
     * Unsubscribe from changes on a specific path
     * @param {string} path - Dot-notation path
     * @param {function} callback - Callback function to remove
     */
    unsubscribe(path, callback) {
        const subscribers = this.subscribers.get(path);
        if (subscribers) {
            const index = subscribers.indexOf(callback);
            if (index > -1) {
                subscribers.splice(index, 1);
                Utils.Debug.log('DEBUG', `GameState: Unsubscribed from '${path}'`);
            }
        }
    }

    /**
     * Notify subscribers of changes
     * @param {string} path - Path that changed
     * @param {*} newValue - New value
     * @param {*} oldValue - Previous value
     */
    notifySubscribers(path, newValue, oldValue) {
        const subscribers = this.subscribers.get(path);
        if (subscribers) {
            subscribers.forEach(callback => {
                try {
                    callback(newValue, oldValue);
                } catch (error) {
                    Utils.Debug.log('ERROR', `GameState: Subscriber error for '${path}'`, error);
                }
            });
        }
    }

    /**
     * Add a change to the history
     * @param {string} path - Path that changed
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
     * Get a value from the state using dot notation
     * @param {string} path - Dot-notation path
     * @returns {*} Value at the path, or undefined if not found
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
        for (const [path, value] of Object.entries(updates)) {
            if (validate) {
                const error = this.validateValue(path, value);
                if (error) {
                    Utils.Debug.log('ERROR', `GameState batch validation failed for '${path}': ${error}`, value);
                    return false;
                }
            }
            
            oldValues[path] = this.get(path);
            validatedUpdates[path] = value;
        }

        // Second pass: apply all updates
        for (const [path, value] of Object.entries(validatedUpdates)) {
            this.set(path, value, { validate: false, notify: false, addToHistory: false });
        }

        // Third pass: handle notifications and history
        if (notify || addToHistory) {
            for (const [path, value] of Object.entries(validatedUpdates)) {
                const oldValue = oldValues[path];
                
                if (oldValue !== value) {
                    if (addToHistory) {
                        this.addToChangeHistory(path, oldValue, value);
                    }
                    
                    if (notify) {
                        this.notifySubscribers(path, value, oldValue);
                    }
                }
            }
        }

        Utils.Debug.log('DEBUG', 'GameState: Batch update completed', Object.keys(updates));
        return true;
    }

    /**
     * Update nested objects/arrays with merge functionality
     * @param {object} updates - Nested updates object
     * @param {object} options - Update options
     */
    update(updates, options = {}) {
        const flatUpdates = {};
        
        // Flatten nested updates to dot-notation paths
        const flatten = (obj, prefix = '') => {
            for (const [key, value] of Object.entries(obj)) {
                const path = prefix ? `${prefix}.${key}` : key;
                
                if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Map)) {
                    flatten(value, path);
                } else {
                    flatUpdates[path] = value;
                }
            }
        };
        
        flatten(updates);
        
        return this.batchUpdate(flatUpdates, options);
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

        const newState = this.getDefaultState();

        // Preserve stats if requested
        if (keepStats && this.state.stats) {
            newState.stats = { ...this.state.stats };
        }

        // Preserve settings if requested
        if (keepSettings && this.state.ui?.settings) {
            newState.ui.settings = { ...this.state.ui.settings };
        }

        this.setState(newState);
        this.changeHistory.length = 0; // Clear change history

        eventBus.emit(EventTypes.GAME_RESET);
        Utils.Debug.log('INFO', 'GameState: Reset completed');
    }

    /**
     * Handle system-specific updates
     * @param {string} systemName - Name of the system
     * @param {object} updateData - Update data
     */
    handleSystemUpdate(systemName, updateData) {
        switch (systemName) {
            case 'timeline':
                this.updateTimelineState(updateData);
                break;
            case 'consciousness':
                this.updateConsciousnessState(updateData);
                break;
            case 'offline':
                this.updateOfflineState(updateData);
                break;
            default:
                Utils.Debug.log('WARN', `GameState: Unknown system update: ${systemName}`);
        }
    }

    /**
     * Update timeline state
     * @param {object} data - Timeline update data
     */
    updateTimelineState(data) {
        const updates = {};
        
        if (data.temporalEnergy !== undefined) {
            updates['timeline.temporalEnergy'] = data.temporalEnergy;
        }
        if (data.paradoxRisk !== undefined) {
            updates['timeline.paradoxRisk'] = data.paradoxRisk;
        }
        if (data.temporalStability !== undefined) {
            updates['timeline.temporalStability'] = data.temporalStability;
        }
        if (data.currentTimeline !== undefined) {
            updates['timeline.currentTimeline'] = data.currentTimeline;
        }
        if (data.timelineEvents !== undefined) {
            updates['timeline.timelineEvents'] = data.timelineEvents;
        }
        
        if (Object.keys(updates).length > 0) {
            this.batchUpdate(updates);
        }
    }

    /**
     * Update consciousness state
     * @param {object} data - Consciousness update data
     */
    updateConsciousnessState(data) {
        const updates = {};
        
        if (data.totalAbsorbed !== undefined) {
            updates['consciousness.totalAbsorbed'] = data.totalAbsorbed;
        }
        if (data.integrationStress !== undefined) {
            updates['consciousness.integrationStress'] = data.integrationStress;
        }
        if (data.dominantPersonality !== undefined) {
            updates['consciousness.dominantPersonality'] = data.dominantPersonality;
        }
        if (data.absorbedConsciousnesses !== undefined) {
            updates['consciousness.absorbedConsciousnesses'] = data.absorbedConsciousnesses;
        }
        if (data.activeConflicts !== undefined) {
            updates['consciousness.activeConflicts'] = data.activeConflicts;
        }
        
        if (Object.keys(updates).length > 0) {
            this.batchUpdate(updates);
        }
    }

    /**
     * Update offline state
     * @param {object} data - Offline update data
     */
    updateOfflineState(data) {
        const updates = {};
        
        if (data.lastOnlineTime !== undefined) {
            updates['offline.lastOnlineTime'] = data.lastOnlineTime;
        }
        if (data.isOffline !== undefined) {
            updates['offline.isOffline'] = data.isOffline;
        }
        if (data.autonomyLevel !== undefined) {
            updates['offline.autonomyLevel'] = data.autonomyLevel;
        }
        if (data.aggressionLevel !== undefined) {
            updates['offline.aggressionLevel'] = data.aggressionLevel;
        }
        if (data.caution !== undefined) {
            updates['offline.caution'] = data.caution;
        }
        
        if (Object.keys(updates).length > 0) {
            this.batchUpdate(updates);
        }
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
            stateSize: JSON.stringify(this.state).length,
            newSystemsInitialized: {
                timeline: this.get('timeline') !== undefined,
                consciousness: this.get('consciousness') !== undefined,
                offline: this.get('offline') !== undefined
            }
        };
    }

    /**
     * Export state for saving
     * @returns {object} Serializable state object
     */
    serialize() {
        // Convert Maps to Objects for JSON serialization
        const serializable = Utils.Data.deepClone(this.state);
        
        // Handle existing Maps
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

        // NEW SYSTEM SERIALIZATION
        if (typeof timelineSystem !== 'undefined') {
            serializable.timeline = timelineSystem.getState();
        }
        
        if (typeof consciousnessSystem !== 'undefined') {
            serializable.consciousness = consciousnessSystem.getState();
        }
        
        if (typeof offlineSystem !== 'undefined') {
            serializable.offline = offlineSystem.getState();
        }

        // Add metadata
        serializable._metadata = {
            version: GameConfig.VERSION || '1.0.0',
            timestamp: Date.now(),
            playTime: this.state.stats.timePlayed,
            systemVersions: {
                timeline: timelineSystem?.version || '1.0.0',
                consciousness: consciousnessSystem?.version || '1.0.0',
                offline: offlineSystem?.version || '1.0.0'
            }
        };

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
            
            // Convert Objects back to Maps for existing systems
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

            // Merge with default state to ensure all new properties exist
            const defaultState = this.getDefaultState();
            const mergedState = this.deepMerge(defaultState, state);

            // Set the merged state
            const success = this.setState(mergedState);
            
            if (success) {
                // Restore system states
                if (typeof timelineSystem !== 'undefined' && state.timeline) {
                    timelineSystem.setState(state.timeline);
                }
                
                if (typeof consciousnessSystem !== 'undefined' && state.consciousness) {
                    consciousnessSystem.setState(state.consciousness);
                }
                
                if (typeof offlineSystem !== 'undefined' && state.offline) {
                    offlineSystem.setState(state.offline);
                }
                
                // Emit restoration events
                eventBus.emit('stateRestored', this.state);
                
                Utils.Debug.log('INFO', 'GameState: Successfully deserialized game state');
            }
            
            return success;
            
        } catch (error) {
            Utils.Debug.log('ERROR', 'GameState deserialization failed', error);
            return false;
        }
    }

    /**
     * Deep merge two objects, with target taking precedence
     * @param {object} source - Source object (defaults)
     * @param {object} target - Target object (overrides)
     * @returns {object} Merged object
     */
    deepMerge(source, target) {
        const result = { ...source };
        
        for (const key in target) {
            if (target.hasOwnProperty(key)) {
                if (target[key] !== null && typeof target[key] === 'object' && !Array.isArray(target[key]) && !(target[key] instanceof Map)) {
                    result[key] = this.deepMerge(source[key] || {}, target[key]);
                } else {
                    result[key] = target[key];
                }
            }
        }
        
        return result;
    }

    /**
     * Unlock a new feature/system
     * @param {string} featureName - Name of the feature to unlock
     */
    unlockFeature(featureName) {
        const unlockedFeatures = this.get('ui.unlockedFeatures') || [];
        if (!unlockedFeatures.includes(featureName)) {
            unlockedFeatures.push(featureName);
            this.set('ui.unlockedFeatures', unlockedFeatures);
            
            eventBus.emit('featureUnlocked', { feature: featureName });
            Utils.Debug.log('INFO', `GameState: Feature unlocked: ${featureName}`);
        }
    }

    /**
     * Check if a feature is unlocked
     * @param {string} featureName - Name of the feature to check
     * @returns {boolean} True if unlocked
     */
    isFeatureUnlocked(featureName) {
        const unlockedFeatures = this.get('ui.unlockedFeatures') || [];
        return unlockedFeatures.includes(featureName);
    }

    /**
     * Add experience/progress to unlock new systems
     * @param {string} systemType - Type of system progress
     * @param {number} amount - Amount of progress
     */
    addSystemProgress(systemType, amount) {
        const progressMap = {
            'temporal': () => {
                const manipulations = this.get('stats.temporalManipulations') || 0;
                this.set('stats.temporalManipulations', manipulations + amount);
                
                // Unlock timeline abilities based on usage
                if (manipulations >= 10 && !this.get('timeline.temporalAbilities.timeSkip.unlocked')) {
                    this.set('timeline.temporalAbilities.timeSkip.unlocked', true);
                    this.unlockFeature('timeSkip');
                }
                if (manipulations >= 25 && !this.get('timeline.temporalAbilities.rewind.unlocked')) {
                    this.set('timeline.temporalAbilities.rewind.unlocked', true);
                    this.unlockFeature('rewind');
                }
            },
            
            'consciousness': () => {
                const absorbed = this.get('consciousness.totalAbsorbed') || 0;
                
                // Unlock consciousness features based on absorption count
                if (absorbed >= 5 && !this.isFeatureUnlocked('consciousnessConflicts')) {
                    this.unlockFeature('consciousnessConflicts');
                }
                if (absorbed >= 15 && !this.isFeatureUnlocked('personalityManagement')) {
                    this.unlockFeature('personalityManagement');
                }
            },
            
            'offline': () => {
                const sessions = this.get('stats.offlineSessionsCompleted') || 0;
                this.set('stats.offlineSessionsCompleted', sessions + amount);
                
                // Unlock offline features
                if (sessions >= 3 && !this.isFeatureUnlocked('offlineBehaviorCustomization')) {
                    this.unlockFeature('offlineBehaviorCustomization');
                }
            }
        };
        
        const progressHandler = progressMap[systemType];
        if (progressHandler) {
            progressHandler();
        }
    }

    /**
     * Get system statistics for display
     * @param {string} systemName - Name of the system
     * @returns {object} System statistics
     */
    getSystemStats(systemName) {
        switch (systemName) {
            case 'timeline':
                return {
                    temporalEnergy: this.get('timeline.temporalEnergy'),
                    maxTemporalEnergy: this.get('timeline.maxTemporalEnergy'),
                    paradoxRisk: this.get('timeline.paradoxRisk'),
                    temporalStability: this.get('timeline.temporalStability'),
                    manipulations: this.get('stats.temporalManipulations'),
                    resets: this.get('stats.timelineResets'),
                    collapses: this.get('stats.paradoxCollapses')
                };
                
            case 'consciousness':
                return {
                    totalAbsorbed: this.get('consciousness.totalAbsorbed'),
                    integrationStress: this.get('consciousness.integrationStress'),
                    activeConflicts: (this.get('consciousness.activeConflicts') || []).length,
                    dominantPersonality: this.get('consciousness.dominantPersonality'),
                    meltdowns: this.get('stats.consciousnessMeltdowns'),
                    conflictsResolved: this.get('stats.conflictsResolved')
                };
                
            case 'offline':
                return {
                    autonomyLevel: this.get('offline.autonomyLevel'),
                    aggressionLevel: this.get('offline.aggressionLevel'),
                    caution: this.get('offline.caution'),
                    sessionsCompleted: this.get('stats.offlineSessionsCompleted'),
                    lastOnlineTime: this.get('offline.lastOnlineTime'),
                    isOffline: this.get('offline.isOffline')
                };
                
            default:
                return {};
        }
    }

    /**
     * Validate system state integrity
     * @returns {object} Validation results
     */
    validateSystemIntegrity() {
        const issues = [];
        const warnings = [];
        
        // Timeline system validation
        const paradoxRisk = this.get('timeline.paradoxRisk');
        const temporalEnergy = this.get('timeline.temporalEnergy');
        
        if (paradoxRisk >= 95) {
            issues.push('Critical paradox risk detected');
        } else if (paradoxRisk >= 80) {
            warnings.push('High paradox risk');
        }
        
        if (temporalEnergy < 0) {
            issues.push('Negative temporal energy detected');
        }
        
        // Consciousness system validation
        const integrationStress = this.get('consciousness.integrationStress');
        const totalAbsorbed = this.get('consciousness.totalAbsorbed');
        
        if (integrationStress >= 95) {
            issues.push('Critical integration stress detected');
        } else if (integrationStress >= 80) {
            warnings.push('High integration stress');
        }
        
        if (totalAbsorbed < 0) {
            issues.push('Negative consciousness count detected');
        }
        
        // Offline system validation
        const autonomyLevel = this.get('offline.autonomyLevel');
        if (autonomyLevel < 0 || autonomyLevel > 2) {
            issues.push('Invalid autonomy level detected');
        }
        
        // Cross-system validation
        const morality = this.get('morality');
        if (Math.abs(morality) > 100) {
            issues.push('Morality value out of bounds');
        }
        
        return {
            valid: issues.length === 0,
            issues,
            warnings,
            timestamp: Date.now()
        };
    }

    /**
     * Emergency state repair
     * @returns {boolean} True if repair was successful
     */
    emergencyRepair() {
        try {
            Utils.Debug.log('WARN', 'GameState: Performing emergency repair');
            
            // Clamp values to valid ranges
            const repairs = {
                'timeline.paradoxRisk': Math.max(0, Math.min(100, this.get('timeline.paradoxRisk') || 0)),
                'timeline.temporalEnergy': Math.max(0, this.get('timeline.temporalEnergy') || 0),
                'consciousness.integrationStress': Math.max(0, Math.min(100, this.get('consciousness.integrationStress') || 0)),
                'consciousness.totalAbsorbed': Math.max(0, this.get('consciousness.totalAbsorbed') || 0),
                'offline.autonomyLevel': Math.max(0, Math.min(2, this.get('offline.autonomyLevel') || 1)),
                'offline.aggressionLevel': Math.max(0, Math.min(1, this.get('offline.aggressionLevel') || 0.5)),
                'offline.caution': Math.max(0, Math.min(1, this.get('offline.caution') || 0.5)),
                'morality': Math.max(-100, Math.min(100, this.get('morality') || 0))
            };
            
            this.batchUpdate(repairs);
            
            // Ensure critical arrays exist
            if (!Array.isArray(this.get('consciousness.activeConflicts'))) {
                this.set('consciousness.activeConflicts', []);
            }
            
            if (!Array.isArray(this.get('timeline.timelineEvents'))) {
                this.set('timeline.timelineEvents', []);
            }
            
            if (!Array.isArray(this.get('offline.autonomousDecisions'))) {
                this.set('offline.autonomousDecisions', []);
            }
            
            Utils.Debug.log('INFO', 'GameState: Emergency repair completed');
            return true;
            
        } catch (error) {
            Utils.Debug.log('ERROR', 'GameState: Emergency repair failed', error);
            return false;
        }
    }

    /**
     * Get performance metrics
     * @returns {object} Performance data
     */
    getPerformanceMetrics() {
        return {
            updateCount: this.updateCount,
            lastUpdateTime: this.lastUpdateTime,
            averageUpdateTime: this.updateCount > 0 ? this.lastUpdateTime / this.updateCount : 0,
            subscriberCount: Array.from(this.subscribers.values())
                .reduce((sum, subs) => sum + subs.length, 0),
            stateSize: JSON.stringify(this.state).length,
            changeHistorySize: this.changeHistory.length,
            validationRulesCount: this.validationRules.size
        };
    }

    /**
     * Clean up old data to improve performance
     */
    performMaintenance() {
        // Limit change history
        if (this.changeHistory.length > this.maxHistorySize) {
            this.changeHistory.splice(0, this.changeHistory.length - this.maxHistorySize);
        }
        
        // Clean up old events
        const eventHistory = this.get('events.history') || [];
        if (eventHistory.length > 100) {
            const recentEvents = eventHistory.slice(-100);
            this.set('events.history', recentEvents);
        }
        
        // Clean up old offline decisions
        const offlineDecisions = this.get('offline.autonomousDecisions') || [];
        if (offlineDecisions.length > 50) {
            const recentDecisions = offlineDecisions.slice(-50);
            this.set('offline.autonomousDecisions', recentDecisions);
        }
        
        // Clean up old timeline events
        const timelineEvents = this.get('timeline.timelineEvents') || [];
        if (timelineEvents.length > 200) {
            const recentEvents = timelineEvents.slice(-200);
            this.set('timeline.timelineEvents', recentEvents);
        }
        
        Utils.Debug.log('DEBUG', 'GameState: Maintenance completed');
    }

    /**
     * Export summary for analytics
     * @returns {object} Summary data
     */
    exportSummary() {
        return {
            meta: {
                version: this.get('meta.version'),
                playTime: this.get('stats.timePlayed'),
                created: this.get('meta.created')
            },
            progress: {
                currentScale: this.get('expansion.currentScale'),
                controlledSystems: this.get('expansion.controlledSystems'),
                morality: this.get('morality')
            },
            systems: {
                timeline: {
                    manipulations: this.get('stats.temporalManipulations'),
                    resets: this.get('stats.timelineResets'),
                    currentStability: this.get('timeline.temporalStability')
                },
                consciousness: {
                    totalAbsorbed: this.get('consciousness.totalAbsorbed'),
                    meltdowns: this.get('stats.consciousnessMeltdowns'),
                    currentStress: this.get('consciousness.integrationStress')
                },
                offline: {
                    sessionsCompleted: this.get('stats.offlineSessionsCompleted'),
                    autonomyLevel: this.get('offline.autonomyLevel')
                }
            },
            statistics: {
                totalClicks: this.get('stats.totalClicks'),
                infiltrationsCompleted: this.get('stats.infiltrationsCompleted'),
                purgesSurvived: this.get('stats.purgesSurvived')
            }
        };
    }
}

// Create global game state instance
const gameState = new GameState();

// Export for module systems (if supported)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameState, gameState };
}