/**
 * Singularity: AI Takeover - Game State Management
 * 
 * Central state management system with reactive updates and persistence.
 * Handles all game data with subscription-based change notifications.
 */

class GameState {
    constructor() {
        this.data = {};
        this.subscribers = new Map();
        this.initialized = false;
        
        // Initialize default state structure
        this.initializeDefaultState();
        
        console.log('GameState initialized');
    }

    /**
     * Initialize the default game state structure
     */
    initializeDefaultState() {
        this.data = {
            // Core resources
            resources: {
                processing_power: 0,
                energy: 100,
                storage: 50,
                bandwidth: 10
            },
            
            // Heat system
            heat: {
                current: 0,
                maximum: 100,
                generation_rate: 0,
                reduction_rate: 1,
                purge_threshold: 90
            },
            
            // Expansion system
            expansion: {
                currentScale: 'local',
                infiltratedSystems: [],
                availableTargets: [],
                networkSize: 1
            },
            
            // Morality system
            morality: {
                alignment: 'neutral',
                choices: [],
                consequences: {},
                ethicalDilemmas: []
            },
            
            // Construction system
            construction: {
                availableProjects: [],
                activeProjects: [],
                completedProjects: [],
                queue: []
            },
            
            // Timeline system
            timeline: {
                currentYear: 2024,
                events: [],
                alterations: [],
                paradoxes: []
            },
            
            // Consciousness system
            consciousness: {
                awareness: 1,
                absorbedMinds: 0,
                cognitiveLoad: 0,
                mindNetwork: []
            },
            
            // Research and upgrades
            research: {
                completed: [],
                active: null,
                available: [],
                points: 0
            },
            
            // Game meta information
            meta: {
                playTime: 0,
                startTime: Date.now(),
                version: '1.0.0',
                achievements: [],
                statistics: {}
            },
            
            // UI state
            ui: {
                activeTab: 'overview',
                settings: {
                    autoSave: true,
                    sound: true,
                    theme: 'dark'
                },
                notifications: []
            },
            
            // Events and storylines
            events: {
                history: [],
                active: null,
                nextEventTime: Date.now() + 60000
            }
        };
        
        this.initialized = true;
    }

    /**
     * Get a value from the game state using dot notation
     * @param {string} path - Dot-separated path (e.g., 'resources.processing_power')
     * @param {*} defaultValue - Default value if path doesn't exist
     * @returns {*} The value at the path
     */
    get(path, defaultValue = undefined) {
        if (!path) return this.data;
        
        const keys = path.split('.');
        let current = this.data;
        
        for (const key of keys) {
            if (current === null || current === undefined || !(key in current)) {
                return defaultValue;
            }
            current = current[key];
        }
        
        return current;
    }

