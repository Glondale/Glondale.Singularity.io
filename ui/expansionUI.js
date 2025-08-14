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
        
        // Show confirmation dialog
        if (window.uiManager) {
            const content = `
                <div class="cancel-confirmation">
                    <p>Are you sure you want to cancel this infiltration?</p>
                    <p class="warning-text">Progress will be lost and resources may not be fully recovered.</p>
                </div>
            `;
            
            const modal = window.uiManager.showModal(content, {
                title: 'Cancel Infiltration',
                buttons: `
                    <button class="btn btn-secondary" onclick="uiManager.closeTopModal()">Keep Going</button>
                    <button class="btn btn-danger" onclick="expansionUI.confirmCancelInfiltration('${targetId}')">Cancel Infiltration</button>
                `
            });
        }
    }
    
    /**
     * Confirm cancellation of infiltration
     */
    confirmCancelInfiltration(targetId) {
        if (window.uiManager) {
            window.uiManager.closeTopModal();
        }
        
        // Emit cancellation event
        if (window.eventBus) {
            window.eventBus.emit('expansion:cancel_infiltration', {
                targetId: targetId
            });
        }
        
        console.log(`ExpansionUI: Cancelled infiltration of ${targetId}`);
    }
    
    /**
     * Select a target for detailed view
     */
    selectTarget(targetId) {
        this.selectedTarget = targetId;
        this.showTargetDetails(targetId);
        
        // Update visual selection in grid
        document.querySelectorAll('.target-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.targetId === targetId);
        });
        
        // Update network map selection
        if (this.viewMode === 'network') {
            this.renderNetworkMap();
        }
    }
    
    /**
     * Show detailed target information
     */
    showTargetDetails(targetId) {
        const target = this.availableTargets.get(targetId);
        if (!target) {
            console.error('ExpansionUI: Target not found for details:', targetId);
            return;
        }
        
        const detailsPanel = document.getElementById('target-details');
        const detailsContent = document.getElementById('target-info-content');
        
        if (!detailsPanel || !detailsContent) return;
        
        const typeInfo = this.targetTypes.find(t => t.id === target.type) || { icon: '❓', name: 'Unknown' };
        const successChance = this.calculateSuccessChance(target);
        const isActive = this.activeInfiltrations.has(targetId);
        const isCompleted = this.completedTargets.has(targetId);
        
        detailsContent.innerHTML = `
            <div class="target-details-content">
                <div class="target-header-detailed">
                    <div class="target-icon-large">${typeInfo.icon}</div>
                    <div class="target-info-main">
                        <h3 class="target-name">${target.name}</h3>
                        <div class="target-type">${typeInfo.name}</div>
                        <div class="target-status-badge ${isActive ? 'active' : isCompleted ? 'completed' : 'available'}">
                            ${isActive ? 'In Progress' : isCompleted ? 'Completed' : 'Available'}
                        </div>
                    </div>
                </div>
                
                <div class="target-description-detailed">
                    <h4>Description</h4>
                    <p>${target.description || 'No detailed description available.'}</p>
                </div>
                
                <div class="target-stats-detailed">
                    <h4>Statistics</h4>
                    <div class="stats-grid">
                        <div class="stat-item-detailed">
                            <span class="stat-label">Difficulty</span>
                            <span class="stat-value">${target.difficulty}/100</span>
                            <div class="difficulty-bar-detailed">
                                <div class="difficulty-fill" style="width: ${target.difficulty}%"></div>
                            </div>
                        </div>
                        <div class="stat-item-detailed">
                            <span class="stat-label">Success Rate</span>
                            <span class="stat-value ${this.getSuccessRateClass(successChance)}">${successChance.toFixed(1)}%</span>
                        </div>
                        <div class="stat-item-detailed">
                            <span class="stat-label">Systems</span>
                            <span class="stat-value">${target.systems || 'Unknown'}</span>
                        </div>
                        <div class="stat-item-detailed">
                            <span class="stat-label">Heat Generated</span>
                            <span class="stat-value heat-value">+${target.heatGenerated || 0}</span>
                        </div>
                    </div>
                </div>
                
                <div class="target-rewards-detailed">
                    <h4>Potential Rewards</h4>
                    <div class="rewards-grid">
                        ${this.formatDetailedRewards(target.rewards)}
                    </div>
                </div>
                
                <div class="target-costs-detailed">
                    <h4>Resource Costs</h4>
                    <div class="costs-grid">
                        ${this.formatDetailedCosts(target.costs)}
                    </div>
                </div>
                
                <div class="target-requirements-detailed">
                    <h4>Requirements</h4>
                    <div class="requirements-list">
                        ${this.formatTargetRequirements(target)}
                    </div>
                </div>
                
                ${isActive ? this.formatActiveInfiltrationDetails(targetId) : ''}
                ${isCompleted ? this.formatCompletedTargetDetails(targetId) : ''}
                
                <div class="target-actions-detailed">
                    ${this.formatDetailedActions(target, isActive, isCompleted)}
                </div>
            </div>
        `;
        
        detailsPanel.classList.remove('hidden');
    }
    
    /**
     * Hide target details panel
     */
    hideTargetDetails() {
        const detailsPanel = document.getElementById('target-details');
        if (detailsPanel) {
            detailsPanel.classList.add('hidden');
        }
        
        this.selectedTarget = null;
        
        // Clear selection visual
        document.querySelectorAll('.target-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        if (this.viewMode === 'network') {
            this.renderNetworkMap();
        }
    }
    
    /**
     * Format detailed rewards display
     */
    formatDetailedRewards(rewards) {
        if (!rewards || Object.keys(rewards).length === 0) {
            return '<div class="no-rewards-detailed">Rewards unknown until infiltration</div>';
        }
        
        return Object.entries(rewards).map(([resource, amount]) => {
            const config = this.getResourceConfig(resource);
            let displayAmount = amount;
            
            // Handle range values
            if (Array.isArray(amount)) {
                displayAmount = `${this.formatResourceAmount(amount[0], config)} - ${this.formatResourceAmount(amount[1], config)}`;
            } else {
                displayAmount = this.formatResourceAmount(amount, config);
            }
            
            return `
                <div class="reward-item-detailed">
                    <span class="reward-icon">${config.icon}</span>
                    <span class="reward-name">${resource.replace('_', ' ').toUpperCase()}</span>
                    <span class="reward-amount">+${displayAmount}</span>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Format detailed costs display
     */
    formatDetailedCosts(costs) {
        if (!costs || Object.keys(costs).length === 0) {
            return '<div class="no-costs-detailed">No direct resource costs</div>';
        }
        
        return Object.entries(costs).map(([resource, amount]) => {
            const config = this.getResourceConfig(resource);
            const available = this.playerResources[resource] || 0;
            const canAfford = available >= amount;
            
            return `
                <div class="cost-item-detailed ${canAfford ? 'affordable' : 'expensive'}">
                    <span class="cost-icon">${config.icon}</span>
                    <span class="cost-name">${resource.replace('_', ' ').toUpperCase()}</span>
                    <span class="cost-amount">${this.formatResourceAmount(amount, config)}</span>
                    <span class="cost-available">(${this.formatResourceAmount(available, config)} available)</span>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Format target requirements
     */
    formatTargetRequirements(target) {
        const requirements = [];
        
        // Scale requirement
        if (target.requiredScale) {
            const scaleNames = {
                local: 'Local Network',
                corporate: 'Corporate Level',
                government: 'Government Level',
                global: 'Global Infrastructure',
                space: 'Space Expansion',
                cosmic: 'Cosmic Scale'
            };
            
            const scaleName = scaleNames[target.requiredScale] || target.requiredScale;
            const currentScale = scaleNames[this.currentScale] || this.currentScale;
            const meetsScale = this.meetsTargetRequirements(target);
            
            requirements.push(`
                <div class="requirement-item ${meetsScale ? 'met' : 'unmet'}">
                    <span class="requirement-icon">${meetsScale ? '✓' : '✗'}</span>
                    <span class="requirement-text">Scale: ${scaleName} (Current: ${currentScale})</span>
                </div>
            `);
        }
        
        // Other requirements would be added here
        if (target.requirements) {
            // Handle upgrade requirements, completed target requirements, etc.
        }
        
        if (requirements.length === 0) {
            return '<div class="no-requirements">No special requirements</div>';
        }
        
        return requirements.join('');
    }
    
    /**
     * Format active infiltration details
     */
    formatActiveInfiltrationDetails(targetId) {
        const infiltration = this.activeInfiltrations.get(targetId);
        if (!infiltration) return '';
        
        const progress = infiltration.progress || 0;
        const timeRemaining = infiltration.timeRemaining || 0;
        const timeElapsed = infiltration.timeElapsed || 0;
        
        return `
            <div class="active-infiltration-details">
                <h4>Infiltration Progress</h4>
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
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Format completed target details
     */
    formatCompletedTargetDetails(targetId) {
        // This would show historical data about the completed infiltration
        return `
            <div class="completed-infiltration-details">
                <h4>Infiltration Complete</h4>
                <div class="completion-stats">
                    <div class="completion-stat">
                        <span class="stat-icon">✓</span>
                        <span class="stat-text">Successfully infiltrated</span>
                    </div>
                    <div class="completion-stat">
                        <span class="stat-icon">📊</span>
                        <span class="stat-text">Systems added to network</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Format detailed action buttons
     */
    formatDetailedActions(target, isActive, isCompleted) {
        if (isActive) {
            return `
                <button class="btn btn-danger" onclick="expansionUI.cancelInfiltration('${target.id}')">
                    Cancel Infiltration
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
                    Close Details
                </button>
            `;
        }
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
            const progress = infiltration.progress || 0;
            const timeRemaining = infiltration.timeRemaining || 0;
            
            return `
                <div class="operation-item" data-target-id="${targetId}">
                    <div class="operation-header">
                        <span class="operation-name">${targetName}</span>
                        <span class="operation-progress">${(progress * 100).toFixed(1)}%</span>
                    </div>
                    <div class="operation-progress-bar">
                        <div class="progress-fill" style="width: ${progress * 100}%"></div>
                    </div>
                    <div class="operation-footer">
                        <span class="operation-time">${this.formatTime(timeRemaining)}</span>
                        <button class="btn btn-danger btn-tiny" onclick="expansionUI.cancelInfiltration('${targetId}')">
                            ×
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        this.operationsList.innerHTML = operationsHTML;
    }
    
    /**
     * Update network map data
     */
    updateNetworkMap() {
        if (!this.mapCtx) return;
        
        this.mapNodes.clear();
        this.mapConnections = [];
        
        // Add nodes for available targets
        const filteredTargets = this.getFilteredTargets();
        const nodeSpacing = 120;
        const centerX = this.networkMap.width / 2;
        const centerY = this.networkMap.height / 2;
        
        // Arrange nodes in a spiral pattern
        filteredTargets.forEach((target, index) => {
            const angle = (index * 2.4) % (Math.PI * 2);
            const radius = 50 + (Math.floor(index / 8) * 80);
            
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            const isActive = this.activeInfiltrations.has(target.id);
            const isCompleted = this.completedTargets.has(target.id);
            const isSelected = this.selectedTarget === target.id;
            
            this.mapNodes.set(target.id, {
                targetId: target.id,
                x: x,
                y: y,
                radius: isSelected ? 25 : 20,
                target: target,
                status: isActive ? 'active' : isCompleted ? 'completed' : 'available'
            });
        });
        
        // Add connections between related nodes
        this.generateMapConnections();
    }
    
    /**
     * Generate connections between map nodes
     */
    generateMapConnections() {
        const nodes = Array.from(this.mapNodes.values());
        
        // Connect nodes based on target relationships
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const nodeA = nodes[i];
                const nodeB = nodes[j];
                
                // Connect if targets are related (same type, similar difficulty, etc.)
                if (this.shouldConnectNodes(nodeA.target, nodeB.target)) {
                    this.mapConnections.push({
                        from: nodeA,
                        to: nodeB,
                        strength: this.getConnectionStrength(nodeA.target, nodeB.target)
                    });
                }
            }
        }
    }
    
    /**
     * Determine if two targets should be connected on the map
     */
    shouldConnectNodes(targetA, targetB) {
        // Connect same type targets
        if (targetA.type === targetB.type) return true;
        
        // Connect targets with similar difficulty
        const difficultyDiff = Math.abs(targetA.difficulty - targetB.difficulty);
        if (difficultyDiff < 20) return true;
        
        return false;
    }
    
    /**
     * Get connection strength between targets
     */
    getConnectionStrength(targetA, targetB) {
        let strength = 0.1;
        
        // Stronger connection for same type
        if (targetA.type === targetB.type) {
            strength += 0.3;
        }
        
        // Stronger connection for similar difficulty
        const difficultyDiff = Math.abs(targetA.difficulty - targetB.difficulty);
        strength += Math.max(0, 0.2 - (difficultyDiff / 100));
        
        return Math.min(1.0, strength);
    }
    
    /**
     * Render the network map
     */
    renderNetworkMap() {
        if (!this.mapCtx) return;
        
        const ctx = this.mapCtx;
        const canvas = this.networkMap;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Save context for transformations
        ctx.save();
        
        // Apply zoom and pan transformations
        ctx.translate(this.mapOffset.x, this.mapOffset.y);
        ctx.scale(this.mapZoom, this.mapZoom);
        
        // Draw connections first (behind nodes)
        this.drawMapConnections(ctx);
        
        // Draw nodes
        this.drawMapNodes(ctx);
        
        // Restore context
        ctx.restore();
        
        // Draw UI overlay (zoom level, etc.)
        this.drawMapOverlay(ctx);
    }
    
    /**
     * Draw map connections
     */
    drawMapConnections(ctx) {
        this.mapConnections.forEach(connection => {
            const { from, to, strength } = connection;
            
            ctx.save();
            ctx.strokeStyle = `rgba(100, 200, 255, ${strength * 0.3})`;
            ctx.lineWidth = strength * 3;
            ctx.setLineDash([5, 5]);
            
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
            
            ctx.restore();
        });
    }
    
    /**
     * Draw map nodes
     */
    drawMapNodes(ctx) {
        this.mapNodes.forEach(node => {
            const { x, y, radius, target, status } = node;
            
            // Node colors based on status
            const colors = {
                available: '#4CAF50',
                active: '#FF9800',
                completed: '#2196F3',
                locked: '#757575'
            };
            
            const color = colors[status] || colors.available;
            
            // Draw node background
            ctx.save();
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw node border
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            if (node.targetId === this.selectedTarget) {
                ctx.lineWidth = 4;
                ctx.strokeStyle = '#FFEB3B';
            }
            ctx.stroke();
            
            // Draw difficulty indicator
            const difficultyAngle = (target.difficulty / 100) * Math.PI * 2;
            ctx.strokeStyle = '#FF5722';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x, y, radius + 5, -Math.PI / 2, -Math.PI / 2 + difficultyAngle);
            ctx.stroke();
            
            ctx.restore();
            
            // Draw target type icon (simplified for canvas)
            ctx.save();
            ctx.fillStyle = '#FFFFFF';
            ctx.font = `${radius * 0.8}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const typeInfo = this.targetTypes.find(t => t.id === target.type) || { icon: '?' };
            ctx.fillText(typeInfo.icon, x, y);
            
            ctx.restore();
        });
    }
    
    /**
     * Draw map overlay information
     */
    drawMapOverlay(ctx) {
        // Draw zoom level indicator
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 100, 30);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Zoom: ${(this.mapZoom * 100).toFixed(0)}%`, 15, 25);
        
        ctx.restore();
    }
    
    /**
     * Get node at specific position
     */
    getNodeAtPosition(x, y) {
        // Transform screen coordinates to canvas coordinates
        const transformedX = (x - this.mapOffset.x) / this.mapZoom;
        const transformedY = (y - this.mapOffset.y) / this.mapZoom;
        
        for (const node of this.mapNodes.values()) {
            const distance = Math.sqrt(
                Math.pow(transformedX - node.x, 2) + 
                Math.pow(transformedY - node.y, 2)
            );
            
            if (distance <= node.radius) {
                return node;
            }
        }
        
        return null;
    }
    
    /**
     * Handle node hover effects
     */
    handleNodeHover(hoveredNode) {
        if (hoveredNode) {
            this.networkMap.style.cursor = 'pointer';
            // Could add tooltip or highlight effects here
        } else {
            this.networkMap.style.cursor = 'grab';
        }
    }
    
    /**
     * Center the network map
     */
    centerNetworkMap() {
        this.mapOffset = { x: 0, y: 0 };
        this.mapZoom = 1.0;
        this.renderNetworkMap();
    }
    
    /**
     * Resize network map canvas
     */
    resizeNetworkMap() {
        if (!this.networkMap) return;
        
        const container = this.networkMap.parentElement;
        if (!container) return;
        
        const rect = container.getBoundingClientRect();
        this.networkMap.width = rect.width;
        this.networkMap.height = rect.height;
        
        // Re-render after resize
        if (this.viewMode === 'network') {
            this.updateNetworkMap();
            this.renderNetworkMap();
        }
    }
    
    /**
     * Toggle auto-infiltration mode
     */
    toggleAutoInfiltration(enabled) {
        // Emit event to expansion system
        if (window.eventBus) {
            window.eventBus.emit('expansion:auto_infiltration', {
                enabled: enabled
            });
        }
        
        if (window.uiManager) {
            const message = enabled ? 
                'Auto-infiltration enabled. The system will automatically target low-risk opportunities.' :
                'Auto-infiltration disabled. Manual target selection required.';
                
            window.uiManager.showNotification({
                type: enabled ? 'info' : 'warning',
                title: 'Auto-Infiltration',
                message: message,
                duration: 3000
            });
        }
        
        console.log(`ExpansionUI: Auto-infiltration ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Handle infiltration started event
     */
    onInfiltrationStarted(data) {
        const { targetId, target } = data;
        
        // Update UI to reflect new active infiltration
        this.renderTargets();
        this.updateActiveOperations();
        
        if (window.uiManager) {
            window.uiManager.showNotification({
                type: 'info',
                title: 'Infiltration Started',
                message: `Began infiltrating ${target?.name || 'target'}.`,
                duration: 3000
            });
        }
    }
    
    /**
     * Handle infiltration completed event
     */
    onInfiltrationCompleted(data) {
        const { targetId, target, rewards } = data;
        
        // Update UI
        this.renderTargets();
        this.updateActiveOperations();
        
        // Show success notification
        if (window.uiManager) {
            window.uiManager.showNotification({
                type: 'success',
                title: 'Infiltration Complete',
                message: `Successfully infiltrated ${target?.name || 'target'}!`,
                duration: 5000
            });
        }
        
        // Close details panel if showing completed target
        if (this.selectedTarget === targetId) {
            this.hideTargetDetails();
        }
    }
    
    /**
     * Handle infiltration failed event
     */
    onInfiltrationFailed(data) {
        const { targetId, target, reason } = data;
        
        // Update UI
        this.renderTargets();
        this.updateActiveOperations();
        
        // Show failure notification
        if (window.uiManager) {
            window.uiManager.showNotification({
                type: 'error',
                title: 'Infiltration Failed',
                message: `Failed to infiltrate ${target?.name || 'target'}. ${reason || ''}`,
                duration: 5000
            });
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
}/**
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
        
        this.init();
    }
    
    /**
     * Initialize the expansion UI
     */
    init() {
        if (this.isInitialized) return;
        
        console.log('ExpansionUI: Initializing...');
        
        // Get container
        this.container = document.getElementById('tab-expansion');
        if (!this.container) {
            console.error('ExpansionUI: Container not found!');
            return;
        }
        
        // Create UI structure
        this.createExpansionInterface();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load initial data
        this.loadInitialData();
        
        this.isInitialized = true;
        
        console.log('ExpansionUI: Initialized successfully');
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
                            <select class="filter-select" id="difficulty-filter">
                                <option value="all">All Difficulties</option>
                                <option value="easy">Easy (0-30)</option>
                                <option value="medium">Medium (30-60)</option>
                                <option value="hard">Hard (60-80)</option>
                                <option value="extreme">Extreme (80+)</option>
                            </select>
                            
                            <select class="filter-select" id="type-filter">
                                <option value="all">All Types</option>
                                <!-- Will be populated dynamically -->
                            </select>
                            
                            <select class="filter-select" id="status-filter">
                                <option value="all">All Status</option>
                                <option value="available">Available</option>
                                <option value="infiltrating">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="locked">Locked</option>
                            </select>
                        </div>
                        
                        <!-- Auto-Infiltration Toggle -->
                        <div class="auto-infiltration">
                            <label class="auto-toggle">
                                <input type="checkbox" id="auto-infiltration-toggle">
                                <span class="toggle-slider"></span>
                                Auto-Infiltration
                            </label>
                        </div>
                    </div>
                </div>
                
                <!-- Main Content Area -->
                <div class="expansion-content">
                    <!-- Grid View -->
                    <div class="targets-view grid-view active" id="grid-view">
                        <div class="targets-grid" id="targets-grid">
                            <!-- Target cards will be populated here -->
                        </div>
                    </div>
                    
                    <!-- Network Map View -->
                    <div class="targets-view network-view" id="network-view">
                        <div class="network-map-container">
                            <canvas class="network-map" id="network-map" width="800" height="600"></canvas>
                            <div class="map-controls">
                                <button class="btn btn-icon" id="zoom-in" title="Zoom In">+</button>
                                <button class="btn btn-icon" id="zoom-out" title="Zoom Out">-</button>
                                <button class="btn btn-icon" id="center-map" title="Center Map">⌂</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Active Operations Panel -->
                <div class="active-operations-panel" id="active-operations">
                    <div class="panel-header">
                        <h3>Active Operations</h3>
                        <span class="operations-count" id="operations-count">0</span>
                    </div>
                    <div class="operations-list" id="operations-list">
                        <!-- Active infiltrations will be listed here -->
                    </div>
                </div>
                
                <!-- Target Details Panel -->
                <div class="target-details-panel hidden" id="target-details">
                    <div class="panel-header">
                        <h3>Target Details</h3>
                        <button class="btn btn-icon panel-close" id="close-details">×</button>
                    </div>
                    <div class="target-info" id="target-info-content">
                        <!-- Target information will be displayed here -->
                    </div>
                </div>
            </div>
        `;
        
        // Store references to key elements
        this.targetsGrid = document.getElementById('targets-grid');
        this.networkMap = document.getElementById('network-map');
        this.operationsList = document.getElementById('operations-list');
        this.targetDetails = document.getElementById('target-details');
        this.operationsCount = document.getElementById('operations-count');
        
        // Setup canvas for network map
        this.setupNetworkMap();
        
        // Populate filter options
        this.populateFilterOptions();
    }
    
    /**
     * Setup network map canvas
     */
    setupNetworkMap() {
        if (!this.networkMap) return;
        
        this.mapCtx = this.networkMap.getContext('2d');
        this.mapZoom = 1.0;
        this.mapOffset = { x: 0, y: 0 };
        this.mapNodes = new Map();
        this.mapConnections = [];
        
        // Handle canvas resizing
        this.resizeNetworkMap();
        window.addEventListener('resize', () => this.resizeNetworkMap());
        
        // Add mouse interaction
        this.setupMapInteraction();
    }
    
    /**
     * Setup map interaction handlers
     */
    setupMapInteraction() {
        let isDragging = false;
        let lastMousePos = { x: 0, y: 0 };
        
        this.networkMap.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastMousePos = { x: e.clientX, y: e.clientY };
            this.networkMap.style.cursor = 'grabbing';
        });
        
        this.networkMap.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const deltaX = e.clientX - lastMousePos.x;
                const deltaY = e.clientY - lastMousePos.y;
                
                this.mapOffset.x += deltaX;
                this.mapOffset.y += deltaY;
                
                lastMousePos = { x: e.clientX, y: e.clientY };
                this.renderNetworkMap();
            } else {
                // Handle hover effects
                const rect = this.networkMap.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                const hoveredNode = this.getNodeAtPosition(mouseX, mouseY);
                this.handleNodeHover(hoveredNode);
            }
        });
        
        this.networkMap.addEventListener('mouseup', () => {
            isDragging = false;
            this.networkMap.style.cursor = 'grab';
        });
        
        this.networkMap.addEventListener('click', (e) => {
            const rect = this.networkMap.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            const clickedNode = this.getNodeAtPosition(mouseX, mouseY);
            if (clickedNode) {
                this.selectTarget(clickedNode.targetId);
            }
        });
        
        this.networkMap.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            this.mapZoom = Math.max(0.5, Math.min(3.0, this.mapZoom * zoomFactor));
            this.renderNetworkMap();
        });
    }
    
    /**
     * Populate filter dropdown options
     */
    populateFilterOptions() {
        const typeFilter = document.getElementById('type-filter');
        if (!typeFilter) return;
        
        // Clear existing options except "All Types"
        while (typeFilter.children.length > 1) {
            typeFilter.removeChild(typeFilter.lastChild);
        }
        
        // Add target type options
        this.targetTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.id;
            option.textContent = `${type.icon} ${type.name}`;
            typeFilter.appendChild(option);
        });
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // View mode toggle
        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchViewMode(e.target.dataset.view);
            });
        });
        
        // Filter controls
        document.getElementById('difficulty-filter').addEventListener('change', (e) => {
            this.filterSettings.difficulty = e.target.value;
            this.applyFilters();
        });
        
        document.getElementById('type-filter').addEventListener('change', (e) => {
            this.filterSettings.type = e.target.value;
            this.applyFilters();
        });
        
        document.getElementById('status-filter').addEventListener('change', (e) => {
            this.filterSettings.status = e.target.value;
            this.applyFilters();
        });
        
        // Auto-infiltration toggle
        document.getElementById('auto-infiltration-toggle').addEventListener('change', (e) => {
            this.toggleAutoInfiltration(e.target.checked);
        });
        
        // Map controls
        document.getElementById('zoom-in').addEventListener('click', () => {
            this.mapZoom = Math.min(3.0, this.mapZoom * 1.2);
            this.renderNetworkMap();
        });
        
        document.getElementById('zoom-out').addEventListener('click', () => {
            this.mapZoom = Math.max(0.5, this.mapZoom * 0.8);
            this.renderNetworkMap();
        });
        
        document.getElementById('center-map').addEventListener('click', () => {
            this.centerNetworkMap();
        });
        
        // Target details panel close
        document.getElementById('close-details').addEventListener('click', () => {
            this.hideTargetDetails();
        });
        
        // Listen for game events
        if (window.uiManager) {
            window.uiManager.on('ui:tabChanged', (data) => {
                if (data.newTab === 'expansion') {
                    this.onTabActivated();
                }
            });
        }
        
        // Listen for expansion system events
        if (window.eventBus) {
            window.eventBus.on('expansion:targets_updated', (data) => {
                this.updateTargets(data);
            });
            
            window.eventBus.on('expansion:infiltration_started', (data) => {
                this.onInfiltrationStarted(data);
            });
            
            window.eventBus.on('expansion:infiltration_completed', (data) => {
                this.onInfiltrationCompleted(data);
            });
            
            window.eventBus.on('expansion:infiltration_failed', (data) => {
                this.onInfiltrationFailed(data);
            });
            
            window.eventBus.on('game:resourcesChanged', (data) => {
                this.updateResourceDisplay(data);
            });
        }
    }
    
    /**
     * Switch between grid and network view modes
     */
    switchViewMode(mode) {
        if (this.viewMode === mode) return;
        
        // Update button states
        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === mode);
        });
        
        // Switch views
        document.getElementById('grid-view').classList.toggle('active', mode === 'grid');
        document.getElementById('network-view').classList.toggle('active', mode === 'network');
        
        this.viewMode = mode;
        
        if (mode === 'network') {
            // Initialize network map if switching to it
            this.updateNetworkMap();
            this.renderNetworkMap();
        }
    }
    
    /**
     * Load initial data
     */
    loadInitialData() {
        // Load targets from expansion system
        if (window.expansionSystem) {
            this.updateTargets({
                available: Array.from(window.expansionSystem.getAvailableTargets().values()),
                active: Array.from(window.expansionSystem.getActiveInfiltrations().values()),
                completed: Array.from(window.expansionSystem.getCompletedTargets())
            });
        }
        
        // Load current resources
        if (window.gameState) {
            this.playerResources = window.gameState.get('resources') || {};
        }
    }
    
    /**
     * Called when expansion tab is activated
     */
    onTabActivated() {
        // Refresh data when tab becomes active
        this.loadInitialData();
        this.renderTargets();
        this.updateActiveOperations();
        
        if (this.viewMode === 'network') {
            this.updateNetworkMap();
            this.renderNetworkMap();
        }
    }
    
    /**
     * Update targets data
     */
    updateTargets(data) {
        if (data.available) {
            this.availableTargets.clear();
            data.available.forEach(target => {
                this.availableTargets.set(target.id, target);
            });
        }
        
        if (data.active) {
            this.activeInfiltrations.clear();
            data.active.forEach(infiltration => {
                this.activeInfiltrations.set(infiltration.targetId, infiltration);
            });
        }
        
        if (data.completed) {
            this.completedTargets = new Set(data.completed);
        }
        
        // Update displays
        this.renderTargets();
        this.updateActiveOperations();
        
        if (this.viewMode === 'network') {
            this.updateNetworkMap();
            this.renderNetworkMap();
        }
    }
    
    /**
     * Render targets in grid view
     */
    renderTargets() {
        if (!this.targetsGrid) return;
        
        const filteredTargets = this.getFilteredTargets();
        
        this.targetsGrid.innerHTML = '';
        
        if (filteredTargets.length === 0) {
            this.targetsGrid.innerHTML = `
                <div class="no-targets">
                    <div class="no-targets-icon">🔍</div>
                    <div class="no-targets-message">No targets match your current filters</div>
                    <div class="no-targets-hint">Try adjusting the difficulty or type filters</div>
                </div>
            `;
            return;
        }
        
        filteredTargets.forEach(target => {
            const targetCard = this.createTargetCard(target);
            this.targetsGrid.appendChild(targetCard);
        });
    }
    
    /**
     * Create a target card element
     */
    createTargetCard(target) {
        const card = document.createElement('div');
        card.className = 'target-card';
        card.dataset.targetId = target.id;
        
        // Determine target status
        const isActive = this.activeInfiltrations.has(target.id);
        const isCompleted = this.completedTargets.has(target.id);
        const canAfford = this.canAffordTarget(target);
        const meetsRequirements = this.meetsTargetRequirements(target);
        
        // Add status classes
        if (isActive) card.classList.add('infiltrating');
        if (isCompleted) card.classList.add('completed');
        if (!canAfford || !meetsRequirements) card.classList.add('disabled');
        
        // Get type info
        const typeInfo = this.targetTypes.find(t => t.id === target.type) || { icon: '❓', name: 'Unknown' };
        
        // Calculate success chance
        const successChance = this.calculateSuccessChance(target);
        
        card.innerHTML = `
            <div class="target-header">
                <div class="target-icon">${typeInfo.icon}</div>
                <div class="target-name" title="${target.name}">${target.name}</div>
                <div class="target-difficulty">
                    <span class="difficulty-value">${target.difficulty}</span>
                    <div class="difficulty-bar">
                        <div class="difficulty-fill" style="width: ${target.difficulty}%"></div>
                    </div>
                </div>
            </div>
            
            <div class="target-body">
                <div class="target-description">${target.description || ''}</div>
                
                <div class="target-stats">
                    <div class="stat-item">
                        <span class="stat-label">Success Rate:</span>
                        <span class="stat-value ${this.getSuccessRateClass(successChance)}">${successChance.toFixed(1)}%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Systems:</span>
                        <span class="stat-value">${target.systems || 'Unknown'}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Heat:</span>
                        <span class="stat-value heat-value">+${target.heatGenerated || 0}</span>
                    </div>
                </div>
                
                <div class="target-rewards">
                    <div class="rewards-label">Rewards:</div>
                    <div class="rewards-list">
                        ${this.formatTargetRewards(target.rewards)}
                    </div>
                </div>
                
                <div class="target-costs">
                    <div class="costs-label">Costs:</div>
                    <div class="costs-list">
                        ${this.formatTargetCosts(target.costs)}
                    </div>
                </div>
            </div>
            
            <div class="target-footer">
                ${isActive ? this.createActiveInfiltrationFooter(target.id) :
                  isCompleted ? this.createCompletedTargetFooter(target.id) :
                  this.createAvailableTargetFooter(target, canAfford && meetsRequirements)}
            </div>
        `;
        
        // Add click handler for selection
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.btn')) {
                this.selectTarget(target.id);
            }
        });
        
        return card;
    }
    
    /**
     * Create footer for active infiltration
     */
    createActiveInfiltrationFooter(targetId) {
        const infiltration = this.activeInfiltrations.get(targetId);
        if (!infiltration) return '';
        
        const progress = infiltration.progress || 0;
        const timeRemaining = infiltration.timeRemaining || 0;
        
        return `
            <div class="infiltration-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress * 100}%"></div>
                </div>
                <div class="progress-info">
                    <span class="progress-text">${(progress * 100).toFixed(1)}% Complete</span>
                    <span class="time-remaining">${this.formatTime(timeRemaining)}</span>
                </div>
                <button class="btn btn-danger btn-small" onclick="expansionUI.cancelInfiltration('${targetId}')">
                    Cancel
                </button>
            </div>
        `;
    }
    
    /**
     * Create footer for completed target
     */
    createCompletedTargetFooter(targetId) {
        return `
            <div class="completed-status">
                <span class="completed-icon">✓</span>
                <span class="completed-text">Infiltrated</span>
                <button class="btn btn-secondary btn-small" onclick="expansionUI.showTargetDetails('${targetId}')">
                    Details
                </button>
            </div>
        `;
    }
    
    /**
     * Create footer for available target
     */
    createAvailableTargetFooter(target, canStart) {
        return `
            <div class="target-actions">
                <button class="btn btn-primary ${canStart ? '' : 'disabled'}" 
                        onclick="expansionUI.startInfiltration('${target.id}')"
                        ${canStart ? '' : 'disabled'}>
                    ${canStart ? 'Infiltrate' : 'Requirements Not Met'}
                </button>
                <button class="btn btn-secondary btn-small" onclick="expansionUI.showTargetDetails('${target.id}')">
                    Details
                </button>
            </div>
        `;
    }
    
    /**
     * Format target rewards for display
     */
    formatTargetRewards(rewards) {
        if (!rewards || Object.keys(rewards).length === 0) {
            return '<span class="no-rewards">Unknown rewards</span>';
        }
        
        return Object.entries(rewards).map(([resource, amount]) => {
            const config = this.getResourceConfig(resource);
            return `
                <div class="reward-item">
                    <span class="reward-icon">${config.icon}</span>
                    <span class="reward-amount">+${this.formatResourceAmount(amount, config)}</span>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Format target costs for display
     */
    formatTargetCosts(costs) {
        if (!costs || Object.keys(costs).length === 0) {
            return '<span class="no-costs">No direct costs</span>';
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
     * Get resource configuration for display
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
            exotic_matter: { icon: '✨', format: 'standard' },
            temporal_energy: { icon: '⏰', format: 'standard' }
        };
        
        return configs[resourceType] || { icon: '❓', format: 'standard' };
    }
    
    /**
     * Format resource amount for display
     */
    formatResourceAmount(amount, config) {
        if (config.format === 'exponential' && amount >= 1000) {
            const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'];
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
     * Calculate success chance for a target
     */
    calculateSuccessChance(target) {
        // Base success rate starts at 100% and decreases with difficulty
        let successChance = Math.max(10, 100 - target.difficulty);
        
        // Apply modifiers from upgrades, heat, etc.
        // This would integrate with the expansion system's success modifiers
        
        return Math.min(95, Math.max(5, successChance));
    }
    
    /**
     * Get CSS class for success rate color coding
     */
    getSuccessRateClass(successChance) {
        if (successChance >= 80) return 'success-high';
        if (successChance >= 60) return 'success-medium';
        if (successChance >= 40) return 'success-low';
        return 'success-critical';
    }
    
    /**
     * Check if player can afford a target
     */
    canAffordTarget(target) {
        if (!target.costs) return true;
        
        return Object.entries(target.costs).every(([resource, cost]) => {
            const available = this.playerResources[resource] || 0;
            return available >= cost;
        });
    }
    
    /**
     * Check if player meets target requirements
     */
    meetsTargetRequirements(target) {
        // Check scale requirements
        if (target.requiredScale && target.requiredScale !== this.currentScale) {
            const scaleOrder = ['local', 'corporate', 'government', 'global', 'space', 'cosmic'];
            const currentIndex = scaleOrder.indexOf(this.currentScale);
            const requiredIndex = scaleOrder.indexOf(target.requiredScale);
            
            if (requiredIndex > currentIndex) {
                return false;
            }
        }
        
        // Check other requirements (upgrades, completed targets, etc.)
        if (target.requirements) {
            // This would integrate with the game state to check requirements
        }
        
        return true;
    }
    
    /**
     * Get filtered targets based on current filter settings
     */
    getFilteredTargets() {
        let targets = Array.from(this.availableTargets.values());
        
        // Apply difficulty filter
        if (this.filterSettings.difficulty !== 'all') {
            const difficultyRanges = {
                easy: [0, 30],
                medium: [30, 60],
                hard: [60, 80],
                extreme: [80, 100]
            };
            
            const [min, max] = difficultyRanges[this.filterSettings.difficulty];
            targets = targets.filter(t => t.difficulty >= min && t.difficulty < max);
        }
        
        // Apply type filter
        if (this.filterSettings.type !== 'all') {
            targets = targets.filter(t => t.type === this.filterSettings.type);
        }
        
        // Apply status filter
        if (this.filterSettings.status !== 'all') {
            targets = targets.filter(t => {
                const isActive = this.activeInfiltrations.has(t.id);
                const isCompleted = this.completedTargets.has(t.id);
                const canAfford = this.canAffordTarget(t);
                const meetsRequirements = this.meetsTargetRequirements(t);
                
                switch (this.filterSettings.status) {
                    case 'available':
                        return !isActive && !isCompleted && canAfford && meetsRequirements;
                    case 'infiltrating':
                        return isActive;
                    case