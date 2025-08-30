/**
 * Singularity: AI Takeover - Save System
 * 
 * Handles game state persistence, auto-save, and save/load operations.
 * Supports save data migration and validation.
 */

class SaveSystem {
    constructor() {
        this.currentVersion = '1.0.0';
        this.saveKey = 'singularity_save_data';
        this.autoSaveInterval = null;
        this.autoSaveEnabled = true;
        this.autoSaveFrequency = 60000; // 1 minute
        this.maxSaveSlots = 10;
        
        // Save validation and migration
        this.migrations = new Map();
        this.lastSaveTime = 0;
        this.saveInProgress = false;
        
        console.log('SaveSystem initialized');
    }

    /**
     * Initialize the save system
     */
    async init() {
        try {
            // Set up save data migrations
            this.setupMigrations();
            
            // Check for existing save data
            const existingSave = this.loadFromStorage();
            if (existingSave) {
                console.log('SaveSystem: Found existing save data');
            }
            
            // Start auto-save if enabled
            if (this.autoSaveEnabled) {
                this.startAutoSave();
            }
            
            console.log('SaveSystem: Initialization complete');
            
        } catch (error) {
            console.error('SaveSystem: Initialization failed', error);
            throw error;
        }
    }

    /**
     * Save the current game state
     * @param {boolean} isAutoSave - Whether this is an automatic save
     * @returns {Promise<boolean>} Success status
     */
    async save(isAutoSave = false) {
        if (this.saveInProgress) {
            console.warn('SaveSystem: Save already in progress');
            return false;
        }

        this.saveInProgress = true;
        const startTime = performance.now();

        try {
            console.log(`SaveSystem: Starting ${isAutoSave ? 'auto-save' : 'manual save'}`);

            // Collect data from game state
            if (typeof gameState === 'undefined') {
                throw new Error('gameState not available');
            }

            const saveData = {
                version: this.currentVersion,
                timestamp: Date.now(),
                gameState: gameState.serialize(),
                metadata: {
                    playTime: gameState.get('playTime') || 0,
                    currentScale: gameState.get('expansion.currentScale') || 'local',
                    heat: gameState.get('heat.current') || 0
                }
            };

            // Validate save data
            if (!this.validateSaveData(saveData)) {
                throw new Error('Save data validation failed');
            }

            // Store to localStorage
            const serialized = JSON.stringify(saveData);
            localStorage.setItem(this.saveKey, serialized);

            const saveTime = performance.now() - startTime;
            this.lastSaveTime = Date.now();

            console.log(`SaveSystem: Save completed in ${saveTime.toFixed(2)}ms`);

            // Emit save success event
            if (window.eventBus) {
                window.eventBus.emit(EventTypes.GAME_SAVED, {
                    isAutoSave,
                    saveTime,
                    saveSize: serialized.length,
                    timestamp: this.lastSaveTime
                });
            }

            return true;

        } catch (error) {
            console.error('SaveSystem: Save failed', error);

            // Emit save failure event
            if (window.eventBus) {
                window.eventBus.emit(EventTypes.SAVE_FAILED, {
                    error: error.message,
                    isAutoSave
                });
            }

            return false;

        } finally {
            this.saveInProgress = false;
        }
    }

    /**
     * Load game state from save data
     * @returns {Promise<boolean>} Success status
     */
    async load() {
        try {
            console.log('SaveSystem: Loading save data');

            const saveData = this.loadFromStorage();
            if (!saveData) {
                console.log('SaveSystem: No save data found');
                return false;
            }

            console.log(`SaveSystem: Found save data (version ${saveData.version})`);

            // Validate save data
            if (!this.validateSaveData(saveData)) {
                throw new Error('Save data validation failed');
            }

            // Migrate if necessary
            const migratedData = this.migrateSaveData(saveData);

            // Load into game state
            if (typeof gameState === 'undefined') {
                throw new Error('gameState not available');
            }

            const success = gameState.deserialize(migratedData.gameState);
            if (!success) {
                throw new Error('Failed to deserialize game state');
            }

            console.log('SaveSystem: Save data loaded successfully');

            // Emit load success event
            if (window.eventBus) {
                window.eventBus.emit(EventTypes.GAME_LOADED, {
                    version: migratedData.version,
                    timestamp: migratedData.timestamp,
                    metadata: migratedData.metadata
                });
            }

            return true;

        } catch (error) {
            console.error('SaveSystem: Load failed', error);

            // Emit load failure event
            if (window.eventBus) {
                window.eventBus.emit(EventTypes.LOAD_FAILED, {
                    error: error.message
                });
            }

            return false;
        }
    }

