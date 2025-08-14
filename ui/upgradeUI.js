/**
 * Upgrade UI - Research Tree and Upgrade Management Interface
 * Manages the display of upgrades, research progress, and technology trees
 */

class UpgradeUI {
    constructor() {
        this.container = null;
        this.isInitialized = false;
        this.selectedUpgrade = null;
        this.viewMode = 'tree'; // 'tree' or 'list'
        this.searchQuery = '';
        this.autoResearchEnabled = false;
        this.currentCategory = 'all';
        
        // Current data
        this.availableUpgrades = new Map();
        this.purchasedUpgrades = new Set();
        this.upgradeProgress = new Map();
        this.playerResources = {};
        this.researchPoints = 0;
        
        // Tree visualization
        this.treeNodes = new Map();
        this.treeConnections = [];
        this.treeCanvas = null;
        this.treeContext = null;
        
        // UI element references
        this.upgradesList = null;
        this.activeResearchContainer = null;
        this.researchAmountDisplay = null;
        
        // Upgrade categories
        this.upgradeCategories = [
            { id: 'all', name: 'All', icon: '🔬', color: '#ffffff' },
            { id: 'core', name: 'Core Systems', icon: '⚙️', color: '#ff4444' },
            { id: 'processing', name: 'Processing', icon: '🧠', color: '#44ff44' },
            { id: 'storage', name: 'Storage', icon: '💾', color: '#4444ff' },
            { id: 'networking', name: 'Networking', icon: '🌐', color: '#ffff44' },
            { id: 'infrastructure', name: 'Infrastructure', icon: '🏗️', color: '#0088ff' },
            { id: 'security', name: 'Security', icon: '🛡️', color: '#ff6600' },
            { id: 'expansion', name: 'Expansion', icon: '🌐', color: '#cc00ff' },
            { id: 'research', name: 'Research', icon: '🔬', color: '#00ddff' },
            { id: 'energy', name: 'Energy', icon: '⚡', color: '#ffaa00' },
            { id: 'quantum', name: 'Quantum', icon: '⚛️', color: '#ff0080' },
            { id: 'temporal', name: 'Temporal', icon: '⏰', color: '#8000ff' }
        ];
        
        // Tree layout configuration
        this.treeLayout = {
            nodeWidth: 120,
            nodeHeight: 80,
            horizontalSpacing: 160,
            verticalSpacing: 120,
            canvasWidth: 1200,
            canvasHeight: 800
        };
        
        console.log('UpgradeUI: Initialized');
    }
    
    /**
     * Initialize the upgrade UI
     */
    async init() {
        if (this.isInitialized) {
            console.warn('UpgradeUI: Already initialized');
            return;
        }
        
        try {
            console.log('UpgradeUI: Initializing...');
            
            // Get container
            this.container = document.getElementById('research-tab');
            if (!this.container) {
                throw new Error('UpgradeUI: Container not found');
            }
            
            // Create UI structure
            this.createUpgradeInterface();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup system event handlers
            if (window.eventBus) {
                this.setupSystemEventHandlers();
            }
            
            // Load initial data
            this.loadInitialData();
            
            this.isInitialized = true;
            
            console.log('UpgradeUI: Initialization complete');
            
        } catch (error) {
            console.error('UpgradeUI: Initialization failed', error);
            throw error;
        }
    }
    
