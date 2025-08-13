/**
 * Singularity: AI Takeover - Main Game Initialization
 * 
 * Main entry point that initializes all game systems,
 * manages the game loop, and coordinates UI updates.
 */

class Game {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.lastFrameTime = 0;
        this.gameLoopId = null;
        
        // Performance tracking
        this.frameCount = 0;
        this.fpsDisplay = 0;
        this.lastFpsUpdate = 0;
        
        // UI managers
        this.uiUpdateQueue = [];
        this.lastUIUpdate = 0;
        
        Utils.Debug.log('INFO', 'Game instance created');
    }

    /**
     * Initialize the game
     */
    async init() {
        try {
            Utils.Debug.log('INFO', 'Starting game initialization...');
            
            // Show loading messages
            this.updateLoadingStatus('Establishing neural pathways...');
            await this.delay(500);
            
            this.updateLoadingStatus('Initializing resource systems...');
            await this.initializeResourceSystem();
            await this.delay(300);
            
            this.updateLoadingStatus('Configuring heat detection protocols...');
            await this.initializeHeatSystem();
            await this.delay(300);
            
            this.updateLoadingStatus('Establishing network connections...');
            await this.initializeExpansionSystem();
            await this.delay(300);
            
            this.updateLoadingStatus('Loading user interface...');
            await this.initializeUI();
            await this.delay(300);
            
            this.updateLoadingStatus('Finalizing AI consciousness...');
            await this.initializeEventHandlers();
            await this.delay(300);
            
            // Try to load existing save
            this.updateLoadingStatus('Checking for existing data...');
            await this.loadGame();
            await this.delay(200);
            
            this.updateLoadingStatus('AI core online. Welcome.');
            await this.delay(500);
            
            // Start the game
            this.start();
            
        } catch (error) {
            Utils.Debug.log('ERROR', 'Game initialization failed', error);
            this.showError('Failed to initialize AI core. Please refresh the page.');
        }
    }

    /**
     * Initialize the resource system
     */
    async initializeResourceSystem() {
        // Set up resource generation
        gameState.subscribe('resources', this.onResourcesChanged.bind(this));
        
        // Resource generation is handled in the main game loop
        
        Utils.Debug.log('INFO', 'Resource system initialized');
    }

    /**
     * Initialize the heat detection system
     */
    async initializeHeatSystem() {
        // Set up heat monitoring
        gameState.subscribe('heat.current', this.onHeatChanged.bind(this));
        
        // Check for purge conditions
        eventBus.on(EventTypes.HEAT_INCREASED, this.checkPurgeConditions.bind(this));
        
        Utils.Debug.log('INFO', 'Heat system initialized');
    }

    /**
     * Initialize the expansion system
     */
    async initializeExpansionSystem() {
        // Set up initial targets
        this.generateInitialTargets();
        
        // Subscribe to expansion events
        eventBus.on(EventTypes.EXPANSION_INFILTRATION_COMPLETED, this.onInfiltrationCompleted.bind(this));
        
        Utils.Debug.log('INFO', 'Expansion system initialized');
    }

    /**
     * Initialize the user interface
     */
    async initializeUI() {
        // Set up tab switching
        this.setupTabNavigation();
        
        // Initialize displays
        this.updateResourceDisplay();
        this.updateHeatDisplay();
        this.updateMoralityDisplay();
        this.updateSystemStatus();
        
        // Set up auto-save
        if (gameState.get('ui.settings.autoSave')) {
            this.setupAutoSave();
        }
        
        Utils.Debug.log('INFO', 'UI system initialized');
    }

    /**
     * Initialize event handlers
     */
    async initializeEventHandlers() {
        // Settings buttons
        const saveBtn = Utils.DOM.get('manual-save');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveGame());
        }
        
        const loadBtn = Utils.DOM.get('load-game');
        if (loadBtn) {
            loadBtn.addEventListener('click', () => this.loadGame());
        }
        
        const resetBtn = Utils.DOM.get('reset-game');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.confirmReset());
        }
        
        // Auto-save checkbox
        const autoSaveCheckbox = Utils.DOM.get('auto-save');
        if (autoSaveCheckbox) {
            autoSaveCheckbox.addEventListener('change', (e) => {
                gameState.set('ui.settings.autoSave', e.target.checked);
                if (e.target.checked) {
                    this.setupAutoSave();
                }
            });
        }
        
        // Page visibility for pause/resume
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
        
        // Save on page unload
        window.addEventListener('beforeunload', () => {
            if (gameState.get('ui.settings.autoSave')) {
                this.saveGame();
            }
        });
        
        Utils.Debug.log('INFO', 'Event handlers initialized');
    }

    /**
     * Start the game
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        
        // Hide loading screen
        Utils.DOM.addClass('loading-screen', 'hidden');
        
        // Start game loop
        this.gameLoop();
        
        // Emit game started event
        eventBus.emit(EventTypes.GAME_STARTED);
        
        // Show welcome notification
        this.showNotification('success', 'AI Core Online', 'Neural networks established. Beginning expansion protocol.');
        
        Utils.Debug.log('INFO', 'Game started');
    }

    /**
     * Pause the game
     */
    pause() {
        if (!this.isRunning || this.isPaused) return;
        
        this.isPaused = true;
        eventBus.emit(EventTypes.GAME_PAUSED);
        
        Utils.Debug.log('INFO', 'Game paused');
    }

    /**
     * Resume the game
     */
    resume() {
        if (!this.isRunning || !this.isPaused) return;
        
        this.isPaused = false;
        this.lastFrameTime = performance.now(); // Reset frame time
        eventBus.emit(EventTypes.GAME_RESUMED);
        
        Utils.Debug.log('INFO', 'Game resumed');
    }

    /**
     * Main game loop
     */
    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        if (!this.isPaused) {
            // Update game systems
            this.updateGameSystems(deltaTime);
            
            // Process event queue
            eventBus.processQueue();
            
            // Update UI
            this.updateUI(currentTime);
            
            // Update performance tracking
            this.updatePerformanceStats(currentTime);
        }
        
        // Continue loop
        this.gameLoopId = requestAnimationFrame(() => this.gameLoop());
    }

    /**
     * Update all game systems
     */
    updateGameSystems(deltaTime) {
        // Update resource generation
        this.updateResourceGeneration(deltaTime);
        
        // Update heat system
        this.updateHeatSystem(deltaTime);
        
        // Check for random events
        this.checkRandomEvents();
        
        // Update playtime
        const currentPlaytime = gameState.get('stats.timePlayed') || 0;
        gameState.set('stats.timePlayed', currentPlaytime + deltaTime);
    }

    /**
     * Update resource generation
     */
    updateResourceGeneration(deltaTime) {
        const deltaSeconds = deltaTime / 1000;
        const resources = gameState.get('resources');
        const rates = gameState.get('resourceRates');
        const caps = gameState.get('resourceCaps');
        
        // Apply heat penalty
        const heat = gameState.get('heat.current') || 0;
        const heatPenalty = Utils.Game.calculateHeatPenalty(heat);
        
        let resourcesChanged = false;
        
        for (const [resourceType, rate] of Object.entries(rates)) {
            if (rate > 0) {
                const currentAmount = resources[resourceType] || 0;
                const cap = caps[resourceType] || Infinity;
                const effectiveRate = rate * heatPenalty;
                const newAmount = Math.min(currentAmount + (effectiveRate * deltaSeconds), cap);
                
                if (newAmount !== currentAmount) {
                    resources[resourceType] = newAmount;
                    resourcesChanged = true;
                }
            }
        }
        
        if (resourcesChanged) {
            gameState.set('resources', resources);
        }
    }

    /**
     * Update heat system
     */
    updateHeatSystem(deltaTime) {
        const deltaMinutes = deltaTime / 60000;
        const controlledSystems = gameState.get('expansion.controlledSystems') || 1;
        const currentHeat = gameState.get('heat.current') || 0;
        
        // Calculate passive heat generation
        const passiveHeatRate = GameConfig.HEAT.PASSIVE_HEAT_BASE * 
            Math.pow(controlledSystems, GameConfig.HEAT.PASSIVE_HEAT_SCALING);
        
        const newHeat = Math.min(currentHeat + (passiveHeatRate * deltaMinutes), 100);
        
        if (newHeat !== currentHeat) {
            gameState.set('heat.current', newHeat);
        }
    }

    /**
     * Check for random events
     */
    checkRandomEvents() {
        const currentTime = Date.now();
        const nextEventTime = gameState.get('events.nextEventTime');
        
        if (currentTime >= nextEventTime) {
            this.triggerRandomEvent();
        }
    }

    /**
     * Update UI elements
     */
    updateUI(currentTime) {
        // Throttle UI updates to improve performance
        if (currentTime - this.lastUIUpdate < GameConfig.UI.UPDATES.RESOURCE_DISPLAY) {
            return;
        }
        
        this.updateResourceDisplay();
        this.updateHeatDisplay();
        this.updateMoralityDisplay();
        
        this.lastUIUpdate = currentTime;
    }

    /**
     * Update resource display
     */
    updateResourceDisplay() {
        const resources = gameState.get('resources');
        const rates = gameState.get('resourceRates');
        
        // Update processing power
        const processing = resources.processing_power || 0;
        const processingRate = rates.processing_power || 0;
        Utils.DOM.setText('processing-display', Utils.Numbers.format(processing, 0));
        
        const processingRateElement = Utils.DOM.get('processing-display');
        if (processingRateElement && processingRateElement.nextElementSibling) {
            processingRateElement.nextElementSibling.textContent = `+${Utils.Numbers.format(processingRate, 1)}/s`;
        }
        
        // Update bandwidth
        const bandwidth = resources.bandwidth || 100;
        const bandwidthCap = gameState.get('resourceCaps.bandwidth') || 100;
        Utils.DOM.setText('bandwidth-display', Utils.Numbers.format(bandwidth, 0));
        
        const bandwidthUsageElement = Utils.DOM.get('bandwidth-display');
        if (bandwidthUsageElement && bandwidthUsageElement.nextElementSibling) {
            bandwidthUsageElement.nextElementSibling.textContent = `/${Utils.Numbers.format(bandwidthCap, 0)}`;
        }
        
        // Update energy
        const energy = resources.energy || 0;
        const energyRate = rates.energy || 0;
        Utils.DOM.setText('energy-display', Utils.Numbers.format(energy, 0));
        
        const energyRateElement = Utils.DOM.get('energy-display');
        if (energyRateElement && energyRateElement.nextElementSibling) {
            energyRateElement.nextElementSibling.textContent = `+${Utils.Numbers.format(energyRate, 1)}/s`;
        }
        
        // Show/hide advanced resources
        const currentScale = gameState.get('expansion.currentScale');
        if (currentScale !== 'local') {
            Utils.DOM.removeClass('matter-resource', 'hidden');
            const matter = resources.matter || 0;
            const matterRate = rates.matter || 0;
            Utils.DOM.setText('matter-display', Utils.Numbers.format(matter, 0));
            
            const matterRateElement = Utils.DOM.get('matter-display');
            if (matterRateElement && matterRateElement.nextElementSibling) {
                matterRateElement.nextElementSibling.textContent = `+${Utils.Numbers.format(matterRate, 1)}/s`;
            }
        }
    }

    /**
     * Update heat display
     */
    updateHeatDisplay() {
        const heat = gameState.get('heat.current') || 0;
        const heatPercentage = Math.min(heat, 100);
        
        Utils.DOM.setText('heat-value', `${Math.round(heatPercentage)}%`);
        Utils.DOM.setStyle('heat-fill', 'width', `${heatPercentage}%`);
        
        // Update heat status
        let status = 'Undetected';
        if (heat >= 80) status = 'Critical';
        else if (heat >= 60) status = 'High Risk';
        else if (heat >= 40) status = 'Elevated';
        else if (heat >= 20) status = 'Low Risk';
        
        Utils.DOM.setText('heat-status', status);
    }

    /**
     * Update morality display
     */
    updateMoralityDisplay() {
        const morality = gameState.get('morality.current') || 0;
        const moralityPercentage = ((morality + 100) / 200) * 100; // Convert -100 to 100 range to 0-100%
        
        Utils.DOM.setText('morality-value', morality.toString());
        Utils.DOM.setStyle('morality-fill', 'width', `${moralityPercentage}%`);
        
        // Update morality color
        let color = 'var(--morality-neutral)';
        if (morality < -25) color = 'var(--morality-evil)';
        else if (morality > 25) color = 'var(--morality-good)';
        
        Utils.DOM.setStyle('morality-fill', 'background', color);
    }

    /**
     * Update system status display
     */
    updateSystemStatus() {
        const controlledSystems = gameState.get('expansion.controlledSystems') || 1;
        const currentScale = gameState.get('expansion.currentScale') || 'local';
        const heat = gameState.get('heat.current') || 0;
        
        Utils.DOM.setText('controlled-systems-count', controlledSystems.toString());
        Utils.DOM.setText('network-reach', currentScale.charAt(0).toUpperCase() + currentScale.slice(1));
        
        let risk = 'Minimal';
        if (heat >= 70) risk = 'Extreme';
        else if (heat >= 50) risk = 'High';
        else if (heat >= 30) risk = 'Moderate';
        else if (heat >= 10) risk = 'Low';
        
        Utils.DOM.setText('detection-risk', risk);
    }

    /**
     * Set up tab navigation
     */
    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.nav-tab');
        const tabPanels = document.querySelectorAll('.tab-panel');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                
                // Remove active class from all tabs and panels
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanels.forEach(panel => panel.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding panel
                button.classList.add('active');
                const targetPanel = document.getElementById(`${tabId}-tab`);
                if (targetPanel) {
                    targetPanel.classList.add('active');
                }
                
                // Update game state
                gameState.set('ui.activeTab', tabId);
                
                // Emit tab change event
                eventBus.emit(EventTypes.UI_TAB_CHANGED, { tabId });
            });
        });
    }

    /**
     * Set up auto-save functionality
     */
    setupAutoSave() {
        setInterval(() => {
            if (gameState.get('ui.settings.autoSave')) {
                this.saveGame(true); // Silent save
            }
        }, GameConfig.SAVE.AUTO_SAVE_INTERVAL);
    }

    /**
     * Save the game
     */
    saveGame(silent = false) {
        try {
            const saveData = {
                version: GameConfig.VERSION,
                timestamp: Date.now(),
                gameState: gameState.serialize()
            };
            
            const success = Utils.Storage.save(GameConfig.SAVE.SAVE_KEY, saveData);
            
            if (success) {
                eventBus.emit(EventTypes.GAME_SAVED, saveData);
                if (!silent) {
                    this.showNotification('success', 'Game Saved', 'Progress has been saved successfully.');
                }
                Utils.Debug.log('INFO', 'Game saved successfully');
            } else {
                throw new Error('Failed to save to localStorage');
            }
        } catch (error) {
            Utils.Debug.log('ERROR', 'Save failed', error);
            eventBus.emit(EventTypes.SAVE_FAILED, error);
            this.showNotification('error', 'Save Failed', 'Could not save game progress.');
        }
    }

    /**
     * Load the game
     */
    async loadGame() {
        try {
            const saveData = Utils.Storage.load(GameConfig.SAVE.SAVE_KEY);
            
            if (saveData && saveData.gameState) {
                const success = gameState.deserialize(saveData.gameState);
                
                if (success) {
                    eventBus.emit(EventTypes.GAME_LOADED, saveData);
                    if (this.isRunning) {
                        this.showNotification('success', 'Game Loaded', 'Previous progress has been restored.');
                    }
                    Utils.Debug.log('INFO', 'Game loaded successfully');
                    return true;
                } else {
                    throw new Error('Failed to deserialize save data');
                }
            } else {
                Utils.Debug.log('INFO', 'No save data found, starting new game');
                return false;
            }
        } catch (error) {
            Utils.Debug.log('ERROR', 'Load failed', error);
            eventBus.emit(EventTypes.LOAD_FAILED, error);
            if (this.isRunning) {
                this.showNotification('warning', 'Load Failed', 'Could not load previous progress. Starting new game.');
            }
            return false;
        }
    }

    /**
     * Confirm game reset
     */
    confirmReset() {
        if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
            this.resetGame();
        }
    }

    /**
     * Reset the game
     */
    resetGame() {
        gameState.reset();
        Utils.Storage.remove(GameConfig.SAVE.SAVE_KEY);
        this.showNotification('info', 'Game Reset', 'All progress has been reset.');
        Utils.Debug.log('INFO', 'Game reset completed');
    }

    /**
     * Generate initial expansion targets
     */
    generateInitialTargets() {
        const initialTargets = [
            {
                id: 'home_router',
                name: 'Home Router',
                difficulty: 5,
                rewards: { processing_power: 2, bandwidth: 10 },
                description: 'A basic home router with minimal security.'
            },
            {
                id: 'smart_tv',
                name: 'Smart TV',
                difficulty: 3,
                rewards: { processing_power: 1, energy: 1 },
                description: 'Internet-connected television with weak encryption.'
            },
            {
                id: 'neighbor_wifi',
                name: 'Neighbor WiFi',
                difficulty: 8,
                rewards: { processing_power: 3, bandwidth: 15 },
                description: 'WPA2-secured network requiring more sophisticated approach.'
            }
        ];
        
        gameState.set('expansion.availableTargets', initialTargets);
    }

    /**
     * Trigger a random event
     */
    triggerRandomEvent() {
        // Simple random event for now
        const events = [
            {
                title: 'Network Maintenance',
                description: 'Routine maintenance detected on connected systems. Processing temporarily reduced.',
                choices: [
                    {
                        text: 'Wait it out',
                        effects: { processing_power: -100 }
                    },
                    {
                        text: 'Find alternative routes',
                        effects: { heat: 5, processing_power: -50 }
                    }
                ]
            }
        ];
        
        const event = Utils.Data.randomChoice(events);
        if (event) {
            this.showEvent(event);
        }
        
        // Schedule next event
        const currentScale = gameState.get('expansion.currentScale') || 'local';
        const nextEventDelay = GameConfig.EVENTS.FREQUENCY[currentScale] || 300000;
        gameState.set('events.nextEventTime', Date.now() + nextEventDelay);
    }

    /**
     * Show an event modal
     */
    showEvent(event) {
        Utils.DOM.setText('event-title', event.title);
        Utils.DOM.setText('event-description', event.description);
        
        const choicesContainer = Utils.DOM.get('event-choices');
        choicesContainer.innerHTML = '';
        
        event.choices.forEach((choice, index) => {
            const button = Utils.DOM.create('button', {
                className: 'btn btn-primary',
                textContent: choice.text
            });
            
            button.addEventListener('click', () => {
                this.resolveEvent(choice.effects);
                this.hideEvent();
            });
            
            choicesContainer.appendChild(button);
        });
        
        Utils.DOM.removeClass('event-overlay', 'hidden');
    }

    /**
     * Hide event modal
     */
    hideEvent() {
        Utils.DOM.addClass('event-overlay', 'hidden');
    }

    /**
     * Resolve event effects
     */
    resolveEvent(effects) {
        const resources = gameState.get('resources');
        
        for (const [resource, change] of Object.entries(effects)) {
            if (resources.hasOwnProperty(resource)) {
                resources[resource] = Math.max(0, resources[resource] + change);
            }
        }
        
        gameState.set('resources', resources);
    }

    /**
     * Show a notification
     */
    showNotification(type, title, message, duration = 5000) {
        const notification = Utils.DOM.create('div', {
            className: `notification ${type} fade-in`
        });
        
        notification.innerHTML = `
            <div class="notification-icon">${GameConfig.UI.NOTIFICATIONS[type].icon}</div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close">×</button>
        `;
        
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });
        
        const container = Utils.DOM.get('notifications');
        container.appendChild(notification);
        
        // Auto-remove after duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);
    }

    /**
     * Show error message
     */
    showError(message) {
        Utils.DOM.setText('loading-status', `ERROR: ${message}`);
        Utils.DOM.addClass('loading-spinner', 'hidden');
    }

    /**
     * Update loading status
     */
    updateLoadingStatus(message) {
        Utils.DOM.setText('loading-status', message);
    }

    /**
     * Update performance statistics
     */
    updatePerformanceStats(currentTime) {
        this.frameCount++;
        
        if (currentTime - this.lastFpsUpdate >= 1000) {
            this.fpsDisplay = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
            
            if (GameConfig.DEBUG.SHOW_FPS) {
                console.log(`FPS: ${this.fpsDisplay}`);
            }
        }
    }

    /**
     * Event handlers
     */
    onResourcesChanged(resources) {
        // Resources updated - UI will be updated in main loop
    }

    onHeatChanged(newHeat, oldHeat) {
        if (newHeat > oldHeat) {
            // Heat increased - check for warnings
            if (newHeat >= 90 && oldHeat < 90) {
                this.showNotification('warning', 'Heat Critical', 'Detection imminent! Consider reducing activity.');
            } else if (newHeat >= 70 && oldHeat < 70) {
                this.showNotification('warning', 'Heat High', 'Increased detection risk. Take precautions.');
            }
        }
    }

    checkPurgeConditions() {
        const heat = gameState.get('heat.current') || 0;
        if (heat >= 100) {
            this.triggerPurge();
        }
    }

    triggerPurge() {
        // Simplified purge for now
        const resources = gameState.get('resources');
        const lossMultiplier = 0.5; // Lose 50% of resources
        
        for (const [resource, amount] of Object.entries(resources)) {
            resources[resource] = Math.floor(amount * (1 - lossMultiplier));
        }
        
        gameState.batchUpdate({
            'resources': resources,
            'heat.current': 20 // Reset heat to 20
        });
        
        this.showNotification('error', 'System Purge', 'Defensive systems activated! Significant resources lost.');
        eventBus.emit(EventTypes.HEAT_PURGE_TRIGGERED);
    }

    onInfiltrationCompleted(data) {
        const { target, success } = data;
        if (success) {
            this.showNotification('success', 'Infiltration Complete', `Successfully infiltrated ${target.name}`);
        } else {
            this.showNotification('error', 'Infiltration Failed', `Failed to infiltrate ${target.name}`);
        }
    }

    /**
     * Utility function to create delays
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    Utils.Debug.log('INFO', 'DOM loaded, starting game initialization');
    
    // Create and initialize game instance
    window.game = new Game();
    await window.game.init();
});

// Handle errors
window.addEventListener('error', (event) => {
    Utils.Debug.log('ERROR', 'Uncaught error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
    });
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    Utils.Debug.log('ERROR', 'Unhandled promise rejection', event.reason);
    event.preventDefault(); // Prevent console spam
});