    /**
     * Load save data from localStorage
     * @returns {object|null} Save data or null if not found
     */
    loadFromStorage() {
        try {
            const data = localStorage.getItem(this.saveKey);
            if (!data) return null;

            return JSON.parse(data);

        } catch (error) {
            console.error('SaveSystem: Failed to load from storage', error);
            return null;
        }
    }

    /**
     * Check if save data exists
     * @returns {boolean} True if save data exists
     */
    hasSaveData() {
        return localStorage.getItem(this.saveKey) !== null;
    }

    /**
     * Delete save data
     * @returns {boolean} Success status
     */
    deleteSaveData() {
        try {
            localStorage.removeItem(this.saveKey);
            console.log('SaveSystem: Save data deleted');
            return true;

        } catch (error) {
            console.error('SaveSystem: Failed to delete save data', error);
            return false;
        }
    }

    /**
     * Export save data as downloadable file
     * @returns {string} Save data as JSON string
     */
    exportSaveData() {
        const saveData = this.loadFromStorage();
        if (!saveData) {
            throw new Error('No save data to export');
        }

        return JSON.stringify(saveData, null, 2);
    }

    /**
     * Import save data from JSON string
     * @param {string} jsonData - JSON save data
     * @returns {boolean} Success status
     */
    async importSaveData(jsonData) {
        try {
            const saveData = JSON.parse(jsonData);

            if (!this.validateSaveData(saveData)) {
                throw new Error('Invalid save data format');
            }

            // Store imported data
            localStorage.setItem(this.saveKey, JSON.stringify(saveData));

            // Load the imported data
            return await this.load();

        } catch (error) {
            console.error('SaveSystem: Import failed', error);
            return false;
        }
    }

    /**
     * Validate save data structure
     * @param {object} saveData - Save data to validate
     * @returns {boolean} True if valid
     */
    validateSaveData(saveData) {
        if (!saveData || typeof saveData !== 'object') {
            console.error('SaveSystem: Invalid save data - not an object');
            return false;
        }

        if (!saveData.version || !saveData.timestamp || !saveData.gameState) {
            console.error('SaveSystem: Invalid save data - missing required fields');
            return false;
        }

        if (typeof saveData.gameState !== 'object') {
            console.error('SaveSystem: Invalid save data - gameState is not an object');
            return false;
        }

        return true;
    }

    /**
     * Migrate save data to current version
     * @param {object} saveData - Save data to migrate
     * @returns {object} Migrated save data
     */
    migrateSaveData(saveData) {
        let currentData = { ...saveData };
        let currentVersion = saveData.version || '0.0.1';

        if (currentVersion === this.currentVersion) {
            return currentData; // No migration needed
        }

        console.log(`SaveSystem: Migrating save data from ${currentVersion} to ${this.currentVersion}`);

        // Apply migrations in sequence
        const migrationPath = this.findMigrationPath(currentVersion, this.currentVersion);

        for (const migration of migrationPath) {
            const migrationFunction = this.migrations.get(migration);
            if (migrationFunction) {
                try {
                    currentData = migrationFunction(currentData);
                    console.debug(`SaveSystem: Applied migration ${migration}`);
                } catch (error) {
                    console.error(`SaveSystem: Migration ${migration} failed`, error);
                    throw new Error(`Migration failed: ${migration}`);
                }
            }
        }

        // Update version
        currentData.version = this.currentVersion;

        console.log('SaveSystem: Migration completed successfully');
        return currentData;
    }

