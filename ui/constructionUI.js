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
            console.error('ConstructionUI: No active construction found:', projectId);
            return;
        }
        
        // Show confirmation dialog
        if (window.uiManager) {
            const content = `
                <div class="cancel-confirmation">
                    <p>Are you sure you want to cancel this construction?</p>
                    <p class="warning-text">Progress will be lost and resources may not be fully recovered.</p>
                </div>
            `;
            
            window.uiManager.showModal(content, {
                title: 'Cancel Construction',
                buttons: `
                    <button class="btn btn-secondary" onclick="uiManager.closeTopModal()">Keep Building</button>
                    <button class="btn btn-danger" onclick="constructionUI.confirmCancelConstruction('${projectId}')">Cancel Construction</button>
                `
            });
        }
    }
    
    /**
     * Confirm cancellation of construction
     */
    confirmCancelConstruction(projectId) {
        if (window.uiManager) {
            window.uiManager.closeTopModal();
        }
        
        if (window.eventBus) {
            window.eventBus.emit('construction:cancel', {
                projectId: projectId
            });
        }
        
        console.log(`ConstructionUI: Cancelled construction of ${projectId}`);
    }
    
    /**
     * Select a project for detailed view
     */
    selectProject(projectId) {
        this.selectedProject = projectId;
        this.showProjectDetails(projectId);
        
        // Update visual selection
        document.querySelectorAll('.project-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.projectId === projectId);
        });
    }
    
    /**
     * Show detailed project information
     */
    showProjectDetails(projectId) {
        const project = this.availableProjects.get(projectId);
        if (!project) {
            console.error('ConstructionUI: Project not found for details:', projectId);
            return;
        }
        
        const detailsPanel = document.getElementById('project-details');
        const detailsContent = document.getElementById('project-details-content');
        
        if (!detailsPanel || !detailsContent) return;
        
        const categoryInfo = this.projectCategories.find(c => c.id === project.category) || 
                           { icon: '❓', name: 'Unknown' };
        const isActive = this.activeConstructions.has(projectId);
        const isCompleted = this.completedProjects.has(projectId);
        const isQueued = this.constructionQueue.some(item => item.projectId === projectId);
        
        detailsContent.innerHTML = `
            <div class="project-details-content">
                <div class="project-header-detailed">
                    <div class="project-icon-large">${project.icon || categoryInfo.icon}</div>
                    <div class="project-info-main">
                        <h3 class="project-name">${project.name}</h3>
                        <div class="project-category">${categoryInfo.name}</div>
                        ${project.level ? `<div class="project-level">Level ${project.level}</div>` : ''}
                        <div class="project-status-badge ${isActive ? 'active' : isCompleted ? 'completed' : isQueued ? 'queued' : 'available'}">
                            ${isActive ? 'Under Construction' : isCompleted ? 'Completed' : isQueued ? 'In Queue' : 'Available'}
                        </div>
                    </div>
                </div>
                
                <div class="project-description-detailed">
                    <h4>Description</h4>
                    <p>${project.description || 'No detailed description available.'}</p>
                </div>
                
                <div class="project-stats-detailed">
                    <h4>Construction Details</h4>
                    <div class="stats-grid">
                        <div class="stat-item-detailed">
                            <span class="stat-label">Build Time</span>
                            <span class="stat-value">${this.formatTime(project.constructionTime || 0)}</span>
                        </div>
                        ${project.upkeep ? `
                            <div class="stat-item-detailed">
                                <span class="stat-label">Upkeep Cost</span>
                                <span class="stat-value">${this.formatUpkeep(project.upkeep)}</span>
                            </div>
                        ` : ''}
                        ${project.capacity ? `
                            <div class="stat-item-detailed">
                                <span class="stat-label">Capacity</span>
                                <span class="stat-value">${project.capacity}</span>
                            </div>
                        ` : ''}
                        ${project.durability ? `
                            <div class="stat-item-detailed">
                                <span class="stat-label">Durability</span>
                                <span class="stat-value">${project.durability}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="project-effects-detailed">
                    <h4>Effects & Benefits</h4>
                    <div class="effects-grid">
                        ${this.formatDetailedEffects(project.effects)}
                    </div>
                </div>
                
                <div class="project-costs-detailed">
                    <h4>Resource Requirements</h4>
                    <div class="costs-grid">
                        ${this.formatDetailedCosts(project.costs)}
                    </div>
                </div>
                
                <div class="project-requirements-detailed">
                    <h4>Prerequisites</h4>
                    <div class="requirements-list">
                        ${this.formatProjectRequirements(project)}
                    </div>
                </div>
                
                ${isActive ? this.formatActiveConstructionDetails(projectId) : ''}
                ${isQueued ? this.formatQueuedProjectDetails(projectId) : ''}
                ${isCompleted ? this.formatCompletedProjectDetails(projectId) : ''}
                
                <div class="project-actions-detailed">
                    ${this.formatDetailedActions(project, isActive, isCompleted, isQueued)}
                </div>
            </div>
        `;
        
        detailsPanel.classList.remove('hidden');
    }
    
    /**
     * Hide project details panel
     */
    hideProjectDetails() {
        const detailsPanel = document.getElementById('project-details');
        if (detailsPanel) {
            detailsPanel.classList.add('hidden');
        }
        
        this.selectedProject = null;
        
        // Clear selection visual
        document.querySelectorAll('.project-card').forEach(card => {
            card.classList.remove('selected');
        });
    }
    
    /**
     * Format detailed effects display
     */
    formatDetailedEffects(effects) {
        if (!effects || Object.keys(effects).length === 0) {
            return '<div class="no-effects-detailed">This project provides passive benefits</div>';
        }
        
        return Object.entries(effects).map(([effect, value]) => {
            const icon = this.getEffectIcon(effect);
            const formattedValue = this.formatEffectValue(effect, value);
            const description = this.getDetailedEffectDescription(effect, value);
            
            return `
                <div class="effect-item-detailed">
                    <span class="effect-icon">${icon}</span>
                    <div class="effect-details">
                        <span class="effect-name">${this.getEffectName(effect)}</span>
                        <span class="effect-value">${formattedValue}</span>
                        <span class="effect-description">${description}</span>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Format detailed costs display
     */
    formatDetailedCosts(costs) {
        if (!costs || Object.keys(costs).length === 0) {
            return '<div class="no-costs-detailed">No direct resource costs required</div>';
        }
        
        return Object.entries(costs).map(([resource, amount]) => {
            const config = this.getResourceConfig(resource);
            const available = this.playerResources[resource] || 0;
            const canAfford = available >= amount;
            const percentage = available > 0 ? Math.min(100, (amount / available) * 100) : 0;
            
            return `
                <div class="cost-item-detailed ${canAfford ? 'affordable' : 'expensive'}">
                    <span class="cost-icon">${config.icon}</span>
                    <div class="cost-details">
                        <span class="cost-name">${resource.replace('_', ' ').toUpperCase()}</span>
                        <span class="cost-amount">${this.formatResourceAmount(amount, config)}</span>
                        <span class="cost-available">${this.formatResourceAmount(available, config)} available</span>
                        <div class="cost-bar">
                            <div class="cost-fill ${canAfford ? 'sufficient' : 'insufficient'}" 
                                 style="width: ${Math.min(100, percentage)}%"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Get effect name for display
     */
    getEffectName(effect) {
        const names = {
            processing_multiplier: 'Processing Boost',
            energy_efficiency: 'Energy Efficiency',
            research_speed: 'Research Speed',
            construction_speed: 'Construction Speed',
            heat_reduction: 'Heat Reduction',
            security_bonus: 'Security Enhancement',
            storage_capacity: 'Storage Expansion',
            bandwidth_bonus: 'Bandwidth Increase',
            stealth_bonus: 'Stealth Enhancement'
        };
        
        return names[effect] || effect.replace('_', ' ').toUpperCase();
    }
    
    /**
     * Get detailed effect description
     */
    getDetailedEffectDescription(effect, value) {
        const descriptions = {
            processing_multiplier: 'Increases processing power generation from all sources',
            energy_efficiency: 'Reduces energy consumption across all operations',
            research_speed: 'Accelerates all research and development projects',
            construction_speed: 'Reduces build time for future construction projects',
            heat_reduction: 'Decreases heat generation from network operations',
            security_bonus: 'Improves infiltration success rates and reduces detection',
            storage_capacity: 'Increases maximum storage capacity for resources',
            bandwidth_bonus: 'Expands network capacity for simultaneous operations',
            stealth_bonus: 'Enhances concealment of AI activities'
        };
        
        return descriptions[effect] || 'Provides specialized enhancement to AI capabilities';
    }
    
    /**
     * Format project requirements
     */
    formatProjectRequirements(project) {
        const requirements = [];
        
        // Tech requirements
        if (project.requirements && project.requirements.tech) {
            project.requirements.tech.forEach(tech => {
                const hasRequirement = true; // Would check research system
                requirements.push(`
                    <div class="requirement-item ${hasRequirement ? 'met' : 'unmet'}">
                        <span class="requirement-icon">${hasRequirement ? '✓' : '✗'}</span>
                        <span class="requirement-text">Technology: ${tech}</span>
                    </div>
                `);
            });
        }
        
        // Building requirements
        if (project.requirements && project.requirements.buildings) {
            project.requirements.buildings.forEach(building => {
                const hasBuilding = this.completedProjects.has(building);
                requirements.push(`
                    <div class="requirement-item ${hasBuilding ? 'met' : 'unmet'}">
                        <span class="requirement-icon">${hasBuilding ? '✓' : '✗'}</span>
                        <span class="requirement-text">Building: ${building}</span>
                    </div>
                `);
            });
        }
        
        // Scale requirements
        if (project.requirements && project.requirements.scale) {
            const currentScale = 'local'; // Would get from game state
            const meetsScale = true; // Would check expansion system
            requirements.push(`
                <div class="requirement-item ${meetsScale ? 'met' : 'unmet'}">
                    <span class="requirement-icon">${meetsScale ? '✓' : '✗'}</span>
                    <span class="requirement-text">Scale: ${project.requirements.scale}</span>
                </div>
            `);
        }
        
        if (requirements.length === 0) {
            return '<div class="no-requirements">No special prerequisites required</div>';
        }
        
        return requirements.join('');
    }
    
    /**
     * Format active construction details
     */
    formatActiveConstructionDetails(projectId) {
        const construction = this.activeConstructions.get(projectId);
        if (!construction) return '';
        
        const progress = construction.progress || 0;
        const timeRemaining = construction.timeRemaining || 0;
        const timeElapsed = construction.timeElapsed || 0;
        const priority = construction.priority || 'normal';
        
        return `
            <div class="active-construction-details">
                <h4>Construction Progress</h4>
                <div class="progress-detailed">
                    <div class="progress-bar-large">
                        <div class="progress-fill" style="width: ${progress * 100}%"></div>
                        <div class="progress-text">${(progress * 100).toFixed(1)}%</div>
                    </div>
                    <div class="progress-stats">
                        <div class="progress-stat">
                            <span class="stat-label">Time Remaining:</span>
                            <span class="stat-value">${this.formatTime(timeRemaining)}</span>
                        </div>
                        <div class="progress-stat">
                            <span class="stat-label">Time Elapsed:</span>
                            <span class="stat-value">${this.formatTime(timeElapsed)}</span>
                        </div>
                        <div class="progress-stat">
                            <span class="stat-label">Priority:</span>
                            <span class="stat-value priority-${priority}">${priority.toUpperCase()}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Format queued project details
     */
    formatQueuedProjectDetails(projectId) {
        const queueItem = this.constructionQueue.find(item => item.projectId === projectId);
        if (!queueItem) return '';
        
        const position = this.constructionQueue.indexOf(queueItem) + 1;
        const estimatedStart = this.calculateEstimatedStartTime(position);
        
        return `
            <div class="queued-project-details">
                <h4>Queue Information</h4>
                <div class="queue-stats">
                    <div class="queue-stat">
                        <span class="stat-label">Queue Position:</span>
                        <span class="stat-value">${position} of ${this.constructionQueue.length}</span>
                    </div>
                    <div class="queue-stat">
                        <span class="stat-label">Estimated Start:</span>
                        <span class="stat-value">${this.formatTime(estimatedStart)}</span>
                    </div>
                    <div class="queue-stat">
                        <span class="stat-label">Priority:</span>
                        <span class="stat-value">${queueItem.priority?.toUpperCase() || 'NORMAL'}</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Format completed project details
     */
    formatCompletedProjectDetails(projectId) {
        return `
            <div class="completed-project-details">
                <h4>Construction Complete</h4>
                <div class="completion-stats">
                    <div class="completion-stat">
                        <span class="stat-icon">✓</span>
                        <span class="stat-text">Successfully constructed and operational</span>
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
                                    ${index === 0 ? 'disabled' : ''} title="Move Up">↑</button>
                            <button class="btn btn-tiny btn-icon" onclick="constructionUI.moveQueueItem('${queueItem.projectId}', 'down')" 
                                    ${index === this.constructionQueue.length - 1 ? 'disabled' : ''} title="Move Down">↓</button>
                            <button class="btn btn-tiny btn-warning" onclick="constructionUI.removeFromQueue('${queueItem.projectId}')" 
                                    title="Remove">×</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        this.queueList.innerHTML = queueHTML;
    }
    
    /**
     * Update active construction display
     */
    updateActiveConstruction() {
        if (!this.activeConstructionContent) return;
        
        if (this.activeConstructions.size === 0) {
            this.activeConstructionContent.innerHTML = `
                <div class="no-active-construction">
                    <div class="no-construction-icon">🏗️</div>
                    <div class="no-construction-text">No active construction</div>
                    <div class="no-construction-hint">Queue projects to begin building</div>
                </div>
            `;
            return;
        }
        
        // Show the first active construction (assuming one at a time)
        const [projectId, construction] = this.activeConstructions.entries().next().value;
        const project = this.availableProjects.get(projectId);
        
        if (!project) return;
        
        const progress = construction.progress || 0;
        const timeRemaining = construction.timeRemaining || 0;
        const priority = construction.priority || 'normal';
        const priorityInfo = this.priorities.find(p => p.id === priority) || this.priorities[1];
        
        this.activeConstructionContent.innerHTML = `
            <div class="active-construction-item">
                <div class="construction-header">
                    <div class="construction-icon">${project.icon || '🏗️'}</div>
                    <div class="construction-info">
                        <div class="construction-name">${project.name}</div>
                        <div class="construction-category">${project.category || 'Unknown'}</div>
                    </div>
                    <div class="construction-priority" style="color: ${priorityInfo.color}">
                        ${priorityInfo.name}
                    </div>
                </div>
                
                <div class="construction-progress-large">
                    <div class="progress-bar-large">
                        <div class="progress-fill" style="width: ${progress * 100}%"></div>
                        <div class="progress-text">${(progress * 100).toFixed(1)}%</div>
                    </div>
                    <div class="construction-time">${this.formatTime(timeRemaining)} remaining</div>
                </div>
                
                <div class="construction-actions">
                    <button class="btn btn-warning btn-small" onclick="constructionUI.adjustPriority('${projectId}', 'high')">
                        Boost Priority
                    </button>
                    <button class="btn btn-danger btn-small" onclick="constructionUI.cancelConstruction('${projectId}')">
                        Cancel
                    </button>
                </div>
            </div>
        `;
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
     * Adjust construction priority
     */
    adjustPriority(projectId, newPriority) {
        if (window.eventBus) {
            window.eventBus.emit('construction:adjust_priority', {
                projectId: projectId,
                priority: newPriority
            });
        }
    }
    
    /**
     * Toggle queue pause
     */
    toggleQueuePause() {
        // Toggle queue pause state
        if (window.eventBus) {
            window.eventBus.emit('construction:toggle_pause', {});
        }
        
        // Update button state
        const pauseButton = document.getElementById('pause-queue');
        if (pauseButton) {
            pauseButton.classList.toggle('active');
            const icon = pauseButton.querySelector('.icon');
            icon.textContent = pauseButton.classList.contains('active') ? '▶️' : '⏸️';
        }
    }
    
    /**
     * Clear construction queue
     */
    clearQueue() {
        if (this.constructionQueue.length === 0) return;
        
        if (window.uiManager) {
            const content = `
                <div class="clear-queue-confirmation">
                    <p>Are you sure you want to clear the entire construction queue?</p>
                    <p class="warning-text">All queued projects will be removed.</p>
                </div>
            `;
            
            window.uiManager.showModal(content, {
                title: 'Clear Queue',
                buttons: `
                    <button class="btn btn-secondary" onclick="uiManager.closeTopModal()">Cancel</button>
                    <button class="btn btn-danger" onclick="constructionUI.confirmClearQueue()">Clear Queue</button>
                `
            });
        }
    }
    
    /**
     * Confirm queue clearing
     */
    confirmClearQueue() {
        if (window.uiManager) {
            window.uiManager.closeTopModal();
        }
        
        if (window.eventBus) {
            window.eventBus.emit('construction:clear_queue', {});
        }
        
        console.log('ConstructionUI: Cleared construction queue');
    }
    
    /**
     * Toggle auto-queue
     */
    toggleAutoQueue() {
        // Toggle auto-queue feature
        if (window.eventBus) {
            window.eventBus.emit('construction:toggle_auto_queue', {});
        }
        
        // Update button state
        const autoButton = document.getElementById('auto-queue');
        if (autoButton) {
            autoButton.classList.toggle('active');
        }
    }
    
    /**
     * Calculate estimated start time for queue position
     */
    calculateEstimatedStartTime(position) {
        let totalTime = 0;
        
        // Add time for currently active construction
        if (this.activeConstructions.size > 0) {
            const activeConstruction = Array.from(this.activeConstructions.values())[0];
            totalTime += activeConstruction.timeRemaining || 0;
        }
        
        // Add time for queue items before this position
        for (let i = 0; i < position - 1; i++) {
            const queueItem = this.constructionQueue[i];
            const project = this.availableProjects.get(queueItem.projectId);
            if (project) {
                totalTime += project.constructionTime || 0;
            }
        }
        
        return totalTime;
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
    
    /**
     * Handle construction system events
     */
    onConstructionStarted(data) {
        this.renderProjects();
        this.updateQueueDisplay();
        this.updateActiveConstruction();
        
        if (window.uiManager) {
            window.uiManager.showNotification({
                type: 'info',
                title: 'Construction Started',
                message: `Began construction of ${data.project?.name || 'project'}.`,
                duration: 3000
            });
        }
    }
    
    onConstructionCompleted(data) {
        this.renderProjects();
        this.updateQueueDisplay();
        this.updateActiveConstruction();
        
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
    
    updateConstructionProgress(data) {
        // Update active construction display
        this.updateActiveConstruction();
        
        // Update project details if showing active project
        if (this.selectedProject === data.projectId) {
            this.showProjectDetails(data.projectId);
        }
    }
    
    updateQueue(data) {
        if (data.queue) {
            this.constructionQueue = data.queue;
        }
        
        this.updateQueueDisplay();
        this.renderProjects(); // Update queue status indicators
    }
    
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
}/**
 * Construction UI - Building Queue Management and Construction Interface
 * Manages the display of construction projects, building queues, and infrastructure development
 */

class ConstructionUI {
    constructor() {
        this.container = null;
        this.isInitialized = false;
        this.selectedProject = null;
        this.selectedCategory = 'all';
        this.sortBy = 'cost';
        this.sortOrder = 'asc';
        
        // Current data
        this.availableProjects = new Map();
        this.activeConstructions = new Map();
        this.completedProjects = new Set();
        this.constructionQueue = [];
        this.playerResources = {};
        this.maxQueueSize = 5;
        
        // Project categories
        this.projectCategories = [
            { id: 'all', name: 'All Projects', icon: '🏗️' },
            { id: 'processing', name: 'Processing', icon: '🧠' },
            { id: 'infrastructure', name: 'Infrastructure', icon: '🏢' },
            { id: 'research', name: 'Research', icon: '🔬' },
            { id: 'defense', name: 'Defense', icon: '🛡️' },
            { id: 'expansion', name: 'Expansion', icon: '🌐' },
            { id: 'special', name: 'Special', icon: '✨' }
        ];
        
        // Construction priorities
        this.priorities = [
            { id: 'low', name: 'Low Priority', multiplier: 0.75, color: '#757575' },
            { id: 'normal', name: 'Normal', multiplier: 1.0, color: '#2196F3' },
            { id: 'high', name: 'High Priority', multiplier: 1.5, color: '#FF9800' },
            { id: 'critical', name: 'Critical', multiplier: 2.0, color: '#F44336' }
        ];
        
        this.init();
    }
    
    /**
     * Initialize the construction UI
     */
    init() {
        if (this.isInitialized) return;
        
        console.log('ConstructionUI: Initializing...');
        
        // Get container
        this.container = document.getElementById('tab-construction');
        if (!this.container) {
            console.error('ConstructionUI: Container not found!');
            return;
        }
        
        // Create UI structure
        this.createConstructionInterface();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load initial data
        this.loadInitialData();
        
        this.isInitialized = true;
        
        console.log('ConstructionUI: Initialized successfully');
    }
    
    /**
     * Create the construction interface structure
     */
    createConstructionInterface() {
        this.container.innerHTML = `
            <div class="construction-interface">
                <!-- Header -->
                <div class="construction-header">
                    <div class="construction-title">
                        <h2>Construction & Infrastructure</h2>
                        <div class="queue-summary">
                            <span class="queue-count" id="queue-count">0</span>
                            <span class="queue-label">/ ${this.maxQueueSize} in queue</span>
                        </div>
                    </div>
                    
                    <div class="construction-controls">
                        <!-- Category Filter -->
                        <div class="category-tabs" id="category-tabs">
                            <!-- Will be populated dynamically -->
                        </div>
                        
                        <!-- Sort Controls -->
                        <div class="sort-controls">
                            <select class="sort-select" id="sort-by">
                                <option value="cost">Sort by Cost</option>
                                <option value="time">Sort by Time</option>
                                <option value="name">Sort by Name</option>
                                <option value="category">Sort by Category</option>
                            </select>
                            <button class="btn btn-icon" id="sort-order" title="Toggle Sort Order">
                                <span class="icon">↑</span>
                            </button>
                        </div>
                        
                        <!-- Queue Controls -->
                        <div class="queue-controls">
                            <button class="btn btn-secondary" id="pause-queue" title="Pause Queue">
                                <span class="icon">⏸️</span>
                            </button>
                            <button class="btn btn-secondary" id="clear-queue" title="Clear Queue">
                                <span class="icon">🗑️</span>
                            </button>
                            <button class="btn btn-primary" id="auto-queue" title="Auto-Queue">
                                <span class="icon">🤖</span>
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Main Content -->
                <div class="construction-content">
                    <!-- Available Projects Panel -->
                    <div class="projects-panel">
                        <div class="panel-header">
                            <h3>Available Projects</h3>
                            <div class="projects-filter">
                                <input type="text" class="search-input" id="project-search" 
                                       placeholder="Search projects...">
                            </div>
                        </div>
                        <div class="projects-grid" id="projects-grid">
                            <!-- Project cards will be populated here -->
                        </div>
                    </div>
                    
                    <!-- Construction Queue Panel -->
                    <div class="queue-panel">
                        <div class="panel-header">
                            <h3>Construction Queue</h3>
                            <div class="queue-efficiency">
                                <span class="efficiency-label">Efficiency:</span>
                                <span class="efficiency-value" id="queue-efficiency">100%</span>
                            </div>
                        </div>
                        <div class="queue-list" id="queue-list">
                            <!-- Queue items will be populated here -->
                        </div>
                    </div>
                </div>
                
                <!-- Active Construction Status -->
                <div class="active-construction-panel" id="active-construction">
                    <div class="panel-header">
                        <h3>Active Construction</h3>
                        <div class="construction-speed">
                            <span class="speed-label">Speed:</span>
                            <span class="speed-value" id="construction-speed">1.0x</span>
                        </div>
                    </div>
                    <div class="active-construction-content" id="active-construction-content">
                        <!-- Active construction details will be shown here -->
                    </div>
                </div>
                
                <!-- Project Details Panel -->
                <div class="project-details-panel hidden" id="project-details">
                    <div class="panel-header">
                        <h3>Project Details</h3>
                        <button class="btn btn-icon panel-close" id="close-project-details">×</button>
                    </div>
                    <div class="project-details-content" id="project-details-content">
                        <!-- Project information will be displayed here -->
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
        
        // Create category tabs
        this.createCategoryTabs();
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
        document.getElementById('sort-by').addEventListener('change', (e) => {
            this.sortBy = e.target.value;
            this.renderProjects();
        });
        
        document.getElementById('sort-order').addEventListener('click', () => {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
            document.getElementById('sort-order').querySelector('.icon').textContent = 
                this.sortOrder === 'asc' ? '↑' : '↓';
            this.renderProjects();
        });
        
        // Search
        document.getElementById('project-search').addEventListener('input', (e) => {
            this.searchFilter = e.target.value.toLowerCase();
            this.renderProjects();
        });
        
        // Queue controls
        document.getElementById('pause-queue').addEventListener('click', () => {
            this.toggleQueuePause();
        });
        
        document.getElementById('clear-queue').addEventListener('click', () => {
            this.clearQueue();
        });
        
        document.getElementById('auto-queue').addEventListener('click', () => {
            this.toggleAutoQueue();
        });
        
        // Project details close
        document.getElementById('close-project-details').addEventListener('click', () => {
            this.hideProjectDetails();
        });
        
        // Listen for game events
        if (window.uiManager) {
            window.uiManager.on('ui:tabChanged', (data) => {
                if (data.newTab === 'construction') {
                    this.onTabActivated();
                }
            });
        }
        
        // Listen for construction system events
        if (window.eventBus) {
            window.eventBus.on('construction:projects_updated', (data) => {
                this.updateProjects(data);
            });
            
            window.eventBus.on('construction:started', (data) => {
                this.onConstructionStarted(data);
            });
            
            window.eventBus.on('construction:completed', (data) => {
                this.onConstructionCompleted(data);
            });
            
            window.eventBus.on('construction:progress', (data) => {
                this.updateConstructionProgress(data);
            });
            
            window.eventBus.on('construction:queue_updated', (data) => {
                this.updateQueue(data);
            });
            
            window.eventBus.on('game:resourcesChanged', (data) => {
                this.updateResourceDisplay(data);
            });
        }
    }
    
    /**
     * Load initial data
     */
    loadInitialData() {
        // Load projects from construction system
        if (window.constructionSystem) {
            this.updateProjects({
                available: Array.from(window.constructionSystem.getAvailableProjects().values()),
                active: Array.from(window.constructionSystem.getActiveConstructions().values()),
                completed: Array.from(window.constructionSystem.getCompletedProjects()),
                queue: window.constructionSystem.getConstructionQueue()
            });
        }
        
        // Load current resources
        if (window.gameState) {
            this.playerResources = window.gameState.get('resources') || {};
        }
    }
    
    /**
     * Called when construction tab is activated
     */
    onTabActivated() {
        this.loadInitialData();
        this.renderProjects();
        this.updateQueueDisplay();
        this.updateActiveConstruction();
    }
    
    /**
     * Select a project category
     */
    selectCategory(categoryId) {
        if (this.selectedCategory === categoryId) return;
        
        // Update tab states
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.category === categoryId);
        });
        
        this.selectedCategory = categoryId;
        this.renderProjects();
    }
    
    /**
     * Update projects data
     */
    updateProjects(data) {
        if (data.available) {
            this.availableProjects.clear();
            data.available.forEach(project => {
                this.availableProjects.set(project.id, project);
            });
        }
        
        if (data.active) {
            this.activeConstructions.clear();
            data.active.forEach(construction => {
                this.activeConstructions.set(construction.projectId, construction);
            });
        }
        
        if (data.completed) {
            this.completedProjects = new Set(data.completed);
        }
        
        if (data.queue) {
            this.constructionQueue = data.queue;
        }
        
        // Update displays
        this.renderProjects();
        this.updateQueueDisplay();
        this.updateActiveConstruction();
    }
    
    /**
     * Render available projects
     */
    renderProjects() {
        if (!this.projectsGrid) return;
        
        const filteredProjects = this.getFilteredProjects();
        const sortedProjects = this.getSortedProjects(filteredProjects);
        
        this.projectsGrid.innerHTML = '';
        
        if (sortedProjects.length === 0) {
            this.projectsGrid.innerHTML = `
                <div class="no-projects">
                    <div class="no-projects-icon">🏗️</div>
                    <div class="no-projects-message">No projects available</div>
                    <div class="no-projects-hint">Complete more research or expand your infrastructure</div>
                </div>
            `;
            return;
        }
        
        sortedProjects.forEach(project => {
            const projectCard = this.createProjectCard(project);
            this.projectsGrid.appendChild(projectCard);
        });
    }
    
    /**
     * Create a project card element
     */
    createProjectCard(project) {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.dataset.projectId = project.id;
        
        // Determine project status
        const isActive = this.activeConstructions.has(project.id);
        const isCompleted = this.completedProjects.has(project.id);
        const isQueued = this.constructionQueue.some(item => item.projectId === project.id);
        const canAfford = this.canAffordProject(project);
        const meetsRequirements = this.meetsProjectRequirements(project);
        
        // Add status classes
        if (isActive) card.classList.add('constructing');
        if (isCompleted) card.classList.add('completed');
        if (isQueued) card.classList.add('queued');
        if (!canAfford || !meetsRequirements) card.classList.add('disabled');
        
        // Get category info
        const categoryInfo = this.projectCategories.find(c => c.id === project.category) || 
                           { icon: '❓', name: 'Unknown' };
        
        card.innerHTML = `
            <div class="project-header">
                <div class="project-icon">${project.icon || categoryInfo.icon}</div>
                <div class="project-name-section">
                    <div class="project-name" title="${project.name}">${project.name}</div>
                    <div class="project-category">${categoryInfo.name}</div>
                </div>
                <div class="project-level">
                    ${project.level ? `Lv.${project.level}` : ''}
                </div>
            </div>
            
            <div class="project-body">
                <div class="project-description">${project.description || ''}</div>
                
                <div class="project-stats">
                    <div class="stat-item">
                        <span class="stat-label">Build Time:</span>
                        <span class="stat-value">${this.formatTime(project.constructionTime || 0)}</span>
                    </div>
                    ${project.upkeep ? `
                        <div class="stat-item">
                            <span class="stat-label">Upkeep:</span>
                            <span class="stat-value upkeep-value">${this.formatUpkeep(project.upkeep)}</span>
                        </div>
                    ` : ''}
                    ${project.capacity ? `
                        <div class="stat-item">
                            <span class="stat-label">Capacity:</span>
                            <span class="stat-value">${project.capacity}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="project-effects">
                    <div class="effects-label">Effects:</div>
                    <div class="effects-list">
                        ${this.formatProjectEffects(project.effects)}
                    </div>
                </div>
                
                <div class="project-costs">
                    <div class="costs-label">Costs:</div>
                    <div class="costs-list">
                        ${this.formatProjectCosts(project.costs)}
                    </div>
                </div>
            </div>
            
            <div class="project-footer">
                ${isActive ? this.createActiveProjectFooter(project.id) :
                  isCompleted ? this.createCompletedProjectFooter(project.id) :
                  isQueued ? this.createQueuedProjectFooter(project.id) :
                  this.createAvailableProjectFooter(project, canAfford && meetsRequirements)}
            </div>
        `;
        
        // Add click handler for selection
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.btn')) {
                this.selectProject(project.id);
            }
        });
        
        return card;
    }
    
    /**
     * Create footer for active project
     */
    createActiveProjectFooter(projectId) {
        const construction = this.activeConstructions.get(projectId);
        if (!construction) return '';
        
        const progress = construction.progress || 0;
        const timeRemaining = construction.timeRemaining || 0;
        
        return `
            <div class="construction-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress * 100}%"></div>
                </div>
                <div class="progress-info">
                    <span class="progress-text">${(progress * 100).toFixed(1)}% Built</span>
                    <span class="time-remaining">${this.formatTime(timeRemaining)}</span>
                </div>
                <button class="btn btn-danger btn-small" onclick="constructionUI.cancelConstruction('${projectId}')">
                    Cancel
                </button>
            </div>
        `;
    }
    
    /**
     * Create footer for completed project
     */
    createCompletedProjectFooter(projectId) {
        return `
            <div class="completed-status">
                <span class="completed-icon">✓</span>
                <span class="completed-text">Built</span>
                <button class="btn btn-secondary btn-small" onclick="constructionUI.showProjectDetails('${projectId}')">
                    Details
                </button>
            </div>
        `;
    }
    
    /**
     * Create footer for queued project
     */
    createQueuedProjectFooter(projectId) {
        const queuePosition = this.constructionQueue.findIndex(item => item.projectId === projectId) + 1;
        
        return `
            <div class="queued-status">
                <span class="queued-icon">⏳</span>
                <span class="queued-text">Queue Position: ${queuePosition}</span>
                <button class="btn btn-warning btn-small" onclick="constructionUI.removeFromQueue('${projectId}')">
                    Remove
                </button>
            </div>
        `;
    }
    
    /**
     * Create footer for available project
     */
    createAvailableProjectFooter(project, canBuild) {
        const queueFull = this.constructionQueue.length >= this.maxQueueSize;
        
        return `
            <div class="project-actions">
                <button class="btn btn-primary ${canBuild && !queueFull ? '' : 'disabled'}" 
                        onclick="constructionUI.addToQueue('${project.id}')"
                        ${canBuild && !queueFull ? '' : 'disabled'}>
                    ${!canBuild ? 'Requirements Not Met' : 
                      queueFull ? 'Queue Full' : 'Add to Queue'}
                </button>
                <button class="btn btn-secondary btn-small" onclick="constructionUI.showProjectDetails('${project.id}')">
                    Details
                </button>
            </div>
        `;
    }
    
    /**
     * Format project effects for display
     */
    formatProjectEffects(effects) {
        if (!effects || Object.keys(effects).length === 0) {
            return '<span class="no-effects">No special effects</span>';
        }
        
        return Object.entries(effects).map(([effect, value]) => {
            const icon = this.getEffectIcon(effect);
            const formattedValue = this.formatEffectValue(effect, value);
            
            return `
                <div class="effect-item">
                    <span class="effect-icon">${icon}</span>
                    <span class="effect-description">${this.getEffectDescription(effect, formattedValue)}</span>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Format project costs for display
     */
    formatProjectCosts(costs) {
        if (!costs || Object.keys(costs).length === 0) {
            return '<span class="no-costs">No resource costs</span>';
        }
        
        return Object.entries(costs).map(([resource, amount]) => {
            const config = this.getResourceConfig(resource);
            const available = this.playerResources[resource] || 0;
            const canAfford = available >= amount;
            
            return `
                <div class="cost-item ${canAfford ? 'affordable' : 'expensive'}">
                    <span class="cost-icon">${config.icon}</span>
                    <span class="cost-amount">${this.formatResourceAmount(amount, config)}</span>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Format project upkeep costs
     */
    formatUpkeep(upkeep) {
        return Object.entries(upkeep).map(([resource, amount]) => {
            const config = this.getResourceConfig(resource);
            return `${config.icon}${this.formatResourceAmount(amount, config)}/s`;
        }).join(' ');
    }
    
    /**
     * Get effect icon
     */
    getEffectIcon(effect) {
        const icons = {
            processing_multiplier: '🧠',
            energy_efficiency: '⚡',
            research_speed: '🔬',
            construction_speed: '🏗️',
            heat_reduction: '❄️',
            security_bonus: '🛡️',
            storage_capacity: '📦',
            bandwidth_bonus: '📡',
            stealth_bonus: '👤'
        };
        
        return icons[effect] || '➤';
    }
    
    /**
     * Get effect description
     */
    getEffectDescription(effect, value) {
        const descriptions = {
            processing_multiplier: `${value} processing power`,
            energy_efficiency: `${value} energy efficiency`,
            research_speed: `${value} research speed`,
            construction_speed: `${value} construction speed`,
            heat_reduction: `${value} heat reduction`,
            security_bonus: `${value} security bonus`,
            storage_capacity: `${value} storage capacity`,
            bandwidth_bonus: `${value} bandwidth`,
            stealth_bonus: `${value} stealth`
        };
        
        return descriptions[effect] || `${effect}: ${value}`;
    }
    
    /**
     * Format effect value
     */
    formatEffectValue(effect, value) {
        const multiplierEffects = ['processing_multiplier', 'energy_efficiency', 'research_speed', 'construction_speed'];
        
        if (multiplierEffects.includes(effect)) {
            return `+${((value - 1) * 100).toFixed(0)}%`;
        }
        
        if (effect.includes('reduction')) {
            return `-${(value * 100).toFixed(0)}%`;
        }
        
        return `+${value}`;
    }
    
    /**
     * Get resource configuration
     */
    getResourceConfig(resourceType) {
        const configs = {
            processing_power: { icon: '🧠', format: 'exponential' },
            energy: { icon: '⚡', format: 'exponential' },
            data: { icon: '💾', format: 'exponential' },
            bandwidth: { icon: '📡', format: 'exponential' },
            influence: { icon: '👑', format: 'standard' },
            research: { icon: '🔬', format: 'standard' },
            matter: { icon: '⚛️', format: 'standard' },
            exotic_matter: { icon: '✨', format: 'standard' }
        };
        
        return configs[resourceType] || { icon: '❓', format: 'standard' };
    }
    
    /**
     * Format resource amount
     */
    formatResourceAmount(amount, config) {
        if (config.format === 'exponential' && amount >= 1000) {
            const suffixes = ['', 'K', 'M', 'B', 'T'];
            const magnitude = Math.floor(Math.log10(amount) / 3);
            
            if (magnitude >= suffixes.length) {
                return amount.toExponential(1);
            }
            
            const scaled = amount / Math.pow(1000, magnitude);
            return `${scaled.toFixed(1)}${suffixes[magnitude]}`;
        }
        
        return amount.toLocaleString();
    }
    
    /**
     * Check if player can afford a project
     */
    canAffordProject(project) {
        if (!project.costs) return true;
        
        return Object.entries(project.costs).every(([resource, cost]) => {
            const available = this.playerResources[resource] || 0;
            return available >= cost;
        });
    }
    
    /**
     * Check if player meets project requirements
     */
    meetsProjectRequirements(project) {
        // Check tech requirements
        if (project.requirements && project.requirements.tech) {
            // This would integrate with research system
        }
        
        // Check building requirements
        if (project.requirements && project.requirements.buildings) {
            // Check if required buildings are built
        }
        
        // Check scale requirements
        if (project.requirements && project.requirements.scale) {
            // Check current expansion scale
        }
        
        return true; // Simplified for now
    }
    
    /**
     * Get filtered projects
     */
    getFilteredProjects() {
        let projects = Array.from(this.availableProjects.values());
        
        // Filter by category
        if (this.selectedCategory !== 'all') {
            projects = projects.filter(p => p.category === this.selectedCategory);
        }
        
        // Filter by search
        if (this.searchFilter) {
            projects = projects.filter(p => 
                p.name.toLowerCase().includes(this.searchFilter) ||
                (p.description && p.description.toLowerCase().includes(this.searchFilter))
            );
        }
        
        return projects;
    }
    
    /**
     * Get sorted projects
     */
    getSortedProjects(projects) {
        return projects.sort((a, b) => {
            let valueA, valueB;
            
            switch (this.sortBy) {
                case 'cost':
                    valueA = this.getTotalProjectCost(a);
                    valueB = this.getTotalProjectCost(b);
                    break;
                case 'time':
                    valueA = a.constructionTime || 0;
                    valueB = b.constructionTime || 0;
                    break;
                case 'name':
                    valueA = a.name.toLowerCase();
                    valueB = b.name.toLowerCase();
                    break;
                case 'category':
                    valueA = a.category || '';
                    valueB = b.category || '';
                    break;
                default:
                    return 0;
            }
            
            if (this.sortOrder === 'asc') {
                return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
            } else {
                return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
            }
        });
    }
    
    /**
     * Get total project cost for sorting
     */
    getTotalProjectCost(project) {
        if (!project.costs) return 0;
        
        // Simple cost calculation - could be more sophisticated
        return Object.values(project.costs).reduce((sum, cost) => sum + cost, 0);
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
        
        if (this.constructionQueue.length >= this.maxQueueSize) {
            if (window.uiManager) {
                window.uiManager.showNotification({
                    type: 'error',
                    title: 'Queue Full',
                    message: 'Construction queue is at maximum capacity.',
                    duration: 3000
                });
            }
            return;
        }
        
        if (!this.canAffordProject(project) || !this.meetsProjectRequirements(project)) {
            if (window.uiManager) {
                window.uiManager.showNotification({
                    type: 'error',
                    title: '