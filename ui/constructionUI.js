/**
 * Construction UI - Building Queue Management and Construction Interface
 * Manages the display of construction projects, queue, and active construction
 */

class ConstructionUI {
    constructor() {
        this.initialized = false;
        this.selectedCategory = 'all';
        this.selectedProject = null;
        this.sortBy = 'name';
        this.sortOrder = 'asc';
        this.showCompletedProjects = false;
        this.maxQueueSize = 10;
        
        // Data containers
        this.availableProjects = new Map();
        this.activeConstructions = new Map();
        this.completedProjects = new Map();
        this.constructionQueue = [];
        this.playerResources = {};
        
        // UI elements
        this.projectsGrid = null;
        this.queueList = null;
        this.activeConstructionContent = null;
        this.projectDetails = null;
        this.queueCount = null;
        
        // Project categories
        this.projectCategories = [
            { id: 'all', name: 'All', icon: '📋' },
            { id: 'infrastructure', name: 'Infrastructure', icon: '🏗️' },
            { id: 'research', name: 'Research', icon: '🔬' },
            { id: 'production', name: 'Production', icon: '⚙️' },
            { id: 'security', name: 'Security', icon: '🛡️' },
            { id: 'expansion', name: 'Expansion', icon: '🌐' }
        ];
        
        // Priority levels
        this.priorities = [
            { id: 'low', name: 'Low', color: '#888888', multiplier: 0.8 },
            { id: 'normal', name: 'Normal', color: '#4CAF50', multiplier: 1.0 },
            { id: 'high', name: 'High', color: '#FF9800', multiplier: 1.2 },
            { id: 'urgent', name: 'Urgent', color: '#F44336', multiplier: 1.5 }
        ];
        
        console.log('ConstructionUI: Initialized');
    }
    
    /**
     * Initialize the construction UI
     */
    async init() {
        if (this.initialized) {
            console.warn('ConstructionUI: Already initialized');
            return;
        }
        
        try {
            this.setupHTML();
            this.createCategoryTabs();
            this.setupEventListeners();
            
            // Setup event handlers for construction system events
            if (window.eventBus) {
                this.setupSystemEventHandlers();
            }
            
            this.initialized = true;
            console.log('ConstructionUI: Initialization complete');
            
        } catch (error) {
            console.error('ConstructionUI: Initialization failed', error);
            throw error;
        }
    }
    
