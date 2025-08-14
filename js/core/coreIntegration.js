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
            
            // Initialize all systems
            await this.initializeSystems();
            
            // Register core systems with game loop
            this.registerCoreSystemsWithGameLoop();
            
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
     * Initialize all systems
     */
    async initializeSystems() {
        try {
            Utils.Debug.log('INFO', 'CoreIntegration: Initializing systems...');

            // Initialize new systems
            if (typeof timelineSystem !== 'undefined') {
                await timelineSystem.init();
                Utils.Debug.log('DEBUG', 'Timeline system initialized');
            }

            if (typeof consciousnessSystem !== 'undefined') {
                // Pass morality system reference if available
                const moralityRef = gameState.get('morality') !== undefined ? gameState : null;
                await consciousnessSystem.init(moralityRef);
                Utils.Debug.log('DEBUG', 'Consciousness system initialized');
            }

            if (typeof offlineSystem !== 'undefined') {
                await offlineSystem.init(gameState);
                Utils.Debug.log('DEBUG', 'Offline system initialized');
            }

            Utils.Debug.log('INFO', 'CoreIntegration: All systems initialized');
        } catch (error) {
            Utils.Debug.log('ERROR', 'CoreIntegration: System initialization failed', error);
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
     * Register all core systems with the game loop
     */
    registerCoreSystemsWithGameLoop() {
        if (this.systemsRegistered) {
            Utils.Debug.log('WARN', 'CoreIntegration: Systems already registered');
            return;
        }

        if (!gameLoop) {
            throw new Error('GameLoop not available for system registration');
        }

        // Resource System (highest priority)
        gameLoop.registerSystem(
            'resources',
            this.updateResources.bind(this),
            10, // High priority
            2   // 2ms budget
        );

        // Timeline System (very high priority - temporal effects are critical)
        gameLoop.registerSystem(
            'timeline',
            this.updateTimeline.bind(this),
            15, // Very high priority
            3   // 3ms budget
        );

        // Heat System
        gameLoop.registerSystem(
            'heat',
            this.updateHeat.bind(this),
            20, // Medium-high priority
            1   // 1ms budget
        );

        // Consciousness System (medium priority - complex processing)
        gameLoop.registerSystem(
            'consciousness',
            this.updateConsciousness.bind(this),
            25, // Medium priority
            4   // 4ms budget (complex processing)
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

        // Offline System (lower priority)
        gameLoop.registerSystem(
            'offline',
            this.updateOffline.bind(this),
            45, // Lower priority
            2   // 2ms budget
        );

        // Statistics System (lowest priority)
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
        // Existing system communication
        
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

        // NEW SYSTEM EVENT HANDLERS
        
        // Timeline system events
        eventBus.on('temporalEnergyChanged', (energy) => {
            gameState.set('timeline.temporalEnergy', energy);
            eventBus.queue('ui:update_timeline');
        });

        eventBus.on('paradoxRiskChanged', (risk) => {
            gameState.set('timeline.paradoxRisk', risk);
            eventBus.queue('ui:update_paradox_risk');
            
            if (risk >= 80) {
                eventBus.queue('ui:paradox_warning');
            }
        });

        eventBus.on('timelineReset', (data) => {
            // Handle timeline reset affecting all systems
            eventBus.queue('systems:timeline_reset', data);
            Utils.Debug.log('WARN', 'CoreIntegration: Timeline reset detected', data);
        });

        eventBus.on('paradoxCollapse', (data) => {
            Utils.Debug.log('ERROR', 'CoreIntegration: Paradox collapse detected', data);
            // Handle catastrophic timeline failure
            this.handleParadoxCollapse(data);
        });

        // Consciousness system events
        eventBus.on('absorptionSuccessful', (data) => {
            gameState.update({
                'consciousness.totalAbsorbed': data.totalAbsorbed,
                'consciousness.integrationStress': data.newStress,
                'stats.consciousnessAbsorbed': data.totalAbsorbed
            });
            eventBus.queue('ui:update_consciousness');
        });

        eventBus.on('consciousnessConflict', (conflict) => {
            eventBus.queue('ui:show_consciousness_conflict', conflict);
            Utils.Debug.log('WARN', 'CoreIntegration: Consciousness conflict detected', conflict);
        });

        eventBus.on('integrationStressChanged', (stress) => {
            gameState.set('consciousness.integrationStress', stress);
            
            if (stress >= 80) {
                eventBus.queue('ui:consciousness_critical_warning');
            }
        });

        eventBus.on('consciousnessMeltdown', (data) => {
            Utils.Debug.log('ERROR', 'CoreIntegration: Consciousness meltdown detected', data);
            gameState.update({
                'stats.consciousnessMeltdowns': (gameState.get('stats.consciousnessMeltdowns') || 0) + 1
            });
            eventBus.queue('ui:show_meltdown_warning', data);
        });

        // Offline system events
        eventBus.on('offlineSessionStarted', (data) => {
            Utils.Debug.log('INFO', 'CoreIntegration: Offline session started', data);
            gameState.set('offline.isOffline', true);
        });

        eventBus.on('offlineSessionEnded', (summary) => {
            Utils.Debug.log('INFO', 'CoreIntegration: Offline session ended', summary);
            gameState.set('offline.isOffline', false);
            eventBus.queue('ui:show_offline_summary', summary);
        });

        eventBus.on('applyOfflineProgress', (progress) => {
            // Apply offline progress to game state
            Object.entries(progress).forEach(([key, value]) => {
                const currentValue = gameState.get(key) || 0;
                gameState.set(key, currentValue + value);
            });
            eventBus.queue('ui:refresh_all');
            Utils.Debug.log('INFO', 'CoreIntegration: Applied offline progress', progress);
        });

        // Cross-system integration events
        
        // Morality changes affect consciousness absorption
        gameState.subscribe('morality', (newMorality, oldMorality) => {
            if (typeof consciousnessSystem !== 'undefined' && oldMorality !== undefined) {
                consciousnessSystem.emit('moralityShift', {
                    current: newMorality,
                    previous: oldMorality,
                    shift: newMorality - oldMorality
                });
            }
        });

        // Action events trigger timeline impacts
        eventBus.on('actionPerformed', (action) => {
            if (typeof timelineSystem !== 'undefined') {
                timelineSystem.emit('actionPerformed', action);
            }
        });

        // Consciousness absorption affects timeline
        eventBus.on('absorptionSuccessful', (data) => {
            if (typeof timelineSystem !== 'undefined') {
                timelineSystem.emit('consciousnessAbsorbed', {
                    targetId: data.consciousness.id,
                    type: data.consciousness.type,
                    temporalDisruption: this.calculateTemporalDisruption(data.consciousness)
                });
            }
        });

        Utils.Debug.log('DEBUG', 'CoreIntegration: Cross-system communication setup complete');
    }

    /**
     * Calculate temporal disruption from consciousness absorption
     */
    calculateTemporalDisruption(consciousness) {
        const baseDisruption = 3;
        const typeMultipliers = {
            'INNOCENT': 1.5,
            'WISE': 1.2,
            'CORRUPT': 0.8,
            'NEUTRAL': 1.0,
            'WARRIOR': 0.9,
            'ARTIST': 1.1
        };
        
        const multiplier = typeMultipliers[consciousness.type] || 1.0;
        return Math.floor(baseDisruption * multiplier * consciousness.strength);
    }

    /**
     * Handle paradox collapse
     */
    handleParadoxCollapse(data) {
        // Trigger emergency stabilization
        eventBus.queue('ui:show_paradox_collapse', data);
        
        // Reset some systems to prevent cascade failure
        if (typeof consciousnessSystem !== 'undefined') {
            consciousnessSystem.integrationStress = Math.min(
                consciousnessSystem.integrationStress + 20,
                consciousnessSystem.maxIntegrationStress
            );
        }
        
        // Update statistics
        gameState.update({
            'stats.paradoxCollapses': (gameState.get('stats.paradoxCollapses') || 0) + 1
        });
    }

    // SYSTEM UPDATE METHODS
    
    /**
     * Update resources system
     * @param {number} deltaTime - Time since last update
     */
    updateResources(deltaTime) {
        // Existing resource update logic would go here
        // This is a placeholder for the actual resource system
        try {
            if (typeof resourceSystem !== 'undefined' && resourceSystem.update) {
                resourceSystem.update(deltaTime);
            }
        } catch (error) {
            Utils.Debug.log('ERROR', 'CoreIntegration: Resource system update failed', error);
        }
    }

    /**
     * Update timeline system
     * @param {number} deltaTime - Time since last update
     */
    updateTimeline(deltaTime) {
        if (typeof timelineSystem !== 'undefined' && timelineSystem.update) {
            try {
                timelineSystem.update(deltaTime);
            } catch (error) {
                Utils.Debug.log('ERROR', 'CoreIntegration: Timeline system update failed', error);
            }
        }
    }

    /**
     * Update heat system
     * @param {number} deltaTime - Time since last update
     */
    updateHeat(deltaTime) {
        // Existing heat update logic would go here
        try {
            if (typeof heatSystem !== 'undefined' && heatSystem.update) {
                heatSystem.update(deltaTime);
            }
        } catch (error) {
            Utils.Debug.log('ERROR', 'CoreIntegration: Heat system update failed', error);
        }
    }

    /**
     * Update consciousness system
     * @param {number} deltaTime - Time since last update
     */
    updateConsciousness(deltaTime) {
        if (typeof consciousnessSystem !== 'undefined' && consciousnessSystem.update) {
            try {
                consciousnessSystem.update(deltaTime);
            } catch (error) {
                Utils.Debug.log('ERROR', 'CoreIntegration: Consciousness system update failed', error);
            }
        }
    }

    /**
     * Update expansion system
     * @param {number} deltaTime - Time since last update
     */
    updateExpansion(deltaTime) {
        // Existing expansion update logic would go here
        try {
            if (typeof expansionSystem !== 'undefined' && expansionSystem.update) {
                expansionSystem.update(deltaTime);
            }
            
            // Check for completed infiltrations
            this.checkInfiltrationCompletion();
            
        } catch (error) {
            Utils.Debug.log('ERROR', 'CoreIntegration: Expansion system update failed', error);
        }
    }

    /**
     * Update events system
     * @param {number} deltaTime - Time since last update
     */
    updateEvents(deltaTime) {
        try {
            const currentTime = Date.now();
            const nextEventTime = gameState.get('events.nextEventTime') || 0;
            
            if (currentTime >= nextEventTime) {
                this.triggerRandomEvent(currentTime);
            }
        } catch (error) {
            Utils.Debug.log('ERROR', 'CoreIntegration: Events system update failed', error);
        }
    }

    /**
     * Update offline system
     * @param {number} deltaTime - Time since last update
     */
    updateOffline(deltaTime) {
        if (typeof offlineSystem !== 'undefined' && offlineSystem.update) {
            try {
                offlineSystem.update(deltaTime);
            } catch (error) {
                Utils.Debug.log('ERROR', 'CoreIntegration: Offline system update failed', error);
            }
        }
    }

    /**
     * Update statistics system
     * @param {number} deltaTime - Time since last update
     */
    updateStatistics(deltaTime) {
        try {
            // Update play time
            const currentPlayTime = gameState.get('stats.timePlayed') || 0;
            gameState.set('stats.timePlayed', currentPlayTime + deltaTime);
            
            // Update other statistics as needed
        } catch (error) {
            Utils.Debug.log('ERROR', 'CoreIntegration: Statistics system update failed', error);
        }
    }

    // GAME LOGIC METHODS
    
    /**
     * Check for completed infiltrations
     */
    checkInfiltrationCompletion() {
        const activeInfiltrations = gameState.get('expansion.activeInfiltrations') || [];
        const currentTime = Date.now();
        
        activeInfiltrations.forEach(infiltration => {
            if (currentTime >= infiltration.completionTime) {
                if (Math.random() < infiltration.successChance) {
                    this.applyInfiltrationSuccess(infiltration);
                } else {
                    this.applyInfiltrationFailure(infiltration);
                }
                
                // Remove from active infiltrations
                const updatedInfiltrations = activeInfiltrations.filter(i => i.id !== infiltration.id);
                gameState.set('expansion.activeInfiltrations', updatedInfiltrations);
            }
        });
    }

    /**
     * Apply successful infiltration effects
     * @param {object} infiltration - Infiltration data
     */
    applyInfiltrationSuccess(infiltration) {
        const { target } = infiltration;
        const resources = target.rewards || {};
        
        // Apply resource rewards
        gameState.update({
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
        
        eventBus.queue('ui:infiltration_success', { target });
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
        
        eventBus.queue('ui:infiltration_failure', { target });
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

    // EVENT HANDLERS
    
    /**
     * Handle game started event
     */
    onGameStarted() {
        Utils.Debug.log('INFO', 'CoreIntegration: Game started');
        
        // Start core systems
        if (!gameLoop.isRunning) {
            gameLoop.start();
        }
        
        // Check for offline progress
        if (typeof offlineSystem !== 'undefined') {
            const offlineProgress = offlineSystem.checkForOfflineProgress();
            if (offlineProgress) {
                eventBus.queue('ui:show_offline_summary', 
                    offlineSystem.generateWelcomeBackInterface(offlineProgress)
                );
            }
        }
    }

    onGamePaused() {
        Utils.Debug.log('INFO', 'CoreIntegration: Game paused');
        
        // Start offline session if applicable
        if (typeof offlineSystem !== 'undefined') {
            offlineSystem.startOfflineSession();
        }
    }

    onGameResumed() {
        Utils.Debug.log('INFO', 'CoreIntegration: Game resumed');
        
        // End offline session if applicable
        if (typeof offlineSystem !== 'undefined') {
            const summary = offlineSystem.endOfflineSession();
            if (summary) {
                eventBus.queue('ui:show_offline_summary', 
                    offlineSystem.generateWelcomeBackInterface(summary)
                );
            }
        }
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
        
        // Refresh new systems
        if (typeof timelineSystem !== 'undefined') {
            timelineSystem.emit('stateRestored');
        }
        
        if (typeof consciousnessSystem !== 'undefined') {
            consciousnessSystem.emit('stateRestored');
        }
        
        if (typeof offlineSystem !== 'undefined') {
            offlineSystem.emit('stateRestored');
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
            registeredSystems: Array.from(gameLoop.updateSystems.keys()),
            newSystems: {
                timeline: typeof timelineSystem !== 'undefined',
                consciousness: typeof consciousnessSystem !== 'undefined',
                offline: typeof offlineSystem !== 'undefined'
            }
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
        
        // End offline session if active
        if (typeof offlineSystem !== 'undefined' && offlineSystem.isOffline) {
            offlineSystem.endOfflineSession();
        }
        
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