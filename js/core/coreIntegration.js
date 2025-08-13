/**
 * Singularity: AI Takeover - Core System Integration
 * 
 * Integrates gameLoop, saveSystem, gameState, and eventBus
 * Registers core systems and manages their interactions
 */

class CoreIntegration {
    constructor() {
        this.initialized = false;
        this.systemsRegistered = false;
        this.updateHandlers = new Map();
        
        Utils.Debug.log('INFO', 'CoreIntegration: Initializing...');
    }

    /**
     * Initialize core system integration
     */
    async init() {
        if (this.initialized) {
            Utils.Debug.log('WARN', 'CoreIntegration: Already initialized');
            return;
        }

        try {
            // Set up event handlers first
            this.setupEventHandlers();
            
            // Register core systems with game loop
            this.registerCoreSystems();
            
            // Initialize save system
            this.initializeSaveSystem();
            
            // Set up cross-system communications
            this.setupSystemCommunication();
            
            this.initialized = true;
            Utils.Debug.log('INFO', 'CoreIntegration: Initialization complete');
            
        } catch (error) {
            Utils.Debug.log('ERROR', 'CoreIntegration: Initialization failed', error);
            throw error;
        }
    }

    /**
     * Set up event handlers for core systems
     */
    setupEventHandlers() {
        // Game lifecycle events
        eventBus.on(EventTypes.GAME_STARTED, this.onGameStarted.bind(this));
        eventBus.on(EventTypes.GAME_PAUSED, this.onGamePaused.bind(this));
        eventBus.on(EventTypes.GAME_RESUMED, this.onGameResumed.bind(this));
        
        // Save/Load events
        eventBus.on(EventTypes.GAME_SAVED, this.onGameSaved.bind(this));
        eventBus.on(EventTypes.GAME_LOADED, this.onGameLoaded.bind(this));
        eventBus.on(EventTypes.SAVE_FAILED, this.onSaveFailed.bind(this));
        eventBus.on(EventTypes.LOAD_FAILED, this.onLoadFailed.bind(this));
        
        // Performance monitoring
        eventBus.on('performance:stats_updated', this.onPerformanceUpdate.bind(this));
        
        Utils.Debug.log('DEBUG', 'CoreIntegration: Event handlers set up');
    }

    /**
     * Register core systems with the game loop
     */
    registerCoreSystems() {
        if (this.systemsRegistered) {
            Utils.Debug.log('WARN', 'CoreIntegration: Systems already registered');
            return;
        }

        // Resource System (highest priority)
        gameLoop.registerSystem(
            'resources',
            this.updateResources.bind(this),
            10, // High priority
            2   // 2ms budget
        );

        // Heat System
        gameLoop.registerSystem(
            'heat',
            this.updateHeat.bind(this),
            20, // Medium-high priority
            1   // 1ms budget
        );

        // Expansion System
        gameLoop.registerSystem(
            'expansion',
            this.updateExpansion.bind(this),
            30, // Medium priority
            3   // 3ms budget
        );

        // Events System
        gameLoop.registerSystem(
            'events',
            this.updateEvents.bind(this),
            40, // Lower priority
            2   // 2ms budget
        );

        // Statistics System
        gameLoop.registerSystem(
            'statistics',
            this.updateStatistics.bind(this),
            50, // Lowest priority
            1   // 1ms budget
        );

        this.systemsRegistered = true;
        Utils.Debug.log('INFO', 'CoreIntegration: Core systems registered with game loop');
    }

    /**
     * Initialize save system integration
     */
    initializeSaveSystem() {
        // Enable auto-save if configured
        if (gameState.get('ui.settings.autoSave')) {
            saveSystem.startAutoSave();
        }

        // Subscribe to settings changes
        gameState.subscribe('ui.settings.autoSave', (enabled) => {
            if (enabled) {
                saveSystem.startAutoSave();
            } else {
                saveSystem.stopAutoSave();
            }
        });

        Utils.Debug.log('DEBUG', 'CoreIntegration: Save system integration initialized');
    }