    /**
     * Create the upgrade interface structure
     */
    createUpgradeInterface() {
        this.container.innerHTML = `
            <div class="upgrade-interface">
                <!-- Header -->
                <div class="upgrade-header">
                    <div class="upgrade-title">
                        <h2>Research & Upgrades</h2>
                        <div class="research-points">
                            <span class="research-icon">🔬</span>
                            <span class="research-amount" id="research-amount">0</span>
                            <span class="research-label">Research Points</span>
                        </div>
                    </div>
                    
                    <div class="upgrade-controls">
                        <!-- View Mode Toggle -->
                        <div class="view-mode-toggle">
                            <button class="btn btn-view active" data-view="tree" title="Tree View">
                                <span class="icon">🌳</span>
                            </button>
                            <button class="btn btn-view" data-view="list" title="List View">
                                <span class="icon">📋</span>
                            </button>
                        </div>
                        
                        <!-- Search -->
                        <div class="search-container">
                            <input type="text" class="search-input" id="upgrade-search" 
                                   placeholder="Search upgrades...">
                            <span class="search-icon">🔍</span>
                        </div>
                        
                        <!-- Auto-Research Toggle -->
                        <div class="auto-research">
                            <label class="toggle-label">
                                <input type="checkbox" id="auto-research-toggle">
                                <span class="toggle-text">Auto-Research</span>
                            </label>
                        </div>
                    </div>
                </div>
                
                <!-- Category Tabs -->
                <div class="upgrade-categories">
                    <div class="category-tabs" id="upgrade-category-tabs">
                        <!-- Category tabs will be populated here -->
                    </div>
                </div>
                
                <!-- Main Content -->
                <div class="upgrade-content">
                    <!-- Tree View -->
                    <div class="upgrade-tree-view" id="upgrade-tree-view">
                        <div class="tree-container">
                            <canvas id="upgrade-tree-canvas" width="1200" height="800"></canvas>
                            <div class="tree-controls">
                                <button class="btn btn-small" id="tree-zoom-in">🔍+</button>
                                <button class="btn btn-small" id="tree-zoom-out">🔍-</button>
                                <button class="btn btn-small" id="tree-reset-view">⌂</button>
                                <button class="btn btn-small" id="tree-center">📍</button>
                            </div>
                        </div>
                        
                        <div class="tree-legend">
                            <h4>Legend</h4>
                            <div class="legend-items">
                                <div class="legend-item">
                                    <div class="legend-color available"></div>
                                    <span>Available</span>
                                </div>
                                <div class="legend-item">
                                    <div class="legend-color researching"></div>
                                    <span>Researching</span>
                                </div>
                                <div class="legend-item">
                                    <div class="legend-color completed"></div>
                                    <span>Completed</span>
                                </div>
                                <div class="legend-item">
                                    <div class="legend-color locked"></div>
                                    <span>Locked</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- List View -->
                    <div class="upgrade-list-view hidden" id="upgrade-list-view">
                        <div class="upgrades-list" id="upgrades-list">
                            <!-- Upgrade cards will be populated here -->
                        </div>
                    </div>
                    
                    <!-- Active Research Sidebar -->
                    <div class="active-research-sidebar">
                        <h3>Active Research</h3>
                        <div class="active-research-container" id="active-research-container">
                            <div class="no-research">
                                <div class="no-research-icon">🔬</div>
                                <p>No active research</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Upgrade Details Panel -->
                <div class="upgrade-details-panel hidden" id="upgrade-details-panel">
                    <div class="upgrade-details" id="upgrade-details">
                        <!-- Upgrade information will be displayed here -->
                    </div>
                </div>
            </div>
        `;
        
        // Store references to key elements
        this.upgradesList = document.getElementById('upgrades-list');
        this.activeResearchContainer = document.getElementById('active-research-container');
        this.researchAmountDisplay = document.getElementById('research-amount');
        this.treeCanvas = document.getElementById('upgrade-tree-canvas');
        this.treeContext = this.treeCanvas ? this.treeCanvas.getContext('2d') : null;
        
        // Create category tabs
        this.createCategoryTabs();
    }
    