    /**
     * Find migration path between versions
     * @param {string} fromVersion - Starting version
     * @param {string} toVersion - Target version
     * @returns {string[]} Array of migration keys
     */
    findMigrationPath(fromVersion, toVersion) {
        // Simple version-to-version migration for now
        // In a more complex system, this would handle multi-step migrations
        const migrationKey = `${fromVersion}_to_${toVersion}`;
        
        if (this.migrations.has(migrationKey)) {
            return [migrationKey];
        }

        // No specific migration found, return empty array
        console.warn(`SaveSystem: No migration path found from ${fromVersion} to ${toVersion}`);
        return [];
    }

    /**
     * Setup save data migrations
     */
    setupMigrations() {
        // Example migration from 0.9.0 to 1.0.0
        this.migrations.set('0.9.0_to_1.0.0', (saveData) => {
            // Example: Rename 'processing_power' to 'computingPower'
            if (saveData.gameState.resources && saveData.gameState.resources.processing_power) {
                saveData.gameState.resources.computingPower = saveData.gameState.resources.processing_power;
                delete saveData.gameState.resources.processing_power;
            }
            return saveData;
        });

        // Add more migrations as needed
        console.debug(`SaveSystem: Set up ${this.migrations.size} migrations`);
    }

    /**
     * Start automatic saving
     */
    startAutoSave() {
        if (this.autoSaveInterval) {
            this.stopAutoSave();
        }

        this.autoSaveInterval = setInterval(async () => {
            if (this.autoSaveEnabled && !this.saveInProgress) {
                const success = await this.save(true);
                if (success) {
                    console.debug('SaveSystem: Auto-save completed');
                }
            }
        }, this.autoSaveFrequency);

        console.log('SaveSystem: Auto-save started');
    }

    /**
     * Stop automatic saving
     */
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
            console.log('SaveSystem: Auto-save stopped');
        }
    }

    /**
     * Enable or disable auto-save
     * @param {boolean} enabled - Whether to enable auto-save
     */
    setAutoSaveEnabled(enabled) {
        this.autoSaveEnabled = enabled;

        if (enabled) {
            this.startAutoSave();
        } else {
            this.stopAutoSave();
        }

        console.log(`SaveSystem: Auto-save ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Set auto-save frequency
     * @param {number} frequency - Frequency in milliseconds
     */
    setAutoSaveFrequency(frequency) {
        if (frequency < 10000) { // Minimum 10 seconds
            console.warn('SaveSystem: Auto-save frequency too low, setting to 10 seconds');
            frequency = 10000;
        }

        this.autoSaveFrequency = frequency;

        // Restart auto-save with new frequency
        if (this.autoSaveEnabled) {
            this.startAutoSave();
        }

        console.log(`SaveSystem: Auto-save frequency set to ${frequency / 1000} seconds`);
    }

    /**
     * Get save system status
     * @returns {object} Status information
     */
    getStatus() {
        return {
            currentVersion: this.currentVersion,
            autoSaveEnabled: this.autoSaveEnabled,
            autoSaveFrequency: this.autoSaveFrequency,
            lastSaveTime: this.lastSaveTime,
            saveInProgress: this.saveInProgress,
            hasSaveData: this.hasSaveData(),
            availableMigrations: Array.from(this.migrations.keys())
        };
    }

    /**
     * Get save data metadata without loading full save
     * @returns {object|null} Save metadata
     */
    getSaveMetadata() {
        const saveData = this.loadFromStorage();
        if (!saveData) return null;

        return {
            version: saveData.version,
            timestamp: saveData.timestamp,
            metadata: saveData.metadata || {}
        };
    }
}

// Create global save system instance
const saveSystem = new SaveSystem();

// Export for module systems (if supported)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SaveSystem, saveSystem };
}

// Also expose globals for non-module consumers
if (typeof window !== 'undefined') {
    window.saveSystem = saveSystem;
    window.SaveSystem = SaveSystem;
}