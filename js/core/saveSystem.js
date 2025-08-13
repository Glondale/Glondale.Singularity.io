/**
 * Singularity: AI Takeover - Save System
 * 
 * Handles save/load functionality with compression, validation, migration,
 * and backup management.
 */

class SaveSystem {
    constructor() {
        this.isAutoSaveEnabled = true;
        this.autoSaveInterval = GameConfig.SAVE.AUTO_SAVE_INTERVAL;
        this.autoSaveTimer = null;
        
        // Save metadata
        this.lastSaveTime = 0;
        this.saveCount = 0;
        this.loadCount = 0;
        
        // Compression and validation
        this.compressionEnabled = GameConfig.SAVE.COMPRESS_SAVES;
        this.maxSaveSize = GameConfig.SAVE.MAX_SAVE_SIZE;
        
        // Backup management
        this.maxBackups = 5;
        this.backupKeys = [];
        
        // Migration system
        this.migrations = new Map();
        this.currentVersion = GameConfig.VERSION;
        
        // Performance tracking
        this.saveTime = 0;
        this.loadTime = 0;
        this.compressionRatio = 0;
        
        this.initializeMigrations();
        this.initializeEventHandlers();
        
        Utils.Debug.log('INFO', 'SaveSystem initialized');
    }

    /**
     * Initialize save data migrations for version compatibility
     */
    initializeMigrations() {
        // Example migration from version 0.0.1 to 0.1.0
        this.addMigration('0.0.1', '0.1.0', (saveData) => {
            // Add new fields that didn't exist in 0.0.1
            if (!saveData.gameState.timeline) {
                saveData.gameState.timeline = {
                    temporalEnergy: 0,
                    operationsCompleted: [],
                    paradoxes: 0,
                    timelineStability: 100
                };
            }
            
            return saveData;
        });
        
        // Add more migrations as needed
        Utils.Debug.log('INFO', 'SaveSystem: Migrations initialized');
    }

