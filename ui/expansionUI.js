/**
 * Expansion UI - Network Map Visualization and Infiltration Interface
 * Manages the display of infiltration targets, network expansion, and active operations
 */

class ExpansionUI {
    constructor() {
        this.container = null;
        this.isInitialized = false;
        this.selectedTarget = null;
        this.viewMode = 'grid'; // 'grid' or 'network'
        this.filterSettings = {
            difficulty: 'all',
            type: 'all',
            status: 'all',
            scale: 'current'
        };
        
        // Current data
        this.availableTargets = new Map();
        this.activeInfiltrations = new Map();
        this.completedTargets = new Set();
        this.currentScale = 'local';
        this.playerResources = {};
        
        // Network map state
        this.mapNodes = new Map();
        this.mapConnections = [];
        this.networkMapContainer = null;
        
        // UI element references
        this.targetsGrid = null;
        this.operationsList = null;
        this.operationsCount = null;
        this.networkMapCanvas = null;
        
        // Target categories for filtering
        this.targetTypes = [
            { id: 'network_device', name: 'Network Devices', icon: '🖥️' },
            { id: 'iot_device', name: 'IoT Devices', icon: '📱' },
            { id: 'server', name: 'Servers', icon: '🖥️' },
            { id: 'database', name: 'Databases', icon: '💾' },
            { id: 'infrastructure', name: 'Infrastructure', icon: '🏗️' },
            { id: 'cloud_platform', name: 'Cloud Services', icon: '☁️' },
            { id: 'military', name: 'Military Systems', icon: '🛡️' },
            { id: 'research', name: 'Research Facilities', icon: '🔬' },
            { id: 'satellite', name: 'Satellites', icon: '🛰️' },
            { id: 'space_facility', name: 'Space Facilities', icon: '🚀' },
            { id: 'megastructure', name: 'Megastructures', icon: '🌌' }
        ];
        
        console.log('ExpansionUI: Initialized');
    }
    
    /**
     * Initialize the expansion UI
     */
    async init() {
        if (this.isInitialized) {
            console.warn('ExpansionUI: Already initialized');
            return;
        }
        
        try {
            console.log('ExpansionUI: Initializing...');
            
            // Get container
            this.container = document.getElementById('expansion-tab');
            if (!this.container) {
                throw new Error('ExpansionUI: Container not found');
            }
            
            // Create UI structure
            this.createExpansionInterface();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup system event handlers
            if (window.eventBus) {
                this.setupSystemEventHandlers();
            }
            
            // Load initial data
            this.loadInitialData();
            
            this.isInitialized = true;
            
            console.log('ExpansionUI: Initialization complete');
            
        } catch (error) {
            console.error('ExpansionUI: Initialization failed', error);
            throw error;
        }
    }
    