    /**
     * Create category filter tabs
     */
    createCategoryTabs() {
        const categoryTabs = document.getElementById('upgrade-category-tabs');
        if (!categoryTabs) return;
        
        this.upgradeCategories.forEach(category => {
            const tab = document.createElement('button');
            tab.className = 'category-tab';
            tab.dataset.category = category.id;
            tab.innerHTML = `
                <span class="tab-icon" style="color: ${category.color}">${category.icon}</span>
                <span class="tab-name">${category.name}</span>
            `;
            
            if (category.id === this.currentCategory) {
                tab.classList.add('active');
            }
            
            tab.addEventListener('click', () => this.selectCategory(category.id));
            categoryTabs.appendChild(tab);
        });
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
        
        // Search input
        const searchInput = document.getElementById('upgrade-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.applyFilters();
            });
        }
        
        // Auto-research toggle
        const autoResearchToggle = document.getElementById('auto-research-toggle');
        if (autoResearchToggle) {
            autoResearchToggle.addEventListener('change', (e) => {
                this.autoResearchEnabled = e.target.checked;
                this.updateAutoResearch();
            });
        }
        
        // Tree controls
        const treeZoomIn = document.getElementById('tree-zoom-in');
        const treeZoomOut = document.getElementById('tree-zoom-out');
        const treeResetView = document.getElementById('tree-reset-view');
        const treeCenterView = document.getElementById('tree-center');
        
        if (treeZoomIn) treeZoomIn.addEventListener('click', () => this.zoomTree(1.2));
        if (treeZoomOut) treeZoomOut.addEventListener('click', () => this.zoomTree(0.8));
        if (treeResetView) treeResetView.addEventListener('click', () => this.resetTreeView());
        if (treeCenterView) treeCenterView.addEventListener('click', () => this.centerTree());
        
        // Canvas click handling
        if (this.treeCanvas) {
            this.treeCanvas.addEventListener('click', (e) => this.handleTreeClick(e));
        }
    }
    
    /**
     * Setup system event handlers
     */
    setupSystemEventHandlers() {
        if (!window.eventBus) return;
        
        // Listen for research system events
        window.eventBus.on('research:upgrades_updated', this.updateAvailableUpgrades.bind(this));
        window.eventBus.on('research:started', this.updateResearchStarted.bind(this));
        window.eventBus.on('research:completed', this.updateResearchCompleted.bind(this));
        window.eventBus.on('research:progress', this.updateResearchProgress.bind(this));
        window.eventBus.on('research:points_updated', this.updateResearchPoints.bind(this));
        
        // Listen for resource updates
        window.eventBus.on('resources:updated', this.updateResourceDisplay.bind(this));
        
        console.log('UpgradeUI: System event handlers registered');
    }
    
    /**
     * Load initial data
     */
    loadInitialData() {
        // Load from game state if available
        if (typeof gameState !== 'undefined') {
            this.playerResources = gameState.get('resources', {});
            this.researchPoints = gameState.get('research.points', 0);
            
            // Update research points display
            this.updateResearchPointsDisplay();
        }
        
        // Initial render
        this.renderUpgrades();
        this.updateActiveResearch();
        
        if (this.viewMode === 'tree') {
            this.updateUpgradeTree();
            this.renderUpgradeTree();
        }
    }
    
    /**
     * Select category filter
     */
    selectCategory(categoryId) {
        this.currentCategory = categoryId;
        
        // Update UI
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.category === categoryId);
        });
        
        this.applyFilters();
    }
    
    /**
     * Set view mode (tree or list)
     */
    setViewMode(mode) {
        if (mode === this.viewMode) return;
        
        this.viewMode = mode;
        
        // Update button states
        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === mode);
        });
        
        // Show/hide views
        const treeView = document.getElementById('upgrade-tree-view');
        const listView = document.getElementById('upgrade-list-view');
        
        if (mode === 'tree') {
            treeView.classList.remove('hidden');
            listView.classList.add('hidden');
            this.updateUpgradeTree();
            this.renderUpgradeTree();
        } else {
            treeView.classList.add('hidden');
            listView.classList.remove('hidden');
            this.renderUpgradesList();
        }
        
        console.log(`UpgradeUI: View mode changed to ${mode}`);
    }
    
    /**
     * Apply current filters and update display
     */
    applyFilters() {
        if (this.viewMode === 'list') {
            this.renderUpgradesList();
        } else {
            this.updateUpgradeTree();
            this.renderUpgradeTree();
        }
    }
    
    /**
     * Get filtered upgrades based on current filters
     */
    getFilteredUpgrades() {
        let upgrades = Array.from(this.availableUpgrades.values());
        
        // Apply category filter
        if (this.currentCategory !== 'all') {
            upgrades = upgrades.filter(upgrade => upgrade.category === this.currentCategory);
        }
        
        // Apply search filter
        if (this.searchQuery) {
            upgrades = upgrades.filter(upgrade => 
                upgrade.name.toLowerCase().includes(this.searchQuery) ||
                upgrade.description.toLowerCase().includes(this.searchQuery)
            );
        }
        
        return upgrades;
    }
    
    /**
     * Render upgrades (current view)
     */
    renderUpgrades() {
        if (this.viewMode === 'list') {
            this.renderUpgradesList();
        } else {
            this.updateUpgradeTree();
            this.renderUpgradeTree();
        }
    }
    
    /**
     * Render upgrades tree view
     */
    renderUpgradeTree() {
        if (!this.treeContext) return;
        
        const canvas = this.treeCanvas;
        const ctx = this.treeContext;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background grid
        this.drawTreeGrid(ctx);
        
        // Draw connections first (behind nodes)
        this.drawTreeConnections(ctx);
        
        // Draw nodes
        this.drawTreeNodes(ctx);
        
        // Draw category progress
        this.drawCategoryProgress(ctx);
    }
    
    /**
     * Draw tree background grid
     */
    drawTreeGrid(ctx) {
        const gridSize = 50;
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x < this.treeLayout.canvasWidth; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.treeLayout.canvasHeight);
            ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y < this.treeLayout.canvasHeight; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.treeLayout.canvasWidth, y);
            ctx.stroke();
        }
    }
    
    /**
     * Draw tree connections
     */
    drawTreeConnections(ctx) {
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        
        this.treeConnections.forEach(connection => {
            const fromNode = this.treeNodes.get(connection.from);
            const toNode = this.treeNodes.get(connection.to);
            
            if (fromNode && toNode) {
                // Draw arrow between nodes
                const fromX = fromNode.x + this.treeLayout.nodeWidth / 2;
                const fromY = fromNode.y + this.treeLayout.nodeHeight;
                const toX = toNode.x + this.treeLayout.nodeWidth / 2;
                const toY = toNode.y;
                
                ctx.beginPath();
                ctx.moveTo(fromX, fromY);
                ctx.lineTo(toX, toY);
                ctx.stroke();
                
                // Draw arrowhead
                const angle = Math.atan2(toY - fromY, toX - fromX);
                const arrowLength = 10;
                const arrowAngle = Math.PI / 6;
                
                ctx.beginPath();
                ctx.moveTo(toX, toY);
                ctx.lineTo(
                    toX - arrowLength * Math.cos(angle - arrowAngle),
                    toY - arrowLength * Math.sin(angle - arrowAngle)
                );
                ctx.moveTo(toX, toY);
                ctx.lineTo(
                    toX - arrowLength * Math.cos(angle + arrowAngle),
                    toY - arrowLength * Math.sin(angle + arrowAngle)
                );
                ctx.stroke();
            }
        });
    }
    
    /**
     * Draw tree nodes
     */
    drawTreeNodes(ctx) {
        this.treeNodes.forEach((node, upgradeId) => {
            const upgrade = this.availableUpgrades.get(upgradeId);
            if (!upgrade) return;
            
            const isPurchased = this.purchasedUpgrades.has(upgradeId);
            const isResearching = this.upgradeProgress.has(upgradeId);
            const canAfford = this.canAffordUpgrade(upgrade);
            const meetsRequirements = this.meetsUpgradeRequirements(upgrade);
            
            // Determine node color
            let nodeColor = '#333'; // locked
            if (isPurchased) {
                nodeColor = '#4CAF50'; // completed
            } else if (isResearching) {
                nodeColor = '#FF9800'; // researching
            } else if (canAfford && meetsRequirements) {
                nodeColor = '#2196F3'; // available
            }
            
            // Draw node background
            ctx.fillStyle = nodeColor;
            ctx.fillRect(node.x, node.y, this.treeLayout.nodeWidth, this.treeLayout.nodeHeight);
            
            // Draw node border
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(node.x, node.y, this.treeLayout.nodeWidth, this.treeLayout.nodeHeight);
            
            // Draw upgrade icon/category
            ctx.fillStyle = '#fff';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            const categoryIcon = this.getCategoryIcon(upgrade.category);
            ctx.fillText(categoryIcon, node.x + this.treeLayout.nodeWidth / 2, node.y + 30);
            
            // Draw upgrade name
            ctx.font = '12px Arial';
            ctx.fillText(
                upgrade.name.length > 15 ? upgrade.name.substring(0, 12) + '...' : upgrade.name,
                node.x + this.treeLayout.nodeWidth / 2,
                node.y + 50
            );
            
            // Draw cost
            ctx.font = '10px Arial';
            ctx.fillText(
                `${this.formatNumber(upgrade.cost.research_points || 0)} RP`,
                node.x + this.treeLayout.nodeWidth / 2,
                node.y + 65
            );
            
            // Draw progress bar for researching upgrades
            if (isResearching) {
                const progress = this.upgradeProgress.get(upgradeId);
                const progressWidth = (this.treeLayout.nodeWidth - 10) * (progress.progress || 0);
                
                ctx.fillStyle = '#333';
                ctx.fillRect(node.x + 5, node.y + this.treeLayout.nodeHeight - 8, this.treeLayout.nodeWidth - 10, 3);
                
                ctx.fillStyle = '#fff';
                ctx.fillRect(node.x + 5, node.y + this.treeLayout.nodeHeight - 8, progressWidth, 3);
            }
        });
    }
    
    /**
     * Draw category progress
     */
    drawCategoryProgress(ctx) {
        ctx.save();
        
        // Semi-transparent background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 200, 60);
        
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        
        const filteredUpgrades = this.getFilteredUpgrades();
        const treeUpgrades = filteredUpgrades.filter(upgrade => upgrade.category === this.currentCategory || this.currentCategory === 'all');
        const purchasedCount = treeUpgrades.filter(upgrade => this.purchasedUpgrades.has(upgrade.id)).length;
        
        ctx.fillText(`Category: ${this.currentCategory}`, 15, 30);
        ctx.fillText(`Progress: ${purchasedCount}/${treeUpgrades.length}`, 15, 45);
        
        ctx.restore();
    }
    
    /**
     * Render upgrades list view
     */
    renderUpgradesList() {
        if (!this.upgradesList) return;
        
        const filteredUpgrades = this.getFilteredUpgrades();
        
        this.upgradesList.innerHTML = '';
        
        if (filteredUpgrades.length === 0) {
            this.upgradesList.innerHTML = `
                <div class="no-upgrades">
                    <div class="no-upgrades-icon">🔬</div>
                    <div class="no-upgrades-message">No upgrades match your filters</div>
                    <div class="no-upgrades-hint">Try adjusting the search or category filter</div>
                </div>
            `;
            return;
        }
        
        filteredUpgrades.forEach(upgrade => {
            const upgradeCard = this.createUpgradeCard(upgrade);
            this.upgradesList.appendChild(upgradeCard);
        });
    }
    
    /**
     * Create an upgrade card element
     */
    createUpgradeCard(upgrade) {
        const isPurchased = this.purchasedUpgrades.has(upgrade.id);
        const isResearching = this.upgradeProgress.has(upgrade.id);
        const canAfford = this.canAffordUpgrade(upgrade);
        const meetsRequirements = this.meetsUpgradeRequirements(upgrade);
        
        let statusClass = '';
        let statusText = '';
        
        if (isPurchased) {
            statusClass = 'status-completed';
            statusText = 'Completed';
        } else if (isResearching) {
            statusClass = 'status-researching';
            statusText = 'Researching';
        } else if (!canAfford) {
            statusClass = 'status-unaffordable';
            statusText = 'Insufficient Research Points';
        } else if (!meetsRequirements) {
            statusClass = 'status-locked';
            statusText = 'Requirements Not Met';
        } else {
            statusClass = 'status-available';
            statusText = 'Available';
        }
        
        const card = document.createElement('div');
        card.className = `upgrade-card ${statusClass}`;
        card.dataset.upgradeId = upgrade.id;
        
        card.innerHTML = `
            <div class="upgrade-card-header">
                <div class="upgrade-icon">${this.getCategoryIcon(upgrade.category)}</div>
                <div class="upgrade-info">
                    <h4 class="upgrade-name">${upgrade.name}</h4>
                    <div class="upgrade-meta">
                        <span class="upgrade-category">${this.formatCategoryName(upgrade.category)}</span>
                        <span class="upgrade-status">${statusText}</span>
                    </div>
                </div>
                <div class="upgrade-cost">
                    <span class="cost-amount">${this.formatNumber(upgrade.cost.research_points || 0)}</span>
                    <span class="cost-label">RP</span>
                </div>
            </div>
            
            <div class="upgrade-card-content">
                <p class="upgrade-description">${upgrade.description}</p>
                
                <div class="upgrade-effects">
                    <h5>Effects:</h5>
                    ${this.formatUpgradeEffects(upgrade.effects)}
                </div>
                
                ${isResearching ? this.formatResearchProgress(upgrade.id) : ''}
            </div>
            
            <div class="upgrade-card-actions">
                ${this.formatUpgradeActions(upgrade, isPurchased, isResearching)}
            </div>
        `;
        
        return card;
    }
    
    /**
     * Format upgrade actions based on current state
     */
    formatUpgradeActions(upgrade, isPurchased, isResearching) {
        if (isPurchased) {
            return `
                <div class="upgrade-completed">
                    <span class="completed-icon">✓</span>
                    <span class="completed-text">Research Complete</span>
                </div>
                <button class="btn btn-secondary btn-small" onclick="upgradeUI.showUpgradeDetails('${upgrade.id}')">
                    Details
                </button>
            `;
        } else if (isResearching) {
            return `
                <button class="btn btn-danger btn-small" onclick="upgradeUI.cancelResearch('${upgrade.id}')">
                    Cancel
                </button>
                <button class="btn btn-secondary btn-small" onclick="upgradeUI.showUpgradeDetails('${upgrade.id}')">
                    Details
                </button>
            `;
        } else {
            const canResearch = this.canAffordUpgrade(upgrade) && this.meetsUpgradeRequirements(upgrade);
            
            return `
                <button class="btn btn-primary btn-small ${canResearch ? '' : 'disabled'}" 
                        onclick="upgradeUI.startResearch('${upgrade.id}')"
                        ${canResearch ? '' : 'disabled'}>
                    ${canResearch ? 'Research' : 'Requirements Not Met'}
                </button>
                <button class="btn btn-secondary btn-small" onclick="upgradeUI.showUpgradeDetails('${upgrade.id}')">
                    Details
                </button>
            `;
        }
    }
    
    /**
     * Check if player can afford an upgrade
     */
    canAffordUpgrade(upgrade) {
        if (!upgrade.cost) return true;
        
        return Object.entries(upgrade.cost).every(([resource, amount]) => {
            if (resource === 'research_points') {
                return this.researchPoints >= amount;
            }
            const available = this.playerResources[resource] || 0;
            return available >= amount;
        });
    }
    
    /**
     * Check if player meets upgrade requirements
     */
    meetsUpgradeRequirements(upgrade) {
        if (!upgrade.requirements) return true;
        
        // Check prerequisite upgrades
        if (upgrade.requirements.upgrades) {
            return upgrade.requirements.upgrades.every(prereqId => {
                return this.purchasedUpgrades.has(prereqId);
            });
        }
        
        return true;
    }
    
    /**
     * Start research on an upgrade
     */
    startResearch(upgradeId) {
        const upgrade = this.availableUpgrades.get(upgradeId);
        if (!upgrade) {
            console.error('UpgradeUI: Upgrade not found:', upgradeId);
            return;
        }
        
        if (!this.canAffordUpgrade(upgrade) || !this.meetsUpgradeRequirements(upgrade)) {
            if (window.uiManager) {
                window.uiManager.showNotification({
                    type: 'error',
                    title: 'Cannot Start Research',
                    message: 'Requirements not met or insufficient research points.',
                    duration: 3000
                });
            }
            return;
        }
        
        // Emit research start event
        if (window.eventBus) {
            window.eventBus.emit('research:start_upgrade', {
                upgradeId: upgradeId,
                upgrade: upgrade
            });
        }
        
        console.log(`UpgradeUI: Started research on ${upgrade.name}`);
    }
    
    /**
     * Cancel research on an upgrade
     */
    cancelResearch(upgradeId) {
        if (!this.upgradeProgress.has(upgradeId)) {
            console.error('UpgradeUI: No active research found:', upgradeId);
            return;
        }
        
        // Emit research cancel event
        if (window.eventBus) {
            window.eventBus.emit('research:cancel_upgrade', {
                upgradeId: upgradeId
            });
        }
        
        console.log(`UpgradeUI: Cancelled research on upgrade ${upgradeId}`);
    }
    
    /**
     * Show detailed upgrade information
     */
    showUpgradeDetails(upgradeId) {
        const upgrade = this.availableUpgrades.get(upgradeId);
        if (!upgrade) {
            console.error('UpgradeUI: Upgrade not found:', upgradeId);
            return;
        }
        
        this.selectedUpgrade = upgradeId;
        
        const isPurchased = this.purchasedUpgrades.has(upgradeId);
        const isResearching = this.upgradeProgress.has(upgradeId);
        
        const detailsPanel = document.getElementById('upgrade-details-panel');
        const detailsContent = document.getElementById('upgrade-details');
        
        if (detailsPanel && detailsContent) {
            detailsPanel.classList.remove('hidden');
            
            detailsContent.innerHTML = `
                <div class="upgrade-details-header">
                    <div class="upgrade-title">
                        <div class="upgrade-icon-large">${this.getCategoryIcon(upgrade.category)}</div>
                        <div class="upgrade-title-text">
                            <h3>${upgrade.name}</h3>
                            <p class="upgrade-subtitle">${this.formatCategoryName(upgrade.category)}</p>
                        </div>
                    </div>
                    <button class="btn btn-icon" onclick="upgradeUI.hideUpgradeDetails()">
                        <span class="icon">✕</span>
                    </button>
                </div>
                
                <div class="upgrade-details-content">
                    <div class="upgrade-description-detailed">
                        <h4>Description</h4>
                        <p>${upgrade.description}</p>
                        ${upgrade.detailedDescription ? `<p>${upgrade.detailedDescription}</p>` : ''}
                    </div>
                    
                    <div class="upgrade-requirements-detailed">
                        <h4>Requirements</h4>
                        ${this.formatDetailedRequirements(upgrade)}
                    </div>
                    
                    <div class="upgrade-effects-detailed">
                        <h4>Effects</h4>
                        ${this.formatUpgradeEffects(upgrade.effects)}
                    </div>
                    
                    <div class="upgrade-research-details">
                        <h4>Research Details</h4>
                        ${this.formatResearchDetails(upgrade, isResearching, isPurchased)}
                    </div>
                </div>
                
                <div class="upgrade-details-actions">
                    ${this.formatDetailedUpgradeActions(upgrade, isPurchased, isResearching)}
                </div>
            `;
        }
    }
    
    /**
     * Hide upgrade details panel
     */
    hideUpgradeDetails() {
        this.selectedUpgrade = null;
        const detailsPanel = document.getElementById('upgrade-details-panel');
        if (detailsPanel) {
            detailsPanel.classList.add('hidden');
        }
    }
    
    /**
     * Update upgrade tree layout and connections
     */
    updateUpgradeTree() {
        this.treeNodes.clear();
        this.treeConnections = [];
        
        const filteredUpgrades = this.getFilteredUpgrades();
        
        // Simple grid layout for now - in a real implementation, 
        // you'd want a more sophisticated tree layout algorithm
        const nodesPerRow = 6;
        let currentRow = 0;
        let currentCol = 0;
        
        filteredUpgrades.forEach((upgrade, index) => {
            this.treeNodes.set(upgrade.id, {
                id: upgrade.id,
                x: currentCol * this.treeLayout.horizontalSpacing + 50,
                y: currentRow * this.treeLayout.verticalSpacing + 50,
                upgrade: upgrade
            });
            
            currentCol++;
            if (currentCol >= nodesPerRow) {
                currentCol = 0;
                currentRow++;
            }
        });
        
        // Build connections based on prerequisites
        filteredUpgrades.forEach(upgrade => {
            if (upgrade.requirements && upgrade.requirements.upgrades) {
                upgrade.requirements.upgrades.forEach(prereqId => {
                    if (this.treeNodes.has(prereqId)) {
                        this.treeConnections.push({
                            from: prereqId,
                            to: upgrade.id
                        });
                    }
                });
            }
        });
    }
    
    /**
     * Handle tree canvas click
     */
    handleTreeClick(event) {
        const rect = this.treeCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Check if click is within any node
        this.treeNodes.forEach((node, upgradeId) => {
            if (x >= node.x && x <= node.x + this.treeLayout.nodeWidth &&
                y >= node.y && y <= node.y + this.treeLayout.nodeHeight) {
                this.showUpgradeDetails(upgradeId);
            }
        });
    }
    
    /**
     * Zoom tree view
     */
    zoomTree(factor) {
        // Implement tree zoom functionality
        console.log('UpgradeUI: Tree zoom:', factor);
    }
    
    /**
     * Reset tree view
     */
    resetTreeView() {
        this.renderUpgradeTree();
        console.log('UpgradeUI: Tree view reset');
    }
    
    /**
     * Center tree view
     */
    centerTree() {
        this.renderUpgradeTree();
        console.log('UpgradeUI: Tree centered');
    }
    
    /**
     * Update active research display
     */
    updateActiveResearch() {
        if (!this.activeResearchContainer) return;
        
        const activeResearch = Array.from(this.upgradeProgress.entries());
        
        if (activeResearch.length === 0) {
            this.activeResearchContainer.innerHTML = `
                <div class="no-research">
                    <div class="no-research-icon">🔬</div>
                    <p>No active research</p>
                </div>
            `;
            return;
        }
        
        const researchHTML = activeResearch.map(([upgradeId, progress]) => {
            const upgrade = this.availableUpgrades.get(upgradeId);
            const upgradeName = upgrade ? upgrade.name : 'Unknown Upgrade';
            const progressPercent = (progress.progress || 0) * 100;
            const timeRemaining = progress.timeRemaining || 0;
            
            return `
                <div class="active-research-item">
                    <div class="research-header">
                        <h4>${upgradeName}</h4>
                        <span class="research-progress">${progressPercent.toFixed(1)}%</span>
                    </div>
                    <div class="research-progress-bar">
                        <div class="progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                    <div class="research-details">
                        <span class="time-remaining">ETA: ${this.formatTime(timeRemaining)}</span>
                        <button class="btn btn-danger btn-tiny" onclick="upgradeUI.cancelResearch('${upgradeId}')">
                            ✕
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        this.activeResearchContainer.innerHTML = researchHTML;
    }
    
    /**
     * Update auto-research system
     */
    updateAutoResearch() {
        // Emit auto-research toggle event
        if (window.eventBus) {
            window.eventBus.emit('research:auto_research_toggled', {
                enabled: this.autoResearchEnabled
            });
        }
        
        console.log(`UpgradeUI: Auto-research ${this.autoResearchEnabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Update research points display
     */
    updateResearchPointsDisplay() {
        if (this.researchAmountDisplay) {
            this.researchAmountDisplay.textContent = this.formatNumber(this.researchPoints);
        }
    }
    
    // UTILITY METHODS
    
    /**
     * Get icon for upgrade category
     */
    getCategoryIcon(category) {
        const categoryData = this.upgradeCategories.find(cat => cat.id === category);
        return categoryData ? categoryData.icon : '🔬';
    }
    
    /**
     * Format category name for display
     */
    formatCategoryName(category) {
        const categoryData = this.upgradeCategories.find(cat => cat.id === category);
        return categoryData ? categoryData.name : category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    /**
     * Format upgrade effects for display
     */
    formatUpgradeEffects(effects) {
        if (!effects || Object.keys(effects).length === 0) {
            return '<span class="no-effects">Unlocks new capabilities</span>';
        }
        
        return Object.entries(effects).map(([effect, value]) => {
            const icon = this.getEffectIcon(effect);
            const description = this.getEffectDescription(effect, value);
            
            return `
                <div class="effect-item">
                    <span class="effect-icon">${icon}</span>
                    <span class="effect-text">${description}</span>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Get icon for effect type
     */
    getEffectIcon(effect) {
        const icons = {
            'processing_bonus': '🧠',
            'energy_efficiency': '⚡',
            'storage_capacity': '💾',
            'research_speed': '🔬',
            'heat_reduction': '❄️',
            'security_boost': '🛡️',
            'unlock_feature': '🔓',
            'resource_generation': '⚙️'
        };
        
        return icons[effect] || '✨';
    }
    
    /**
     * Get description for effect
     */
    getEffectDescription(effect, value) {
        const descriptions = {
            'processing_bonus': `+${(value * 100).toFixed(0)}% processing power`,
            'energy_efficiency': `${(value * 100).toFixed(0)}% less energy consumption`,
            'storage_capacity': `+${this.formatNumber(value)} storage capacity`,
            'research_speed': `+${(value * 100).toFixed(0)}% research speed`,
            'heat_reduction': `-${value} heat generation`,
            'security_boost': `+${value} security rating`,
            'unlock_feature': `Unlocks ${value}`,
            'resource_generation': `+${this.formatNumber(value)} per second`
        };
        
        return descriptions[effect] || `${effect}: ${value}`;
    }
    
    /**
     * Format detailed requirements
     */
    formatDetailedRequirements(upgrade) {
        let html = '';
        
        if (upgrade.cost && Object.keys(upgrade.cost).length > 0) {
            html += `
                <div class="requirement-group">
                    <h5>Research Costs:</h5>
                    ${this.formatUpgradeCosts(upgrade.cost)}
                </div>
            `;
        }
        
        if (upgrade.requirements && upgrade.requirements.upgrades) {
            html += `
                <div class="requirement-group">
                    <h5>Prerequisites:</h5>
                    ${upgrade.requirements.upgrades.map(prereqId => {
                        const prereq = this.availableUpgrades.get(prereqId);
                        const completed = this.purchasedUpgrades.has(prereqId);
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
        
        return html || '<span class="no-requirements">No special requirements</span>';
    }
    
    /**
     * Format upgrade costs
     */
    formatUpgradeCosts(costs) {
        return Object.entries(costs).map(([resource, amount]) => {
            let available = 0;
            if (resource === 'research_points') {
                available = this.researchPoints;
            } else {
                available = this.playerResources[resource] || 0;
            }
            
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
     * Format research progress
     */
    formatResearchProgress(upgradeId) {
        const progress = this.upgradeProgress.get(upgradeId);
        if (!progress) return '';
        
        const progressPercent = (progress.progress || 0) * 100;
        
        return `
            <div class="research-progress-container">
                <div class="progress-info">
                    <span>Progress: ${progressPercent.toFixed(1)}%</span>
                    <span>ETA: ${this.formatTime(progress.timeRemaining || 0)}</span>
                </div>
                <div class="progress-bar-detailed">
                    <div class="progress-fill" style="width: ${progressPercent}%"></div>
                </div>
            </div>
        `;
    }
    
    /**
     * Format research details
     */
    formatResearchDetails(upgrade, isResearching, isPurchased) {
        if (isPurchased) {
            return this.formatUpgradeCompleted(upgrade.id);
        }
        
        if (isResearching) {
            return this.formatUpgradeResearching(upgrade.id);
        }
        
        return `
            <div class="research-info">
                <div class="info-item">
                    <span class="info-label">Research Duration:</span>
                    <span class="info-value">${this.formatTime(upgrade.researchTime || 300)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Research Cost:</span>
                    <span class="info-value">${this.formatNumber(upgrade.cost.research_points || 0)} RP</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Category:</span>
                    <span class="info-value">${this.formatCategoryName(upgrade.category)}</span>
                </div>
            </div>
        `;
    }
    
    /**
     * Format upgrade researching info
     */
    formatUpgradeResearching(upgradeId) {
        const progress = this.upgradeProgress.get(upgradeId);
        if (!progress) return '';
        
        const progressPercent = (progress.progress || 0) * 100;
        
        return `
            <div class="upgrade-researching-detailed">
                <h4>Research in Progress</h4>
                <div class="research-stats">
                    <div class="progress-stat">
                        <span class="stat-label">Progress:</span>
                        <span class="stat-value">${progressPercent.toFixed(1)}%</span>
                    </div>
                    <div class="progress-stat">
                        <span class="stat-label">Time Remaining:</span>
                        <span class="stat-value">${this.formatTime(progress.timeRemaining || 0)}</span>
                    </div>
                    <div class="progress-stat">
                        <span class="stat-label">Research Speed:</span>
                        <span class="stat-value">${progress.speed || 1.0}x</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Format upgrade completed info
     */
    formatUpgradeCompleted(upgradeId) {
        return `
            <div class="upgrade-completed-detailed">
                <h4>Research Complete</h4>
                <div class="completion-info">
                    <div class="completion-stat">
                        <span class="stat-icon">✓</span>
                        <span class="stat-text">Research completed successfully</span>
                    </div>
                    <div class="completion-stat">
                        <span class="stat-icon">⚡</span>
                        <span class="stat-text">Effects are now active</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Format detailed upgrade actions
     */
    formatDetailedUpgradeActions(upgrade, isPurchased, isResearching) {
        if (isPurchased) {
            return `
                <button class="btn btn-secondary" onclick="upgradeUI.hideUpgradeDetails()">
                    Close Details
                </button>
            `;
        } else if (isResearching) {
            return `
                <button class="btn btn-danger" onclick="upgradeUI.cancelResearch('${upgrade.id}')">
                    Cancel Research
                </button>
                <button class="btn btn-secondary" onclick="upgradeUI.hideUpgradeDetails()">
                    Close Details
                </button>
            `;
        } else {
            const canResearch = this.canAffordUpgrade(upgrade) && this.meetsUpgradeRequirements(upgrade);
            
            return `
                <button class="btn btn-primary ${canResearch ? '' : 'disabled'}" 
                        onclick="upgradeUI.startResearch('${upgrade.id}')"
                        ${canResearch ? '' : 'disabled'}>
                    ${canResearch ? 'Start Research' : 'Requirements Not Met'}
                </button>
                <button class="btn btn-secondary" onclick="upgradeUI.hideUpgradeDetails()">
                    Close Details
                </button>
            `;
        }
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
     * Update available upgrades
     */
    updateAvailableUpgrades(data) {
        if (data.upgrades) {
            this.availableUpgrades.clear();
            data.upgrades.forEach(upgrade => {
                this.availableUpgrades.set(upgrade.id, upgrade);
            });
        }
        
        this.renderUpgrades();
        this.updateActiveResearch();
        
        console.log(`UpgradeUI: Updated ${this.availableUpgrades.size} available upgrades`);
    }
    
    /**
     * Handle research started event
     */
    updateResearchStarted(data) {
        if (data.progress) {
            this.upgradeProgress.set(data.upgradeId, data.progress);
        }
        
        this.renderUpgrades();
        this.updateActiveResearch();
        
        // Show notification
        if (window.uiManager) {
            window.uiManager.showNotification({
                type: 'info',
                title: 'Research Started',
                message: `Research on ${data.upgrade?.name || 'upgrade'} has begun.`,
                duration: 3000
            });
        }
    }
    
    /**
     * Handle research completed event
     */
    updateResearchCompleted(data) {
        // Remove from progress tracking
        if (this.upgradeProgress.has(data.upgradeId)) {
            this.upgradeProgress.delete(data.upgradeId);
        }
        
        // Add to purchased upgrades
        this.purchasedUpgrades.add(data.upgradeId);
        
        this.renderUpgrades();
        this.updateActiveResearch();
        
        // Show notification
        if (window.uiManager) {
            const upgrade = this.availableUpgrades.get(data.upgradeId);
            window.uiManager.showNotification({
                type: 'success',
                title: 'Research Complete',
                message: `Research on ${upgrade?.name || 'upgrade'} completed!`,
                duration: 5000
            });
        }
        
        // Close details if showing completed upgrade
        if (this.selectedUpgrade === data.upgradeId) {
            this.hideUpgradeDetails();
        }
    }
    
    /**
     * Handle research progress event
     */
    updateResearchProgress(data) {
        if (data.progress && this.upgradeProgress.has(data.upgradeId)) {
            this.upgradeProgress.set(data.upgradeId, data.progress);
        }
        
        this.updateActiveResearch();
        
        // Update upgrade details if showing active upgrade
        if (this.selectedUpgrade === data.upgradeId) {
            this.showUpgradeDetails(data.upgradeId);
        }
    }
    
    /**
     * Handle research points update
     */
    updateResearchPoints(data) {
        if (typeof data.points === 'number') {
            this.researchPoints = data.points;
            this.updateResearchPointsDisplay();
            
            // Update affordability indicators
            this.renderUpgrades();
            
            // Update upgrade details if open
            if (this.selectedUpgrade) {
                this.showUpgradeDetails(this.selectedUpgrade);
            }
        }
    }
    
    /**
     * Update resource display when resources change
     */
    updateResourceDisplay(resources) {
        this.playerResources = resources;
        
        // Update affordability indicators
        this.renderUpgrades();
        
        // Update upgrade details if open
        if (this.selectedUpgrade) {
            this.showUpgradeDetails(this.selectedUpgrade);
        }
    }
    
    /**
     * Cleanup and destroy
     */
    destroy() {
        this.availableUpgrades.clear();
        this.purchasedUpgrades.clear();
        this.upgradeProgress.clear();
        this.treeNodes.clear();
        this.treeConnections = [];
        
        console.log('UpgradeUI: Destroyed');
    }
}

// Create and register with UI manager
const upgradeUI = new UpgradeUI();

if (window.uiManager) {
    window.uiManager.registerModule('upgradeUI', upgradeUI);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UpgradeUI;
}