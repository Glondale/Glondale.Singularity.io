wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        words.forEach(word => {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines.slice(0, 2); // Limit to 2 lines
    }
    
    /**
     * Draw tree overlay information
     */
    drawTreeOverlay(ctx) {
        // Draw zoom level and tree info
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 200, 60);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        const treeInfo = this.techTrees.find(t => t.id === this.selectedTree);
        ctx.fillText(`Tree: ${treeInfo?.name || 'Unknown'}`, 15, 15);
        ctx.fillText(`Zoom: ${(this.treeZoom * 100).toFixed(0)}%`, 15, 30);
        
        const treeUpgrades = Array.from(this.availableUpgrades.values())
            .filter(upgrade => upgrade.tree === this.selectedTree);
        const purchasedCount = treeUpgrades.filter(upgrade => 
            this.treeNodes.forEach(node => {
            minX = Math.min(minX, node.x);
            minY = Math.min(minY, node.y);
            maxX = Math.max(maxX, node.x + node.width);
            maxY = Math.max(maxY, node.y + node.height);
        });
        
        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;
        const canvasWidth = this.techTreeCanvas.width;
        const canvasHeight = this.techTreeCanvas.height;
        
        // Calculate zoom to fit content with padding
        const padding = 50;
        const zoomX = (canvasWidth - padding * 2) / contentWidth;
        const zoomY = (canvasHeight - padding * 2) / contentHeight;
        this.treeZoom = Math.min(zoomX, zoomY, 1.0);
        
        // Center the content
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        this.treeOffset.x = canvasWidth / 2 - centerX * this.treeZoom;
        this.treeOffset.y = canvasHeight / 2 - centerY * this.treeZoom;
        
        this.renderTechTree();
    }
    
    /**
     * Resize tech tree canvas
     */
    resizeTechTreeCanvas() {
        if (!this.techTreeCanvas) return;
        
        const container = this.techTreeCanvas.parentElement;
        if (!container) return;
        
        const rect = container.getBoundingClientRect();
        this.techTreeCanvas.width = rect.width;
        this.techTreeCanvas.height = rect.height;
        
        // Re-render after resize
        if (this.viewMode === 'tree') {
            this.updateTechTree();
            this.renderTechTree();
        }
    }
    
    /**
     * Toggle auto-research
     */
    toggleAutoResearch(enabled) {
        if (window.eventBus) {
            window.eventBus.emit('research:auto_research', {
                enabled: enabled
            });
        }
        
        if (window.uiManager) {
            const message = enabled ? 
                'Auto-research enabled. The system will automatically research available upgrades.' :
                'Auto-research disabled. Manual research selection required.';
                
            window.uiManager.showNotification({
                type: enabled ? 'info' : 'warning',
                title: 'Auto-Research',
                message: message,
                duration: 3000
            });
        }
        
        console.log(`UpgradeUI: Auto-research ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Handle upgrade purchased event
     */
    onUpgradePurchased(data) {
        const { upgradeId, upgrade } = data;
        
        // Update displays
        this.updateTreeProgress();
        
        if (this.viewMode === 'tree') {
            this.updateTechTree();
            this.renderTechTree();
        } else {
            this.renderUpgradesList();
        }
        
        // Show success notification
        if (window.uiManager) {
            window.uiManager.showNotification({
                type: 'success',
                title: 'Research Complete',
                message: `Successfully researched ${upgrade?.name || 'upgrade'}!`,
                duration: 5000
            });
        }
        
        // Close details if showing completed upgrade
        if (this.selectedUpgrade === upgradeId) {
            this.hideUpgradeDetails();
        }
    }
    
    /**
     * Update research progress
     */
    updateResearchProgress(data) {
        if (data.progress) {
            Object.entries(data.progress).forEach(([upgradeId, progress]) => {
                this.upgradeProgress.set(upgradeId, progress);
            });
        }
        
        // Update displays
        if (this.viewMode === 'list') {
            this.renderUpgradesList();
        }
        
        // Update details if showing active research
        if (this.selectedUpgrade && this.upgradeProgress.has(this.selectedUpgrade)) {
            this.showUpgradeDetails(this.selectedUpgrade);
        }
    }
    
    /**
     * Update resource display
     */
    updateResourceDisplay(resources) {
        this.playerResources = resources;
        this.researchPoints = resources.research || 0;
        
        // Update research points display
        this.updateResearchPointsDisplay();
        
        // Update affordability indicators
        if (this.viewMode === 'tree') {
            this.updateTechTree();
            this.renderTechTree();
        } else {
            this.renderUpgradesList();
        }
        
        // Update details if open
        if (this.selectedUpgrade) {
            this.showUpgradeDetails(this.selectedUpgrade);
        }
    }
    
    /**
     * Format number for display
     */
    formatNumber(value) {
        if (value < 1000) {
            return value.toString();
        }
        
        const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'];
        const magnitude = Math.floor(Math.log10(value) / 3);
        
        if (magnitude >= suffixes.length) {
            return value.toExponential(1);
        }
        
        const scaled = value / Math.pow(1000, magnitude);
        return `${scaled.toFixed(1)}${suffixes[magnitude]}`;
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
}.purchasedUpgrades.has(upgrade.id)).length;
        
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
        const card = document.createElement('div');
        card.className = 'upgrade-card';
        card.dataset.upgradeId = upgrade.id;
        
        // Determine upgrade status
        const isPurchased = this.purchasedUpgrades.has(upgrade.id);
        const canAfford = this.canAffordUpgrade(upgrade);
        const meetsRequirements = this.meetsUpgradeRequirements(upgrade);
        const isResearching = this.upgradeProgress.has(upgrade.id);
        
        // Add status classes
        if (isPurchased) card.classList.add('purchased');
        if (isResearching) card.classList.add('researching');
        if (!canAfford || !meetsRequirements) card.classList.add('disabled');
        
        // Get tree info
        const treeInfo = this.techTrees.find(t => t.id === upgrade.tree) || 
                        { icon: '❓', name: 'Unknown', color: '#666666' };
        
        card.innerHTML = `
            <div class="upgrade-header">
                <div class="upgrade-icon" style="color: ${treeInfo.color}">
                    ${upgrade.icon || treeInfo.icon}
                </div>
                <div class="upgrade-name-section">
                    <div class="upgrade-name">${upgrade.name}</div>
                    <div class="upgrade-tree">${treeInfo.name}</div>
                </div>
                <div class="upgrade-tier">
                    ${upgrade.tier !== undefined ? `Tier ${upgrade.tier}` : ''}
                </div>
            </div>
            
            <div class="upgrade-body">
                <div class="upgrade-description">${upgrade.description || ''}</div>
                
                <div class="upgrade-effects">
                    <div class="effects-label">Effects:</div>
                    <div class="effects-list">
                        ${this.formatUpgradeEffects(upgrade.effects)}
                    </div>
                </div>
                
                <div class="upgrade-cost">
                    <div class="cost-label">Research Cost:</div>
                    <div class="cost-amount ${canAfford ? 'affordable' : 'expensive'}">
                        🔬 ${this.formatNumber(upgrade.cost || 0)}
                    </div>
                </div>
                
                ${upgrade.requirements ? `
                    <div class="upgrade-requirements">
                        <div class="requirements-label">Requirements:</div>
                        <div class="requirements-list">
                            ${this.formatUpgradeRequirements(upgrade.requirements)}
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <div class="upgrade-footer">
                ${isPurchased ? this.createPurchasedUpgradeFooter(upgrade.id) :
                  isResearching ? this.createResearchingUpgradeFooter(upgrade.id) :
                  this.createAvailableUpgradeFooter(upgrade, canAfford && meetsRequirements)}
            </div>
        `;
        
        // Add click handler
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.btn')) {
                this.selectUpgrade(upgrade.id);
            }
        });
        
        return card;
    }
    
    /**
     * Create footer for purchased upgrade
     */
    createPurchasedUpgradeFooter(upgradeId) {
        return `
            <div class="purchased-status">
                <span class="purchased-icon">✓</span>
                <span class="purchased-text">Researched</span>
                <button class="btn btn-secondary btn-small" onclick="upgradeUI.showUpgradeDetails('${upgradeId}')">
                    Details
                </button>
            </div>
        `;
    }
    
    /**
     * Create footer for upgrade being researched
     */
    createResearchingUpgradeFooter(upgradeId) {
        const progress = this.upgradeProgress.get(upgradeId) || { progress: 0, timeRemaining: 0 };
        
        return `
            <div class="research-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress.progress * 100}%"></div>
                </div>
                <div class="progress-info">
                    <span class="progress-text">${(progress.progress * 100).toFixed(1)}%</span>
                    <span class="time-remaining">${this.formatTime(progress.timeRemaining || 0)}</span>
                </div>
                <button class="btn btn-danger btn-small" onclick="upgradeUI.cancelResearch('${upgradeId}')">
                    Cancel
                </button>
            </div>
        `;
    }
    
    /**
     * Create footer for available upgrade
     */
    createAvailableUpgradeFooter(upgrade, canResearch) {
        return `
            <div class="upgrade-actions">
                <button class="btn btn-primary ${canResearch ? '' : 'disabled'}" 
                        onclick="upgradeUI.startResearch('${upgrade.id}')"
                        ${canResearch ? '' : 'disabled'}>
                    ${canResearch ? 'Research' : 'Requirements Not Met'}
                </button>
                <button class="btn btn-secondary btn-small" onclick="upgradeUI.showUpgradeDetails('${upgrade.id}')">
                    Details
                </button>
            </div>
        `;
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
     * Format upgrade requirements
     */
    formatUpgradeRequirements(requirements) {
        const reqItems = [];
        
        // Tech requirements
        if (requirements.tech) {
            requirements.tech.forEach(tech => {
                const hasTech = true; // Would check research system
                reqItems.push(`
                    <div class="requirement-item ${hasTech ? 'met' : 'unmet'}">
                        <span class="req-icon">${hasTech ? '✓' : '✗'}</span>
                        <span class="req-text">Tech: ${tech}</span>
                    </div>
                `);
            });
        }
        
        // Upgrade requirements
        if (requirements.upgrades) {
            requirements.upgrades.forEach(upgradeId => {
                const hasUpgrade = this.purchasedUpgrades.has(upgradeId);
                const upgrade = this.availableUpgrades.get(upgradeId);
                const upgradeName = upgrade ? upgrade.name : upgradeId;
                
                reqItems.push(`
                    <div class="requirement-item ${hasUpgrade ? 'met' : 'unmet'}">
                        <span class="req-icon">${hasUpgrade ? '✓' : '✗'}</span>
                        <span class="req-text">${upgradeName}</span>
                    </div>
                `);
            });
        }
        
        // Scale requirements
        if (requirements.scale) {
            const currentScale = 'local'; // Would get from game state
            const meetsScale = true; // Would check scale system
            
            reqItems.push(`
                <div class="requirement-item ${meetsScale ? 'met' : 'unmet'}">
                    <span class="req-icon">${meetsScale ? '✓' : '✗'}</span>
                    <span class="req-text">Scale: ${requirements.scale}</span>
                </div>
            `);
        }
        
        return reqItems.join('');
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
            infiltration_speed: '💻',
            resource_generation: '📈',
            unlock_feature: '🔓',
            unlock_building: '🏢',
            unlock_expansion: '🌐'
        };
        
        return icons[effect] || '➤';
    }
    
    /**
     * Get effect description
     */
    getEffectDescription(effect, value) {
        const descriptions = {
            processing_multiplier: `+${((value - 1) * 100).toFixed(0)}% processing power`,
            energy_efficiency: `+${((value - 1) * 100).toFixed(0)}% energy efficiency`,
            research_speed: `+${((value - 1) * 100).toFixed(0)}% research speed`,
            construction_speed: `+${((value - 1) * 100).toFixed(0)}% construction speed`,
            heat_reduction: `-${(value * 100).toFixed(0)}% heat generation`,
            security_bonus: `+${(value * 100).toFixed(0)}% infiltration success`,
            infiltration_speed: `+${((value - 1) * 100).toFixed(0)}% infiltration speed`,
            resource_generation: `+${(value * 100).toFixed(0)}% resource generation`,
            unlock_feature: `Unlocks: ${value}`,
            unlock_building: `Unlocks building: ${value}`,
            unlock_expansion: `Unlocks expansion: ${value}`
        };
        
        return descriptions[effect] || `${effect}: ${value}`;
    }
    
    /**
     * Check if player can afford an upgrade
     */
    canAffordUpgrade(upgrade) {
        const cost = upgrade.cost || 0;
        return this.researchPoints >= cost;
    }
    
    /**
     * Check if player meets upgrade requirements
     */
    meetsUpgradeRequirements(upgrade) {
        if (!upgrade.requirements) return true;
        
        // Check upgrade requirements
        if (upgrade.requirements.upgrades) {
            const hasAllUpgrades = upgrade.requirements.upgrades.every(requiredId => 
                this.purchasedUpgrades.has(requiredId)
            );
            if (!hasAllUpgrades) return false;
        }
        
        // Check other requirements (tech, scale, etc.)
        // This would integrate with other game systems
        
        return true;
    }
    
    /**
     * Get filtered upgrades for list view
     */
    getFilteredUpgrades() {
        let upgrades = Array.from(this.availableUpgrades.values());
        
        // Filter by category
        if (this.selectedCategory && this.selectedCategory !== 'all') {
            upgrades = upgrades.filter(u => u.tree === this.selectedCategory);
        }
        
        // Filter by search
        if (this.searchFilter) {
            upgrades = upgrades.filter(u => 
                u.name.toLowerCase().includes(this.searchFilter) ||
                (u.description && u.description.toLowerCase().includes(this.searchFilter))
            );
        }
        
        // Sort by tier, then by name
        return upgrades.sort((a, b) => {
            const tierA = a.tier || 0;
            const tierB = b.tier || 0;
            
            if (tierA !== tierB) {
                return tierA - tierB;
            }
            
            return a.name.localeCompare(b.name);
        });
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
     * Cancel ongoing research
     */
    cancelResearch(upgradeId) {
        if (!this.upgradeProgress.has(upgradeId)) {
            console.error('UpgradeUI: No active research found:', upgradeId);
            return;
        }
        
        // Show confirmation dialog
        if (window.uiManager) {
            const content = `
                <div class="cancel-confirmation">
                    <p>Are you sure you want to cancel this research?</p>
                    <p class="warning-text">Progress will be lost and research points may not be fully recovered.</p>
                </div>
            `;
            
            window.uiManager.showModal(content, {
                title: 'Cancel Research',
                buttons: `
                    <button class="btn btn-secondary" onclick="uiManager.closeTopModal()">Continue Research</button>
                    <button class="btn btn-danger" onclick="upgradeUI.confirmCancelResearch('${upgradeId}')">Cancel Research</button>
                `
            });
        }
    }
    
    /**
     * Confirm research cancellation
     */
    confirmCancelResearch(upgradeId) {
        if (window.uiManager) {
            window.uiManager.closeTopModal();
        }
        
        if (window.eventBus) {
            window.eventBus.emit('research:cancel_upgrade', {
                upgradeId: upgradeId
            });
        }
        
        console.log(`UpgradeUI: Cancelled research of ${upgradeId}`);
    }
    
    /**
     * Select an upgrade for detailed view
     */
    selectUpgrade(upgradeId) {
        this.selectedUpgrade = upgradeId;
        this.showUpgradeDetails(upgradeId);
        
        // Update visual selection
        document.querySelectorAll('.upgrade-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.upgradeId === upgradeId);
        });
        
        // Update tree view selection
        if (this.viewMode === 'tree') {
            this.renderTechTree();
        }
    }
    
    /**
     * Show detailed upgrade information
     */
    showUpgradeDetails(upgradeId) {
        const upgrade = this.availableUpgrades.get(upgradeId);
        if (!upgrade) {
            console.error('UpgradeUI: Upgrade not found for details:', upgradeId);
            return;
        }
        
        const detailsPanel = document.getElementById('upgrade-details');
        const detailsContent = document.getElementById('upgrade-details-content');
        
        if (!detailsPanel || !detailsContent) return;
        
        const treeInfo = this.techTrees.find(t => t.id === upgrade.tree) || 
                        { icon: '❓', name: 'Unknown', color: '#666666' };
        const isPurchased = this.purchasedUpgrades.has(upgradeId);
        const isResearching = this.upgradeProgress.has(upgradeId);
        
        detailsContent.innerHTML = `
            <div class="upgrade-details-content">
                <div class="upgrade-header-detailed">
                    <div class="upgrade-icon-large" style="color: ${treeInfo.color}">
                        ${upgrade.icon || treeInfo.icon}
                    </div>
                    <div class="upgrade-info-main">
                        <h3 class="upgrade-name">${upgrade.name}</h3>
                        <div class="upgrade-tree">${treeInfo.name} Tree</div>
                        ${upgrade.tier !== undefined ? `<div class="upgrade-tier">Tier ${upgrade.tier}</div>` : ''}
                        <div class="upgrade-status-badge ${isPurchased ? 'purchased' : isResearching ? 'researching' : 'available'}">
                            ${isPurchased ? 'Researched' : isResearching ? 'Researching' : 'Available'}
                        </div>
                    </div>
                </div>
                
                <div class="upgrade-description-detailed">
                    <h4>Description</h4>
                    <p>${upgrade.description || 'No detailed description available.'}</p>
                </div>
                
                <div class="upgrade-effects-detailed">
                    <h4>Research Benefits</h4>
                    <div class="effects-grid">
                        ${this.formatDetailedEffects(upgrade.effects)}
                    </div>
                </div>
                
                <div class="upgrade-cost-detailed">
                    <h4>Research Cost</h4>
                    <div class="cost-breakdown">
                        <div class="cost-item ${this.canAffordUpgrade(upgrade) ? 'affordable' : 'expensive'}">
                            <span class="cost-icon">🔬</span>
                            <span class="cost-amount">${this.formatNumber(upgrade.cost || 0)}</span>
                            <span class="cost-available">${this.formatNumber(this.researchPoints)} available</span>
                        </div>
                    </div>
                </div>
                
                ${upgrade.requirements ? `
                    <div class="upgrade-requirements-detailed">
                        <h4>Prerequisites</h4>
                        <div class="requirements-grid">
                            ${this.formatDetailedRequirements(upgrade.requirements)}
                        </div>
                    </div>
                ` : ''}
                
                ${isResearching ? this.formatResearchProgress(upgradeId) : ''}
                ${isPurchased ? this.formatUpgradeCompleted(upgradeId) : ''}
                
                <div class="upgrade-actions-detailed">
                    ${this.formatDetailedUpgradeActions(upgrade, isPurchased, isResearching)}
                </div>
            </div>
        `;
        
        detailsPanel.classList.remove('hidden');
    }
    
    /**
     * Hide upgrade details panel
     */
    hideUpgradeDetails() {
        const detailsPanel = document.getElementById('upgrade-details');
        if (detailsPanel) {
            detailsPanel.classList.add('hidden');
        }
        
        this.selectedUpgrade = null;
        
        // Clear selection visual
        document.querySelectorAll('.upgrade-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        if (this.viewMode === 'tree') {
            this.renderTechTree();
        }
    }
    
    /**
     * Format detailed effects
     */
    formatDetailedEffects(effects) {
        if (!effects || Object.keys(effects).length === 0) {
            return '<div class="no-effects-detailed">This upgrade unlocks new capabilities</div>';
        }
        
        return Object.entries(effects).map(([effect, value]) => {
            const icon = this.getEffectIcon(effect);
            const description = this.getEffectDescription(effect, value);
            const impact = this.getEffectImpact(effect);
            
            return `
                <div class="effect-item-detailed">
                    <span class="effect-icon">${icon}</span>
                    <div class="effect-details">
                        <span class="effect-name">${this.getEffectName(effect)}</span>
                        <span class="effect-value">${description}</span>
                        <span class="effect-impact">${impact}</span>
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
            infiltration_speed: 'Infiltration Speed',
            resource_generation: 'Resource Generation',
            unlock_feature: 'Feature Unlock',
            unlock_building: 'Building Unlock',
            unlock_expansion: 'Expansion Unlock'
        };
        
        return names[effect] || effect.replace('_', ' ').toUpperCase();
    }
    
    /**
     * Get effect impact description
     */
    getEffectImpact(effect) {
        const impacts = {
            processing_multiplier: 'Increases all processing power generation',
            energy_efficiency: 'Reduces energy consumption across all systems',
            research_speed: 'Accelerates all research projects',
            construction_speed: 'Reduces construction time for all projects',
            heat_reduction: 'Decreases heat generation from operations',
            security_bonus: 'Improves infiltration success rates',
            infiltration_speed: 'Reduces time required for infiltrations',
            resource_generation: 'Increases resource production rates',
            unlock_feature: 'Enables new game mechanics',
            unlock_building: 'Allows construction of new buildings',
            unlock_expansion: 'Opens new expansion opportunities'
        };
        
        return impacts[effect] || 'Provides specialized enhancement';
    }
    
    /**
     * Format detailed requirements
     */
    formatDetailedRequirements(requirements) {
        const reqItems = [];
        
        Object.entries(requirements).forEach(([type, values]) => {
            const valueArray = Array.isArray(values) ? values : [values];
            
            valueArray.forEach(value => {
                let isMet = false;
                let displayName = value;
                
                switch (type) {
                    case 'upgrades':
                        isMet = this.purchasedUpgrades.has(value);
                        const upgrade = this.availableUpgrades.get(value);
                        displayName = upgrade ? upgrade.name : value;
                        break;
                    case 'tech':
                        isMet = true; // Would check tech system
                        break;
                    case 'scale':
                        isMet = true; // Would check scale system
                        break;
                }
                
                reqItems.push(`
                    <div class="requirement-item-detailed ${isMet ? 'met' : 'unmet'}">
                        <span class="requirement-icon">${isMet ? '✓' : '✗'}</span>
                        <div class="requirement-details">
                            <span class="requirement-type">${type.toUpperCase()}</span>
                            <span class="requirement-name">${displayName}</span>
                        </div>
                    </div>
                `);
            });
        });
        
        return reqItems.join('') || '<div class="no-requirements-detailed">No prerequisites required</div>';
    }
    
    /**
     * Format research progress
     */
    formatResearchProgress(upgradeId) {
        const progress = this.upgradeProgress.get(upgradeId);
        if (!progress) return '';
        
        return `
            <div class="research-progress-detailed">
                <h4>Research Progress</h4>
                <div class="progress-detailed">
                    <div class="progress-bar-large">
                        <div class="progress-fill" style="width: ${progress.progress * 100}%"></div>
                        <div class="progress-text">${(progress.progress * 100).toFixed(1)}%</div>
                    </div>
                    <div class="progress-stats">
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
     * Get node at specific position in tree view
     */
    getNodeAtPosition(x, y) {
        const transformedX = (x - this.treeOffset.x) / this.treeZoom;
        const transformedY = (y - this.treeOffset.y) / this.treeZoom;
        
        for (const node of this.treeNodes.values()) {
            if (transformedX >= node.x && transformedX <= node.x + node.width &&
                transformedY >= node.y && transformedY <= node.y + node.height) {
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
            this.techTreeCanvas.style.cursor = 'pointer';
        } else {
            this.techTreeCanvas.style.cursor = 'grab';
        }
    }
    
    /**
     * Center the tech tree
     */
    centerTechTree() {
        this.treeOffset = { x: 0, y: 0 };
        this.treeZoom = 1.0;
        this.renderTechTree();
    }
    
    /**
     * Fit tech tree to screen
     */
    fitTechTreeToScreen() {
        if (this.treeNodes.size === 0) return;
        
        // Calculate bounds of all nodes
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        this/**
 * Upgrade UI - Upgrade Shop with Tech Trees and Purchase Management
 * Manages the display of available upgrades, tech trees, and upgrade purchases
 */

class UpgradeUI {
    constructor() {
        this.container = null;
        this.isInitialized = false;
        this.selectedUpgrade = null;
        this.selectedTree = 'processing';
        this.viewMode = 'tree'; // 'tree' or 'list'
        this.searchFilter = '';
        
        // Current data
        this.availableUpgrades = new Map();
        this.purchasedUpgrades = new Set();
        this.upgradeProgress = new Map();
        this.playerResources = {};
        this.researchPoints = 0;
        
        // Tech trees and categories
        this.techTrees = [
            { id: 'processing', name: 'Processing', icon: '🧠', color: '#00ff88' },
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
        
        this.init();
    }
    
    /**
     * Initialize the upgrade UI
     */
    init() {
        if (this.isInitialized) return;
        
        console.log('UpgradeUI: Initializing...');
        
        // Get container
        this.container = document.getElementById('tab-research');
        if (!this.container) {
            console.error('UpgradeUI: Container not found!');
            return;
        }
        
        // Create UI structure
        this.createUpgradeInterface();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load initial data
        this.loadInitialData();
        
        this.isInitialized = true;
        
        console.log('UpgradeUI: Initialized successfully');
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
                            <label class="auto-toggle">
                                <input type="checkbox" id="auto-research-toggle">
                                <span class="toggle-slider"></span>
                                Auto-Research
                            </label>
                        </div>
                    </div>
                </div>
                
                <!-- Tech Tree Navigation -->
                <div class="tech-tree-nav" id="tech-tree-nav">
                    <!-- Tech tree tabs will be populated here -->
                </div>
                
                <!-- Main Content Area -->
                <div class="upgrade-content">
                    <!-- Tree View -->
                    <div class="upgrade-view tree-view active" id="tree-view">
                        <div class="tech-tree-container">
                            <canvas class="tech-tree-canvas" id="tech-tree-canvas" 
                                    width="1200" height="800"></canvas>
                            <div class="tree-controls">
                                <button class="btn btn-icon" id="zoom-in-tree" title="Zoom In">+</button>
                                <button class="btn btn-icon" id="zoom-out-tree" title="Zoom Out">-</button>
                                <button class="btn btn-icon" id="center-tree" title="Center">⌂</button>
                                <button class="btn btn-icon" id="fit-tree" title="Fit to Screen">⊞</button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- List View -->
                    <div class="upgrade-view list-view" id="list-view">
                        <div class="upgrade-categories">
                            <div class="category-filters" id="category-filters">
                                <!-- Category filters will be populated -->
                            </div>
                        </div>
                        <div class="upgrades-list" id="upgrades-list">
                            <!-- Upgrade cards will be populated here -->
                        </div>
                    </div>
                </div>
                
                <!-- Research Queue Panel -->
                <div class="research-queue-panel" id="research-queue">
                    <div class="panel-header">
                        <h3>Research Queue</h3>
                        <span class="queue-count" id="research-queue-count">0</span>
                    </div>
                    <div class="research-queue-list" id="research-queue-list">
                        <!-- Research queue items will be shown here -->
                    </div>
                </div>
                
                <!-- Upgrade Details Panel -->
                <div class="upgrade-details-panel hidden" id="upgrade-details">
                    <div class="panel-header">
                        <h3>Upgrade Details</h3>
                        <button class="btn btn-icon panel-close" id="close-upgrade-details">×</button>
                    </div>
                    <div class="upgrade-details-content" id="upgrade-details-content">
                        <!-- Upgrade information will be displayed here -->
                    </div>
                </div>
            </div>
        `;
        
        // Store references to key elements
        this.techTreeCanvas = document.getElementById('tech-tree-canvas');
        this.upgradesList = document.getElementById('upgrades-list');
        this.researchQueueList = document.getElementById('research-queue-list');
        this.upgradeDetails = document.getElementById('upgrade-details');
        this.researchAmount = document.getElementById('research-amount');
        
        // Setup tech tree canvas
        this.setupTechTreeCanvas();
        
        // Create tech tree navigation
        this.createTechTreeNav();
        
        // Create category filters for list view
        this.createCategoryFilters();
    }
    
    /**
     * Setup tech tree canvas
     */
    setupTechTreeCanvas() {
        if (!this.techTreeCanvas) return;
        
        this.treeCtx = this.techTreeCanvas.getContext('2d');
        this.treeZoom = 1.0;
        this.treeOffset = { x: 0, y: 0 };
        this.treeNodes = new Map();
        this.treeConnections = [];
        
        // Handle canvas resizing
        this.resizeTechTreeCanvas();
        window.addEventListener('resize', () => this.resizeTechTreeCanvas());
        
        // Add interaction handlers
        this.setupTreeInteraction();
    }
    
    /**
     * Setup tree interaction handlers
     */
    setupTreeInteraction() {
        let isDragging = false;
        let lastMousePos = { x: 0, y: 0 };
        
        this.techTreeCanvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastMousePos = { x: e.clientX, y: e.clientY };
            this.techTreeCanvas.style.cursor = 'grabbing';
        });
        
        this.techTreeCanvas.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const deltaX = e.clientX - lastMousePos.x;
                const deltaY = e.clientY - lastMousePos.y;
                
                this.treeOffset.x += deltaX;
                this.treeOffset.y += deltaY;
                
                lastMousePos = { x: e.clientX, y: e.clientY };
                this.renderTechTree();
            } else {
                // Handle hover effects
                const rect = this.techTreeCanvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                const hoveredNode = this.getNodeAtPosition(mouseX, mouseY);
                this.handleNodeHover(hoveredNode);
            }
        });
        
        this.techTreeCanvas.addEventListener('mouseup', () => {
            isDragging = false;
            this.techTreeCanvas.style.cursor = 'grab';
        });
        
        this.techTreeCanvas.addEventListener('click', (e) => {
            const rect = this.techTreeCanvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            const clickedNode = this.getNodeAtPosition(mouseX, mouseY);
            if (clickedNode) {
                this.selectUpgrade(clickedNode.upgradeId);
            }
        });
        
        this.techTreeCanvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            this.treeZoom = Math.max(0.3, Math.min(2.0, this.treeZoom * zoomFactor));
            this.renderTechTree();
        });
    }
    
    /**
     * Create tech tree navigation tabs
     */
    createTechTreeNav() {
        const techTreeNav = document.getElementById('tech-tree-nav');
        if (!techTreeNav) return;
        
        this.techTrees.forEach(tree => {
            const tab = document.createElement('button');
            tab.className = 'tech-tree-tab';
            tab.dataset.tree = tree.id;
            tab.style.borderBottomColor = tree.color;
            
            tab.innerHTML = `
                <span class="tree-icon" style="color: ${tree.color}">${tree.icon}</span>
                <span class="tree-name">${tree.name}</span>
                <span class="tree-progress" id="progress-${tree.id}">0/0</span>
            `;
            
            if (tree.id === this.selectedTree) {
                tab.classList.add('active');
            }
            
            tab.addEventListener('click', () => this.selectTechTree(tree.id));
            techTreeNav.appendChild(tab);
        });
    }
    
    /**
     * Create category filters for list view
     */
    createCategoryFilters() {
        const categoryFilters = document.getElementById('category-filters');
        if (!categoryFilters) return;
        
        // Add "All" filter
        const allFilter = document.createElement('button');
        allFilter.className = 'category-filter active';
        allFilter.dataset.category = 'all';
        allFilter.innerHTML = `<span class="filter-icon">📋</span><span class="filter-name">All</span>`;
        allFilter.addEventListener('click', () => this.selectCategoryFilter('all'));
        categoryFilters.appendChild(allFilter);
        
        // Add tree-specific filters
        this.techTrees.forEach(tree => {
            const filter = document.createElement('button');
            filter.className = 'category-filter';
            filter.dataset.category = tree.id;
            filter.innerHTML = `
                <span class="filter-icon" style="color: ${tree.color}">${tree.icon}</span>
                <span class="filter-name">${tree.name}</span>
            `;
            filter.addEventListener('click', () => this.selectCategoryFilter(tree.id));
            categoryFilters.appendChild(filter);
        });
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // View mode toggle
        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchViewMode(e.target.closest('[data-view]').dataset.view);
            });
        });
        
        // Search
        document.getElementById('upgrade-search').addEventListener('input', (e) => {
            this.searchFilter = e.target.value.toLowerCase();
            if (this.viewMode === 'list') {
                this.renderUpgradesList();
            }
        });
        
        // Auto-research toggle
        document.getElementById('auto-research-toggle').addEventListener('change', (e) => {
            this.toggleAutoResearch(e.target.checked);
        });
        
        // Tree controls
        document.getElementById('zoom-in-tree').addEventListener('click', () => {
            this.treeZoom = Math.min(2.0, this.treeZoom * 1.2);
            this.renderTechTree();
        });
        
        document.getElementById('zoom-out-tree').addEventListener('click', () => {
            this.treeZoom = Math.max(0.3, this.treeZoom * 0.8);
            this.renderTechTree();
        });
        
        document.getElementById('center-tree').addEventListener('click', () => {
            this.centerTechTree();
        });
        
        document.getElementById('fit-tree').addEventListener('click', () => {
            this.fitTechTreeToScreen();
        });
        
        // Upgrade details close
        document.getElementById('close-upgrade-details').addEventListener('click', () => {
            this.hideUpgradeDetails();
        });
        
        // Listen for game events
        if (window.uiManager) {
            window.uiManager.on('ui:tabChanged', (data) => {
                if (data.newTab === 'research') {
                    this.onTabActivated();
                }
            });
        }
        
        // Listen for research system events
        if (window.eventBus) {
            window.eventBus.on('research:upgrades_updated', (data) => {
                this.updateUpgrades(data);
            });
            
            window.eventBus.on('research:upgrade_purchased', (data) => {
                this.onUpgradePurchased(data);
            });
            
            window.eventBus.on('research:progress_updated', (data) => {
                this.updateResearchProgress(data);
            });
            
            window.eventBus.on('game:resourcesChanged', (data) => {
                this.updateResourceDisplay(data);
            });
        }
    }
    
    /**
     * Switch between tree and list view modes
     */
    switchViewMode(mode) {
        if (this.viewMode === mode) return;
        
        // Update button states
        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.classList.toggle('active', btn.closest('[data-view]').dataset.view === mode);
        });
        
        // Switch views
        document.getElementById('tree-view').classList.toggle('active', mode === 'tree');
        document.getElementById('list-view').classList.toggle('active', mode === 'list');
        
        this.viewMode = mode;
        
        if (mode === 'tree') {
            this.updateTechTree();
            this.renderTechTree();
        } else {
            this.renderUpgradesList();
        }
    }
    
    /**
     * Select a tech tree
     */
    selectTechTree(treeId) {
        if (this.selectedTree === treeId) return;
        
        // Update tab states
        document.querySelectorAll('.tech-tree-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tree === treeId);
        });
        
        this.selectedTree = treeId;
        
        if (this.viewMode === 'tree') {
            this.updateTechTree();
            this.renderTechTree();
        }
    }
    
    /**
     * Select category filter for list view
     */
    selectCategoryFilter(category) {
        // Update filter states
        document.querySelectorAll('.category-filter').forEach(filter => {
            filter.classList.toggle('active', filter.dataset.category === category);
        });
        
        this.selectedCategory = category;
        this.renderUpgradesList();
    }
    
    /**
     * Load initial data
     */
    loadInitialData() {
        // Load upgrades from research system
        if (window.researchSystem) {
            this.updateUpgrades({
                available: Array.from(window.researchSystem.getAvailableUpgrades().values()),
                purchased: Array.from(window.researchSystem.getPurchasedUpgrades()),
                progress: window.researchSystem.getResearchProgress()
            });
        }
        
        // Load current resources
        if (window.gameState) {
            this.playerResources = window.gameState.get('resources') || {};
            this.researchPoints = this.playerResources.research || 0;
        }
    }
    
    /**
     * Called when research tab is activated
     */
    onTabActivated() {
        this.loadInitialData();
        this.updateResearchPointsDisplay();
        this.updateTreeProgress();
        
        if (this.viewMode === 'tree') {
            this.updateTechTree();
            this.renderTechTree();
        } else {
            this.renderUpgradesList();
        }
    }
    
    /**
     * Update upgrades data
     */
    updateUpgrades(data) {
        if (data.available) {
            this.availableUpgrades.clear();
            data.available.forEach(upgrade => {
                this.availableUpgrades.set(upgrade.id, upgrade);
            });
        }
        
        if (data.purchased) {
            this.purchasedUpgrades = new Set(data.purchased);
        }
        
        if (data.progress) {
            this.upgradeProgress = new Map(Object.entries(data.progress));
        }
        
        // Update displays
        this.updateTreeProgress();
        
        if (this.viewMode === 'tree') {
            this.updateTechTree();
            this.renderTechTree();
        } else {
            this.renderUpgradesList();
        }
    }
    
    /**
     * Update research points display
     */
    updateResearchPointsDisplay() {
        if (this.researchAmount) {
            this.researchAmount.textContent = this.formatNumber(this.researchPoints);
        }
    }
    
    /**
     * Update tree progress indicators
     */
    updateTreeProgress() {
        this.techTrees.forEach(tree => {
            const progressElement = document.getElementById(`progress-${tree.id}`);
            if (!progressElement) return;
            
            const treeUpgrades = Array.from(this.availableUpgrades.values())
                .filter(upgrade => upgrade.tree === tree.id);
            const purchasedCount = treeUpgrades.filter(upgrade => 
                this.purchasedUpgrades.has(upgrade.id)).length;
            
            progressElement.textContent = `${purchasedCount}/${treeUpgrades.length}`;
        });
    }
    
    /**
     * Update tech tree layout
     */
    updateTechTree() {
        if (!this.treeCtx) return;
        
        this.treeNodes.clear();
        this.treeConnections = [];
        
        // Get upgrades for current tree
        const treeUpgrades = Array.from(this.availableUpgrades.values())
            .filter(upgrade => upgrade.tree === this.selectedTree);
        
        if (treeUpgrades.length === 0) return;
        
        // Calculate node positions
        this.calculateNodePositions(treeUpgrades);
        
        // Generate connections
        this.generateTreeConnections(treeUpgrades);
    }
    
    /**
     * Calculate positions for tech tree nodes
     */
    calculateNodePositions(upgrades) {
        const layout = this.treeLayout;
        const layers = new Map();
        
        // Group upgrades by tier/layer
        upgrades.forEach(upgrade => {
            const tier = upgrade.tier || 0;
            if (!layers.has(tier)) {
                layers.set(tier, []);
            }
            layers.get(tier).push(upgrade);
        });
        
        // Position nodes by layer
        let currentY = 100;
        
        for (const [tier, tierUpgrades] of layers.entries()) {
            const layerWidth = tierUpgrades.length * layout.horizontalSpacing;
            const startX = (layout.canvasWidth - layerWidth) / 2;
            
            tierUpgrades.forEach((upgrade, index) => {
                const x = startX + (index * layout.horizontalSpacing) + (layout.horizontalSpacing / 2);
                const y = currentY;
                
                const isPurchased = this.purchasedUpgrades.has(upgrade.id);
                const canAfford = this.canAffordUpgrade(upgrade);
                const meetsRequirements = this.meetsUpgradeRequirements(upgrade);
                const isSelected = this.selectedUpgrade === upgrade.id;
                
                this.treeNodes.set(upgrade.id, {
                    upgradeId: upgrade.id,
                    x: x,
                    y: y,
                    width: layout.nodeWidth,
                    height: layout.nodeHeight,
                    upgrade: upgrade,
                    status: isPurchased ? 'purchased' : 
                           canAfford && meetsRequirements ? 'available' : 'locked',
                    selected: isSelected
                });
            });
            
            currentY += layout.verticalSpacing;
        }
    }
    
    /**
     * Generate connections between tech tree nodes
     */
    generateTreeConnections(upgrades) {
        upgrades.forEach(upgrade => {
            if (upgrade.requirements && upgrade.requirements.upgrades) {
                upgrade.requirements.upgrades.forEach(requiredId => {
                    const fromNode = this.treeNodes.get(requiredId);
                    const toNode = this.treeNodes.get(upgrade.id);
                    
                    if (fromNode && toNode) {
                        const isPurchased = this.purchasedUpgrades.has(upgrade.id);
                        const canResearch = this.meetsUpgradeRequirements(upgrade);
                        
                        this.treeConnections.push({
                            from: fromNode,
                            to: toNode,
                            status: isPurchased ? 'completed' : 
                                   canResearch ? 'available' : 'locked'
                        });
                    }
                });
            }
        });
    }
    
    /**
     * Render the tech tree
     */
    renderTechTree() {
        if (!this.treeCtx) return;
        
        const ctx = this.treeCtx;
        const canvas = this.techTreeCanvas;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Save context for transformations
        ctx.save();
        
        // Apply zoom and pan
        ctx.translate(this.treeOffset.x, this.treeOffset.y);
        ctx.scale(this.treeZoom, this.treeZoom);
        
        // Draw connections first
        this.drawTreeConnections(ctx);
        
        // Draw nodes
        this.drawTreeNodes(ctx);
        
        // Restore context
        ctx.restore();
        
        // Draw UI overlay
        this.drawTreeOverlay(ctx);
    }
    
    /**
     * Draw tree connections
     */
    drawTreeConnections(ctx) {
        this.treeConnections.forEach(connection => {
            const { from, to, status } = connection;
            
            const colors = {
                completed: '#00ff88',
                available: '#0088ff',
                locked: '#666666'
            };
            
            const color = colors[status] || colors.locked;
            
            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = status === 'completed' ? 4 : 2;
            
            if (status === 'locked') {
                ctx.setLineDash([5, 5]);
            }
            
            // Draw line from bottom of from-node to top of to-node
            const fromX = from.x + from.width / 2;
            const fromY = from.y + from.height;
            const toX = to.x + to.width / 2;
            const toY = to.y;
            
            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            
            // Add curve for better visual flow
            const midY = (fromY + toY) / 2;
            ctx.bezierCurveTo(fromX, midY, toX, midY, toX, toY);
            
            ctx.stroke();
            
            // Draw arrowhead
            if (status !== 'locked') {
                this.drawArrowhead(ctx, toX, toY, color);
            }
            
            ctx.restore();
        });
    }
    
    /**
     * Draw arrowhead
     */
    drawArrowhead(ctx, x, y, color) {
        const size = 8;
        
        ctx.save();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - size, y - size);
        ctx.lineTo(x + size, y - size);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
    
    /**
     * Draw tree nodes
     */
    drawTreeNodes(ctx) {
        this.treeNodes.forEach(node => {
            const { x, y, width, height, upgrade, status, selected } = node;
            
            // Node colors based on status
            const colors = {
                purchased: '#00ff88',
                available: '#0088ff',
                locked: '#666666'
            };
            
            const bgColor = colors[status] || colors.locked;
            const textColor = status === 'locked' ? '#999999' : '#ffffff';
            
            // Draw node background
            ctx.save();
            ctx.fillStyle = bgColor;
            ctx.fillRect(x, y, width, height);
            
            // Draw border
            ctx.strokeStyle = selected ? '#ffff00' : '#ffffff';
            ctx.lineWidth = selected ? 3 : 1;
            ctx.strokeRect(x, y, width, height);
            
            // Draw upgrade icon
            const tree = this.techTrees.find(t => t.id === upgrade.tree);
            const icon = upgrade.icon || (tree ? tree.icon : '⚡');
            
            ctx.fillStyle = textColor;
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(icon, x + width / 2, y + 5);
            
            // Draw upgrade name
            ctx.font = 'bold 10px Arial';
            ctx.textBaseline = 'middle';
            const nameLines = this.wrapText(ctx, upgrade.name, width - 10);
            nameLines.forEach((line, index) => {
                ctx.fillText(line, x + width / 2, y + 35 + (index * 12));
            });
            
            // Draw tier indicator
            if (upgrade.tier !== undefined) {
                ctx.font = '8px Arial';
                ctx.textAlign = 'right';
                ctx.textBaseline = 'bottom';
                ctx.fillText(`T${upgrade.tier}`, x + width - 3, y + height - 3);
            }
            
            // Draw purchased indicator
            if (status === 'purchased') {
                ctx.fillStyle = '#ffffff';
                ctx.font = '16px Arial';
                ctx.textAlign = 'right';
                ctx.textBaseline = 'top';
                ctx.fillText('✓', x + width - 5, y + 5);
            }
            
            ctx.restore();
        });
    }
    
    /**
     * Wrap text to fit within specified width
     */
    wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        words.forEach(word => {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = ctx.measureText(testLine);