    /**
     * Initialize event handlers
     */
    initializeEventHandlers() {
        // Auto-save when game state changes significantly
        eventBus.on(EventTypes.EXPANSION_SCALE_CHANGED, () => {
            if (this.isAutoSaveEnabled) {
                this.scheduleSave();
            }
        });
        
        eventBus.on(EventTypes.HEAT_PURGE_COMPLETED, () => {
            if (this.isAutoSaveEnabled) {
                this.save();
            }
        });
        
        // Save before page unload
        window.addEventListener('beforeunload', () => {
            if (this.isAutoSaveEnabled) {
                this.save(true); // Quick save
            }
        });
        
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isAutoSaveEnabled) {
                this.save();
            }
        });
        
        Utils.Debug.log('INFO', 'SaveSystem: Event handlers initialized');
    }

    /**
     * Add a migration function
     * @param {string} fromVersion - Source version
     * @param {string} toVersion - Target version
     * @param {Function} migrationFunction - Function to transform save data
     */
    addMigration(fromVersion, toVersion, migrationFunction) {
        const key = `${fromVersion}->${toVersion}`;
        this.migrations.set(key, migrationFunction);
        
        Utils.Debug.log('DEBUG', `SaveSystem: Added migration ${key}`);
    }

    /**
     * Start auto-save timer
     */
    startAutoSave() {
        this.stopAutoSave(); // Clear any existing timer
        
        if (this.autoSaveInterval > 0) {
            this.autoSaveTimer = setInterval(() => {
                this.save();
            }, this.autoSaveInterval);
            
            this.isAutoSaveEnabled = true;
            Utils.Debug.log('INFO', `SaveSystem: Auto-save started (${this.autoSaveInterval}ms interval)`);
        }
    }

    /**
     * Stop auto-save timer
     */
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
        
        this.isAutoSaveEnabled = false;
        Utils.Debug.log('INFO', 'SaveSystem: Auto-save stopped');
    }

    /**
     * Schedule a save for the next frame (debounced)
     */
    scheduleSave() {
        if (this.scheduledSave) return;
        
        this.scheduledSave = requestAnimationFrame(() => {
            this.save();
            this.scheduledSave = null;
        });
    }

    /**
     * Save the game
     * @param {boolean} quick - Whether to perform a quick save (less validation)
     * @returns {boolean} True if save was successful
     */
    save(quick = false) {
        const startTime = performance.now();
        
        try {
            // Create save data
            const saveData = this.createSaveData();
            
            // Validate save data
            if (!quick && !this.validateSaveData(saveData)) {
                throw new Error('Save data validation failed');
            }
            
            // Compress if enabled
            const processedData = this.compressionEnabled 
                ? this.compressSaveData(saveData)
                : saveData;
            
            // Check size limits
            const serializedData = JSON.stringify(processedData);
            if (serializedData.length > this.maxSaveSize) {
                throw new Error(`Save data too large: ${serializedData.length} > ${this.maxSaveSize}`);
            }
            
            // Create backup before saving
            this.createBackup();
            
            // Save to localStorage
            const success = Utils.Storage.save(GameConfig.SAVE.SAVE_KEY, processedData);
            
            if (!success) {
                throw new Error('Failed to write to localStorage');
            }
            
            // Update save metadata
            this.lastSaveTime = Date.now();
            this.saveCount++;
            this.saveTime = performance.now() - startTime;
            
            // Calculate compression ratio
            if (this.compressionEnabled) {
                const originalSize = JSON.stringify(saveData).length;
                const compressedSize = serializedData.length;
                this.compressionRatio = compressedSize / originalSize;
            }
            
            // Emit save event
            eventBus.emit(EventTypes.GAME_SAVED, {
                saveTime: this.saveTime,
                saveSize: serializedData.length,
                compressed: this.compressionEnabled,
                compressionRatio: this.compressionRatio
            });
            
            Utils.Debug.log('INFO', `SaveSystem: Game saved successfully (${this.saveTime.toFixed(2)}ms, ${serializedData.length} bytes)`);
            
            return true;
            
        } catch (error) {
            Utils.Debug.log('ERROR', 'SaveSystem: Save failed', {
                error: error.message,
                saveTime: performance.now() - startTime
            });
            
            eventBus.emit(EventTypes.SAVE_FAILED, { error });
            return false;
        }
    }

    /**
     * Load the game
     * @param {string} saveKey - Optional save key to load specific save
     * @returns {boolean} True if load was successful
     */
    load(saveKey = GameConfig.SAVE.SAVE_KEY) {
        const startTime = performance.now();
        
        try {
            // Load from localStorage
            const rawData = Utils.Storage.load(saveKey);
            
            if (!rawData) {
                Utils.Debug.log('INFO', 'SaveSystem: No save data found');
                return false;
            }
            
            // Decompress if needed
            const saveData = this.isCompressedSave(rawData) 
                ? this.decompressSaveData(rawData)
                : rawData;
            
            // Validate save data
            if (!this.validateSaveData(saveData)) {
                throw new Error('Save data validation failed');
            }
            
            // Migrate if necessary
            const migratedData = this.migrateSaveData(saveData);
            
            // Load into game state
            const success = gameState.deserialize(migratedData.gameState);
            
            if (!success) {
                throw new Error('Failed to deserialize game state');
            }
            
            // Update load metadata
            this.loadCount++;
            this.loadTime = performance.now() - startTime;
            
            // Emit load event
            eventBus.emit(EventTypes.GAME_LOADED, {
                loadTime: this.loadTime,
                version: migratedData.version,
                migrated: migratedData.version !== this.currentVersion
            });
            
            Utils.Debug.log('INFO', `SaveSystem: Game loaded successfully (${this.loadTime.toFixed(2)}ms)`);
            
            return true;
            
        } catch (error) {
            Utils.Debug.log('ERROR', 'SaveSystem: Load failed', {
                error: error.message,
                loadTime: performance.now() - startTime
            });
            
            eventBus.emit(EventTypes.LOAD_FAILED, { error });
            return false;
        }
    }

    /**
     * Create save data object
     * @returns {object} Save data
     */
    createSaveData() {
        return {
            version: this.currentVersion,
            timestamp: Date.now(),
            gameState: gameState.serialize(),
            metadata: {
                saveCount: this.saveCount,
                totalPlayTime: gameState.get('stats.timePlayed') || 0,
                lastScale: gameState.get('expansion.currentScale'),
                difficulty: gameState.get('meta.difficulty') || 'normal'
            }
        };
    }

    /**
     * Validate save data structure
     * @param {object} saveData - Save data to validate
     * @returns {boolean} True if valid
     */
    validateSaveData(saveData) {
        if (!saveData || typeof saveData !== 'object') {
            Utils.Debug.log('ERROR', 'SaveSystem: Invalid save data - not an object');
            return false;
        }
        
        if (!saveData.version || !saveData.timestamp || !saveData.gameState) {
            Utils.Debug.log('ERROR', 'SaveSystem: Invalid save data - missing required fields');
            return false;
        }
        
        if (typeof saveData.gameState !== 'object') {
            Utils.Debug.log('ERROR', 'SaveSystem: Invalid save data - gameState is not an object');
            return false;
        }
        
        // Validate critical game state fields
        const requiredFields = ['resources', 'heat', 'expansion', 'morality'];
        for (const field of requiredFields) {
            if (!saveData.gameState[field]) {
                Utils.Debug.log('ERROR', `SaveSystem: Invalid save data - missing gameState.${field}`);
                return false;
            }
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
        
        Utils.Debug.log('INFO', `SaveSystem: Migrating save data from ${currentVersion} to ${this.currentVersion}`);
        
        // Apply migrations in sequence
        const migrationPath = this.findMigrationPath(currentVersion, this.currentVersion);
        
        for (const migration of migrationPath) {
            const migrationFunction = this.migrations.get(migration);
            if (migrationFunction) {
                try {
                    currentData = migrationFunction(currentData);
                    Utils.Debug.log('DEBUG', `SaveSystem: Applied migration ${migration}`);
                } catch (error) {
                    Utils.Debug.log('ERROR', `SaveSystem: Migration ${migration} failed`, error);
                    throw new Error(`Migration failed: ${migration}`);
                }
            }
        }
        
        // Update version
        currentData.version = this.currentVersion;
        
        Utils.Debug.log('INFO', 'SaveSystem: Migration completed successfully');
        return currentData;
    }

    /**
     * Find migration path between versions
     * @param {string} fromVersion - Source version
     * @param {string} toVersion - Target version
     * @returns {Array} Array of migration keys
     */
    findMigrationPath(fromVersion, toVersion) {
        // Simple implementation - assumes direct migration exists
        // In a more complex system, you'd implement pathfinding through versions
        const directMigration = `${fromVersion}->${toVersion}`;
        
        if (this.migrations.has(directMigration)) {
            return [directMigration];
        }
        
        // For now, just return empty array if no direct migration
        // In production, implement proper version graph traversal
        Utils.Debug.log('WARN', `SaveSystem: No migration path found from ${fromVersion} to ${toVersion}`);
        return [];
    }

    /**
     * Create a backup of current save
     */
    createBackup() {
        try {
            const currentSave = Utils.Storage.load(GameConfig.SAVE.SAVE_KEY);
            if (!currentSave) return;
            
            const backupKey = `${GameConfig.SAVE.BACKUP_KEY}_${Date.now()}`;
            Utils.Storage.save(backupKey, currentSave);
            
            this.backupKeys.push(backupKey);
            
            // Maintain maximum number of backups
            while (this.backupKeys.length > this.maxBackups) {
                const oldBackup = this.backupKeys.shift();
                Utils.Storage.remove(oldBackup);
            }
            
            Utils.Debug.log('DEBUG', `SaveSystem: Backup created: ${backupKey}`);
            
        } catch (error) {
            Utils.Debug.log('ERROR', 'SaveSystem: Failed to create backup', error);
        }
    }

    /**
     * Get list of available backups
     * @returns {Array} Array of backup information
     */
    getBackups() {
        const backups = [];
        
        for (const backupKey of this.backupKeys) {
            const backupData = Utils.Storage.load(backupKey);
            if (backupData) {
                backups.push({
                    key: backupKey,
                    timestamp: backupData.timestamp,
                    version: backupData.version,
                    metadata: backupData.metadata
                });
            }
        }
        
        return backups.sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Load from a backup
     * @param {string} backupKey - Backup key to load
     * @returns {boolean} True if successful
     */
    loadBackup(backupKey) {
        Utils.Debug.log('INFO', `SaveSystem: Loading backup: ${backupKey}`);
        return this.load(backupKey);
    }

    /**
     * Delete a backup
     * @param {string} backupKey - Backup key to delete
     */
    deleteBackup(backupKey) {
        Utils.Storage.remove(backupKey);
        this.backupKeys = this.backupKeys.filter(key => key !== backupKey);
        Utils.Debug.log('INFO', `SaveSystem: Deleted backup: ${backupKey}`);
    }

    /**
     * Check if save data is compressed
     * @param {object} saveData - Save data to check
     * @returns {boolean} True if compressed
     */
    isCompressedSave(saveData) {
        // Simple check - in a real implementation you'd have a proper compression marker
        return saveData && saveData._compressed === true;
    }

    /**
     * Compress save data
     * @param {object} saveData - Save data to compress
     * @returns {object} Compressed save data
     */
    compressSaveData(saveData) {
        try {
            // Simple compression implementation
            // In a real game, you'd use proper compression like LZ-string
            const jsonString = JSON.stringify(saveData);
            
            // Simulate compression by removing whitespace and shortening keys
            const compressed = this.compressObject(saveData);
            
            return {
                _compressed: true,
                _originalSize: jsonString.length,
                data: compressed
            };
            
        } catch (error) {
            Utils.Debug.log('ERROR', 'SaveSystem: Compression failed', error);
            return saveData; // Return uncompressed on failure
        }
    }

    /**
     * Decompress save data
     * @param {object} compressedData - Compressed save data
     * @returns {object} Decompressed save data
     */
    decompressSaveData(compressedData) {
        try {
            if (!compressedData._compressed) {
                return compressedData;
            }
            
            return this.decompressObject(compressedData.data);
            
        } catch (error) {
            Utils.Debug.log('ERROR', 'SaveSystem: Decompression failed', error);
            throw error;
        }
    }

    /**
     * Simple object compression (key shortening)
     * @param {object} obj - Object to compress
     * @returns {object} Compressed object
     */
    compressObject(obj) {
        // Map of long keys to short keys
        const keyMap = {
            'processing_power': 'pp',
            'bandwidth': 'bw',
            'energy': 'en',
            'matter': 'mt',
            'information': 'inf',
            'temporal_energy': 'te',
            'consciousness_fragments': 'cf',
            'exotic_matter': 'em',
            'current': 'cur',
            'currentScale': 'cs',
            'controlledSystems': 'ctrl',
            'completedTargets': 'ct',
            'availableTargets': 'at',
            'activeInfiltrations': 'ai',
            'totalPlayTime': 'tpt',
            'lastPlayed': 'lp'
        };
        
        return this.transformObjectKeys(obj, keyMap);
    }

    /**
     * Simple object decompression (key expansion)
     * @param {object} obj - Object to decompress
     * @returns {object} Decompressed object
     */
    decompressObject(obj) {
        // Reverse map of short keys to long keys
        const keyMap = {
            'pp': 'processing_power',
            'bw': 'bandwidth',
            'en': 'energy',
            'mt': 'matter',
            'inf': 'information',
            'te': 'temporal_energy',
            'cf': 'consciousness_fragments',
            'em': 'exotic_matter',
            'cur': 'current',
            'cs': 'currentScale',
            'ctrl': 'controlledSystems',
            'ct': 'completedTargets',
            'at': 'availableTargets',
            'ai': 'activeInfiltrations',
            'tpt': 'totalPlayTime',
            'lp': 'lastPlayed'
        };
        
        return this.transformObjectKeys(obj, keyMap);
    }

    /**
     * Transform object keys using a mapping
     * @param {*} obj - Object to transform
     * @param {object} keyMap - Key mapping
     * @returns {*} Transformed object
     */
    transformObjectKeys(obj, keyMap) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.transformObjectKeys(item, keyMap));
        }
        
        const result = {};
        
        for (const [key, value] of Object.entries(obj)) {
            const newKey = keyMap[key] || key;
            result[newKey] = this.transformObjectKeys(value, keyMap);
        }
        
        return result;
    }

    /**
     * Export save data for external use
     * @returns {string} JSON string of save data
     */
    exportSave() {
        try {
            const saveData = this.createSaveData();
            return JSON.stringify(saveData, null, 2);
        } catch (error) {
            Utils.Debug.log('ERROR', 'SaveSystem: Export failed', error);
            return null;
        }
    }

    /**
     * Import save data from external source
     * @param {string} jsonString - JSON string of save data
     * @returns {boolean} True if successful
     */
    importSave(jsonString) {
        try {
            const saveData = JSON.parse(jsonString);
            
            if (!this.validateSaveData(saveData)) {
                throw new Error('Invalid save data format');
            }
            
            // Create backup before importing
            this.createBackup();
            
            // Save imported data
            const success = Utils.Storage.save(GameConfig.SAVE.SAVE_KEY, saveData);
            
            if (success) {
                // Load the imported save
                return this.load();
            }
            
            return false;
            
        } catch (error) {
            Utils.Debug.log('ERROR', 'SaveSystem: Import failed', error);
            return false;
        }
    }

    /**
     * Clear all save data
     */
    clearAll() {
        Utils.Storage.remove(GameConfig.SAVE.SAVE_KEY);
        
        // Clear backups
        for (const backupKey of this.backupKeys) {
            Utils.Storage.remove(backupKey);
        }
        this.backupKeys.length = 0;
        
        // Reset metadata
        this.saveCount = 0;
        this.loadCount = 0;
        this.lastSaveTime = 0;
        
        Utils.Debug.log('INFO', 'SaveSystem: All save data cleared');
        eventBus.emit('save:all_cleared');
    }

    /**
     * Get save system status
     * @returns {object} Status information
     */
    getStatus() {
        const saveExists = Utils.Storage.load(GameConfig.SAVE.SAVE_KEY) !== null;
        const saveSize = saveExists ? JSON.stringify(Utils.Storage.load(GameConfig.SAVE.SAVE_KEY)).length : 0;
        
        return {
            autoSaveEnabled: this.isAutoSaveEnabled,
            autoSaveInterval: this.autoSaveInterval,
            saveExists,
            saveSize,
            saveCount: this.saveCount,
            loadCount: this.loadCount,
            lastSaveTime: this.lastSaveTime,
            backupCount: this.backupKeys.length,
            compressionEnabled: this.compressionEnabled,
            compressionRatio: this.compressionRatio,
            lastSaveTime: this.saveTime,
            lastLoadTime: this.loadTime,
            storageAvailable: Utils.Storage.isAvailable()
        };
    }

    /**
     * Set auto-save settings
     * @param {boolean} enabled - Whether auto-save is enabled
     * @param {number} interval - Auto-save interval in milliseconds
     */
    setAutoSave(enabled, interval = null) {
        if (interval !== null) {
            this.autoSaveInterval = interval;
        }
        
        if (enabled) {
            this.startAutoSave();
        } else {
            this.stopAutoSave();
        }
        
        Utils.Debug.log('INFO', `SaveSystem: Auto-save ${enabled ? 'enabled' : 'disabled'}`, {
            interval: this.autoSaveInterval
        });
    }

    /**
     * Get save file information
     * @returns {object|null} Save file info or null if no save exists
     */
    getSaveInfo() {
        const saveData = Utils.Storage.load(GameConfig.SAVE.SAVE_KEY);
        
        if (!saveData) {
            return null;
        }
        
        return {
            version: saveData.version,
            timestamp: saveData.timestamp,
            metadata: saveData.metadata,
            size: JSON.stringify(saveData).length,
            compressed: this.isCompressedSave(saveData)
        };
    }

    /**
     * Test save/load functionality
     * @returns {boolean} True if test passed
     */
    testSaveLoad() {
        try {
            // Create test data
            const testKey = 'test_save_' + Date.now();
            const testData = {
                version: this.currentVersion,
                timestamp: Date.now(),
                gameState: { test: true, value: 42 }
            };
            
            // Test save
            Utils.Storage.save(testKey, testData);
            
            // Test load
            const loadedData = Utils.Storage.load(testKey);
            
            // Clean up
            Utils.Storage.remove(testKey);
            
            // Validate
            const success = loadedData && 
                           loadedData.version === testData.version &&
                           loadedData.gameState.test === true &&
                           loadedData.gameState.value === 42;
            
            Utils.Debug.log('INFO', `SaveSystem: Test ${success ? 'passed' : 'failed'}`);
            return success;
            
        } catch (error) {
            Utils.Debug.log('ERROR', 'SaveSystem: Test failed', error);
            return false;
        }
    }

    /**
     * Get debug information
     * @returns {object} Debug information
     */
    getDebugInfo() {
        return {
            ...this.getStatus(),
            currentVersion: this.currentVersion,
            maxBackups: this.maxBackups,
            maxSaveSize: this.maxSaveSize,
            migrationCount: this.migrations.size,
            availableMigrations: Array.from(this.migrations.keys())
        };
    }
}

// Create global save system instance
const saveSystem = new SaveSystem();

// Export for module systems (if supported)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SaveSystem, saveSystem };
}