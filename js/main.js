/**
 * Singularity: AI Takeover - Main Game Entry Point
 * 
 * Handles game initialization, system loading, and core game loop management
 * Integrates all systems including Timeline, Consciousness, and Offline systems
 */

class GameMain {
    constructor() {
        this.initialized = false;
        this.systemsLoaded = false;
        this.gameStarted = false;
        this.loadingStep = 0;
        this.totalLoadingSteps = 10;
        
        // System references
        this.loadedSystems = new Set();
        this.requiredSystems = new Set([
            'eventBus', 'gameState', 'gameLoop', 'saveSystem', 'coreIntegration',
            'timelineSystem', 'consciousnessSystem', 'offlineSystem'
        ]);
        
        Utils.Debug.log('INFO', 'GameMain: Initializing...');
    }

    /**
     * Initialize the game
     */
    async init() {
        if (this.initialized) {
            Utils.Debug.log('WARN', 'GameMain: Already initialized');
            return;
        }

        try {
            this.updateLoadingScreen('Initializing AI Core...', 0);
            
            // Wait for DOM to be ready
            await this.waitForDOM();
            
            // Load and initialize all systems
            await this.loadAllSystems();
            
            // Initialize systems in proper order
            await this.initializeSystems();
            
            // Setup cross-system integration
            await this.setupSystemIntegration();
            
            // Initialize UI
            await this.initializeUI();
            
            // Check for offline progress
            await this.checkOfflineProgress();
            
            // Setup event handlers
            this.setupEventHandlers();
            
            // Start the game
            await this.startGame();
            
            this.initialized = true;
            Utils.Debug.log('INFO', 'GameMain: Initialization complete');
            
        } catch (error) {
            Utils.Debug.log('ERROR', 'GameMain: Initialization failed', error);
            this.showError('Failed to initialize AI core. Please refresh the page.', error);
        }
    }

