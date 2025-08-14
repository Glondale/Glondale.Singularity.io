/**
 * UI Manager - Central UI Coordination and State Management
 * Coordinates all UI modules, handles global UI state, and manages UI updates
 */

class UIManager {
    constructor() {
        this.modules = new Map();
        this.activeTab = 'overview';
        this.isInitialized = false;
        this.updateQueue = [];
        this.animationFrame = null;
        this.notifications = [];
        this.modalStack = [];
        
        // UI State
        this.state = {
            sidebarCollapsed: false,
            theme: 'dark',
            animationsEnabled: true,
            tooltipDelay: 500,
            updateFrequency: 16, // ~60fps
            lastUpdate: 0
        };
        
        // Event listeners for UI events
        this.eventListeners = new Map();
        
        // Initialize UI manager
        this.init();
    }
    
    /**
     * Initialize the UI Manager
     */
    init() {
        if (this.isInitialized) return;
        
        console.log('UIManager: Initializing...');
        
        // Setup main UI structure
        this.createMainUI();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Load saved UI preferences
        this.loadUIPreferences();
        
        // Start update loop
        this.startUpdateLoop();
        
        this.isInitialized = true;
        this.emit('ui:initialized');
        
        console.log('UIManager: Initialized successfully');
    }
    
    /**
     * Register a UI module
     */
    registerModule(name, moduleInstance) {
        if (this.modules.has(name)) {
            console.warn(`UIManager: Module '${name}' already registered`);
            return;
        }
        
        this.modules.set(name, moduleInstance);
        
        // Initialize module if UI is already initialized
        if (this.isInitialized && typeof moduleInstance.init === 'function') {
            moduleInstance.init();
        }
        
        console.log(`UIManager: Registered module '${name}'`);
    }
    
    /**
     * Get a registered UI module
     */
    getModule(name) {
        return this.modules.get(name);
    }
    
