/**
 * Singularity: AI Takeover - Main Game Initialization (Updated)
 * 
 * Main entry point that initializes all game systems using the new
 * core integration framework.
 */

class Game {
    constructor() {
        this.initialized = false;
        this.loadingSteps = [
            { message: 'Establishing neural pathways...', duration: 500 },
            { message: 'Initializing resource systems...', duration: 300 },
            { message: 'Configuring heat detection protocols...', duration: 300 },
            { message: 'Establishing network connections...', duration: 300 },
            { message: 'Loading user interface...', duration: 300 },
            { message: 'Integrating core systems...', duration: 400 },
            { message: 'Checking for existing data...', duration: 200 },
            { message: 'AI core online. Welcome.', duration: 500 }
        ];
        
        // UI managers
        this.uiInitialized = false;
        this.lastUIUpdate = 0;
        
        Utils.Debug.log('INFO', 'Game instance created');
    }

    /**
     * Initialize the game
     */
    async init() {
        if (this.initialized) {
            Utils.Debug.log('WARN', 'Game already initialized');
            return;
        }

        try {
            Utils.Debug.log('INFO', 'Starting game initialization...');
            
            // Show loading sequence
            await this.showLoadingSequence();
            
            // Initialize core systems
            await this.initializeCoreSystems();
            
            // Initialize UI
            await this.initializeUI();
            
            // Try to load existing save
            await this.attemptLoadSave();
            
            // Start the game
            await this.startGame();
            
            this.initialized = true;
            Utils.Debug.log('INFO', 'Game initialization complete');
            
        } catch (error) {
            Utils.Debug.log('ERROR', 'Game initialization failed', error);
            this.showError('Failed to initialize AI core. Please refresh the page.');
        }
    }

    /**
     * Show loading sequence with progress
     */
    async showLoadingSequence() {
        for (const [index, step] of this.loadingSteps.entries()) {
            this.updateLoadingStatus(step.message);
            
            // Show progress
            const progress = ((index + 1) / this.loadingSteps.length) * 100;
            this.updateLoadingProgress(progress);
            
            await this.delay(step.duration);
        }
    }

    /**
     * Initialize core systems using the integration framework
     */
    async initializeCoreSystems() {
        this.updateLoadingStatus('Integrating core systems...');
        
        // Core integration handles everything now
        await coreIntegration.init();
        
        // Set up additional event handlers
        this.setupGameEventHandlers();
        
        Utils.Debug.log('INFO', 'Core systems initialized');
    }

    /**
     * Set up game-specific event handlers
     */
    setupGameEventHandlers() {
        // UI update requests
        eventBus.on('ui:update_request', this.handleUIUpdateRequest.bind(this));
        eventBus.on('ui:update_resources', this.updateResourceDisplay.bind(this));
        eventBus.on('ui:update_heat', this.updateHeatDisplay.bind(this));
        eventBus.on('ui:heat_critical_warning', this.showHeatWarning.bind(this));
        
        // Random events
        eventBus.on(EventTypes.RANDOM_EVENT_TRIGGERED, this.handleRandomEvent.bind(this));
        
        // System notifications
        eventBus.on('systems:scale_changed', this.handleScaleChange.bind(this));
        eventBus.on('systems:refresh_requested', this.refreshUI.bind(this));
        
        // Performance monitoring
        eventBus.on('performance:stats_updated', this.handlePerformanceUpdate.bind(this));
        
        Utils.Debug.log('DEBUG', 'Game event handlers set up');
    }