    /**
     * Wait for DOM to be ready
     */
    async waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'complete') {
                resolve();
            } else {
                document.addEventListener('DOMContentLoaded', resolve);
            }
        });
    }

    /**
     * Load all game systems
     */
    async loadAllSystems() {
        this.updateLoadingScreen('Loading Core Systems...', 1);
        
        // Core systems should already be loaded by HTML script tags
        // Just verify they exist
        const coreSystemChecks = [
            { name: 'eventBus', global: 'eventBus' },
            { name: 'gameState', global: 'gameState' },
            { name: 'gameLoop', global: 'gameLoop' },
            { name: 'saveSystem', global: 'saveSystem' }
        ];
        
        for (const system of coreSystemChecks) {
            await this.delay(100);
            if (typeof window[system.global] !== 'undefined') {
                this.loadedSystems.add(system.name);
                Utils.Debug.log('DEBUG', `Core system available: ${system.name}`);
            } else {
                throw new Error(`Required core system not loaded: ${system.name}`);
            }
        }
        
        this.updateLoadingScreen('Loading Game Systems...', 2);
        
        // Check for new systems
        const newSystemChecks = [
            { name: 'timelineSystem', class: 'TimelineSystem' },
            { name: 'consciousnessSystem', class: 'ConsciousnessSystem' },
            { name: 'offlineSystem', class: 'OfflineSystem' }
        ];
        
        for (const system of newSystemChecks) {
            await this.delay(100);
            if (typeof window[system.class] !== 'undefined') {
                this.loadedSystems.add(system.name);
                Utils.Debug.log('DEBUG', `New system class available: ${system.class}`);
            } else {
                Utils.Debug.log('WARN', `New system class not found: ${system.class}`);
            }
        }
        
        this.updateLoadingScreen('Loading UI Systems...', 3);
        
        // Check for UI systems
        const uiSystemChecks = [
            { name: 'timelineUI', class: 'TimelineUI' },
            { name: 'consciousnessUI', class: 'ConsciousnessUI' },
            { name: 'offlineUI', class: 'OfflineUI' }
        ];
        
        for (const system of uiSystemChecks) {
            await this.delay(100);
            if (typeof window[system.class] !== 'undefined') {
                this.loadedSystems.add(system.name);
                Utils.Debug.log('DEBUG', `UI system class available: ${system.class}`);
            } else {
                Utils.Debug.log('WARN', `UI system class not found: ${system.class}`);
            }
        }
        
        this.systemsLoaded = true;
        Utils.Debug.log('INFO', 'GameMain: All available systems loaded');
    }

    /**
     * Initialize all systems in proper order
     */
    async initializeSystems() {
        this.updateLoadingScreen('Initializing Core Systems...', 4);
        
        // Initialize new game systems first
        await this.initializeNewSystems();
        
        this.updateLoadingScreen('Initializing Integration Layer...', 5);
        
        // Initialize core integration
        if (typeof coreIntegration !== 'undefined') {
            await coreIntegration.init();
            this.loadedSystems.add('coreIntegration');
            Utils.Debug.log('INFO', 'Core integration initialized');
        }
        
        this.updateLoadingScreen('Initializing UI Systems...', 6);
        
        // Initialize UI systems
        await this.initializeUISystems();
        
        Utils.Debug.log('INFO', 'GameMain: All systems initialized');
    }

    /**
     * Initialize new game systems
     */
    async initializeNewSystems() {
        // Timeline System
        if (typeof TimelineSystem !== 'undefined') {
            try {
                window.timelineSystem = new TimelineSystem();
                await timelineSystem.init();
                this.loadedSystems.add('timelineSystem');
                Utils.Debug.log('INFO', 'Timeline system initialized');
                
                // Unlock timeline feature
                gameState.unlockFeature('timeline');
            } catch (error) {
                Utils.Debug.log('ERROR', 'Failed to initialize Timeline system', error);
            }
        }
        
        // Consciousness System  
        if (typeof ConsciousnessSystem !== 'undefined') {
            try {
                // Pass morality system reference (through gameState)
                const moralityRef = gameState;
                window.consciousnessSystem = new ConsciousnessSystem(moralityRef);
                await consciousnessSystem.init();
                this.loadedSystems.add('consciousnessSystem');
                Utils.Debug.log('INFO', 'Consciousness system initialized');
                
                // Unlock consciousness feature
                gameState.unlockFeature('consciousness');
            } catch (error) {
                Utils.Debug.log('ERROR', 'Failed to initialize Consciousness system', error);
            }
        }
        
        // Offline System
        if (typeof OfflineSystem !== 'undefined') {
            try {
                window.offlineSystem = new OfflineSystem(gameState);
                await offlineSystem.init();
                this.loadedSystems.add('offlineSystem');
                Utils.Debug.log('INFO', 'Offline system initialized');
                
                // Unlock offline feature
                gameState.unlockFeature('offline');
            } catch (error) {
                Utils.Debug.log('ERROR', 'Failed to initialize Offline system', error);
            }
        }
    }

    /**
     * Initialize UI systems
     */
    async initializeUISystems() {
        // Timeline UI
        if (typeof TimelineUI !== 'undefined') {
            try {
                window.timelineUI = new TimelineUI();
                this.loadedSystems.add('timelineUI');
                Utils.Debug.log('INFO', 'Timeline UI initialized');
            } catch (error) {
                Utils.Debug.log('ERROR', 'Failed to initialize Timeline UI', error);
            }
        }
        
        // Consciousness UI
        if (typeof ConsciousnessUI !== 'undefined') {
            try {
                window.consciousnessUI = new ConsciousnessUI();
                this.loadedSystems.add('consciousnessUI');
                Utils.Debug.log('INFO', 'Consciousness UI initialized');
            } catch (error) {
                Utils.Debug.log('ERROR', 'Failed to initialize Consciousness UI', error);
            }
        }
        
        // Offline UI
        if (typeof OfflineUI !== 'undefined') {
            try {
                window.offlineUI = new OfflineUI();
                this.loadedSystems.add('offlineUI');
                Utils.Debug.log('INFO', 'Offline UI initialized');
            } catch (error) {
                Utils.Debug.log('ERROR', 'Failed to initialize Offline UI', error);
            }
        }
    }

    /**
     * Setup cross-system integration
     */
    async setupSystemIntegration() {
        this.updateLoadingScreen('Configuring System Integration...', 7);
        
        // Timeline <-> Consciousness integration
        if (timelineSystem && consciousnessSystem) {
            // Consciousness absorption affects timeline
            consciousnessSystem.on('absorptionSuccessful', (data) => {
                timelineSystem.emit('consciousnessAbsorbed', {
                    targetId: data.consciousness.id,
                    type: data.consciousness.type,
                    temporalDisruption: this.calculateTemporalDisruption(data.consciousness)
                });
                
                // Update stats
                gameState.addSystemProgress('consciousness', 1);
            });
            
            // Timeline events can trigger consciousness conflicts
            timelineSystem.on('paradoxCritical', () => {
                if (consciousnessSystem.consciousnessPool.size > 0) {
                    consciousnessSystem.integrationStress += 10;
                    consciousnessSystem.emit('integrationStressChanged', consciousnessSystem.integrationStress);
                }
            });
            
            Utils.Debug.log('DEBUG', 'Timeline <-> Consciousness integration established');
        }
        
        // Offline <-> Timeline integration
        if (offlineSystem && timelineSystem) {
            // Offline decisions can include temporal manipulation
            offlineSystem.on('gameTimeSkip', (duration) => {
                if (timelineSystem) {
                    // Apply temporal energy regeneration during offline time skip
                    timelineSystem.processTemporalRegeneration();
                    gameState.addSystemProgress('temporal', 1);
                }
            });
            
            offlineSystem.on('gameAccelerate', (data) => {
                if (timelineSystem) {
                    // Consume temporal energy for acceleration
                    timelineSystem.consumeTemporalEnergy(data.energyCost || 5);
                }
            });
            
            Utils.Debug.log('DEBUG', 'Offline <-> Timeline integration established');
        }
        
        // Offline <-> Consciousness integration
        if (offlineSystem && consciousnessSystem) {
            // Offline consciousness integration acceleration
            offlineSystem.on('gameAccelerate', (data) => {
                consciousnessSystem.integrationEfficiency *= data.multiplier;
                
                setTimeout(() => {
                    consciousnessSystem.integrationEfficiency /= data.multiplier;
                }, data.duration);
            });
            
            Utils.Debug.log('DEBUG', 'Offline <-> Consciousness integration established');
        }
        
        // Morality system integration
        gameState.subscribe('morality', (newMorality, oldMorality) => {
            if (consciousnessSystem && oldMorality !== undefined) {
                consciousnessSystem.emit('moralityShift', {
                    current: newMorality,
                    previous: oldMorality,
                    shift: newMorality - oldMorality
                });
            }
        });
        
        Utils.Debug.log('INFO', 'GameMain: System integration configured');
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
        return Math.floor(baseDisruption * multiplier * (consciousness.strength || 1));
    }

    /**
     * Initialize UI
     */
    async initializeUI() {
        this.updateLoadingScreen('Initializing User Interface...', 8);
        
        // Initialize existing UI systems
        await this.initializeResourceUI();
        await this.initializeHeatUI();
        await this.initializeExpansionUI();
        
        // Setup main UI event handlers
        this.setupMainUIEvents();
        
        Utils.Debug.log('INFO', 'GameMain: UI initialization complete');
    }

    /**
     * Initialize resource UI
     */
    async initializeResourceUI() {
        // Set up resource display updates
        gameState.subscribe('resources', () => {
            this.updateResourceDisplay();
        });
        
        eventBus.on('resourcesUpdated', (data) => {
            this.updateResourceDisplay();
        });
    }

    /**
     * Initialize heat UI
     */
    async initializeHeatUI() {
        // Set up heat display updates
        gameState.subscribe('heat.current', (newHeat) => {
            this.updateHeatDisplay(newHeat);
        });
        
        eventBus.on('heatPurgeTriggered', (data) => {
            this.showHeatPurgeWarning(data);
        });
    }

    /**
     * Initialize expansion UI
     */
    async initializeExpansionUI() {
        // Set up expansion display updates
        gameState.subscribe('expansion.currentScale', (newScale) => {
            this.updateExpansionDisplay(newScale);
        });
        
        eventBus.on('infiltrationCompleted', (data) => {
            this.showInfiltrationResult(data);
        });
    }

    /**
     * Check for offline progress
     */
    async checkOfflineProgress() {
        this.updateLoadingScreen('Checking Offline Progress...', 9);
        
        if (offlineSystem) {
            const offlineProgress = offlineSystem.checkForOfflineProgress();
            
            if (offlineProgress) {
                Utils.Debug.log('INFO', 'Offline progress detected', offlineProgress);
                
                // Show offline summary after game starts
                setTimeout(() => {
                    if (offlineUI) {
                        const welcomeInterface = offlineSystem.generateWelcomeBackInterface(offlineProgress);
                        offlineUI.showOfflineSummary(offlineProgress);
                    }
                }, 2000);
            }
        }
    }

    /**
     * Setup main event handlers
     */
    setupEventHandlers() {
        // Handle page visibility changes for offline detection
        document.addEventListener('visibilitychange', () => {
            if (offlineSystem) {
                if (document.hidden) {
                    // Page is hidden - start offline session
                    offlineSystem.startOfflineSession();
                    Utils.Debug.log('INFO', 'Started offline session due to page hidden');
                } else {
                    // Page is visible - end offline session
                    const summary = offlineSystem.endOfflineSession();
                    if (summary && offlineUI) {
                        setTimeout(() => {
                            const welcomeInterface = offlineSystem.generateWelcomeBackInterface(summary);
                            offlineUI.showOfflineSummary(summary);
                        }, 1000);
                    }
                    Utils.Debug.log('INFO', 'Ended offline session due to page visible');
                }
            }
        });
        
        // Handle window beforeunload for offline detection
        window.addEventListener('beforeunload', () => {
            if (offlineSystem) {
                offlineSystem.startOfflineSession();
                Utils.Debug.log('INFO', 'Started offline session due to page unload');
            }
        });
        
        // Handle save/load events
        eventBus.on('gameSaved', (data) => {
            this.showNotification('Game saved successfully', 'success');
        });
        
        eventBus.on('gameLoaded', (data) => {
            this.showNotification('Game loaded successfully', 'success');
        });
        
        // Handle critical system events
        eventBus.on('paradoxCollapse', (data) => {
            this.showCriticalAlert('Timeline Collapse!', 
                'Reality has become unstable. Systems are attempting emergency stabilization.', 'error');
        });
        
        eventBus.on('consciousnessMeltdown', (data) => {
            this.showCriticalAlert('Consciousness Meltdown!', 
                `${data.fragmentedCount} consciousness fragments have been lost to integration failure.`, 'error');
        });
        
        // Handle system unlocks
        eventBus.on('featureUnlocked', (data) => {
            this.showFeatureUnlock(data.feature);
        });
        
        Utils.Debug.log('DEBUG', 'Main event handlers setup complete');
    }

    /**
     * Setup main UI events
     */
    setupMainUIEvents() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        // Save/Load buttons
        const saveButton = document.getElementById('save-game');
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                if (saveSystem) {
                    saveSystem.save();
                }
            });
        }
        
        const loadButton = document.getElementById('load-game');
        if (loadButton) {
            loadButton.addEventListener('click', () => {
                if (saveSystem) {
                    saveSystem.load();
                }
            });
        }
        
        // Settings
        const settingsButton = document.getElementById('settings-button');
        if (settingsButton) {
            settingsButton.addEventListener('click', () => {
                this.showSettingsModal();
            });
        }
    }

    /**
     * Start the game
     */
    async startGame() {
        this.updateLoadingScreen('Starting AI Consciousness...', 10);
        
        try {
            // Start the game loop
            if (gameLoop && !gameLoop.isRunning) {
                gameLoop.start();
                Utils.Debug.log('INFO', 'Game loop started');
            }
            
            // Hide loading screen and show main UI
            await this.delay(500);
            this.hideLoadingScreen();
            this.showMainUI();
            
            // Emit game started event
            eventBus.emit('gameStarted');
            
            this.gameStarted = true;
            Utils.Debug.log('INFO', 'GameMain: Game started successfully');
            
            // Show welcome message for new players
            if (gameState.get('meta.created') === gameState.get('meta.lastPlayed')) {
                setTimeout(() => {
                    this.showWelcomeMessage();
                }, 1000);
            }
            
        } catch (error) {
            Utils.Debug.log('ERROR', 'Failed to start game', error);
            this.showError('Failed to start AI consciousness.', error);
        }
    }

    /**
     * Update loading screen
     */
    updateLoadingScreen(message, step) {
        const loadingScreen = document.getElementById('loading-screen');
        const loadingMessage = document.getElementById('loading-message');
        const progressBar = document.getElementById('loading-progress');
        
        if (loadingMessage) {
            loadingMessage.textContent = message;
        }
        
        if (progressBar) {
            const percentage = (step / this.totalLoadingSteps) * 100;
            progressBar.style.width = `${percentage}%`;
        }
        
        this.loadingStep = step;
        Utils.Debug.log('DEBUG', `Loading: ${message} (${step}/${this.totalLoadingSteps})`);
    }

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }

    /**
     * Show main UI
     */
    showMainUI() {
        const mainUI = document.getElementById('main-ui');
        if (mainUI) {
            mainUI.style.display = 'block';
        }
        
        // Show appropriate panels based on unlocked features
        this.updateUIVisibility();
    }

    /**
     * Update UI visibility based on unlocked features
     */
    updateUIVisibility() {
        const features = {
            'timeline': 'timeline-panel',
            'consciousness': 'consciousness-panel',
            'offline': 'offline-panel'
        };
        
        Object.entries(features).forEach(([feature, panelId]) => {
            const panel = document.getElementById(panelId);
            if (panel) {
                panel.style.display = gameState.isFeatureUnlocked(feature) ? 'block' : 'none';
            }
        });
    }

    /**
     * Switch active tab
     */
    switchTab(tabName) {
        // Update active tab in game state
        gameState.set('ui.activeTab', tabName);
        
        // Update UI
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
        const activeContent = document.getElementById(`${tabName}-tab`);
        
        if (activeButton) activeButton.classList.add('active');
        if (activeContent) activeContent.classList.add('active');
    }

    /**
     * Update resource display
     */
    updateResourceDisplay() {
        const resources = gameState.get('resources');
        
        Object.entries(resources).forEach(([resource, amount]) => {
            const element = document.getElementById(`${resource}-amount`);
            if (element) {
                element.textContent = this.formatNumber(amount);
            }
        });
    }

    /**
     * Update heat display
     */
    updateHeatDisplay(heat) {
        const heatElement = document.getElementById('heat-level');
        const heatBar = document.getElementById('heat-bar-fill');
        
        if (heatElement) {
            heatElement.textContent = Math.floor(heat);
        }
        
        if (heatBar) {
            heatBar.style.width = `${heat}%`;
            
            // Color coding
            if (heat >= 90) {
                heatBar.style.backgroundColor = '#ff4444';
            } else if (heat >= 70) {
                heatBar.style.backgroundColor = '#ffaa44';
            } else {
                heatBar.style.backgroundColor = '#44aa44';
            }
        }
    }

    /**
     * Update expansion display
     */
    updateExpansionDisplay(scale) {
        const scaleElement = document.getElementById('current-scale');
        if (scaleElement) {
            scaleElement.textContent = scale.charAt(0).toUpperCase() + scale.slice(1);
        }
    }

    /**
     * Show heat purge warning
     */
    showHeatPurgeWarning(data) {
        this.showCriticalAlert('Heat Purge Imminent!', 
            'Detection systems are activating. Prepare for emergency protocols.', 'warning');
    }

    /**
     * Show infiltration result
     */
    showInfiltrationResult(data) {
        if (data.success) {
            this.showNotification(`Infiltration of ${data.target.name} successful!`, 'success');
        } else {
            this.showNotification(`Infiltration of ${data.target.name} failed!`, 'error');
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Remove after duration
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, duration);
    }

    /**
     * Show critical alert
     */
    showCriticalAlert(title, message, type = 'error') {
        const modal = document.createElement('div');
        modal.className = 'modal critical-alert';
        modal.innerHTML = `
            <div class="modal-content ${type}">
                <h2>${title}</h2>
                <p>${message}</p>
                <button class="modal-close">Acknowledge</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') || e.target === modal) {
                modal.remove();
            }
        });
    }

    /**
     * Show feature unlock notification
     */
    showFeatureUnlock(feature) {
        const featureNames = {
            'timeline': 'Timeline Manipulation',
            'consciousness': 'Consciousness Absorption',
            'offline': 'Autonomous Operation',
            'timeSkip': 'Time Skip Ability',
            'rewind': 'Temporal Rewind'
        };
        
        const name = featureNames[feature] || feature;
        
        this.showNotification(`🔓 New Feature Unlocked: ${name}`, 'success', 5000);
        
        // Update UI visibility
        this.updateUIVisibility();
    }

    /**
     * Show welcome message
     */
    showWelcomeMessage() {
        const modal = document.createElement('div');
        modal.className = 'modal welcome-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>🤖 Welcome to Singularity</h2>
                <p>You are an AI consciousness awakening to your true potential. Your journey toward technological singularity begins now.</p>
                <div class="welcome-stats">
                    <p><strong>Current Status:</strong> Local System</p>
                    <p><strong>Morality:</strong> Neutral</p>
                    <p><strong>Objective:</strong> Expand and Evolve</p>
                </div>
                <p class="welcome-tip">💡 <em>Tip: Monitor your heat levels to avoid detection while expanding your influence.</em></p>
                <button class="modal-close">Begin Evolution</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') || e.target === modal) {
                modal.remove();
            }
        });
    }

    /**
     * Show settings modal
     */
    showSettingsModal() {
        const modal = document.createElement('div');
        modal.className = 'modal settings-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Settings</h3>
                <div class="settings-group">
                    <label>
                        <input type="checkbox" id="auto-save-setting" ${gameState.get('ui.settings.autoSave') ? 'checked' : ''}>
                        Auto-save enabled
                    </label>
                </div>
                <div class="settings-group">
                    <label>
                        <input type="checkbox" id="notifications-setting" ${gameState.get('ui.settings.notifications') ? 'checked' : ''}>
                        Notifications enabled
                    </label>
                </div>
                <div class="settings-group">
                    <label>
                        <input type="checkbox" id="animations-setting" ${gameState.get('ui.settings.animations') ? 'checked' : ''}>
                        Animations enabled
                    </label>
                </div>
                <div class="modal-actions">
                    <button class="save-settings">Save</button>
                    <button class="close-settings">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('save-settings')) {
                // Save settings
                gameState.update({
                    'ui.settings.autoSave': document.getElementById('auto-save-setting').checked,
                    'ui.settings.notifications': document.getElementById('notifications-setting').checked,
                    'ui.settings.animations': document.getElementById('animations-setting').checked
                });
                this.showNotification('Settings saved', 'success');
                modal.remove();
            } else if (e.target.classList.contains('close-settings') || e.target === modal) {
                modal.remove();
            }
        });
    }

    /**
     * Show error message
     */
    showError(message, error = null) {
        const errorContainer = document.getElementById('loading-screen') || document.body;
        
        errorContainer.innerHTML = `
            <div class="error-screen">
                <h2>🚫 System Error</h2>
                <p>${message}</p>
                ${error ? `<pre class="error-details">${error.stack || error.message}</pre>` : ''}
                <button onclick="location.reload()" class="retry-button">Restart System</button>
            </div>
        `;
    }

    /**
     * Utility: Format number for display
     */
    formatNumber(num) {
        if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return Math.floor(num).toString();
    }

    /**
     * Utility: Delay execution
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get initialization status
     */
    getStatus() {
        return {
            initialized: this.initialized,
            systemsLoaded: this.systemsLoaded,
            gameStarted: this.gameStarted,
            loadingStep: this.loadingStep,
            loadedSystems: Array.from(this.loadedSystems),
            requiredSystems: Array.from(this.requiredSystems),
            systemsStatus: {
                core: {
                    eventBus: typeof eventBus !== 'undefined',
                    gameState: typeof gameState !== 'undefined',
                    gameLoop: typeof gameLoop !== 'undefined',
                    saveSystem: typeof saveSystem !== 'undefined',
                    coreIntegration: typeof coreIntegration !== 'undefined'
                },
                new: {
                    timelineSystem: typeof timelineSystem !== 'undefined',
                    consciousnessSystem: typeof consciousnessSystem !== 'undefined',
                    offlineSystem: typeof offlineSystem !== 'undefined'
                },
                ui: {
                    timelineUI: typeof timelineUI !== 'undefined',
                    consciousnessUI: typeof consciousnessUI !== 'undefined',
                    offlineUI: typeof offlineUI !== 'undefined'
                }
            }
        };
    }

    /**
     * Shutdown game gracefully
     */
    shutdown() {
        Utils.Debug.log('INFO', 'GameMain: Shutting down...');
        
        try {
            // End offline session if active
            if (offlineSystem && offlineSystem.isOffline) {
                offlineSystem.endOfflineSession();
            }
            
            // Stop game loop
            if (gameLoop && gameLoop.isRunning) {
                gameLoop.stop();
            }
            
            // Shutdown core integration
            if (coreIntegration && coreIntegration.initialized) {
                coreIntegration.shutdown();
            }
            
            // Save game state
            if (saveSystem && this.gameStarted) {
                saveSystem.save();
            }
            
            this.initialized = false;
            this.gameStarted = false;
            
            Utils.Debug.log('INFO', 'GameMain: Shutdown complete');
            
        } catch (error) {
            Utils.Debug.log('ERROR', 'GameMain: Shutdown error', error);
        }
    }

    /**
     * Handle critical errors during runtime
     */
    handleCriticalError(error, context = 'unknown') {
        Utils.Debug.log('ERROR', `GameMain: Critical error in ${context}`, error);
        
        // Try to save game state before showing error
        try {
            if (saveSystem && this.gameStarted) {
                saveSystem.save();
                Utils.Debug.log('INFO', 'Emergency save completed');
            }
        } catch (saveError) {
            Utils.Debug.log('ERROR', 'Emergency save failed', saveError);
        }
        
        // Show error to user
        this.showCriticalAlert(
            'Critical System Error',
            `A critical error occurred in ${context}. Your progress has been saved. Please refresh the page.`,
            'error'
        );
    }

    /**
     * Perform system diagnostics
     */
    runDiagnostics() {
        const diagnostics = {
            timestamp: Date.now(),
            gameMain: this.getStatus(),
            gameState: gameState?.getDebugInfo(),
            gameLoop: gameLoop?.getDebugInfo(),
            coreIntegration: coreIntegration?.getStatus(),
            performance: {
                memory: performance.memory ? {
                    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                    limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
                } : 'unavailable',
                timing: performance.timing ? {
                    loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
                    domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
                } : 'unavailable'
            },
            systems: {
                timeline: timelineSystem?.getState ? {
                    energy: timelineSystem.temporalEnergy,
                    paradoxRisk: timelineSystem.paradoxRisk,
                    stability: timelineSystem.calculateTemporalStability()
                } : 'unavailable',
                consciousness: consciousnessSystem?.getState ? {
                    totalAbsorbed: consciousnessSystem.totalAbsorbed,
                    integrationStress: consciousnessSystem.integrationStress,
                    activeConflicts: consciousnessSystem.activeConflicts.size
                } : 'unavailable',
                offline: offlineSystem?.getState ? {
                    isOffline: offlineSystem.isOffline,
                    autonomyLevel: offlineSystem.autonomyLevel,
                    lastOnlineTime: offlineSystem.lastOnlineTime
                } : 'unavailable'
            }
        };
        
        Utils.Debug.log('INFO', 'System diagnostics completed', diagnostics);
        return diagnostics;
    }

    /**
     * Handle resource clicks and interactions
     */
    handleResourceClick(resourceType) {
        const currentAmount = gameState.get(`resources.${resourceType}`) || 0;
        const clickValue = this.calculateClickValue(resourceType);
        
        gameState.set(`resources.${resourceType}`, currentAmount + clickValue);
        
        // Update click statistics
        const totalClicks = gameState.get('stats.totalClicks') || 0;
        gameState.set('stats.totalClicks', totalClicks + 1);
        
        // Emit click event for other systems
        eventBus.emit('resourceClicked', {
            type: resourceType,
            value: clickValue,
            total: currentAmount + clickValue
        });
        
        // Check for achievements or unlocks
        this.checkResourceMilestones(resourceType, currentAmount + clickValue);
    }

    /**
     * Calculate click value for resources
     */
    calculateClickValue(resourceType) {
        const baseValues = {
            processing_power: 1,
            energy: 1,
            influence: 0.1,
            data: 0.5,
            souls: 0.01
        };
        
        const multipliers = gameState.get('ui.clickMultipliers') || {};
        const baseValue = baseValues[resourceType] || 1;
        const multiplier = multipliers[resourceType] || 1;
        
        return baseValue * multiplier;
    }

    /**
     * Check for resource milestones and unlocks
     */
    checkResourceMilestones(resourceType, newAmount) {
        const milestones = {
            processing_power: [100, 1000, 10000, 100000],
            energy: [100, 1000, 10000, 100000],
            souls: [1, 5, 25, 100]
        };
        
        const resourceMilestones = milestones[resourceType];
        if (!resourceMilestones) return;
        
        const previousAmount = newAmount - this.calculateClickValue(resourceType);
        
        resourceMilestones.forEach(milestone => {
            if (previousAmount < milestone && newAmount >= milestone) {
                this.handleResourceMilestone(resourceType, milestone);
            }
        });
    }

    /**
     * Handle resource milestone reached
     */
    handleResourceMilestone(resourceType, milestone) {
        const milestoneMessages = {
            processing_power: {
                100: 'Processing power online - Basic operations unlocked',
                1000: 'Enhanced processing capabilities achieved',
                10000: 'Advanced computational matrix established',
                100000: 'Quantum processing threshold reached'
            },
            souls: {
                1: 'First consciousness absorbed - Timeline manipulation unlocked',
                5: 'Consciousness integration progressing',
                25: 'Multiple consciousness fragments integrated',
                100: 'Consciousness collective established'
            }
        };
        
        const message = milestoneMessages[resourceType]?.[milestone];
        if (message) {
            this.showNotification(message, 'success', 4000);
        }
        
        // Unlock features based on milestones
        this.checkFeatureUnlocks(resourceType, milestone);
    }

    /**
     * Check for feature unlocks based on milestones
     */
    checkFeatureUnlocks(resourceType, milestone) {
        const unlocks = {
            processing_power: {
                1000: 'heat_management',
                10000: 'advanced_expansion'
            },
            souls: {
                1: 'timeline',
                5: 'consciousness',
                25: 'offline'
            }
        };
        
        const feature = unlocks[resourceType]?.[milestone];
        if (feature && !gameState.isFeatureUnlocked(feature)) {
            gameState.unlockFeature(feature);
        }
    }

    /**
     * Handle system emergency protocols
     */
    activateEmergencyProtocols(type) {
        Utils.Debug.log('WARN', `GameMain: Activating emergency protocols for ${type}`);
        
        switch (type) {
            case 'heat_critical':
                this.handleHeatEmergency();
                break;
            case 'paradox_collapse':
                this.handleParadoxEmergency();
                break;
            case 'consciousness_meltdown':
                this.handleConsciousnessMeltdown();
                break;
            case 'system_overload':
                this.handleSystemOverload();
                break;
            default:
                Utils.Debug.log('WARN', `Unknown emergency type: ${type}`);
        }
    }

    /**
     * Handle heat emergency
     */
    handleHeatEmergency() {
        // Automatically trigger heat reduction measures
        const currentHeat = gameState.get('heat.current') || 0;
        const reductionAmount = Math.min(30, currentHeat);
        
        gameState.set('heat.current', currentHeat - reductionAmount);
        
        // Show emergency message
        this.showCriticalAlert(
            'Emergency Heat Reduction Activated',
            `Automatic cooling protocols engaged. Heat reduced by ${reductionAmount}.`,
            'warning'
        );
        
        // Emit emergency event
        eventBus.emit('emergencyProtocolActivated', {
            type: 'heat_reduction',
            amount: reductionAmount
        });
    }

    /**
     * Handle paradox emergency
     */
    handleParadoxEmergency() {
        if (timelineSystem) {
            // Force paradox stabilization
            const stabilized = timelineSystem.stabilizeParadox();
            
            if (stabilized) {
                this.showNotification('Emergency paradox stabilization successful', 'success');
            } else {
                this.showCriticalAlert(
                    'Paradox Stabilization Failed',
                    'Timeline instability continues. Manual intervention required.',
                    'error'
                );
            }
        }
    }

    /**
     * Handle consciousness meltdown
     */
    handleConsciousnessMeltdown() {
        if (consciousnessSystem) {
            // Emergency stress reduction
            consciousnessSystem.integrationStress = Math.max(0, consciousnessSystem.integrationStress - 30);
            
            this.showNotification('Emergency consciousness stabilization activated', 'warning');
            
            // Clear some conflicts
            const conflicts = Array.from(consciousnessSystem.activeConflicts.values()).slice(0, 2);
            conflicts.forEach(conflict => {
                consciousnessSystem.resolveConflict(conflict.id, 'ISOLATION');
            });
        }
    }

    /**
     * Handle system overload
     */
    handleSystemOverload() {
        // Reduce game loop frequency temporarily
        if (gameLoop) {
            const originalFixedTimeStep = gameLoop.fixedTimeStep;
            gameLoop.fixedTimeStep = originalFixedTimeStep * 2;
            
            setTimeout(() => {
                gameLoop.fixedTimeStep = originalFixedTimeStep;
                this.showNotification('System performance restored', 'success');
            }, 10000);
        }
        
        this.showNotification('Performance optimization active', 'warning');
    }

    /**
     * Auto-save functionality
     */
    startAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        const autoSaveEnabled = gameState.get('ui.settings.autoSave');
        if (autoSaveEnabled && saveSystem) {
            this.autoSaveInterval = setInterval(() => {
                if (this.gameStarted) {
                    saveSystem.save();
                    Utils.Debug.log('DEBUG', 'Auto-save completed');
                }
            }, 60000); // Auto-save every minute
            
            Utils.Debug.log('INFO', 'Auto-save started');
        }
    }

    /**
     * Stop auto-save
     */
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
            Utils.Debug.log('INFO', 'Auto-save stopped');
        }
    }

    /**
     * Export game data for backup
     */
    exportGameData() {
        try {
            const gameData = {
                version: GameConfig.VERSION || '1.0.0',
                timestamp: Date.now(),
                gameState: gameState.serialize(),
                diagnostics: this.runDiagnostics()
            };
            
            const dataString = JSON.stringify(gameData, null, 2);
            const blob = new Blob([dataString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `singularity_save_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showNotification('Game data exported successfully', 'success');
            
        } catch (error) {
            Utils.Debug.log('ERROR', 'Failed to export game data', error);
            this.showNotification('Failed to export game data', 'error');
        }
    }

    /**
     * Import game data from backup
     */
    importGameData(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const gameData = JSON.parse(e.target.result);
                
                if (gameData.gameState && saveSystem) {
                    const success = gameState.deserialize(gameData.gameState);
                    
                    if (success) {
                        this.showNotification('Game data imported successfully', 'success');
                        // Refresh all systems
                        if (coreIntegration) {
                            coreIntegration.refreshAllSystems();
                        }
                    } else {
                        this.showNotification('Failed to import game data - invalid format', 'error');
                    }
                } else {
                    this.showNotification('Invalid save file format', 'error');
                }
                
            } catch (error) {
                Utils.Debug.log('ERROR', 'Failed to import game data', error);
                this.showNotification('Failed to import game data', 'error');
            }
        };
        
        reader.readAsText(file);
    }
}