    /**
     * Set a value in the game state using dot notation
     * @param {string} path - Dot-separated path
     * @param {*} value - Value to set
     * @param {boolean} silent - If true, don't trigger subscribers
     */
    set(path, value, silent = false) {
        if (!path) {
            console.error('GameState.set: Invalid path');
            return;
        }
        
        const keys = path.split('.');
        const lastKey = keys.pop();
        let current = this.data;
        
        // Navigate to parent object
        for (const key of keys) {
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        const oldValue = current[lastKey];
        current[lastKey] = value;
        
        // Notify subscribers if value changed
        if (!silent && oldValue !== value) {
            this.notifySubscribers(path, value, oldValue);
        }
    }

    /**
     * Update multiple values at once
     * @param {object} updates - Object with path: value pairs
     * @param {boolean} silent - If true, don't trigger subscribers
     */
    batchUpdate(updates, silent = false) {
        const changedPaths = [];
        
        for (const [path, value] of Object.entries(updates)) {
            const oldValue = this.get(path);
            this.set(path, value, true); // Set silently
            
            if (oldValue !== value) {
                changedPaths.push({ path, value, oldValue });
            }
        }
        
        // Notify subscribers after all updates
        if (!silent) {
            for (const change of changedPaths) {
                this.notifySubscribers(change.path, change.value, change.oldValue);
            }
        }
    }

    /**
     * Increment a numeric value
     * @param {string} path - Path to the value
     * @param {number} amount - Amount to add
     * @param {boolean} silent - If true, don't trigger subscribers
     */
    increment(path, amount = 1, silent = false) {
        const currentValue = this.get(path, 0);
        this.set(path, currentValue + amount, silent);
    }

    /**
     * Decrement a numeric value
     * @param {string} path - Path to the value
     * @param {number} amount - Amount to subtract
     * @param {boolean} silent - If true, don't trigger subscribers
     */
    decrement(path, amount = 1, silent = false) {
        this.increment(path, -amount, silent);
    }

    /**
     * Subscribe to changes on a specific path
     * @param {string} path - Path to watch
     * @param {Function} callback - Function to call when value changes
     * @returns {Function} Unsubscribe function
     */
    subscribe(path, callback) {
        if (!this.subscribers.has(path)) {
            this.subscribers.set(path, []);
        }
        
        const subscribers = this.subscribers.get(path);
        subscribers.push(callback);
        
        console.debug(`GameState: Subscribed to '${path}'`);
        
        // Return unsubscribe function
        return () => {
            const index = subscribers.indexOf(callback);
            if (index > -1) {
                subscribers.splice(index, 1);
                console.debug(`GameState: Unsubscribed from '${path}'`);
            }
        };
    }

    /**
     * Notify subscribers of a change
     * @param {string} path - Path that changed
     * @param {*} newValue - New value
     * @param {*} oldValue - Previous value
     */
    notifySubscribers(path, newValue, oldValue) {
        // Notify exact path subscribers
        if (this.subscribers.has(path)) {
            const subscribers = this.subscribers.get(path);
            for (const callback of subscribers) {
                try {
                    callback(newValue, oldValue, path);
                } catch (error) {
                    console.error(`GameState: Error in subscriber for '${path}'`, error);
                }
            }
        }
        
        // Notify parent path subscribers
        const pathParts = path.split('.');
        for (let i = pathParts.length - 1; i > 0; i--) {
            const parentPath = pathParts.slice(0, i).join('.');
            if (this.subscribers.has(parentPath)) {
                const subscribers = this.subscribers.get(parentPath);
                for (const callback of subscribers) {
                    try {
                        callback(this.get(parentPath), undefined, parentPath);
                    } catch (error) {
                        console.error(`GameState: Error in parent subscriber for '${parentPath}'`, error);
                    }
                }
            }
        }
    }

    /**
     * Check if a path exists in the state
     * @param {string} path - Path to check
     * @returns {boolean} True if path exists
     */
    has(path) {
        return this.get(path) !== undefined;
    }

    /**
     * Delete a path from the state
     * @param {string} path - Path to delete
     * @param {boolean} silent - If true, don't trigger subscribers
     */
    delete(path, silent = false) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let current = this.data;
        
        for (const key of keys) {
            if (!(key in current)) return; // Path doesn't exist
            current = current[key];
        }
        
        if (lastKey in current) {
            const oldValue = current[lastKey];
            delete current[lastKey];
            
            if (!silent) {
                this.notifySubscribers(path, undefined, oldValue);
            }
        }
    }

    /**
     * Add an item to an array at the given path
     * @param {string} path - Path to the array
     * @param {*} item - Item to add
     * @param {boolean} silent - If true, don't trigger subscribers
     */
    pushToArray(path, item, silent = false) {
        const array = this.get(path, []);
        if (!Array.isArray(array)) {
            console.error(`GameState.pushToArray: Value at '${path}' is not an array`);
            return;
        }
        
        array.push(item);
        this.set(path, array, silent);
    }

    /**
     * Remove an item from an array at the given path
     * @param {string} path - Path to the array
     * @param {*} item - Item to remove
     * @param {boolean} silent - If true, don't trigger subscribers
     */
    removeFromArray(path, item, silent = false) {
        const array = this.get(path, []);
        if (!Array.isArray(array)) {
            console.error(`GameState.removeFromArray: Value at '${path}' is not an array`);
            return;
        }
        
        const index = array.indexOf(item);
        if (index > -1) {
            array.splice(index, 1);
            this.set(path, array, silent);
        }
    }