    /**
     * Set up cross-system communication
     */
    setupSystemCommunication() {
        // Resource changes trigger UI updates
        gameState.subscribe('resources', () => {
            eventBus.queue('ui:update_resources');
        });

        // Heat changes trigger UI updates and warnings
        gameState.subscribe('heat.current', (newHeat, oldHeat) => {
            eventBus.queue('ui:update_heat');
            
            if (newHeat >= 90 && oldHeat < 90) {
                eventBus.queue('ui:heat_critical_warning');
            }
        });

        // Scale changes trigger system updates
        gameState.subscribe('expansion.currentScale', (newScale) => {
            eventBus.queue('systems:scale_changed', { scale: newScale });
        });

        Utils.Debug.log('DEBUG', 'CoreIntegration: Cross-system communication set up');
    }

    /**
     * Update resource system
     * @param {number} deltaTime - Time since last update
     * @param {number} currentTime - Current timestamp
     */
    updateResources(deltaTime, currentTime) {
        const deltaSeconds = deltaTime / 1000;
        const resources = gameState.get('resources');
        const rates = gameState.get('resourceRates');
        const caps = gameState.get('resourceCaps');
        
        // Apply heat penalty to processing power
        const heat = gameState.get('heat.current') || 0;
        const heatPenalty = Utils.Game.calculateHeatPenalty(heat);
        
        let resourcesChanged = false;
        const resourceUpdates = {};
        
        // Update each resource
        for (const [resourceType, rate] of Object.entries(rates)) {
            if (rate > 0) {
                const currentAmount = resources[resourceType] || 0;
                const cap = caps[resourceType] || Infinity;
                
                // Apply penalties and bonuses
                let effectiveRate = rate;
                if (resourceType === 'processing_power') {
                    effectiveRate *= heatPenalty;
                }
                
                const generated = effectiveRate * deltaSeconds;
                const newAmount = Math.min(currentAmount + generated, cap);
                
                if (newAmount !== currentAmount) {
                    resourceUpdates[resourceType] = newAmount;
                    resourcesChanged = true;
                    
                    // Track statistics
                    const stats = gameState.get('stats.resourcesGenerated') || {};
                    stats[resourceType] = (stats[resourceType] || 0) + generated;
                    gameState.set('stats.resourcesGenerated', stats);
                }
            }
        }
        
        // Batch update resources if any changed
        if (resourcesChanged) {
            // Update resources in gameState
            Object.assign(resources, resourceUpdates);
            gameState.set('resources', resources);
        }
    }

    /**
     * Update heat system
     * @param {number} deltaTime - Time since last update
     * @param {number} currentTime - Current timestamp
     */
    updateHeat(deltaTime, currentTime) {
        const deltaMinutes = deltaTime / 60000;
        const controlledSystems = gameState.get('expansion.controlledSystems') || 1;
        const currentHeat = gameState.get('heat.current') || 0;
        
        // Calculate passive heat generation
        const baseHeatRate = GameConfig.HEAT.PASSIVE_HEAT_BASE;
        const scalingFactor = GameConfig.HEAT.PASSIVE_HEAT_SCALING;
        const passiveHeat = baseHeatRate * Math.pow(controlledSystems, scalingFactor) * deltaMinutes;
        
        // Apply heat reduction methods
        const reductionMethods = gameState.get('heat.reductionMethods') || new Map();
        let totalReduction = 0;
        
        for (const [method, data] of reductionMethods) {
            if (data.active && data.rate > 0) {
                totalReduction += data.rate * deltaMinutes;
            }
        }
        
        // Calculate new heat level
        const netHeatChange = passiveHeat - totalReduction;
        const newHeat = Utils.Numbers.clamp(currentHeat + netHeatChange, 0, GameConfig.HEAT.MAX_HEAT);
        
        if (newHeat !== currentHeat) {
            gameState.set('heat.current', newHeat);
            
            // Check for purge condition
            if (newHeat >= GameConfig.HEAT.PURGE_THRESHOLD) {
                eventBus.queue(EventTypes.HEAT_PURGE_TRIGGERED);
            }
        }
    }

