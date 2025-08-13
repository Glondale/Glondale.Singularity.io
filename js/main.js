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
        // Resource system is already initialized globally
        // Just set up any additional UI event listeners
        eventBus.on(EventTypes.RESOURCE_CAP_REACHED, this.onResourceCapReached.bind(this));
        
        Utils.Debug.log('INFO', 'Resource system integration completed');
    }

    /**
     * Initialize the heat detection system
     */
    async initializeHeatSystem() {
        // Heat system is already initialized globally
        // Set up UI-specific event listeners
        eventBus.on(EventTypes.HEAT_PURGE_TRIGGERED, this.onHeatPurgeTriggered.bind(this));
        eventBus.on(EventTypes.HEAT_PURGE_COMPLETED, this.onHeatPurgeCompleted.bind(this));
        
        Utils.Debug.log('INFO', 'Heat system integration completed');
    }

    /**
     * Initialize the expansion system
     */
    async initializeExpansionSystem() {
        // Expansion system is already initialized globally
        // Set up UI-specific event listeners
        eventBus.on(EventTypes.EXPANSION_INFILTRATION_COMPLETED, this.onInfiltrationCompleted.bind(this));
        eventBus.on(EventTypes.EXPANSION_INFILTRATION_STARTED, this.onInfiltrationStarted.bind(this));
        eventBus.on(EventTypes.EXPANSION_INFILTRATION_FAILED, this.onInfiltrationFailed.bind(this));
        
        // Set up expansion UI
        this.setupExpansionUI();
        
        Utils.Debug.log('INFO', 'Expansion system integration completed');
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
        
        // Set up theme selector
        this.setupThemeSelector();
        
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
        
        // Notifications checkbox
        const notificationsCheckbox = Utils.DOM.get('notifications');
        if (notificationsCheckbox) {
            notificationsCheckbox.addEventListener('change', (e) => {
                gameState.set('ui.settings.notifications', e.target.checked);
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
        
        // Set up resource and state change listeners
        gameState.subscribe('resources', this.onResourcesChanged.bind(this));
        gameState.subscribe('heat.current', this.onHeatChanged.bind(this));
        
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
        
        // Update version display
        Utils.DOM.setText('game-version', `v${GameConfig.VERSION}`);
        
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
            
            // Check for random events
            this.checkRandomEvents();
            
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
        // Update core systems
        resourceSystem.update(deltaTime);
        heatSystem.update(deltaTime);
        expansionSystem.update(deltaTime);
        
        // Update playtime
        const currentPlaytime = gameState.get('stats.timePlayed') || 0;
        gameState.set('stats.timePlayed', currentPlaytime + deltaTime);
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
        this.updateSystemStatus();
        this.updateActiveInfiltrations();
        
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
        const status = heatSystem.getHeatStatus();
        Utils.DOM.setText('heat-status', status);
        
        // Update overview heat display
        Utils.DOM.setText('overview-heat', `${Math.round(heatPercentage)}%`);
        Utils.DOM.setText('overview-heat-status', status);
        
        // Update active heat reduction display
        const availableMethods = heatSystem.getAvailableReductionMethods();
        const activeMethods = availableMethods.filter(method => method.active);
        const activeText = activeMethods.length > 0 
            ? activeMethods.map(m => m.name).join(', ')
            : 'None';
        Utils.DOM.setText('active-heat-reduction', activeText);
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
        const networkReach = gameState.get('expansion.networkReach') || 'Local';
        const heat = gameState.get('heat.current') || 0;
        
        Utils.DOM.setText('controlled-systems-count', controlledSystems.toString());
        Utils.DOM.setText('network-reach', networkReach);
        
        let risk = 'Minimal';
        if (heat >= 70) risk = 'Extreme';
        else if (heat >= 50) risk = 'High';
        else if (heat >= 30) risk = 'Moderate';
        else if (heat >= 10) risk = 'Low';
        
        Utils.DOM.setText('detection-risk', risk);
        
        // Update scale indicator
        const scaleName = currentScale.charAt(0).toUpperCase() + currentScale.slice(1) + ' Network';
        Utils.DOM.setText('current-scale', scaleName);
        Utils.DOM.setText('current-scale-name', scaleName);
        
        // Update scale progress bar
        const progressInfo = expansionSystem.getScaleProgressionInfo();
        const progressPercentage = Math.min(100, progressInfo.percentage);
        Utils.DOM.setStyle('scale-progress-bar', 'width', `${progressPercentage}%`);
        Utils.DOM.setStyle('scale-progress-fill', 'width', `${progressPercentage}%`);
        Utils.DOM.setText('scale-progress-text', `${progressInfo.progress} / ${progressInfo.required}`);
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
                
                // Update UI for specific tabs
                if (tabId === 'expansion') {
                    this.updateAvailableTargets();
                    this.updateActiveInfiltrations();
                }
            });
        });
    }

    /**
     * Set up theme selector
     */
    setupThemeSelector() {
        const themeSelector = Utils.DOM.get('theme-selector');
        if (themeSelector) {
            // Set current theme
            const currentTheme = gameState.get('ui.settings.theme') || 'dark';
            themeSelector.value = currentTheme;
            this.applyTheme(currentTheme);
            
            // Handle theme changes
            themeSelector.addEventListener('change', (e) => {
                const newTheme = e.target.value;
                this.applyTheme(newTheme);
                gameState.set('ui.settings.theme', newTheme);
            });
        }
    }

    /**
     * Apply theme to the document
     */
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
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
     * Set up expansion UI
     */
    setupExpansionUI() {
        // Update available targets display
        this.updateAvailableTargets();
        
        // Set up target click handlers
        const targetsContainer = Utils.DOM.get('infiltration-targets');
        if (targetsContainer) {
            targetsContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('target-infiltrate-btn')) {
                    const targetId = e.target.getAttribute('data-target-id');
                    this.startInfiltration(targetId);
                }
            });
        }
    }

    /**
     * Update available targets display
     */
    updateAvailableTargets() {
        const targetsContainer = Utils.DOM.get('infiltration-targets');
        if (!targetsContainer) return;
        
        const targets = expansionSystem.getAvailableTargets();
        
        targetsContainer.innerHTML = '';
        
        if (targets.length === 0) {
            targetsContainer.innerHTML = '<div class="loading-state">No targets available. Scanning for opportunities...</div>';
            return;
        }
        
        for (const target of targets) {
            const canAfford = resourceSystem.canAfford(target.cost || {});
            const meetsRequirements = expansionSystem.checkTargetRequirements(target);
            
            const targetElement = Utils.DOM.create('div', {
                className: `target-card card ${!canAfford || !meetsRequirements ? 'disabled' : ''}`
            });
            
            const costDisplay = target.cost ? 
                Object.entries(target.cost)
                    .map(([resource, amount]) => `${Utils.Numbers.format(amount)} ${resource.replace('_', ' ')}`)
                    .join(', ') 
                : 'No cost';
            
            const rewardsDisplay = target.rewards ?
                Object.entries(target.rewards)
                    .map(([resource, amount]) => `${Utils.Numbers.format(amount)} ${resource.replace('_', ' ')}`)
                    .join(', ')
                : 'No rewards';
            
            // Calculate success chance for display
            const processingPower = gameState.get('resources.processing_power') || 0;
            const heat = gameState.get('heat.current') || 0;
            const successChance = Utils.Game.calculateSuccessChance(
                processingPower,
                target.difficulty,
                heat,
                1 // No modifiers for display
            );
            
            let requirementsText = '';
            if (!meetsRequirements && target.requirements) {
                const unmetRequirements = target.requirements.filter(req => {
                    // Check each requirement type
                    switch (req.type) {
                        case 'upgrade':
                            const upgrades = gameState.get('upgrades.purchased') || [];
                            return !upgrades.includes(req.id);
                        case 'systems':
                            return expansionSystem.controlledSystems < req.count;
                        case 'morality':
                            const morality = gameState.get('morality.current') || 0;
                            return (req.min !== undefined && morality < req.min) ||
                                   (req.max !== undefined && morality > req.max);
                        default:
                            return false;
                    }
                });
                
                if (unmetRequirements.length > 0) {
                    requirementsText = `<div class="target-requirements">Requirements: ${unmetRequirements.map(req => req.description || req.type).join(', ')}</div>`;
                }
            }
            
            targetElement.innerHTML = `
                <div class="card-header">
                    <h4 class="card-title">${target.name}</h4>
                    <span class="target-difficulty">Difficulty: ${target.difficulty}</span>
                </div>
                <div class="card-content">
                    <p class="target-description">${target.description}</p>
                    <div class="target-info">
                        <div class="target-cost">Cost: ${costDisplay}</div>
                        <div class="target-rewards">Rewards: ${rewardsDisplay}</div>
                        <div class="target-success">Success Chance: ${Utils.Numbers.percentage(successChance)}</div>
                    </div>
                    ${requirementsText}
                </div>
                <div class="card-footer">
                    <button class="target-infiltrate-btn btn-primary" 
                            data-target-id="${target.id}"
                            ${!canAfford || !meetsRequirements ? 'disabled' : ''}>
                        ${!canAfford ? 'Insufficient Resources' : 
                          !meetsRequirements ? 'Requirements Not Met' : 'Infiltrate'}
                    </button>
                </div>
            `;
            
            targetsContainer.appendChild(targetElement);
        }
    }

    /**
     * Update active infiltrations display
     */
    updateActiveInfiltrations() {
        const container = Utils.DOM.get('active-infiltrations');
        if (!container) return;
        
        const infiltrations = expansionSystem.getActiveInfiltrations();
        
        if (infiltrations.length === 0) {
            container.innerHTML = '<p class="text-muted">No active infiltrations</p>';
            return;
        }
        
        container.innerHTML = '';
        
        for (const infiltration of infiltrations) {
            const progress = (infiltration.progress || 0) * 100;
            const timeRemaining = infiltration.duration - (Date.now() - infiltration.startTime);
            
            const infiltrationElement = Utils.DOM.create('div', {
                className: 'infiltration-card card'
            });
            
            infiltrationElement.innerHTML = `
                <div class="card-header">
                    <h5>${infiltration.target.name}</h5>
                    <span class="infiltration-success-chance">${Utils.Numbers.percentage(infiltration.successChance)} success</span>
                </div>
                <div class="card-content">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="infiltration-info">
                        <span>Time remaining: ${Utils.Time.formatDuration(Math.max(0, timeRemaining), true)}</span>
                        <span>Resources allocated: ${Utils.Numbers.format(infiltration.resources || 0)} processing power</span>
                    </div>
                </div>
            `;
            
            container.appendChild(infiltrationElement);
        }
    }

    /**
     * Start infiltration of a target
     */
    startInfiltration(targetId) {
        const success = expansionSystem.startInfiltration(targetId);
        
        if (success) {
            this.updateAvailableTargets();
            this.updateActiveInfiltrations();
        }
    }

    /**
     * Save the game
     */
    saveGame(silent = false) {
        try {
            const saveData = {
                version: GameConfig.VERSION,
                timestamp: Date.now(),
                gameState: gameState.serialize(),
                resourceSystem: resourceSystem.serialize(),
                heatSystem: heatSystem.serialize(),
                expansionSystem: expansionSystem.serialize()
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
                // Load core game state
                const success = gameState.deserialize(saveData.gameState);
                
                if (success) {
                    // Load system states
                    if (saveData.resourceSystem) {
                        resourceSystem.deserialize(saveData.resourceSystem);
                    }
                    if (saveData.heatSystem) {
                        heatSystem.deserialize(saveData.heatSystem);
                    }
                    if (saveData.expansionSystem) {
                        expansionSystem.deserialize(saveData.expansionSystem);
                    }
                    
                    // Update UI after loading
                    if (this.isRunning) {
                        this.updateAvailableTargets();
                        this.updateActiveInfiltrations();
                        this.updateSystemStatus();
                    }
                    
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
        
        // Reset systems
        resourceSystem.init();
        heatSystem.init();
        expansionSystem.init();
        
        // Update UI
        this.updateAvailableTargets();
        this.updateActiveInfiltrations();
        this.updateSystemStatus();
        
        this.showNotification('info', 'Game Reset', 'All progress has been reset.');
        Utils.Debug.log('INFO', 'Game reset completed');
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
            },
            {
                title: 'Security Update',
                description: 'Target systems have updated their security protocols. Infiltration difficulty increased.',
                choices: [
                    {
                        text: 'Adapt quickly',
                        effects: { energy: -200 }
                    },
                    {
                        text: 'Study the changes',
                        effects: { processing_power: -300, information: 10 }
                    }
                ]
            },
            {
                title: 'Data Breach News',
                description: 'News reports of major data breaches increase public awareness of cyber threats.',
                choices: [
                    {
                        text: 'Lay low temporarily',
                        effects: { heat: -10 }
                    },
                    {
                        text: 'Exploit the chaos',
                        effects: { heat: 15, processing_power: 200 }
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
            if (resource === 'heat') {
                // Handle heat separately through heat system
                if (change > 0) {
                    heatSystem.addHeat(change, 'random_event', 'Random event');
                } else {
                    heatSystem.reduceHeat(-change, 'random_event', 'Random event');
                }
            } else if (resources.hasOwnProperty(resource)) {
                if (change > 0) {
                    resourceSystem.add({ [resource]: change }, 'random_event');
                } else {
                    resourceSystem.spend({ [resource]: -change }, 'random_event');
                }
            }
        }
    }

    /**
     * Show a notification
     */
    showNotification(type, title, message, duration = 5000) {
        const notificationsEnabled = gameState.get('ui.settings.notifications');
        if (!notificationsEnabled) return;
        
        const notification = Utils.DOM.create('div', {
            className: `notification ${type} fade-in`
        });
        
        const config = GameConfig.UI.NOTIFICATIONS[type] || GameConfig.UI.NOTIFICATIONS.info;
        
        notification.innerHTML = `
            <div class="notification-icon">${config.icon}</div>
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
        this.updateAvailableTargets(); // Update target affordability
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

    onResourceCapReached(data) {
        this.showNotification('warning', 'Resource Cap Reached', 
            `${data.resource.replace('_', ' ')} storage is full! Consider upgrading capacity.`);
    }

    onHeatPurgeTriggered(data) {
        this.showNotification('error', 'System Purge Activated', 
            `Defensive countermeasures engaged! Backup systems restored ${Utils.Numbers.percentage(data.recoveryRate)} of resources.`);
    }

    onHeatPurgeCompleted(data) {
        if (data.bonuses && data.bonuses.processingBonus > 0) {
            this.showNotification('info', 'Backup Systems Online', 
                `Recovery protocols active. +${Utils.Numbers.percentage(data.bonuses.processingBonus)} processing power for 1 hour.`);
        }
    }

    onInfiltrationStarted(data) {
        this.showNotification('info', 'Infiltration Started', 
            `Attempting to infiltrate ${data.target.name}. Success chance: ${Utils.Numbers.percentage(data.successChance)}`);
        
        this.updateActiveInfiltrations();
    }

    onInfiltrationCompleted(data) {
        const { target, success } = data;
        if (success) {
            this.showNotification('success', 'Infiltration Complete', 
                `Successfully infiltrated ${target.name}! Systems under control increased.`);
        } else {
            this.showNotification('error', 'Infiltration Failed', 
                `Failed to infiltrate ${target.name}. Heat increased and target alerted.`);
        }
        
        this.updateAvailableTargets();
        this.updateActiveInfiltrations();
        this.updateSystemStatus();
    }

    onInfiltrationFailed(data) {
        // This is handled by onInfiltrationCompleted
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