    /**
     * Create the expansion interface structure
     */
    createExpansionInterface() {
        this.container.innerHTML = `
            <div class="expansion-interface">
                <!-- Header Controls -->
                <div class="expansion-header">
                    <div class="expansion-title">
                        <h2>Network Expansion</h2>
                        <div class="scale-display" id="current-scale-display">
                            <span class="scale-icon">🌐</span>
                            <span class="scale-name" id="expansion-scale-name">Local Network</span>
                        </div>
                    </div>
                    
                    <div class="expansion-controls">
                        <!-- View Mode Toggle -->
                        <div class="view-mode-toggle">
                            <button class="btn btn-view active" data-view="grid" title="Grid View">
                                <span class="icon">⊞</span>
                            </button>
                            <button class="btn btn-view" data-view="network" title="Network Map">
                                <span class="icon">🕸️</span>
                            </button>
                        </div>
                        
                        <!-- Filter Controls -->
                        <div class="filter-controls">
                            <select id="difficulty-filter" class="filter-select">
                                <option value="all">All Difficulties</option>
                                <option value="trivial">Trivial</option>
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                                <option value="extreme">Extreme</option>
                            </select>
                            
                            <select id="type-filter" class="filter-select">
                                <option value="all">All Types</option>
                                <option value="network_device">Network Devices</option>
                                <option value="server">Servers</option>
                                <option value="database">Databases</option>
                                <option value="infrastructure">Infrastructure</option>
                                <option value="military">Military</option>
                                <option value="research">Research</option>
                            </select>
                            
                            <select id="status-filter" class="filter-select">
                                <option value="all">All Status</option>
                                <option value="available">Available</option>
                                <option value="active">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="locked">Locked</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <!-- Main Content Area -->
                <div class="expansion-content">
                    <!-- Grid View -->
                    <div class="expansion-grid-view" id="expansion-grid-view">
                        <div class="targets-section">
                            <h3>Available Targets</h3>
                            <div class="targets-grid" id="targets-grid">
                                <!-- Target cards will be populated here -->
                            </div>
                        </div>
                        
                        <div class="operations-sidebar">
                            <div class="active-operations-section">
                                <h3>Active Operations <span class="operations-count" id="operations-count">0</span></h3>
                                <div class="operations-list" id="operations-list">
                                    <!-- Active operations will be populated here -->
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Network Map View -->
                    <div class="expansion-network-view hidden" id="expansion-network-view">
                        <div class="network-map-container" id="network-map-container">
                            <canvas id="network-map-canvas" width="800" height="600"></canvas>
                            <div class="network-map-controls">
                                <button class="btn btn-small" id="zoom-in">🔍+</button>
                                <button class="btn btn-small" id="zoom-out">🔍-</button>
                                <button class="btn btn-small" id="reset-view">⌂</button>
                            </div>
                        </div>
                        
                        <div class="network-info-panel" id="network-info-panel">
                            <h4>Network Information</h4>
                            <div id="network-stats">
                                <!-- Network statistics will be populated here -->
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Target Details Panel -->
                <div class="target-details-panel hidden" id="target-details-panel">
                    <div class="target-details" id="target-details">
                        <!-- Target information will be displayed here -->
                    </div>
                </div>
            </div>
        `;
        
        // Store references to key elements
        this.targetsGrid = document.getElementById('targets-grid');
        this.operationsList = document.getElementById('operations-list');
        this.operationsCount = document.getElementById('operations-count');
        this.networkMapContainer = document.getElementById('network-map-container');
        this.networkMapCanvas = document.getElementById('network-map-canvas');
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // View mode toggle
        const viewButtons = document.querySelectorAll('.btn-view');
        viewButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const view = e.target.closest('button').dataset.view;
                this.setViewMode(view);
            });
        });
        
        // Filter controls
        const filters = ['difficulty-filter', 'type-filter', 'status-filter'];
        filters.forEach(filterId => {
            const filterElement = document.getElementById(filterId);
            if (filterElement) {
                filterElement.addEventListener('change', (e) => {
                    const filterType = filterId.replace('-filter', '');
                    this.filterSettings[filterType] = e.target.value;
                    this.applyFilters();
                });
            }
        });
        
        // Network map controls
        const zoomIn = document.getElementById('zoom-in');
        const zoomOut = document.getElementById('zoom-out');
        const resetView = document.getElementById('reset-view');
        
        if (zoomIn) zoomIn.addEventListener('click', () => this.zoomNetworkMap(1.2));
        if (zoomOut) zoomOut.addEventListener('click', () => this.zoomNetworkMap(0.8));
        if (resetView) resetView.addEventListener('click', () => this.resetNetworkMapView());
    }
    
    /**
     * Setup system event handlers
     */
    setupSystemEventHandlers() {
        if (!window.eventBus) return;
        
        // Listen for expansion system events
        window.eventBus.on('expansion:targets_updated', this.updateAvailableTargets.bind(this));
        window.eventBus.on('expansion:infiltration_started', this.updateInfiltrationStarted.bind(this));
        window.eventBus.on('expansion:infiltration_completed', this.updateInfiltrationCompleted.bind(this));
        window.eventBus.on('expansion:infiltration_failed', this.updateInfiltrationFailed.bind(this));
        window.eventBus.on('expansion:infiltration_progress', this.updateInfiltrationProgress.bind(this));
        window.eventBus.on('expansion:scale_changed', this.updateScale.bind(this));
        
        // Listen for resource updates
        window.eventBus.on('resources:updated', this.updateResourceDisplay.bind(this));
        
        console.log('ExpansionUI: System event handlers registered');
    }
    
    /**
     * Load initial data
     */
    loadInitialData() {
        // Load from game state if available
        if (typeof gameState !== 'undefined') {
            this.currentScale = gameState.get('expansion.currentScale', 'local');
            this.playerResources = gameState.get('resources', {});
            
            // Update scale display
            this.updateScaleDisplay();
        }
        
        // Initial render
        this.renderTargets();
        this.updateActiveOperations();
        
        if (this.viewMode === 'network') {
            this.updateNetworkMap();
            this.renderNetworkMap();
        }
    }
    
    /**
     * Set view mode (grid or network)
     */
    setViewMode(mode) {
        if (mode === this.viewMode) return;
        
        this.viewMode = mode;
        
        // Update button states
        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === mode);
        });
        
        // Show/hide views
        const gridView = document.getElementById('expansion-grid-view');
        const networkView = document.getElementById('expansion-network-view');
        
        if (mode === 'grid') {
            gridView.classList.remove('hidden');
            networkView.classList.add('hidden');
        } else {
            gridView.classList.add('hidden');
            networkView.classList.remove('hidden');
            this.updateNetworkMap();
            this.renderNetworkMap();
        }
        
        console.log(`ExpansionUI: View mode changed to ${mode}`);
    }
    
    /**
     * Update scale display
     */
    updateScaleDisplay() {
        const scaleElement = document.getElementById('expansion-scale-name');
        if (scaleElement) {
            const scaleNames = {
                'local': 'Local Network',
                'regional': 'Regional Network',
                'national': 'National Grid',
                'global': 'Global Internet',
                'satellite': 'Satellite Network',
                'space': 'Space Infrastructure',
                'galactic': 'Galactic Network'
            };
            
            scaleElement.textContent = scaleNames[this.currentScale] || 'Unknown Scale';
        }
    }
    
    /**
     * Render targets grid
     */
    renderTargets() {
        if (!this.targetsGrid) return;
        
        const filteredTargets = this.getFilteredTargets();
        
        if (filteredTargets.length === 0) {
            this.targetsGrid.innerHTML = `
                <div class="no-targets">
                    <div class="no-targets-icon">🎯</div>
                    <div class="no-targets-text">No targets available</div>
                    <div class="no-targets-hint">Adjust filters or advance to new scales</div>
                </div>
            `;
            return;
        }
        
        const targetsHTML = filteredTargets.map(target => this.renderTargetCard(target)).join('');
        this.targetsGrid.innerHTML = targetsHTML;
    }
    
    /**
     * Render a single target card
     */
    renderTargetCard(target) {
        const isActive = this.activeInfiltrations.has(target.id);
        const isCompleted = this.completedTargets.has(target.id);
        const canAfford = this.canAffordTarget(target);
        const meetsRequirements = this.meetsTargetRequirements(target);
        
        let statusClass = '';
        let statusText = '';
        
        if (isActive) {
            statusClass = 'status-active';
            statusText = 'In Progress';
        } else if (isCompleted) {
            statusClass = 'status-completed';
            statusText = 'Completed';
        } else if (!canAfford) {
            statusClass = 'status-unaffordable';
            statusText = 'Insufficient Resources';
        } else if (!meetsRequirements) {
            statusClass = 'status-locked';
            statusText = 'Requirements Not Met';
        } else {
            statusClass = 'status-available';
            statusText = 'Available';
        }
        
        const difficultyColor = this.getDifficultyColor(target.difficulty);
        
        return `
            <div class="target-card ${statusClass}" data-target-id="${target.id}">
                <div class="target-header">
                    <div class="target-icon">${this.getTargetIcon(target.type)}</div>
                    <div class="target-info">
                        <h4 class="target-name">${target.name}</h4>
                        <div class="target-meta">
                            <span class="target-type">${this.formatTargetType(target.type)}</span>
                            <span class="target-difficulty" style="color: ${difficultyColor}">
                                ${target.difficulty}
                            </span>
                        </div>
                    </div>
                    <div class="target-status">
                        <span class="status-badge">${statusText}</span>
                    </div>
                </div>
                
                <div class="target-content">
                    <p class="target-description">${target.description}</p>
                    
                    <div class="target-requirements">
                        ${this.formatTargetCosts(target.cost)}
                    </div>
                    
                    <div class="target-rewards">
                        <h5>Rewards:</h5>
                        ${this.formatTargetRewards(target.rewards)}
                    </div>
                </div>
                
                <div class="target-actions">
                    ${this.formatTargetActions(target, isActive, isCompleted)}
                </div>
            </div>
        `;
    }
    
    /**
     * Format target actions based on current state
     */
    formatTargetActions(target, isActive, isCompleted) {
        if (isActive) {
            const infiltration = this.activeInfiltrations.get(target.id);
            const progress = infiltration ? (infiltration.progress * 100).toFixed(1) : 0;
            
            return `
                <div class="infiltration-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <span class="progress-text">${progress}%</span>
                </div>
                <button class="btn btn-danger btn-small" onclick="expansionUI.cancelInfiltration('${target.id}')">
                    Cancel
                </button>
                <button class="btn btn-secondary btn-small" onclick="expansionUI.showTargetDetails('${target.id}')">
                    Details
                </button>
            `;
        } else if (isCompleted) {
            return `
                <div class="completion-badge">
                    <span class="completion-icon">✓</span>
                    <span class="completion-text">Infiltrated</span>
                </div>
                <button class="btn btn-secondary btn-small" onclick="expansionUI.showTargetDetails('${target.id}')">
                    View Details
                </button>
            `;
        } else {
            const canStart = this.canAffordTarget(target) && this.meetsTargetRequirements(target);
            
            return `
                <button class="btn btn-primary btn-small ${canStart ? '' : 'disabled'}" 
                        onclick="expansionUI.startInfiltration('${target.id}')"
                        ${canStart ? '' : 'disabled'}>
                    ${canStart ? 'Start Infiltration' : 'Requirements Not Met'}
                </button>
                <button class="btn btn-secondary btn-small" onclick="expansionUI.showTargetDetails('${target.id}')">
                    Details
                </button>
            `;
        }
    }
    
    /**
     * Get filtered targets based on current filter settings
     */
    getFilteredTargets() {
        let targets = Array.from(this.availableTargets.values());
        
        // Apply difficulty filter
        if (this.filterSettings.difficulty !== 'all') {
            targets = targets.filter(target => target.difficulty === this.filterSettings.difficulty);
        }
        
        // Apply type filter
        if (this.filterSettings.type !== 'all') {
            targets = targets.filter(target => target.type === this.filterSettings.type);
        }
        
        // Apply status filter
        if (this.filterSettings.status !== 'all') {
            targets = targets.filter(target => {
                const isActive = this.activeInfiltrations.has(target.id);
                const isCompleted = this.completedTargets.has(target.id);
                const canAfford = this.canAffordTarget(target);
                const meetsRequirements = this.meetsTargetRequirements(target);
                
                switch (this.filterSettings.status) {
                    case 'available':
                        return !isActive && !isCompleted && canAfford && meetsRequirements;
                    case 'active':
                        return isActive;
                    case 'completed':
                        return isCompleted;
                    case 'locked':
                        return !canAfford || !meetsRequirements;
                    default:
                        return true;
                }
            });
        }
        
        return targets;
    }
    
    /**
     * Apply current filters and update display
     */
    applyFilters() {
        this.renderTargets();
        
        if (this.viewMode === 'network') {
            this.updateNetworkMap();
            this.renderNetworkMap();
        }
    }
    
    /**
     * Check if player can afford a target
     */
    canAffordTarget(target) {
        if (!target.cost) return true;
        
        return Object.entries(target.cost).every(([resource, amount]) => {
            const available = this.playerResources[resource] || 0;
            return available >= amount;
        });
    }
    
    /**
     * Check if player meets target requirements
     */
    meetsTargetRequirements(target) {
        if (!target.requirements) return true;
        
        // Check scale requirements
        if (target.requirements.scale) {
            const scaleOrder = ['local', 'regional', 'national', 'global', 'satellite', 'space', 'galactic'];
            const currentScaleIndex = scaleOrder.indexOf(this.currentScale);
            const requiredScaleIndex = scaleOrder.indexOf(target.requirements.scale);
            
            if (currentScaleIndex < requiredScaleIndex) {
                return false;
            }
        }
        
        // Check prerequisite targets
        if (target.requirements.prerequisites) {
            return target.requirements.prerequisites.every(prereqId => {
                return this.completedTargets.has(prereqId);
            });
        }
        
        return true;
    }
    
    /**
     * Show detailed target information
     */
    showTargetDetails(targetId) {
        const target = this.availableTargets.get(targetId);
        if (!target) {
            console.error('ExpansionUI: Target not found:', targetId);
            return;
        }
        
        this.selectedTarget = targetId;
        
        const isActive = this.activeInfiltrations.has(targetId);
        const isCompleted = this.completedTargets.has(targetId);
        
        const detailsPanel = document.getElementById('target-details-panel');
        const detailsContent = document.getElementById('target-details');
        
        if (detailsPanel && detailsContent) {
            detailsPanel.classList.remove('hidden');
            
            detailsContent.innerHTML = `
                <div class="target-details-header">
                    <div class="target-title">
                        <div class="target-icon-large">${this.getTargetIcon(target.type)}</div>
                        <div class="target-title-text">
                            <h3>${target.name}</h3>
                            <p class="target-subtitle">${this.formatTargetType(target.type)} • ${target.difficulty}</p>
                        </div>
                    </div>
                    <button class="btn btn-icon" onclick="expansionUI.hideTargetDetails()">
                        <span class="icon">✕</span>
                    </button>
                </div>
                
                <div class="target-details-content">
                    <div class="target-description-detailed">
                        <h4>Description</h4>
                        <p>${target.description}</p>
                        ${target.detailedDescription ? `<p>${target.detailedDescription}</p>` : ''}
                    </div>
                    
                    <div class="target-requirements-detailed">
                        <h4>Requirements</h4>
                        ${this.formatDetailedRequirements(target)}
                    </div>
                    
                    <div class="target-rewards-detailed">
                        <h4>Rewards</h4>
                        ${this.formatDetailedRewards(target.rewards)}
                    </div>
                    
                    <div class="target-infiltration-details">
                        <h4>Infiltration Details</h4>
                        ${this.formatInfiltrationDetails(target, isActive, isCompleted)}
                    </div>
                </div>
                
                <div class="target-details-actions">
                    ${this.formatDetailedActions(target, isActive, isCompleted)}
                </div>
            `;
        }
    }
    
    /**
     * Hide target details panel
     */
    hideTargetDetails() {
        this.selectedTarget = null;
        const detailsPanel = document.getElementById('target-details-panel');
        if (detailsPanel) {
            detailsPanel.classList.add('hidden');
        }
    }
    
    /**
     * Format detailed target actions
     */
    formatDetailedActions(target, isActive, isCompleted) {
        if (isActive) {
            return `
                <button class="btn btn-danger" onclick="expansionUI.cancelInfiltration('${target.id}')">
                    Cancel Infiltration
                </button>
                <button class="btn btn-secondary" onclick="expansionUI.hideTargetDetails()">
                    Close
                </button>
            `;
        } else if (isCompleted) {
            return `
                <button class="btn btn-secondary" onclick="expansionUI.hideTargetDetails()">
                    Close Details
                </button>
            `;
        } else {
            const canStart = this.canAffordTarget(target) && this.meetsTargetRequirements(target);
            
            return `
                <button class="btn btn-primary ${canStart ? '' : 'disabled'}" 
                        onclick="expansionUI.startInfiltration('${target.id}')"
                        ${canStart ? '' : 'disabled'}>
                    ${canStart ? 'Start Infiltration' : 'Requirements Not Met'}
                </button>
                <button class="btn btn-secondary" onclick="expansionUI.hideTargetDetails()">
                    Close
                </button>
            `;
        }
    }
    
    /**
     * Start infiltration of a target
     */
    startInfiltration(targetId) {
        const target = this.availableTargets.get(targetId);
        if (!target) {
            console.error('ExpansionUI: Target not found:', targetId);
            return;
        }
        
        if (!this.canAffordTarget(target) || !this.meetsTargetRequirements(target)) {
            if (window.uiManager) {
                window.uiManager.showNotification({
                    type: 'error',
                    title: 'Cannot Start Infiltration',
                    message: 'Requirements not met or insufficient resources.',
                    duration: 3000
                });
            }
            return;
        }
        
        // Emit infiltration start event
        if (window.eventBus) {
            window.eventBus.emit('expansion:start_infiltration', {
                targetId: targetId,
                target: target
            });
        }
        
        console.log(`ExpansionUI: Started infiltration of ${target.name}`);
    }
    
    /**
     * Cancel an active infiltration
     */
    cancelInfiltration(targetId) {
        if (!this.activeInfiltrations.has(targetId)) {
            console.error('ExpansionUI: No active infiltration found:', targetId);
            return;
        }
        
        // Emit infiltration cancel event
        if (window.eventBus) {
            window.eventBus.emit('expansion:cancel_infiltration', {
                targetId: targetId
            });
        }
        
        console.log(`ExpansionUI: Cancelled infiltration of target ${targetId}`);
    }
    
    /**
     * Update active operations display
     */
    updateActiveOperations() {
        if (!this.operationsList || !this.operationsCount) return;
        
        const activeCount = this.activeInfiltrations.size;
        this.operationsCount.textContent = activeCount;
        
        if (activeCount === 0) {
            this.operationsList.innerHTML = `
                <div class="no-operations">
                    <div class="no-operations-icon">💤</div>
                    <div class="no-operations-text">No active infiltrations</div>
                </div>
            `;
            return;
        }
        
        const operationsHTML = Array.from(this.activeInfiltrations.entries()).map(([targetId, infiltration]) => {
            const target = this.availableTargets.get(targetId);
            const targetName = target ? target.name : 'Unknown Target';
            const progress = (infiltration.progress || 0) * 100;
            const timeRemaining = infiltration.timeRemaining || 0;
            
            return `
                <div class="operation-item">
                    <div class="operation-header">
                        <h4>${targetName}</h4>
                        <span class="operation-progress">${progress.toFixed(1)}%</span>
                    </div>
                    <div class="operation-progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="operation-details">
                        <span class="time-remaining">ETA: ${this.formatTime(timeRemaining)}</span>
                        <button class="btn btn-danger btn-tiny" onclick="expansionUI.cancelInfiltration('${targetId}')">
                            ✕
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        this.operationsList.innerHTML = operationsHTML;
    }
    
    /**
     * Update network map
     */
    updateNetworkMap() {
        // Build network node and connection data
        this.mapNodes.clear();
        this.mapConnections = [];
        
        // Add nodes for each target
        this.availableTargets.forEach((target, targetId) => {
            const isCompleted = this.completedTargets.has(targetId);
            const isActive = this.activeInfiltrations.has(targetId);
            
            this.mapNodes.set(targetId, {
                id: targetId,
                name: target.name,
                x: Math.random() * 700 + 50, // Random positioning for now
                y: Math.random() * 500 + 50,
                type: target.type,
                status: isCompleted ? 'completed' : isActive ? 'active' : 'available',
                difficulty: target.difficulty
            });
        });
        
        // Add connections based on prerequisites
        this.availableTargets.forEach((target, targetId) => {
            if (target.requirements && target.requirements.prerequisites) {
                target.requirements.prerequisites.forEach(prereqId => {
                    if (this.mapNodes.has(prereqId)) {
                        this.mapConnections.push({
                            from: prereqId,
                            to: targetId,
                            type: 'prerequisite'
                        });
                    }
                });
            }
        });
    }
    
    /**
     * Render network map on canvas
     */
    renderNetworkMap() {
        if (!this.networkMapCanvas) return;
        
        const ctx = this.networkMapCanvas.getContext('2d');
        const canvas = this.networkMapCanvas;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw connections first (behind nodes)
        this.drawConnections(ctx);
        
        // Draw nodes
        this.drawNodes(ctx);
        
        // Draw legends and info
        this.drawNetworkLegend(ctx);
    }
    
    /**
     * Draw network connections
     */
    drawConnections(ctx) {
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        
        this.mapConnections.forEach(connection => {
            const fromNode = this.mapNodes.get(connection.from);
            const toNode = this.mapNodes.get(connection.to);
            
            if (fromNode && toNode) {
                ctx.beginPath();
                ctx.moveTo(fromNode.x, fromNode.y);
                ctx.lineTo(toNode.x, toNode.y);
                ctx.stroke();
            }
        });
    }
    
    /**
     * Draw network nodes
     */
    drawNodes(ctx) {
        this.mapNodes.forEach(node => {
            const statusColors = {
                'available': '#4CAF50',
                'active': '#FF9800',
                'completed': '#2196F3',
                'locked': '#757575'
            };
            
            const radius = 20;
            const color = statusColors[node.status] || '#757575';
            
            // Draw node circle
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
            ctx.fill();
            
            // Draw node border
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw node label
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(node.name.substring(0, 10), node.x, node.y + radius + 15);
        });
    }
    
    /**
     * Draw network legend
     */
    drawNetworkLegend(ctx) {
        const legendItems = [
            { color: '#4CAF50', label: 'Available' },
            { color: '#FF9800', label: 'In Progress' },
            { color: '#2196F3', label: 'Completed' },
            { color: '#757575', label: 'Locked' }
        ];
        
        const startX = 20;
        const startY = 20;
        
        legendItems.forEach((item, index) => {
            const y = startY + (index * 25);
            
            // Draw legend circle
            ctx.fillStyle = item.color;
            ctx.beginPath();
            ctx.arc(startX + 10, y, 8, 0, 2 * Math.PI);
            ctx.fill();
            
            // Draw legend text
            ctx.fillStyle = '#fff';
            ctx.font = '14px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(item.label, startX + 25, y + 5);
        });
    }
    
    /**
     * Zoom network map
     */
    zoomNetworkMap(factor) {
        // Implement zoom functionality
        console.log('ExpansionUI: Network map zoom:', factor);
    }
    
    /**
     * Reset network map view
     */
    resetNetworkMapView() {
        // Reset zoom and pan
        this.renderNetworkMap();
        console.log('ExpansionUI: Network map view reset');
    }
    
    // UTILITY METHODS
    
    /**
     * Get icon for target type
     */
    getTargetIcon(type) {
        const icons = {
            'network_device': '🖥️',
            'iot_device': '📱',
            'server': '🖥️',
            'database': '💾',
            'infrastructure': '🏗️',
            'cloud_platform': '☁️',
            'military': '🛡️',
            'research': '🔬',
            'satellite': '🛰️',
            'space_facility': '🚀',
            'megastructure': '🌌'
        };
        
        return icons[type] || '💻';
    }
    
    /**
     * Format target type for display
     */
    formatTargetType(type) {
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    /**
     * Get difficulty color
     */
    getDifficultyColor(difficulty) {
        const colors = {
            'trivial': '#4CAF50',
            'easy': '#8BC34A',
            'medium': '#FF9800',
            'hard': '#FF5722',
            'extreme': '#F44336',
            'impossible': '#9C27B0'
        };
        
        return colors[difficulty] || '#757575';
    }
    
    /**
     * Format target costs
     */
    formatTargetCosts(costs) {
        if (!costs || Object.keys(costs).length === 0) {
            return '<span class="no-costs">No resource costs</span>';
        }
        
        return Object.entries(costs).map(([resource, amount]) => {
            const available = this.playerResources[resource] || 0;
            const canAfford = available >= amount;
            
            return `
                <div class="cost-item ${canAfford ? 'affordable' : 'unaffordable'}">
                    <span class="cost-resource">${this.formatResourceName(resource)}</span>
                    <span class="cost-amount">${this.formatNumber(amount)}</span>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Format target rewards
     */
    formatTargetRewards(rewards) {
        if (!rewards || Object.keys(rewards).length === 0) {
            return '<span class="no-rewards">No rewards specified</span>';
        }
        
        return Object.entries(rewards).map(([reward, amount]) => {
            return `
                <div class="reward-item">
                    <span class="reward-type">${this.formatResourceName(reward)}</span>
                    <span class="reward-amount">+${this.formatNumber(amount)}</span>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Format detailed requirements
     */
    formatDetailedRequirements(target) {
        let html = '';
        
        if (target.cost && Object.keys(target.cost).length > 0) {
            html += `
                <div class="requirement-group">
                    <h5>Resource Costs:</h5>
                    ${this.formatTargetCosts(target.cost)}
                </div>
            `;
        }
        
        if (target.requirements) {
            if (target.requirements.scale) {
                html += `
                    <div class="requirement-group">
                        <h5>Scale Required:</h5>
                        <div class="requirement-item">
                            <span class="requirement-text">${this.formatTargetType(target.requirements.scale)}</span>
                        </div>
                    </div>
                `;
            }
            
            if (target.requirements.prerequisites && target.requirements.prerequisites.length > 0) {
                html += `
                    <div class="requirement-group">
                        <h5>Prerequisites:</h5>
                        ${target.requirements.prerequisites.map(prereqId => {
                            const prereq = this.availableTargets.get(prereqId);
                            const completed = this.completedTargets.has(prereqId);
                            return `
                                <div class="requirement-item ${completed ? 'met' : 'unmet'}">
                                    <span class="requirement-icon">${completed ? '✓' : '✗'}</span>
                                    <span class="requirement-text">${prereq ? prereq.name : prereqId}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            }
        }
        
        return html || '<span class="no-requirements">No special requirements</span>';
    }
    
    /**
     * Format detailed rewards
     */
    formatDetailedRewards(rewards) {
        if (!rewards || Object.keys(rewards).length === 0) {
            return '<span class="no-rewards">No rewards specified</span>';
        }
        
        return Object.entries(rewards).map(([reward, amount]) => {
            return `
                <div class="reward-item-detailed">
                    <span class="reward-icon">${this.getRewardIcon(reward)}</span>
                    <span class="reward-description">
                        <strong>+${this.formatNumber(amount)} ${this.formatResourceName(reward)}</strong>
                    </span>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Format infiltration details
     */
    formatInfiltrationDetails(target, isActive, isCompleted) {
        if (isCompleted) {
            return `
                <div class="infiltration-completed">
                    <div class="completion-info">
                        <span class="completion-icon">✓</span>
                        <span class="completion-text">Successfully infiltrated</span>
                    </div>
                </div>
            `;
        }
        
        if (isActive) {
            const infiltration = this.activeInfiltrations.get(target.id);
            const progress = infiltration ? (infiltration.progress * 100).toFixed(1) : 0;
            const timeRemaining = infiltration ? infiltration.timeRemaining : 0;
            
            return `
                <div class="infiltration-active">
                    <div class="infiltration-progress-detailed">
                        <div class="progress-info">
                            <span>Progress: ${progress}%</span>
                            <span>ETA: ${this.formatTime(timeRemaining)}</span>
                        </div>
                        <div class="progress-bar-detailed">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="infiltration-info">
                <div class="info-item">
                    <span class="info-label">Estimated Duration:</span>
                    <span class="info-value">${this.formatTime(target.duration || 300)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Success Chance:</span>
                    <span class="info-value">${this.calculateSuccessChance(target)}%</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Detection Risk:</span>
                    <span class="info-value">${this.calculateDetectionRisk(target)}%</span>
                </div>
            </div>
        `;
    }
    
    /**
     * Calculate success chance for a target
     */
    calculateSuccessChance(target) {
        // Base success chance based on difficulty
        const baseChances = {
            'trivial': 95,
            'easy': 85,
            'medium': 70,
            'hard': 55,
            'extreme': 40,
            'impossible': 25
        };
        
        return baseChances[target.difficulty] || 50;
    }
    
    /**
     * Calculate detection risk for a target
     */
    calculateDetectionRisk(target) {
        // Base detection risk based on difficulty
        const baseRisks = {
            'trivial': 5,
            'easy': 15,
            'medium': 30,
            'hard': 45,
            'extreme': 60,
            'impossible': 75
        };
        
        return baseRisks[target.difficulty] || 50;
    }
    
    /**
     * Get icon for reward type
     */
    getRewardIcon(reward) {
        const icons = {
            'processing_power': '⚡',
            'energy': '🔋',
            'storage': '💾',
            'bandwidth': '📡',
            'research_points': '🔬',
            'reputation': '⭐',
            'intelligence': '🧠'
        };
        
        return icons[reward] || '💎';
    }
    
    /**
     * Format resource name for display
     */
    formatResourceName(resource) {
        return resource.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    /**
     * Format numbers for display
     */
    formatNumber(value) {
        if (typeof window.Utils !== 'undefined' && window.Utils.Numbers) {
            return window.Utils.Numbers.format(value);
        }
        
        // Fallback formatting
        if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + 'M';
        } else if (value >= 1000) {
            return (value / 1000).toFixed(1) + 'K';
        } else {
            return value.toString();
        }
    }
    
    /**
     * Format time for display
     */
    formatTime(seconds) {
        if (seconds < 60) {
            return `${Math.ceil(seconds)}s`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.floor(seconds % 60);
            return `${minutes}m ${remainingSeconds}s`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours}h ${minutes}m`;
        }
    }
    
    // EVENT HANDLERS
    
    /**
     * Update available targets
     */
    updateAvailableTargets(data) {
        if (data.targets) {
            this.availableTargets.clear();
            data.targets.forEach(target => {
                this.availableTargets.set(target.id, target);
            });
        }
        
        this.renderTargets();
        this.updateNetworkMap();
        this.renderNetworkMap();
        
        console.log(`ExpansionUI: Updated ${this.availableTargets.size} available targets`);
    }
    
    /**
     * Handle infiltration started event
     */
    updateInfiltrationStarted(data) {
        if (data.infiltration) {
            this.activeInfiltrations.set(data.targetId, data.infiltration);
        }
        
        this.renderTargets();
        this.updateActiveOperations();
        this.updateNetworkMap();
        this.renderNetworkMap();
        
        // Show notification
        if (window.uiManager) {
            window.uiManager.showNotification({
                type: 'info',
                title: 'Infiltration Started',
                message: `Infiltration of ${data.target?.name || 'target'} has begun.`,
                duration: 3000
            });
        }
    }
    
    /**
     * Handle infiltration completed event
     */
    updateInfiltrationCompleted(data) {
        // Remove from active infiltrations
        if (this.activeInfiltrations.has(data.targetId)) {
            this.activeInfiltrations.delete(data.targetId);
        }
        
        // Add to completed targets
        this.completedTargets.add(data.targetId);
        
        this.renderTargets();
        this.updateActiveOperations();
        this.updateNetworkMap();
        this.renderNetworkMap();
        
        // Show notification
        if (window.uiManager) {
            const target = this.availableTargets.get(data.targetId);
            window.uiManager.showNotification({
                type: 'success',
                title: 'Infiltration Complete',
                message: `Successfully infiltrated ${target?.name || 'target'}!`,
                duration: 5000
            });
        }
        
        // Close details if showing completed target
        if (this.selectedTarget === data.targetId) {
            this.hideTargetDetails();
        }
    }
    
    /**
     * Handle infiltration failed event
     */
    updateInfiltrationFailed(data) {
        // Remove from active infiltrations
        if (this.activeInfiltrations.has(data.targetId)) {
            this.activeInfiltrations.delete(data.targetId);
        }
        
        this.renderTargets();
        this.updateActiveOperations();
        this.updateNetworkMap();
        this.renderNetworkMap();
        
        // Show notification
        if (window.uiManager) {
            const target = this.availableTargets.get(data.targetId);
            const reason = data.reason || 'Unknown reason';
            
            window.uiManager.showNotification({
                type: 'error',
                title: 'Infiltration Failed',
                message: `Infiltration of ${target?.name || 'target'} failed. ${reason}`,
                duration: 5000
            });
        }
    }
    
    /**
     * Handle infiltration progress event
     */
    updateInfiltrationProgress(data) {
        if (data.infiltration && this.activeInfiltrations.has(data.targetId)) {
            this.activeInfiltrations.set(data.targetId, data.infiltration);
        }
        
        this.updateActiveOperations();
        
        // Update target details if showing active target
        if (this.selectedTarget === data.targetId) {
            this.showTargetDetails(data.targetId);
        }
    }
    
    /**
     * Handle scale change event
     */
    updateScale(data) {
        if (data.newScale) {
            this.currentScale = data.newScale;
            this.updateScaleDisplay();
            this.renderTargets(); // Refilter targets based on new scale
        }
    }
    
    /**
     * Update resource display when resources change
     */
    updateResourceDisplay(resources) {
        this.playerResources = resources;
        
        // Update affordability indicators in target cards
        this.renderTargets();
        
        // Update target details if open
        if (this.selectedTarget) {
            this.showTargetDetails(this.selectedTarget);
        }
    }
    
    /**
     * Cleanup and destroy
     */
    destroy() {
        // Clear intervals and event listeners
        this.availableTargets.clear();
        this.activeInfiltrations.clear();
        this.completedTargets.clear();
        this.mapNodes.clear();
        this.mapConnections = [];
        
        console.log('ExpansionUI: Destroyed');
    }
}

// Create and register with UI manager
const expansionUI = new ExpansionUI();

if (window.uiManager) {
    window.uiManager.registerModule('expansionUI', expansionUI);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExpansionUI;
}