    /**
     * Update expansion system
     * @param {number} deltaTime - Time since last update
     * @param {number} currentTime - Current timestamp
     */
    updateExpansion(deltaTime, currentTime) {
        const activeInfiltrations = gameState.get('expansion.activeInfiltrations') || new Map();
        const completedInfiltrations = [];
        
        // Update active infiltrations
        for (const [targetId, infiltration] of activeInfiltrations) {
            infiltration.timeRemaining -= deltaTime;
            
            if (infiltration.timeRemaining <= 0) {
                // Infiltration complete - determine success
                const success = this.resolveInfiltration(infiltration);
                
                if (success) {
                    this.applyInfiltrationSuccess(infiltration);
                } else {
                    this.applyInfiltrationFailure(infiltration);
                }
                
                completedInfiltrations.push(targetId);
                
                eventBus.queue(EventTypes.EXPANSION_INFILTRATION_COMPLETED, {
                    target: infiltration.target,
                    success
                });
            }
        }
        
        // Remove completed infiltrations
        for (const targetId of completedInfiltrations) {
            activeInfiltrations.delete(targetId);
        }
        
        if (completedInfiltrations.length > 0) {
            gameState.set('expansion.activeInfiltrations', activeInfiltrations);
        }
    }

    /**
     * Update events system
     * @param {number} deltaTime - Time since last update
     * @param {number} currentTime - Current timestamp
     */
    updateEvents(deltaTime, currentTime) {
        const nextEventTime = gameState.get('events.nextEventTime');
        
        if (currentTime >= nextEventTime) {
            this.triggerRandomEvent(currentTime);
        }
        
        // Update event cooldowns
        const cooldowns = gameState.get('events.eventCooldowns') || new Map();
        const updatedCooldowns = new Map();
        
        for (const [eventId, cooldownEnd] of cooldowns) {
            if (currentTime < cooldownEnd) {
                updatedCooldowns.set(eventId, cooldownEnd);
            }
        }
        
        if (updatedCooldowns.size !== cooldowns.size) {
            gameState.set('events.eventCooldowns', updatedCooldowns);
        }
    }

    /**
     * Update statistics system
     * @param {number} deltaTime - Time since last update
     * @param {number} currentTime - Current timestamp
     */
    updateStatistics(deltaTime, currentTime) {
        // Update total play time
        const currentPlayTime = gameState.get('stats.timePlayed') || 0;
        gameState.set('stats.timePlayed', currentPlayTime + deltaTime);
        
        // Update meta information
        gameState.set('meta.lastPlayed', currentTime);
    }

    /**
     * Resolve infiltration success/failure
     * @param {object} infiltration - Infiltration data
     * @returns {boolean} True if successful
     */
    resolveInfiltration(infiltration) {
        const { target, processingPowerUsed } = infiltration;
        const heat = gameState.get('heat.current') || 0;
        
        const successChance = Utils.Game.calculateSuccessChance(
            processingPowerUsed,
            target.difficulty,
            heat
        );
        
        return Math.random() < successChance;
    }

    /**
     * Apply successful infiltration effects
     * @param {object} infiltration - Infiltration data
     */
    applyInfiltrationSuccess(infiltration) {
        const { target } = infiltration;
        const resources = gameState.get('resources');
        
        // Apply rewards
        for (const [resource, amount] of Object.entries(target.rewards)) {
            resources[resource] = (resources[resource] || 0) + amount;
        }
        
        gameState.batchUpdate({
            'resources': resources,
            'expansion.controlledSystems': (gameState.get('expansion.controlledSystems') || 1) + 1,
            'stats.infiltrationsCompleted': (gameState.get('stats.infiltrationsCompleted') || 0) + 1
        });
        
        // Add to completed targets
        const completedTargets = gameState.get('expansion.completedTargets') || [];
        completedTargets.push(target.id);
        gameState.set('expansion.completedTargets', completedTargets);
        
        // Add small amount of heat for successful infiltration
        const currentHeat = gameState.get('heat.current') || 0;
        gameState.set('heat.current', Math.min(currentHeat + 2, GameConfig.HEAT.MAX_HEAT));
    }