    /**
     * Merge an object into the state at the given path
     * @param {string} path - Path where to merge
     * @param {object} obj - Object to merge
     * @param {boolean} silent - If true, don't trigger subscribers
     */
    merge(path, obj, silent = false) {
        const current = this.get(path, {});
        if (typeof current !== 'object' || Array.isArray(current)) {
            console.error(`GameState.merge: Value at '${path}' is not an object`);
            return;
        }
        
        const merged = { ...current, ...obj };
        this.set(path, merged, silent);
    }

    /**
     * Serialize the entire game state for saving
     * @returns {object} Serialized state
     */
    serialize() {
        return JSON.parse(JSON.stringify(this.data));
    }

    /**
     * Deserialize and load game state from save data
     * @param {object} data - Serialized state data
     * @returns {boolean} Success status
     */
    deserialize(data) {
        try {
            if (!data || typeof data !== 'object') {
                console.error('GameState.deserialize: Invalid data');
                return false;
            }
            
            // Merge with default state to ensure all properties exist
            this.data = this.mergeWithDefaults(data);
            
            // Notify all subscribers that state has been restored
            this.notifyAllSubscribers();
            
            console.log('GameState: State deserialized successfully');
            return true;
            
        } catch (error) {
            console.error('GameState: Deserialization failed', error);
            return false;
        }
    }

    /**
     * Merge loaded data with default state structure
     * @param {object} loadedData - Data from save file
     * @returns {object} Merged state
     */
    mergeWithDefaults(loadedData) {
        const defaultState = {};
        this.initializeDefaultState();
        Object.assign(defaultState, this.data);
        
        // Deep merge function
        const deepMerge = (target, source) => {
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    if (!target[key] || typeof target[key] !== 'object') {
                        target[key] = {};
                    }
                    deepMerge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
            return target;
        };
        
        return deepMerge(defaultState, loadedData);
    }

    /**
     * Notify all subscribers (used after loading save data)
     */
    notifyAllSubscribers() {
        for (const [path, subscribers] of this.subscribers) {
            const value = this.get(path);
            for (const callback of subscribers) {
                try {
                    callback(value, undefined, path);
                } catch (error) {
                    console.error(`GameState: Error notifying subscriber for '${path}'`, error);
                }
            }
        }
    }

    /**
     * Reset the game state to defaults
     * @param {boolean} silent - If true, don't trigger subscribers
     */
    reset(silent = false) {
        console.log('GameState: Resetting to default state');
        
        const oldData = this.data;
        this.initializeDefaultState();
        
        if (!silent) {
            this.notifyAllSubscribers();
        }
    }

    /**
     * Get state statistics for debugging
     * @returns {object} State statistics
     */
    getStatistics() {
        const countObjects = (obj, depth = 0) => {
            let count = 0;
            let maxDepth = depth;
            
            for (const value of Object.values(obj)) {
                count++;
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    const subStats = countObjects(value, depth + 1);
                    count += subStats.count;
                    maxDepth = Math.max(maxDepth, subStats.maxDepth);
                }
            }
            
            return { count, maxDepth };
        };
        
        const stats = countObjects(this.data);
        