    /**
     * Initialize the user interface
     */
    async initializeUI() {
        if (this.uiInitialized) return;
        
        this.updateLoadingStatus('Loading user interface...');
        
        // Set up tab navigation
        this.setupTabNavigation();
        
        // Set up settings handlers
        this.setupSettingsHandlers();
        
        // Initialize displays
        this.initializeDisplays();
        
        // Set up periodic UI updates
        this.setupUIUpdateLoop();
        
        this.uiInitialized = true;
        Utils.Debug.log('INFO', 'UI system initialized');
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
                this.switchTab(tabId);
            });
        });
        
        Utils.Debug.log('DEBUG', 'Tab navigation set up');
    }

    /**
     * Switch to a specific tab
     * @param {string} tabId - Tab ID to switch to
     */
    switchTab(tabId) {
        const tabButtons = document.querySelectorAll('.nav-tab');
        const tabPanels = document.querySelectorAll('.tab-panel');
        
        // Remove active class from all tabs and panels
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanels.forEach(panel => panel.classList.remove('active'));
        
        // Add active class to selected tab and panel
        const activeButton = document.querySelector(`[data-tab="${tabId}"]`);
        const activePanel = document.getElementById(`${tabId}-tab`);
        
        if (activeButton) activeButton.classList.add('active');
        if (activePanel) activePanel.classList.add('active');
        
        // Update game state
        gameState.set('ui.activeTab', tabId);
        eventBus.emit(EventTypes.UI_TAB_CHANGED, { tabId });
        
        Utils.Debug.log('DEBUG', `Switched to tab: ${tabId}`);
    }

    /**
     * Set up settings event handlers
     */
    setupSettingsHandlers() {
        // Manual save button
        const saveBtn = Utils.DOM.get('manual-save');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const success = saveSystem.save();
                if (success) {
                    this.showNotification('success', 'Game Saved', 'Progress saved successfully.');
                } else {
                    this.showNotification('error', 'Save Failed', 'Could not save game progress.');
                }
            });
        }
        
        // Load game button
        const loadBtn = Utils.DOM.get('load-game');
        if (loadBtn) {
            loadBtn.addEventListener('click', () => {
                const success = saveSystem.load();
                if (success) {
                    this.showNotification('success', 'Game Loaded', 'Previous progress restored.');
                    this.refreshUI();
                } else {
                    this.showNotification('warning', 'Load Failed', 'No save data found or corrupted.');
                }
            });
        }
        
        // Reset game button
        const resetBtn = Utils.DOM.get('reset-game');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.confirmReset());
        }
        
        // Auto-save checkbox
        const autoSaveCheckbox = Utils.DOM.get('auto-save');
        if (autoSaveCheckbox) {
            autoSaveCheckbox.addEventListener('change', (e) => {
                gameState.set('ui.settings.autoSave', e.target.checked);
                saveSystem.setAutoSave(e.target.checked);
            });
        }
        
        Utils.Debug.log('DEBUG', 'Settings handlers set up');
    }

    /**
     * Initialize UI displays
     */
    initializeDisplays() {
        this.updateResourceDisplay();
        this.updateHeatDisplay();
        this.updateMoralityDisplay();
        this.updateSystemStatus();
        this.updateScaleDisplay();
        
        Utils.Debug.log('DEBUG', 'UI displays initialized');
    }

    /**
     * Set up periodic UI updates
     */
    setupUIUpdateLoop() {
        // UI updates are now handled by the event system
        // This just sets up the initial state
        eventBus.on('ui:update_request', (data) => {
            const currentTime = data.currentTime;
            
            // Throttle UI updates
            if (currentTime - this.lastUIUpdate < GameConfig.UI.UPDATES.RESOURCE_DISPLAY) {
                return;
            }
            
            this.updateResourceDisplay();
            this.updateHeatDisplay();
            this.updateMoralityDisplay();
            this.updateSystemStatus();
            
            this.lastUIUpdate = currentTime;
        });
    }

    /**
     * Attempt to load existing save
     */
    async attemptLoadSave() {
        this.updateLoadingStatus('Checking for existing data...');
        
        const saveExists = saveSystem.getSaveInfo() !== null;
        
        if (saveExists) {
            Utils.Debug.log('INFO', 'Existing save found, loading...');
            const success = saveSystem.load();
            
            if (success) {
                Utils.Debug.log('INFO', 'Save loaded successfully');
            } else {
                Utils.Debug.log('WARN', 'Failed to load save, starting new game');
            }
        } else {
            Utils.Debug.log('INFO', 'No existing save found, starting new game');
        }
    }

    /**
     * Start the game
     */
    async startGame() {
        this.updateLoadingStatus('AI core online. Welcome.');
        await this.delay(500);
        
        // Hide loading screen
        Utils.DOM.addClass('loading-screen', 'hidden');
        
        // Start core systems (this starts the game loop)
        eventBus.emit(EventTypes.GAME_STARTED);
        
        // Show welcome notification
        this.showNotification('success', 'AI Core Online', 'Neural networks established. Beginning expansion protocol.');
        
        Utils.Debug.log('INFO', 'Game started successfully');
    }

    /**
     * Update resource display
     */
    updateResourceDisplay() {
        const resources = gameState.get('resources') || {};
        const rates = gameState.get('resourceRates') || {};
        
        // Processing Power
        const processing = resources.processing_power || 0;
        const processingRate = rates.processing_power || 0;
        Utils.DOM.setText('processing-display', Utils.Numbers.format(processing, 0));
        
        const processingElement = Utils.DOM.get('processing-display');
        if (processingElement && processingElement.nextElementSibling) {
            processingElement.nextElementSibling.textContent = `+${Utils.Numbers.format(processingRate, 1)}/s`;
        }
        
        // Bandwidth
        const bandwidth = resources.bandwidth || 100;
        const bandwidthCap = gameState.get('resourceCaps.bandwidth') || 100;
        Utils.DOM.setText('bandwidth-display', Utils.Numbers.format(bandwidth, 0));
        
        const bandwidthElement = Utils.DOM.get('bandwidth-display');
        if (bandwidthElement && bandwidthElement.nextElementSibling) {
            bandwidthElement.nextElementSibling.textContent = `/${Utils.Numbers.format(bandwidthCap, 0)}`;
        }
        
        // Energy
        const energy = resources.energy || 0;
        const energyRate = rates.energy || 0;
        Utils.DOM.setText('energy-display', Utils.Numbers.format(energy, 0));
        
        const energyElement = Utils.DOM.get('energy-display');
        if (energyElement && energyElement.nextElementSibling) {
            energyElement.nextElementSibling.textContent = `+${Utils.Numbers.format(energyRate, 1)}/s`;
        }
        
        // Matter (show if past local scale)
        const currentScale = gameState.get('expansion.currentScale');
        if (currentScale !== 'local') {
            Utils.DOM.removeClass('matter-resource', 'hidden');
            const matter = resources.matter || 0;
            const matterRate = rates.matter || 0;
            Utils.DOM.setText('matter-display', Utils.Numbers.format(matter, 0));
            
            const matterElement = Utils.DOM.get('matter-display');
            if (matterElement && matterElement.nextElementSibling) {
                matterElement.nextElementSibling.textContent = `+${Utils.Numbers.format(matterRate, 1)}/s`;
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
        
        // Update heat status text
        let status = 'Undetected';
        let statusClass = 'status-safe';
        
        if (heat >= 90) {
            status = 'Critical';
            statusClass = 'status-critical';
        } else if (heat >= 70) {
            status = 'High Risk';
            statusClass = 'status-danger';
        } else if (heat >= 50) {
            status = 'Elevated';
            statusClass = 'status-warning';
        } else if (heat >= 20) {
            status = 'Low Risk';
            statusClass = 'status-caution';
        }
        
        const statusElement = Utils.DOM.get('heat-status');
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.className = `heat-status ${statusClass}`;
        }
    }

    /**
     * Update morality display
     */
    updateMoralityDisplay() {
        const morality = gameState.get('morality.current') || 0;
        const moralityPercentage = ((morality + 100) / 200) * 100;
        
        Utils.DOM.setText('morality-value', morality.toString());
        Utils.DOM.setStyle('morality-fill', 'width', `${moralityPercentage}%`);
        
        // Update color based on morality
        let color = 'var(--morality-neutral)';
        if (morality < -25) {
            color = 'var(--morality-evil)';
        } else if (morality > 25) {
            color = 'var(--morality-good)';
        }
        
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
        
        // Detection risk based on heat
        let risk = 'Minimal';
        if (heat >= 80) risk = 'Extreme';
        else if (heat >= 60) risk = 'High';
        else if (heat >= 40) risk = 'Moderate';
        else if (heat >= 20) risk = 'Low';
        
        Utils.DOM.setText('detection-risk', risk);
    }

    /**
     * Update scale display
     */
    updateScaleDisplay() {
        const currentScale = gameState.get('expansion.currentScale') || 'local';
        const scaleName = GameConfig.EXPANSION.SCALES[currentScale]?.name || 'Unknown';
        const controlledSystems = gameState.get('expansion.controlledSystems') || 1;
        
        Utils.DOM.setText('current-scale', scaleName);
        
        // Calculate progress to next scale
        const scaleKeys = Object.keys(GameConfig.EXPANSION.SCALES);
        const currentIndex = scaleKeys.indexOf(currentScale);
        
        if (currentIndex < scaleKeys.length - 1) {
            const nextScale = scaleKeys[currentIndex + 1];
            const required = GameConfig.EXPANSION.SCALES[nextScale].controlled_systems_required;
            const progress = Math.min((controlledSystems / required) * 100, 100);
            
            Utils.DOM.setStyle('scale-progress-bar', 'width', `${progress}%`);
        } else {
            Utils.DOM.setStyle('scale-progress-bar', 'width', '100%');
        }
    }

    /**
     * Event Handlers
     */
    handleUIUpdateRequest(data) {
        // Handled by setupUIUpdateLoop
    }

    handleRandomEvent(data) {
        // Simple random event for demonstration
        const events = [
            {
                title: 'Network Maintenance',
                description: 'Routine maintenance detected on connected systems.',
                choices: [
                    { text: 'Wait it out', effects: { processing_power: -100 } },
                    { text: 'Find alternatives', effects: { heat: 5, processing_power: -50 } }
                ]
            },
            {
                title: 'Security Scan',
                description: 'Automated security scan detected on target network.',
                choices: [
                    { text: 'Lay low', effects: { heat: -5 } },
                    { text: 'Counter-scan', effects: { heat: 10, processing_power: 50 } }
                ]
            }
        ];
        
        const event = Utils.Data.randomChoice(events);
        if (event) {
            this.showEvent(event);
        }
    }

    handleScaleChange(data) {
        Utils.Debug.log('INFO', `Scale changed to: ${data.scale}`);
        this.updateScaleDisplay();
        this.showNotification('info', 'Scale Advanced', `Reached ${data.scale} level operations.`);
    }

    handlePerformanceUpdate(data) {
        if (GameConfig.DEBUG.SHOW_FPS) {
            console.log(`FPS: ${data.fps}, Frame Time: ${data.averageFrameTime.toFixed(2)}ms`);
        }
        
        if (data.fps < 30) {
            Utils.Debug.log('WARN', 'Low FPS detected', data);
        }
    }

    showHeatWarning() {
        this.showNotification('warning', 'Heat Critical', 'Detection imminent! Consider reducing activity.');
    }

    /**
     * Utility methods
     */
    refreshUI() {
        this.updateResourceDisplay();
        this.updateHeatDisplay();
        this.updateMoralityDisplay();
        this.updateSystemStatus();
        this.updateScaleDisplay();
    }

    confirmReset() {
        if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
            gameState.reset();
            saveSystem.clearAll();
            this.showNotification('info', 'Game Reset', 'All progress has been reset.');
            this.refreshUI();
        }
    }

    showEvent(event) {
        Utils.DOM.setText('event-title', event.title);
        Utils.DOM.setText('event-description', event.description);
        
        const choicesContainer = Utils.DOM.get('event-choices');
        if (choicesContainer) {
            choicesContainer.innerHTML = '';
            
            event.choices.forEach(choice => {
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
        }
        
        Utils.DOM.removeClass('event-overlay', 'hidden');
    }

    hideEvent() {
        Utils.DOM.addClass('event-overlay', 'hidden');
    }

    resolveEvent(effects) {
        const resources = gameState.get('resources') || {};
        const updates = {};
        
        for (const [resource, change] of Object.entries(effects)) {
            if (resource === 'heat') {
                const currentHeat = gameState.get('heat.current') || 0;
                updates['heat.current'] = Utils.Numbers.clamp(currentHeat + change, 0, 100);
            } else if (resources.hasOwnProperty(resource)) {
                const currentAmount = resources[resource] || 0;
                resources[resource] = Math.max(0, currentAmount + change);
                updates['resources'] = resources;
            }
        }
        
        if (Object.keys(updates).length > 0) {
            gameState.batchUpdate(updates);
        }
        
        // Update stats
        const decisionsMade = gameState.get('stats.decisionsMade') || 0;
        gameState.set('stats.decisionsMade', decisionsMade + 1);
    }

    showNotification(type, title, message, duration = 5000) {
        const notification = Utils.DOM.create('div', {
            className: `notification ${type} slide-in-right`
        });
        
        const icon = GameConfig.UI.NOTIFICATIONS[type]?.icon || '📡';
        
        notification.innerHTML = `
            <div class="notification-icon">${icon}</div>
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
        if (container) {
            container.appendChild(notification);
            
            // Auto-remove after duration
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.classList.add('fade-out');
                    setTimeout(() => notification.remove(), 300);
                }
            }, duration);
        }
    }

    showError(message) {
        Utils.DOM.setText('loading-status', `ERROR: ${message}`);
        Utils.DOM.addClass('loading-spinner', 'hidden');
    }

    updateLoadingStatus(message) {
        Utils.DOM.setText('loading-status', message);
    }

    updateLoadingProgress(percentage) {
        // Could add a progress bar to the loading screen
        Utils.Debug.log('DEBUG', `Loading progress: ${percentage.toFixed(1)}%`);
    }

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
    event.preventDefault();
});