    /**
     * Apply failed infiltration effects
     * @param {object} infiltration - Infiltration data
     */
    applyInfiltrationFailure(infiltration) {
        const { target } = infiltration;
        
        // Add significant heat for failed infiltration
        const currentHeat = gameState.get('heat.current') || 0;
        const heatIncrease = target.difficulty * 0.5;
        gameState.set('heat.current', Math.min(currentHeat + heatIncrease, GameConfig.HEAT.MAX_HEAT));
    }

    /**
     * Trigger a random event
     * @param {number} currentTime - Current timestamp
     */
    triggerRandomEvent(currentTime) {
        const currentScale = gameState.get('expansion.currentScale') || 'local';
        
        // Schedule next event
        const eventFrequency = GameConfig.EVENTS.FREQUENCY[currentScale] || 300000;
        const nextEventTime = currentTime + eventFrequency * (0.8 + Math.random() * 0.4); // ±20% variance
        gameState.set('events.nextEventTime', nextEventTime);
        
        // Emit random event trigger
        eventBus.queue(EventTypes.RANDOM_EVENT_TRIGGERED, {
            scale: currentScale,
            timestamp: currentTime
        });
    }

    /**
     * Event handlers
     */
    onGameStarted() {
        Utils.Debug.log('INFO', 'CoreIntegration: Game started');
        
        // Start core systems
        if (!gameLoop.isRunning) {
            gameLoop.start();
        }
    }

    onGamePaused() {
        Utils.Debug.log('INFO', 'CoreIntegration: Game paused');
    }

    onGameResumed() {
        Utils.Debug.log('INFO', 'CoreIntegration: Game resumed');
    }

    onGameSaved(data) {
        Utils.Debug.log('INFO', 'CoreIntegration: Game saved', {
            saveTime: data.saveTime,
            size: data.saveSize
        });
    }

    onGameLoaded(data) {
        Utils.Debug.log('INFO', 'CoreIntegration: Game loaded', {
            loadTime: data.loadTime,
            version: data.version
        });
        
        // Refresh all systems after load
        this.refreshAllSystems();
    }

    onSaveFailed(data) {
        Utils.Debug.log('ERROR', 'CoreIntegration: Save failed', data.error);
    }

    onLoadFailed(data) {
        Utils.Debug.log('ERROR', 'CoreIntegration: Load failed', data.error);
    }

    onPerformanceUpdate(data) {
        if (data.fps < 30) {
            Utils.Debug.log('WARN', 'CoreIntegration: Low FPS detected', data);
        }
    }

    /**
     * Refresh all systems after major state changes
     */
    refreshAllSystems() {
        eventBus.emit('systems:refresh_requested');
        
        // Force update all systems
        if (gameLoop.isRunning) {
            gameLoop.forceUpdate();
        }
    }

    /**
     * Get integration status
     * @returns {object} Status information
     */
    getStatus() {
        return {
            initialized: this.initialized,
            systemsRegistered: this.systemsRegistered,
            gameLoopRunning: gameLoop.isRunning,
            saveSystemEnabled: saveSystem.isAutoSaveEnabled,
            registeredSystems: Array.from(gameLoop.updateSystems.keys())
        };
    }

    /**
     * Shutdown integration
     */
    shutdown() {
        Utils.Debug.log('INFO', 'CoreIntegration: Shutting down...');
        
        // Stop game loop
        gameLoop.stop();
        
        // Stop auto-save
        saveSystem.stopAutoSave();
        
        // Clear event handlers
        eventBus.clearAll();
        
        this.initialized = false;
        this.systemsRegistered = false;
        
        Utils.Debug.log('INFO', 'CoreIntegration: Shutdown complete');
    }
}

// Create global integration instance
const coreIntegration = new CoreIntegration();

// Auto-initialize when all dependencies are loaded
if (typeof gameLoop !== 'undefined' && 
    typeof saveSystem !== 'undefined' && 
    typeof gameState !== 'undefined' && 
    typeof eventBus !== 'undefined') {
    
    // Initialize on next tick to ensure all modules are loaded
    setTimeout(() => {
        coreIntegration.init().catch(error => {
            Utils.Debug.log('ERROR', 'CoreIntegration: Failed to auto-initialize', error);
        });
    }, 0);
}

// Export for module systems (if supported)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CoreIntegration, coreIntegration };
}