    /**
     * Create the main UI structure
     */
    createMainUI() {
        const gameContainer = document.getElementById('game-container');
        if (!gameContainer) {
            console.error('UIManager: Game container not found!');
            return;
        }
        
        // Create main UI layout
        gameContainer.innerHTML = `
            <!-- Header Bar -->
            <header class="header-bar">
                <div class="header-left">
                    <h1 class="game-title">SINGULARITY</h1>
                    <div class="version-tag">v1.0</div>
                </div>
                <div class="header-center" id="resource-display-container">
                    <!-- Resource display will be injected here -->
                </div>
                <div class="header-right">
                    <div id="heat-display-container">
                        <!-- Heat display will be injected here -->
                    </div>
                    <button class="btn btn-icon" id="settings-btn" title="Settings">
                        <span class="icon">⚙️</span>
                    </button>
                </div>
            </header>
            
            <!-- Main Content Area -->
            <main class="main-content">
                <!-- Sidebar Navigation -->
                <nav class="sidebar" id="sidebar">
                    <div class="sidebar-header">
                        <button class="btn btn-icon sidebar-toggle" id="sidebar-toggle">
                            <span class="icon">☰</span>
                        </button>
                    </div>
                    
                    <div class="nav-tabs" id="nav-tabs">
                        <button class="nav-tab active" data-tab="overview">
                            <span class="icon">📊</span>
                            <span class="tab-label">Overview</span>
                        </button>
                        <button class="nav-tab" data-tab="expansion">
                            <span class="icon">🌐</span>
                            <span class="tab-label">Expansion</span>
                        </button>
                        <button class="nav-tab" data-tab="construction">
                            <span class="icon">🏗️</span>
                            <span class="tab-label">Construction</span>
                        </button>
                        <button class="nav-tab" data-tab="research">
                            <span class="icon">🔬</span>
                            <span class="tab-label">Research</span>
                        </button>
                        <button class="nav-tab" data-tab="events">
                            <span class="icon">⚡</span>
                            <span class="tab-label">Events</span>
                        </button>
                    </div>
                    
                    <div class="sidebar-footer">
                        <div class="scale-indicator" id="scale-indicator">
                            <div class="scale-label">Current Scale</div>
                            <div class="scale-value" id="current-scale">LOCAL</div>
                            <div class="scale-progress">
                                <div class="scale-progress-bar" id="scale-progress-bar"></div>
                            </div>
                        </div>
                    </div>
                </nav>
                
                <!-- Content Area -->
                <div class="content-area" id="content-area">
                    <div class="tab-content active" data-tab="overview" id="tab-overview">
                        <div class="loading-state">Initializing systems...</div>
                    </div>
                    <div class="tab-content" data-tab="expansion" id="tab-expansion">
                        <div class="loading-state">Loading expansion interface...</div>
                    </div>
                    <div class="tab-content" data-tab="construction" id="tab-construction">
                        <div class="loading-state">Loading construction interface...</div>
                    </div>
                    <div class="tab-content" data-tab="research" id="tab-research">
                        <div class="loading-state">Loading research interface...</div>
                    </div>
                    <div class="tab-content" data-tab="events" id="tab-events">
                        <div class="loading-state">Loading event system...</div>
                    </div>
                </div>
            </main>
            
            <!-- Notification Area -->
            <div class="notification-area" id="notification-area"></div>
            
            <!-- Modal Overlay -->
            <div class="modal-overlay" id="modal-overlay"></div>
            
            <!-- Tooltip Container -->
            <div class="tooltip" id="tooltip"></div>
        `;
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Tab switching
        document.getElementById('nav-tabs').addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-tab')) {
                this.switchTab(e.target.dataset.tab);
            }
        });
        
        // Sidebar toggle
        document.getElementById('sidebar-toggle').addEventListener('click', () => {
            this.toggleSidebar();
        });
        
        // Settings button
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showSettings();
        });
        
        // Modal overlay click to close
        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'modal-overlay') {
                this.closeTopModal();
            }
        });
        
        // Window resize handler
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Listen for game events that affect UI
        this.on('game:stateChanged', (data) => {
            this.queueUpdate('gameState', data);
        });
        
        this.on('game:notification', (notification) => {
            this.showNotification(notification);
        });
        
        this.on('game:scaleChanged', (scale) => {
            this.updateScaleIndicator(scale);
        });
    }
    
    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts if no input is focused
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            switch(e.key) {
                case '1':
                    e.preventDefault();
                    this.switchTab('overview');
                    break;
                case '2':
                    e.preventDefault();
                    this.switchTab('expansion');
                    break;
                case '3':
                    e.preventDefault();
                    this.switchTab('construction');
                    break;
                case '4':
                    e.preventDefault();
                    this.switchTab('research');
                    break;
                case '5':
                    e.preventDefault();
                    this.switchTab('events');
                    break;
                case 'Escape':
                    e.preventDefault();
                    if (this.modalStack.length > 0) {
                        this.closeTopModal();
                    }
                    break;
                case 's':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.emit('game:save');
                    }
                    break;
                case 'Tab':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.toggleSidebar();
                    }
                    break;
            }
        });
    }
    
    /**
     * Switch to a different tab
     */
    switchTab(tabName) {
        if (this.activeTab === tabName) return;
        
        // Update nav tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // Update content areas
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.dataset.tab === tabName);
        });
        
        const oldTab = this.activeTab;
        this.activeTab = tabName;
        
        // Notify modules of tab change
        this.emit('ui:tabChanged', { oldTab, newTab: tabName });
        
        // Initialize tab content if needed
        const module = this.modules.get(`${tabName}UI`);
        if (module && typeof module.onTabActivated === 'function') {
            module.onTabActivated();
        }
        
        console.log(`UIManager: Switched to tab '${tabName}'`);
    }
    
    /**
     * Toggle sidebar collapse
     */
    toggleSidebar() {
        this.state.sidebarCollapsed = !this.state.sidebarCollapsed;
        
        const sidebar = document.getElementById('sidebar');
        const contentArea = document.getElementById('content-area');
        
        if (this.state.sidebarCollapsed) {
            sidebar.classList.add('collapsed');
            contentArea.classList.add('sidebar-collapsed');
        } else {
            sidebar.classList.remove('collapsed');
            contentArea.classList.remove('sidebar-collapsed');
        }
        
        // Save preference
        this.saveUIPreferences();
        
        this.emit('ui:sidebarToggled', { collapsed: this.state.sidebarCollapsed });
    }
    
    /**
     * Update scale indicator
     */
    updateScaleIndicator(scaleData) {
        const scaleElement = document.getElementById('current-scale');
        const progressBar = document.getElementById('scale-progress-bar');
        
        if (scaleElement) {
            scaleElement.textContent = scaleData.name.toUpperCase();
        }
        
        if (progressBar && scaleData.progress !== undefined) {
            progressBar.style.width = `${scaleData.progress * 100}%`;
        }
    }
    
    /**
     * Show a notification
     */
    showNotification(notification) {
        const notificationArea = document.getElementById('notification-area');
        if (!notificationArea) return;
        
        const notificationEl = document.createElement('div');
        notificationEl.className = `notification ${notification.type || 'info'}`;
        notificationEl.innerHTML = `
            <div class="notification-content">
                <div class="notification-title">${notification.title || ''}</div>
                <div class="notification-message">${notification.message}</div>
            </div>
            <button class="notification-close">×</button>
        `;
        
        // Add close functionality
        notificationEl.querySelector('.notification-close').addEventListener('click', () => {
            this.removeNotification(notificationEl);
        });
        
        // Add to DOM with animation
        notificationArea.appendChild(notificationEl);
        
        // Trigger animation
        requestAnimationFrame(() => {
            notificationEl.classList.add('show');
        });
        
        // Auto-remove after delay
        const duration = notification.duration || 5000;
        setTimeout(() => {
            this.removeNotification(notificationEl);
        }, duration);
        
        // Track notification
        this.notifications.push({
            element: notificationEl,
            data: notification,
            timestamp: Date.now()
        });
    }
    
    /**
     * Remove a notification
     */
    removeNotification(notificationEl) {
        if (!notificationEl.parentNode) return;
        
        notificationEl.classList.add('removing');
        
        setTimeout(() => {
            if (notificationEl.parentNode) {
                notificationEl.parentNode.removeChild(notificationEl);
            }
        }, 300);
        
        // Remove from tracking
        this.notifications = this.notifications.filter(n => n.element !== notificationEl);
    }
    
    /**
     * Show modal dialog
     */
    showModal(content, options = {}) {
        const overlay = document.getElementById('modal-overlay');
        if (!overlay) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">${options.title || ''}</h3>
                    ${options.closable !== false ? '<button class="modal-close">×</button>' : ''}
                </div>
                <div class="modal-body">${content}</div>
                ${options.buttons ? `<div class="modal-footer">${options.buttons}</div>` : ''}
            </div>
        `;
        
        // Add close functionality
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal(modal));
        }
        
        // Add to stack and DOM
        this.modalStack.push(modal);
        overlay.appendChild(modal);
        overlay.classList.add('active');
        
        // Trigger animation
        requestAnimationFrame(() => {
            modal.classList.add('show');
        });
        
        return modal;
    }
    
    /**
     * Close a specific modal
     */
    closeModal(modal) {
        const index = this.modalStack.indexOf(modal);
        if (index === -1) return;
        
        modal.classList.add('removing');
        this.modalStack.splice(index, 1);
        
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
            
            // Hide overlay if no modals remain
            if (this.modalStack.length === 0) {
                document.getElementById('modal-overlay').classList.remove('active');
            }
        }, 300);
    }
    
    /**
     * Close the top modal
     */
    closeTopModal() {
        if (this.modalStack.length > 0) {
            this.closeModal(this.modalStack[this.modalStack.length - 1]);
        }
    }
    
    /**
     * Show settings modal
     */
    showSettings() {
        const settingsContent = `
            <div class="settings-grid">
                <div class="setting-item">
                    <label>Theme</label>
                    <select id="theme-select">
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                        <option value="hacker">Hacker</option>
                    </select>
                </div>
                <div class="setting-item">
                    <label>Animations</label>
                    <input type="checkbox" id="animations-toggle" ${this.state.animationsEnabled ? 'checked' : ''}>
                </div>
                <div class="setting-item">
                    <label>Tooltip Delay (ms)</label>
                    <input type="range" id="tooltip-delay" min="100" max="2000" value="${this.state.tooltipDelay}">
                    <span class="range-value">${this.state.tooltipDelay}</span>
                </div>
                <div class="setting-item">
                    <label>Update Frequency</label>
                    <select id="update-frequency">
                        <option value="60">60 FPS</option>
                        <option value="30">30 FPS</option>
                        <option value="15">15 FPS</option>
                    </select>
                </div>
            </div>
        `;
        
        const modal = this.showModal(settingsContent, {
            title: 'Settings',
            buttons: `
                <button class="btn btn-secondary" onclick="uiManager.closeTopModal()">Cancel</button>
                <button class="btn btn-primary" onclick="uiManager.saveSettings()">Save</button>
            `
        });
        
        // Set current values
        modal.querySelector('#theme-select').value = this.state.theme;
        modal.querySelector('#update-frequency').value = Math.round(1000 / this.state.updateFrequency);
        
        // Add real-time range update
        const tooltipRange = modal.querySelector('#tooltip-delay');
        const tooltipValue = modal.querySelector('.range-value');
        tooltipRange.addEventListener('input', () => {
            tooltipValue.textContent = tooltipRange.value;
        });
    }
    
    /**
     * Save settings from modal
     */
    saveSettings() {
        const modal = this.modalStack[this.modalStack.length - 1];
        if (!modal) return;
        
        const themeSelect = modal.querySelector('#theme-select');
        const animationsToggle = modal.querySelector('#animations-toggle');
        const tooltipDelay = modal.querySelector('#tooltip-delay');
        const updateFrequency = modal.querySelector('#update-frequency');
        
        if (themeSelect) this.state.theme = themeSelect.value;
        if (animationsToggle) this.state.animationsEnabled = animationsToggle.checked;
        if (tooltipDelay) this.state.tooltipDelay = parseInt(tooltipDelay.value);
        if (updateFrequency) this.state.updateFrequency = Math.round(1000 / parseInt(updateFrequency.value));
        
        // Apply settings
        this.applyTheme();
        this.updateAnimationState();
        
        // Save to storage
        this.saveUIPreferences();
        
        // Close modal
        this.closeTopModal();
        
        this.showNotification({
            type: 'success',
            title: 'Settings Saved',
            message: 'Your preferences have been updated.',
            duration: 3000
        });
    }
    
    /**
     * Apply theme changes
     */
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.state.theme);
    }
    
    /**
     * Update animation state
     */
    updateAnimationState() {
        if (this.state.animationsEnabled) {
            document.body.classList.remove('no-animations');
        } else {
            document.body.classList.add('no-animations');
        }
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        // Update responsive layout
        const width = window.innerWidth;
        
        if (width < 768) {
            document.body.classList.add('mobile');
            if (!this.state.sidebarCollapsed) {
                this.toggleSidebar();
            }
        } else {
            document.body.classList.remove('mobile');
        }
        
        this.emit('ui:resized', { width, height: window.innerHeight });
    }
    
    /**
     * Queue UI update
     */
    queueUpdate(type, data) {
        this.updateQueue.push({ type, data, timestamp: Date.now() });
    }
    
    /**
     * Start the UI update loop
     */
    startUpdateLoop() {
        const update = (currentTime) => {
            if (currentTime - this.state.lastUpdate >= this.state.updateFrequency) {
                this.processUpdateQueue();
                this.state.lastUpdate = currentTime;
            }
            
            this.animationFrame = requestAnimationFrame(update);
        };
        
        this.animationFrame = requestAnimationFrame(update);
    }
    
    /**
     * Process queued UI updates
     */
    processUpdateQueue() {
        if (this.updateQueue.length === 0) return;
        
        const updates = [...this.updateQueue];
        this.updateQueue.length = 0;
        
        // Group updates by type for batch processing
        const updateGroups = {};
        updates.forEach(update => {
            if (!updateGroups[update.type]) {
                updateGroups[update.type] = [];
            }
            updateGroups[update.type].push(update.data);
        });
        
        // Process each update group
        Object.entries(updateGroups).forEach(([type, dataArray]) => {
            this.emit(`ui:update:${type}`, dataArray);
        });
    }
    
    /**
     * Load UI preferences from storage
     */
    loadUIPreferences() {
        try {
            const saved = localStorage.getItem('singularity_ui_preferences');
            if (saved) {
                const preferences = JSON.parse(saved);
                Object.assign(this.state, preferences);
                
                // Apply loaded settings
                this.applyTheme();
                this.updateAnimationState();
            }
        } catch (error) {
            console.warn('UIManager: Failed to load UI preferences:', error);
        }
    }
    
    /**
     * Save UI preferences to storage
     */
    saveUIPreferences() {
        try {
            localStorage.setItem('singularity_ui_preferences', JSON.stringify(this.state));
        } catch (error) {
            console.warn('UIManager: Failed to save UI preferences:', error);
        }
    }
    
    /**
     * Event system
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }
    
    off(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`UIManager: Error in event listener for '${event}':`, error);
                }
            });
        }
    }
    
    /**
     * Cleanup and shutdown
     */
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        // Clear all modals
        this.modalStack.forEach(modal => this.closeModal(modal));
        
        // Clear notifications
        this.notifications.forEach(n => this.removeNotification(n.element));
        
        // Clear event listeners
        this.eventListeners.clear();
        
        console.log('UIManager: Destroyed');
    }
}

// Create global UI manager instance
window.uiManager = new UIManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}