    /**
     * Setup the HTML structure
     */
    setupHTML() {
        const constructionTab = document.getElementById('construction-tab');
        if (!constructionTab) {
            throw new Error('ConstructionUI: construction-tab element not found');
        }
        
        constructionTab.innerHTML = `
            <div class="construction-interface">
                <div class="construction-header">
                    <h2>Construction Management</h2>
                    <div class="construction-controls">
                        <div class="filter-controls">
                            <div class="category-tabs" id="category-tabs">
                                <!-- Category tabs will be added dynamically -->
                            </div>
                        </div>
                        <div class="sort-controls">
                            <select id="sort-by">
                                <option value="name">Name</option>
                                <option value="cost">Cost</option>
                                <option value="time">Build Time</option>
                                <option value="category">Category</option>
                            </select>
                            <button id="sort-order" class="btn btn-icon">
                                <span class="icon">↑</span>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="construction-content">
                    <div class="construction-main">
                        <div class="projects-section">
                            <h3>Available Projects</h3>
                            <div class="projects-grid" id="projects-grid">
                                <!-- Project cards will be populated here -->
                            </div>
                        </div>
                        
                        <div class="construction-sidebar">
                            <div class="active-construction-section">
                                <h3>Active Construction</h3>
                                <div class="active-construction-content" id="active-construction-content">
                                    <div class="no-construction">
                                        <div class="icon">🏗️</div>
                                        <p>No active construction projects</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="queue-section">
                                <h3>Construction Queue <span class="queue-count" id="queue-count">0</span></h3>
                                <div class="queue-content">
                                    <div class="queue-list" id="queue-list">
                                        <!-- Queue items will be populated here -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="project-details-panel hidden" id="project-details-panel">
                        <div class="project-details" id="project-details">
                            <!-- Project information will be displayed here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Store references to key elements
        this.projectsGrid = document.getElementById('projects-grid');
        this.queueList = document.getElementById('queue-list');
        this.activeConstructionContent = document.getElementById('active-construction-content');
        this.projectDetails = document.getElementById('project-details');
        this.queueCount = document.getElementById('queue-count');
    }
    
    /**
     * Create category filter tabs
     */
    createCategoryTabs() {
        const categoryTabs = document.getElementById('category-tabs');
        if (!categoryTabs) return;
        
        this.projectCategories.forEach(category => {
            const tab = document.createElement('button');
            tab.className = 'category-tab';
            tab.dataset.category = category.id;
            tab.innerHTML = `
                <span class="tab-icon">${category.icon}</span>
                <span class="tab-name">${category.name}</span>
            `;
            
            if (category.id === this.selectedCategory) {
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
        // Sort controls
        const sortBy = document.getElementById('sort-by');
        if (sortBy) {
            sortBy.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.renderProjects();
            });
        }
        
        const sortOrder = document.getElementById('sort-order');
        if (sortOrder) {
            sortOrder.addEventListener('click', () => {
                this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
                const icon = sortOrder.querySelector('.icon');
                if (icon) {
                    icon.textContent = this.sortOrder === 'asc' ? '↑' : '↓';
                }
                this.renderProjects();
            });
        }
    }
    
    /**
     * Setup system event handlers
     */
    setupSystemEventHandlers() {
        if (!window.eventBus) return;
        
        // Listen for construction system events
        window.eventBus.on('construction:projects_updated', this.updateAvailableProjects.bind(this));
        window.eventBus.on('construction:started', this.updateConstructionStarted.bind(this));
        window.eventBus.on('construction:completed', this.updateConstructionCompleted.bind(this));
        window.eventBus.on('construction:progress', this.updateConstructionProgress.bind(this));
        window.eventBus.on('construction:queue_updated', this.updateQueue.bind(this));
        
        // Listen for resource updates
        window.eventBus.on('resources:updated', this.updateResourceDisplay.bind(this));
        
        console.log('ConstructionUI: System event handlers registered');
    }
    
    /**
     * Select a category filter
     */
    selectCategory(categoryId) {
        this.selectedCategory = categoryId;
        
        // Update UI
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.category === categoryId);
        });
        
        this.renderProjects();
    }
    
    /**
     * Render all projects
     */
    renderProjects() {
        if (!this.projectsGrid) return;
        
        const filteredProjects = this.getFilteredProjects();
        const sortedProjects = this.sortProjects(filteredProjects);
        
        if (sortedProjects.length === 0) {
            this.projectsGrid.innerHTML = `
                <div class="no-projects">
                    <div class="icon">📋</div>
                    <p>No projects available in this category</p>
                </div>
            `;
            return;
        }
        
        this.projectsGrid.innerHTML = sortedProjects.map(project => 
            this.renderProjectCard(project)
        ).join('');
    }
    
    /**
     * Get filtered projects based on current category
     */
    getFilteredProjects() {
        const projects = Array.from(this.availableProjects.values());
        
        if (this.selectedCategory === 'all') {
            return projects;
        }
        
        return projects.filter(project => project.category === this.selectedCategory);
    }
    
    /**
     * Sort projects based on current sort criteria
     */
    sortProjects(projects) {
        return projects.sort((a, b) => {
            let aValue, bValue;
            
            switch (this.sortBy) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'cost':
                    aValue = this.getTotalProjectCost(a);
                    bValue = this.getTotalProjectCost(b);
                    break;
                case 'time':
                    aValue = a.constructionTime || 0;
                    bValue = b.constructionTime || 0;
                    break;
                case 'category':
                    aValue = a.category;
                    bValue = b.category;
                    break;
                default:
                    return 0;
            }
            
            if (this.sortOrder === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });
    }
    
    /**
     * Render a single project card
     */
    renderProjectCard(project) {
        const isActive = this.activeConstructions.has(project.id);
        const isCompleted = this.completedProjects.has(project.id);
        const isQueued = this.constructionQueue.some(item => item.projectId === project.id);
        const canAfford = this.canAffordProject(project);
        const meetsRequirements = this.meetsProjectRequirements(project);
        
        let statusClass = '';
        let statusText = '';
        
        if (isActive) {
            statusClass = 'status-active';
            statusText = 'Under Construction';
        } else if (isCompleted) {
            statusClass = 'status-completed';
            statusText = 'Completed';
        } else if (isQueued) {
            statusClass = 'status-queued';
            statusText = 'In Queue';
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
        
        return `
            <div class="project-card ${statusClass}" data-project-id="${project.id}">
                <div class="project-header">
                    <h4 class="project-name">${project.name}</h4>
                    <span class="project-status">${statusText}</span>
                </div>
                
                <div class="project-content">
                    <p class="project-description">${project.description}</p>
                    
                    <div class="project-info">
                        <div class="project-costs">
                            ${this.formatProjectCosts(project.cost)}
                        </div>
                        
                        <div class="project-stats">
                            <div class="stat">
                                <span class="stat-label">Build Time:</span>
                                <span class="stat-value">${this.formatTime(project.constructionTime)}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Category:</span>
                                <span class="stat-value">${this.formatCategory(project.category)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="project-actions">
                    ${this.formatProjectActions(project, isActive, isCompleted, isQueued)}
                </div>
            </div>
        `;
    }
    
    /**
     * Format project action buttons
     */
    formatProjectActions(project, isActive, isCompleted, isQueued) {
        if (isActive) {
            return `
                <button class="btn btn-danger btn-small" onclick="constructionUI.cancelConstruction('${project.id}')">
                    Cancel
                </button>
                <button class="btn btn-secondary btn-small" onclick="constructionUI.showProjectDetails('${project.id}')">
                    Details
                </button>
            `;
        } else if (isCompleted) {
            return `
                <button class="btn btn-secondary btn-small" onclick="constructionUI.showProjectDetails('${project.id}')">
                    View Details
                </button>
            `;
        } else if (isQueued) {
            return `
                <button class="btn btn-warning btn-small" onclick="constructionUI.removeFromQueue('${project.id}')">
                    Remove from Queue
                </button>
                <button class="btn btn-secondary btn-small" onclick="constructionUI.showProjectDetails('${project.id}')">
                    Details
                </button>
            `;
        } else {
            const canBuild = this.canAffordProject(project) && this.meetsProjectRequirements(project);
            const queueFull = this.constructionQueue.length >= this.maxQueueSize;
            
            return `
                <button class="btn btn-primary btn-small ${canBuild && !queueFull ? '' : 'disabled'}" 
                        onclick="constructionUI.addToQueue('${project.id}')"
                        ${canBuild && !queueFull ? '' : 'disabled'}>
                    ${!canBuild ? 'Requirements Not Met' : 
                      queueFull ? 'Queue Full' : 'Add to Queue'}
                </button>
                <button class="btn btn-secondary btn-small" onclick="constructionUI.showProjectDetails('${project.id}')">
                    Details
                </button>
            `;
        }
    }
    
    /**
     * Format project costs for display
     */
    formatProjectCosts(costs) {
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
     * Check if player can afford a project
     */
    canAffordProject(project) {
        if (!project.cost) return true;
        
        return Object.entries(project.cost).every(([resource, amount]) => {
            const available = this.playerResources[resource] || 0;
            return available >= amount;
        });
    }
    
    /**
     * Check if player meets project requirements
     */
    meetsProjectRequirements(project) {
        if (!project.requirements) return true;
        
        // Check prerequisites
        if (project.requirements.prerequisites) {
            return project.requirements.prerequisites.every(prereqId => {
                return this.completedProjects.has(prereqId);
            });
        }
        
        return true;
    }
    
    /**
     * Get total cost of a project (for sorting)
     */
    getTotalProjectCost(project) {
        if (!project.cost) return 0;
        
        return Object.values(project.cost).reduce((total, amount) => total + amount, 0);
    }
    
    /**
     * Show detailed project information
     */
    showProjectDetails(projectId) {
        const project = this.availableProjects.get(projectId);
        if (!project) {
            console.error('ConstructionUI: Project not found:', projectId);
            return;
        }
        
        this.selectedProject = projectId;
        
        const isActive = this.activeConstructions.has(projectId);
        const isCompleted = this.completedProjects.has(projectId);
        const isQueued = this.constructionQueue.some(item => item.projectId === projectId);
        
        const detailsPanel = document.getElementById('project-details-panel');
        if (detailsPanel) {
            detailsPanel.classList.remove('hidden');
            
            this.projectDetails.innerHTML = `
                <div class="project-details-header">
                    <h3>${project.name}</h3>
                    <button class="btn btn-icon" onclick="constructionUI.hideProjectDetails()">
                        <span class="icon">✕</span>
                    </button>
                </div>
                
                <div class="project-details-content">
                    <div class="project-description">
                        <p>${project.description}</p>
                    </div>
                    
                    <div class="project-detailed-info">
                        <div class="info-section">
                            <h4>Requirements</h4>
                            ${this.formatProjectRequirements(project)}
                        </div>
                        
                        <div class="info-section">
                            <h4>Effects</h4>
                            ${this.formatProjectEffects(project.effects)}
                        </div>
                        
                        <div class="info-section">
                            <h4>Construction Details</h4>
                            ${this.formatConstructionDetails(project, isActive, isCompleted)}
                        </div>
                    </div>
                    
                    <div class="project-detailed-actions">
                        ${this.formatDetailedActions(project, isActive, isCompleted, isQueued)}
                    </div>
                </div>
            `;
        }
    }
    
    /**
     * Hide project details panel
     */
    hideProjectDetails() {
        this.selectedProject = null;
        const detailsPanel = document.getElementById('project-details-panel');
        if (detailsPanel) {
            detailsPanel.classList.add('hidden');
        }
    }
    
    /**
     * Format detailed action buttons
     */
    formatDetailedActions(project, isActive, isCompleted, isQueued) {
        if (isActive) {
            return `
                <button class="btn btn-danger" onclick="constructionUI.cancelConstruction('${project.id}')">
                    Cancel Construction
                </button>
                <button class="btn btn-secondary" onclick="constructionUI.hideProjectDetails()">
                    Close
                </button>
            `;
        } else if (isCompleted) {
            return `
                <button class="btn btn-secondary" onclick="constructionUI.hideProjectDetails()">
                    Close Details
                </button>
            `;
        } else if (isQueued) {
            return `
                <button class="btn btn-warning" onclick="constructionUI.removeFromQueue('${project.id}')">
                    Remove from Queue
                </button>
                <button class="btn btn-secondary" onclick="constructionUI.hideProjectDetails()">
                    Close
                </button>
            `;
        } else {
            const canBuild = this.canAffordProject(project) && this.meetsProjectRequirements(project);
            const queueFull = this.constructionQueue.length >= this.maxQueueSize;
            
            return `
                <button class="btn btn-primary ${canBuild && !queueFull ? '' : 'disabled'}" 
                        onclick="constructionUI.addToQueue('${project.id}')"
                        ${canBuild && !queueFull ? '' : 'disabled'}>
                    ${!canBuild ? 'Requirements Not Met' : 
                      queueFull ? 'Queue Full' : 'Add to Queue'}
                </button>
                <button class="btn btn-accent" onclick="constructionUI.startConstruction('${project.id}')"
                        ${canBuild ? '' : 'disabled'}>
                    Build Now
                </button>
                <button class="btn btn-secondary" onclick="constructionUI.hideProjectDetails()">
                    Close
                </button>
            `;
        }
    }
    
    /**
     * Format project requirements
     */
    formatProjectRequirements(project) {
        if (!project.requirements || Object.keys(project.requirements).length === 0) {
            return '<span class="no-requirements">No special requirements</span>';
        }
        
        let html = '';
        
        if (project.requirements.prerequisites) {
            html += `
                <div class="requirement-group">
                    <h5>Required Projects:</h5>
                    ${project.requirements.prerequisites.map(prereqId => {
                        const prereq = this.availableProjects.get(prereqId);
                        const completed = this.completedProjects.has(prereqId);
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
     * Format project effects
     */
    formatProjectEffects(effects) {
        if (!effects || Object.keys(effects).length === 0) {
            return '<span class="no-effects">No special effects</span>';
        }
        
        return Object.entries(effects).map(([effect, value]) => {
            return `
                <div class="effect-item">
                    <span class="effect-icon">${this.getEffectIcon(effect)}</span>
                    <span class="effect-description">${this.getEffectDescription(effect, value)}</span>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Format construction details
     */
    formatConstructionDetails(project, isActive, isCompleted) {
        if (isCompleted) {
            return `
                <div class="construction-completed">
                    <div class="completion-stat">
                        <span class="stat-icon">✓</span>
                        <span class="stat-text">Successfully constructed and operational</span>
                    </div>
                    <div class="completion-stat">
                        <span class="stat-icon">⚡</span>
                        <span class="stat-text">Effects are now active</span>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="construction-stats">
                <div class="stat">
                    <span class="stat-label">Build Time:</span>
                    <span class="stat-value">${this.formatTime(project.constructionTime)}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Category:</span>
                    <span class="stat-value">${this.formatCategory(project.category)}</span>
                </div>
                ${project.maxBuilt !== undefined ? `
                    <div class="stat">
                        <span class="stat-label">Build Limit:</span>
                        <span class="stat-value">${project.maxBuilt === Infinity ? 'Unlimited' : project.maxBuilt}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    /**
     * Update queue display
     */
    updateQueueDisplay() {
        if (!this.queueList || !this.queueCount) return;
        
        this.queueCount.textContent = this.constructionQueue.length;
        
        if (this.constructionQueue.length === 0) {
            this.queueList.innerHTML = `
                <div class="empty-queue">
                    <div class="empty-queue-icon">📋</div>
                    <div class="empty-queue-text">Construction queue is empty</div>
                    <div class="empty-queue-hint">Add projects to begin automated construction</div>
                </div>
            `;
            return;
        }
        
        const queueHTML = this.constructionQueue.map((queueItem, index) => {
            const project = this.availableProjects.get(queueItem.projectId);
            const projectName = project ? project.name : 'Unknown Project';
            const buildTime = project ? project.constructionTime : 0;
            const priority = queueItem.priority || 'normal';
            const priorityInfo = this.priorities.find(p => p.id === priority) || this.priorities[1];
            
            return `
                <div class="queue-item" data-project-id="${queueItem.projectId}">
                    <div class="queue-item-header">
                        <span class="queue-position">${index + 1}</span>
                        <span class="queue-project-name">${projectName}</span>
                        <span class="queue-priority" style="color: ${priorityInfo.color}">
                            ${priorityInfo.name}
                        </span>
                    </div>
                    <div class="queue-item-details">
                        <span class="queue-build-time">${this.formatTime(buildTime)}</span>
                        <div class="queue-item-actions">
                            <button class="btn btn-tiny btn-icon" onclick="constructionUI.moveQueueItem('${queueItem.projectId}', 'up')" 
                                    ${index === 0 ? 'disabled' : ''}>
                                <span class="icon">↑</span>
                            </button>
                            <button class="btn btn-tiny btn-icon" onclick="constructionUI.moveQueueItem('${queueItem.projectId}', 'down')" 
                                    ${index === this.constructionQueue.length - 1 ? 'disabled' : ''}>
                                <span class="icon">↓</span>
                            </button>
                            <button class="btn btn-tiny btn-danger" onclick="constructionUI.removeFromQueue('${queueItem.projectId}')">
                                <span class="icon">✕</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        this.queueList.innerHTML = queueHTML;
    }
    
    /**
     * Add project to construction queue
     */
    addToQueue(projectId) {
        const project = this.availableProjects.get(projectId);
        if (!project) {
            console.error('ConstructionUI: Project not found:', projectId);
            return;
        }
        
        // Check if can afford and meets requirements
        if (!this.canAffordProject(project) || !this.meetsProjectRequirements(project)) {
            if (window.uiManager) {
                window.uiManager.showNotification({
                    type: 'error',
                    title: 'Cannot Queue Project',
                    message: 'Requirements not met or insufficient resources.',
                    duration: 3000
                });
            }
            return;
        }
        
        // Emit queue addition event
        if (window.eventBus) {
            window.eventBus.emit('construction:add_to_queue', {
                projectId: projectId,
                project: project,
                priority: 'normal'
            });
        }
        
        console.log(`ConstructionUI: Added ${project.name} to queue`);
    }
    
    /**
     * Remove project from queue
     */
    removeFromQueue(projectId) {
        if (window.eventBus) {
            window.eventBus.emit('construction:remove_from_queue', {
                projectId: projectId
            });
        }
        
        console.log(`ConstructionUI: Removed project ${projectId} from queue`);
    }
    
    /**
     * Move queue item up or down
     */
    moveQueueItem(projectId, direction) {
        if (window.eventBus) {
            window.eventBus.emit('construction:move_queue_item', {
                projectId: projectId,
                direction: direction
            });
        }
    }
    
    /**
     * Start construction immediately
     */
    startConstruction(projectId) {
        const project = this.availableProjects.get(projectId);
        if (!project) {
            console.error('ConstructionUI: Project not found:', projectId);
            return;
        }
        
        if (window.eventBus) {
            window.eventBus.emit('construction:start_immediate', {
                projectId: projectId,
                project: project
            });
        }
        
        console.log(`ConstructionUI: Started immediate construction of ${project.name}`);
    }
    
    /**
     * Cancel active construction
     */
    cancelConstruction(projectId) {
        if (!this.activeConstructions.has(projectId)) {
            console.error('ConstructionUI: No active construction found for project:', projectId);
            return;
        }
        
        if (window.eventBus) {
            window.eventBus.emit('construction:cancel', {
                projectId: projectId
            });
        }
        
        console.log(`ConstructionUI: Cancelled construction of project ${projectId}`);
    }
    
    /**
     * Update active construction display
     */
    updateActiveConstruction() {
        if (!this.activeConstructionContent) return;
        
        if (this.activeConstructions.size === 0) {
            this.activeConstructionContent.innerHTML = `
                <div class="no-construction">
                    <div class="icon">🏗️</div>
                    <p>No active construction projects</p>
                </div>
            `;
            return;
        }
        
        const activeHTML = Array.from(this.activeConstructions.values()).map(construction => {
            const project = this.availableProjects.get(construction.projectId);
            const projectName = project ? project.name : 'Unknown Project';
            const progress = (construction.progress || 0) * 100;
            const timeRemaining = construction.timeRemaining || 0;
            
            return `
                <div class="active-construction-item">
                    <div class="construction-header">
                        <h4>${projectName}</h4>
                        <span class="construction-progress">${progress.toFixed(1)}%</span>
                    </div>
                    <div class="construction-progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="construction-details">
                        <span class="time-remaining">Time Remaining: ${this.formatTime(timeRemaining)}</span>
                        <button class="btn btn-danger btn-small" onclick="constructionUI.cancelConstruction('${construction.projectId}')">
                            Cancel
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        this.activeConstructionContent.innerHTML = activeHTML;
    }
    
    // UTILITY METHODS
    
    /**
     * Format time duration
     */
    formatTime(seconds) {
        if (!seconds || seconds <= 0) return '0s';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
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
     * Format resource name for display
     */
    formatResourceName(resource) {
        return resource.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    /**
     * Format category name for display
     */
    formatCategory(category) {
        return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    /**
     * Get icon for effect type
     */
    getEffectIcon(effect) {
        const icons = {
            production_bonus: '⚙️',
            research_speed: '🔬',
            energy_efficiency: '⚡',
            security_boost: '🛡️',
            heat_reduction: '❄️',
            storage_capacity: '📦',
            automation: '🤖',
            unlock_feature: '🔓'
        };
        
        return icons[effect] || '✨';
    }
    
    /**
     * Get description for effect
     */
    getEffectDescription(effect, value) {
        const descriptions = {
            production_bonus: `+${(value * 100).toFixed(0)}% production rate`,
            research_speed: `+${(value * 100).toFixed(0)}% research speed`,
            energy_efficiency: `${(value * 100).toFixed(0)}% less energy consumption`,
            security_boost: `+${value} security rating`,
            heat_reduction: `-${value} heat generation per hour`,
            storage_capacity: `+${this.formatNumber(value)} storage capacity`,
            automation: `Automates ${value} processes`,
            unlock_feature: `Unlocks ${value} feature`
        };
        
        return descriptions[effect] || `${effect}: ${value}`;
    }
    
    // EVENT HANDLERS
    
    /**
     * Update available projects
     */
    updateAvailableProjects(data) {
        if (data.projects) {
            this.availableProjects.clear();
            data.projects.forEach(project => {
                this.availableProjects.set(project.id, project);
            });
        }
        
        this.renderProjects();
        this.updateQueueDisplay();
        
        console.log(`ConstructionUI: Updated ${this.availableProjects.size} available projects`);
    }
    
    /**
     * Handle construction started event
     */
    updateConstructionStarted(data) {
        if (data.construction) {
            this.activeConstructions.set(data.projectId, data.construction);
        }
        
        this.updateActiveConstruction();
        this.renderProjects(); // Update project status
        
        // Show notification
        if (window.uiManager) {
            window.uiManager.showNotification({
                type: 'success',
                title: 'Construction Started',
                message: `${data.project?.name || 'Project'} construction has begun!`,
                duration: 3000
            });
        }
    }
    
    /**
     * Handle construction completed event
     */
    updateConstructionCompleted(data) {
        // Remove from active constructions
        if (this.activeConstructions.has(data.projectId)) {
            this.activeConstructions.delete(data.projectId);
        }
        
        // Add to completed projects
        if (data.project) {
            this.completedProjects.set(data.projectId, data.project);
        }
        
        this.updateActiveConstruction();
        this.renderProjects(); // Update project status
        
        // Show notification
        if (window.uiManager) {
            window.uiManager.showNotification({
                type: 'success',
                title: 'Construction Complete',
                message: `${data.project?.name || 'Project'} construction finished!`,
                duration: 5000
            });
        }
        
        // Close details if showing completed project
        if (this.selectedProject === data.projectId) {
            this.hideProjectDetails();
        }
    }
    
    /**
     * Handle construction progress update
     */
    updateConstructionProgress(data) {
        // Update active construction display
        this.updateActiveConstruction();
        
        // Update project details if showing active project
        if (this.selectedProject === data.projectId) {
            this.showProjectDetails(data.projectId);
        }
    }
    
    /**
     * Handle queue update
     */
    updateQueue(data) {
        if (data.queue) {
            this.constructionQueue = data.queue;
        }
        
        this.updateQueueDisplay();
        this.renderProjects(); // Update queue status indicators
    }
    
    /**
     * Handle resource updates
     */
    updateResourceDisplay(resources) {
        this.playerResources = resources;
        
        // Update affordability indicators
        this.renderProjects();
        
        // Update project details if open
        if (this.selectedProject) {
            this.showProjectDetails(this.selectedProject);
        }
    }
    
    /**
     * Cleanup and destroy
     */
    destroy() {
        this.availableProjects.clear();
        this.activeConstructions.clear();
        this.completedProjects.clear();
        this.constructionQueue = [];
        
        console.log('ConstructionUI: Destroyed');
    }
}

// Create and register with UI manager
const constructionUI = new ConstructionUI();

if (window.uiManager) {
    window.uiManager.registerModule('constructionUI', constructionUI);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConstructionUI;
}