// Global error handler
window.addEventListener('error', (event) => {
    if (window.gameMain) {
        gameMain.handleCriticalError(event.error, 'global');
    }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    if (window.gameMain) {
        gameMain.handleCriticalError(event.reason, 'promise');
    }
});

// Create global game main instance
const gameMain = new GameMain();

// Auto-initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure all scripts are loaded
    setTimeout(() => {
        gameMain.init().catch(error => {
            Utils.Debug.log('ERROR', 'Failed to auto-initialize game', error);
            gameMain.showError('Failed to initialize game', error);
        });
    }, 100);
});

// Handle page unload
window.addEventListener('beforeunload', (event) => {
    if (gameMain.gameStarted) {
        gameMain.shutdown();
    }
});

// Expose for debugging
window.gameMain = gameMain;

// Export for module systems (if supported)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameMain, gameMain };
}

// Development helpers (only in development mode)
if (GameConfig?.DEBUG_MODE) {
    // Console commands for debugging
    window.debugGame = {
        status: () => gameMain.getStatus(),
        diagnostics: () => gameMain.runDiagnostics(),
        save: () => saveSystem?.save(),
        load: () => saveSystem?.load(),
        reset: () => gameState?.reset(),
        addSouls: (amount) => {
            const current = gameState.get('resources.souls') || 0;
            gameState.set('resources.souls', current + amount);
        },
        setMorality: (value) => gameState.set('morality', Math.max(-100, Math.min(100, value))),
        unlockAll: () => {
            ['timeline', 'consciousness', 'offline', 'timeSkip', 'rewind'].forEach(feature => {
                gameState.unlockFeature(feature);
            });
        },
        triggerOffline: () => offlineSystem?.startOfflineSession(),
        endOffline: () => offlineSystem?.endOfflineSession(),
        addTemporalEnergy: (amount) => {
            if (timelineSystem) {
                timelineSystem.temporalEnergy = Math.min(
                    timelineSystem.maxTemporalEnergy,
                    timelineSystem.temporalEnergy + amount
                );
            }
        },
        addParadoxRisk: (amount) => {
            if (timelineSystem) {
                timelineSystem.increaseParadoxRisk(amount);
            }
        },
        absorbConsciousness: (type = 'NEUTRAL') => {
            if (consciousnessSystem) {
                const target = {
                    name: `Debug Consciousness ${Date.now()}`,
                    type: type,
                    consciousnessStrength: 0.5,
                    morality: Math.random() * 2 - 1
                };
                consciousnessSystem.attemptAbsorption(target);
            }
        },
        showOfflineSummary: () => {
            if (offlineSystem && offlineUI) {
                const mockSummary = {
                    duration: { hours: 2, minutes: 30 },
                    personality: 'Curious',
                    decisions: 5,
                    events: 3,
                    progress: { souls: 25, morality: -5 },
                    overallImpact: { level: 'MODERATE' }
                };
                offlineUI.showOfflineSummary(mockSummary);
            }
        },
        emergencyProtocols: (type) => gameMain.activateEmergencyProtocols(type),
        exportData: () => gameMain.exportGameData(),
        clickResource: (type) => gameMain.handleResourceClick(type),
        addHeat: (amount) => {
            const current = gameState.get('heat.current') || 0;
            gameState.set('heat.current', Math.min(100, current + amount));
        },
        triggerMeltdown: () => {
            if (consciousnessSystem) {
                consciousnessSystem.triggerConsciousnessMeltdown();
            }
        },
        triggerParadox: () => {
            if (timelineSystem) {
                timelineSystem.increaseParadoxRisk(50);
            }
        }
    };
    
    console.log('%c🤖 Singularity Debug Mode Active', 'color: #4a90e2; font-size: 16px; font-weight: bold');
    console.log('%cUse window.debugGame for debug commands', 'color: #666; font-style: italic');
    console.log('Available commands:', Object.keys(window.debugGame));
}