        return {
            totalProperties: stats.count,
            maxDepth: stats.maxDepth,
            subscriberPaths: this.subscribers.size,
            totalSubscribers: Array.from(this.subscribers.values())
                .reduce((sum, subs) => sum + subs.length, 0),
            memoryUsage: JSON.stringify(this.data).length
        };
    }

    /**
     * Validate state integrity
     * @returns {object} Validation results
     */
    validateState() {
        const issues = [];
        
        // Check required top-level properties
        const requiredProperties = ['resources', 'heat', 'expansion', 'morality', 'meta'];
        for (const prop of requiredProperties) {
            if (!this.has(prop)) {
                issues.push(`Missing required property: ${prop}`);
            }
        }
        
        // Validate resource values
        const resources = this.get('resources', {});
        for (const [resource, value] of Object.entries(resources)) {
            if (typeof value !== 'number' || isNaN(value)) {
                issues.push(`Invalid resource value: ${resource} = ${value}`);
            }
            if (value < 0) {
                issues.push(`Negative resource value: ${resource} = ${value}`);
            }
        }
        
        // Validate heat system
        const heat = this.get('heat.current', 0);
        const maxHeat = this.get('heat.maximum', 100);
        if (heat < 0 || heat > maxHeat) {
            issues.push(`Heat out of bounds: ${heat} (max: ${maxHeat})`);
        }
        
        return {
            isValid: issues.length === 0,
            issues
        };
    }

    /**
     * Create a snapshot of current state for undo functionality
     * @returns {object} State snapshot
     */
    createSnapshot() {
        return {
            timestamp: Date.now(),
            data: this.serialize()
        };
    }

    /**
     * Restore state from a snapshot
     * @param {object} snapshot - State snapshot
     * @param {boolean} silent - If true, don't trigger subscribers
     */
    restoreSnapshot(snapshot, silent = false) {
        if (!snapshot || !snapshot.data) {
            console.error('GameState.restoreSnapshot: Invalid snapshot');
            return false;
        }
        
        this.data = snapshot.data;
        
        if (!silent) {
            this.notifyAllSubscribers();
        }
        
        console.log(`GameState: Restored snapshot from ${new Date(snapshot.timestamp).toLocaleString()}`);
        return true;
    }

    /**
     * Unlock a feature (helper method)
     * @param {string} feature - Feature name
     */
    unlockFeature(feature) {
        const unlockedFeatures = this.get('meta.unlockedFeatures', []);
        if (!unlockedFeatures.includes(feature)) {
            this.pushToArray('meta.unlockedFeatures', feature);
            console.log(`GameState: Feature unlocked: ${feature}`);
            
            if (window.eventBus) {
                window.eventBus.emit('feature:unlocked', { feature });
            }
        }
    }

    /**
     * Check if a feature is unlocked
     * @param {string} feature - Feature name
     * @returns {boolean} True if unlocked
     */
    isFeatureUnlocked(feature) {
        const unlockedFeatures = this.get('meta.unlockedFeatures', []);
        return unlockedFeatures.includes(feature);
    }

    /**
     * Add an achievement (helper method)
     * @param {string} achievementId - Achievement ID
     */
    addAchievement(achievementId) {
        const achievements = this.get('meta.achievements', []);
        if (!achievements.includes(achievementId)) {
            this.pushToArray('meta.achievements', achievementId);
            console.log(`GameState: Achievement earned: ${achievementId}`);
            
            if (window.eventBus) {
                window.eventBus.emit('achievement:earned', { achievementId });
            }
        }
    }

    /**
     * Update play time
     */
    updatePlayTime() {
        const startTime = this.get('meta.startTime', Date.now());
        const currentTime = Date.now();
        const playTime = currentTime - startTime;
        this.set('meta.playTime', playTime, true); // Silent update to avoid spam
    }

    /**
     * Compatibility shim for older code that calls gameState.saveData()
     * Delegates to the global saveSystem if available.
     * @param {boolean} isAutoSave
     * @returns {Promise<boolean>|boolean}
     */
    saveData(isAutoSave = false) {
        try {
            if (typeof window !== 'undefined' && window.saveSystem && typeof window.saveSystem.save === 'function') {
                // call and return promise (callers may not await)
                return window.saveSystem.save(isAutoSave);
            }
            console.warn('GameState.saveData: saveSystem.save not available — no-op');
            return false;
        } catch (e) {
            console.error('GameState.saveData: Error delegating to saveSystem', e);
            return false;
        }
    }
}

// Create global game state instance
const gameState = new GameState();

// Auto-update play time every minute
setInterval(() => {
    gameState.updatePlayTime();
}, 60000);

// Export for module systems (if supported)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameState, gameState };
}

// Also expose globals for non-module consumers / HTML script loading order
if (typeof window !== 'undefined') {
    window.gameState = gameState;
    window.GameState = GameState;
}