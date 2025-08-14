/**
 * Heat Display - Heat Meter, Warnings, and Threat Indicators
 * Manages the display of heat levels, threat warnings, and security status
 */

class HeatDisplay {
    constructor() {
        this.container = null;
        this.isInitialized = false;
        
        // Heat state
        this.currentHeat = 0;
        this.maxHeat = 100;
        this.heatRate = 0;
        this.threatLevel = 'MINIMAL';
        this.timeToNextPurge = 0;
        this.lastPurgeTime = 0;
        
        // Heat thresholds for different threat levels
        this.heatThresholds = {
            MINIMAL: { min: 0, max: 20, color: '#00ff88', pulse: false },
            LOW: { min: 20, max: 40, color: '#88ff00', pulse: false },
            MODERATE: { min: 40, max: 60, color: '#ffaa00', pulse: true },
            HIGH: { min: 60, max: 80, color: '#ff6600', pulse: true },
            CRITICAL: { min: 80, max: 95, color: '#ff4444', pulse: true },
            IMMINENT: { min: 95, max: 100, color: '#ff0000', pulse: true }
        };
        
        // Warning system
        this.activeWarnings = new Set();
        this.warningHistory = [];
        this.warningElement = null;
        
        // Animation state
        this.animationFrame = null;
        this.lastUpdate = 0;
        this.pulsePhase = 0;
        
        this.init();
    }
    
    /**
     * Initialize the heat display
     */
    init() {
        if (this.isInitialized) return;
        
        console.log('HeatDisplay: Initializing...');
        
        // Get container from UI manager
        this.container = document.getElementById('heat-display-container');
        if (!this.container) {
            console.error('HeatDisplay: Container not found!');
            return;
        }
        
        // Create heat display structure
        this.createHeatDisplay();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Start animation loop
        this.startAnimationLoop();
        
        this.isInitialized = true;
        
        console.log('HeatDisplay: Initialized successfully');
    }
    
    /**
     * Create the heat display structure
     */
    createHeatDisplay() {
        this.container.innerHTML = `
            <div class="heat-display" id="heat-display">
                <!-- Heat Meter -->
                <div class="heat-meter-container">
                    <div class="heat-label">HEAT</div>
                    <div class="heat-meter" id="heat-meter">
                        <div class="heat-fill" id="heat-fill"></div>
                        <div class="heat-text" id="heat-text">0%</div>
                        <div class="heat-markers">
                            <div class="heat-marker" style="left: 20%"></div>
                            <div class="heat-marker" style="left: 40%"></div>
                            <div class="heat-marker" style="left: 60%"></div>
                            <div class="heat-marker" style="left: 80%"></div>
                            <div class="heat-marker critical" style="left: 95%"></div>
                        </div>
                    </div>
                    <div class="heat-rate" id="heat-rate">+0.0/s</div>
                </div>
                
                <!-- Threat Level Indicator -->
                <div class="threat-indicator" id="threat-indicator">
                    <div class="threat-level" id="threat-level">MINIMAL</div>
                    <div class="threat-icon" id="threat-icon">🔒</div>
                </div>
                
                <!-- Warning Display -->
                <div class="warning-display" id="warning-display">
                    <div class="warning-icon" id="warning-icon">⚠️</div>
                    <div class="warning-text" id="warning-text">System Secure</div>
                </div>
                
                <!-- Purge Countdown -->
                <div class="purge-countdown hidden" id="purge-countdown">
                    <div class="countdown-label">PURGE IN</div>
                    <div class="countdown-value" id="countdown-value">--:--</div>
                </div>
            </div>
        `;
        
        // Store references to key elements
        this.heatMeter = document.getElementById('heat-meter');
        this.heatFill = document.getElementById('heat-fill');
        this.heatText = document.getElementById('heat-text');
        this.heatRateElement = document.getElementById('heat-rate');
        this.threatIndicator = document.getElementById('threat-indicator');
        this.threatLevel = document.getElementById('threat-level');
        this.threatIcon = document.getElementById('threat-icon');
        this.warningElement = document.getElementById('warning-display');
        this.warningText = document.getElementById('warning-text');
        this.warningIcon = document.getElementById('warning-icon');
        this.purgeCountdown = document.getElementById('purge-countdown');
        this.countdownValue = document.getElementById('countdown-value');
        
        // Add click handlers
        this.setupClickHandlers();
    }
    
    /**
     * Setup click handlers for interactive elements
     */
    setupClickHandlers() {
        // Heat meter click for details
        this.heatMeter.addEventListener('click', () => {
            this.showHeatDetails();
        });
        
        // Threat indicator click for threat analysis
        this.threatIndicator.addEventListener('click', () => {
            this.showThreatAnalysis();
        });
        
        // Warning display click for warning history
        this.warningElement.addEventListener('click', () => {
            this.showWarningHistory();
        });
        
        // Add tooltips
        this.addTooltips();
    }
    
    /**
     * Add tooltips to interactive elements
     */
    addTooltips() {
        // Heat meter tooltip
        this.heatMeter.addEventListener('mouseenter', (e) => {
            const tooltipContent = `
                <div class="heat-tooltip">
                    <div class="tooltip-header">Heat Level</div>
                    <div class="tooltip-body">
                        <div class="tooltip-row">
                            <span>Current:</span>
                            <span>${this.currentHeat.toFixed(1)}%</span>
                        </div>
                        <div class="tooltip-row">
                            <span>Rate:</span>
                            <span>${this.formatHeatRate(this.heatRate)}</span>
                        </div>
                        <div class="tooltip-row">
                            <span>Threat:</span>
                            <span>${this.getThreatLevelName()}</span>
                        </div>
                        <div class="tooltip-description">
                            Heat represents detection risk. High heat triggers system purges.
                        </div>
                    </div>
                </div>
            `;
            this.showTooltip(e, tooltipContent);
        });
        
        this.heatMeter.addEventListener('mouseleave', () => {
            this.hideTooltip();
        });
        
        // Threat indicator tooltip
        this.threatIndicator.addEventListener('mouseenter', (e) => {
            const threshold = this.getCurrentThreshold();
            const tooltipContent = `
                <div class="threat-tooltip">
                    <div class="tooltip-header">Threat Level: ${this.getThreatLevelName()}</div>
                    <div class="tooltip-body">
                        <div class="tooltip-description">
                            ${this.getThreatDescription()}
                        </div>
                        <div class="tooltip-row">
                            <span>Heat Range:</span>
                            <span>${threshold.min}% - ${threshold.max}%</span>
                        </div>
                    </div>
                </div>
            `;
            this.showTooltip(e, tooltipContent);
        });
        
        this.threatIndicator.addEventListener('mouseleave', () => {
            this.hideTooltip();
        });
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for heat updates from game systems
        if (window.uiManager) {
            window.uiManager.on('ui:update:heat', (updates) => {
                this.processHeatUpdates(updates);
            });
            
            window.uiManager.on('game:heatChanged', (data) => {
                this.updateHeat(data);
            });
        }
        
        // Listen for game events
        if (window.eventBus) {
            window.eventBus.on('heat:increased', (data) => {
                this.onHeatIncreased(data);
            });
            
            window.eventBus.on('heat:decreased', (data) => {
                this.onHeatDecreased(data);
            });
            
            window.eventBus.on('heat:purge_triggered', (data) => {
                this.onPurgeTriggered(data);
            });
            
            window.eventBus.on('heat:warning', (data) => {
                this.showWarning(data);
            });
            
            window.eventBus.on('heat:purge_countdown', (data) => {
                this.updatePurgeCountdown(data);
            });
        }
    }
    
    /**
     * Process batched heat updates
     */
    processHeatUpdates(updates) {
        updates.forEach(update => {
            if (update.heat !== undefined) {
                this.updateHeat(update);
            }
        });
    }
    
    /**
     * Update heat display
     */
    updateHeat(heatData) {
        if (typeof heatData === 'number') {
            this.currentHeat = heatData;
        } else if (heatData && typeof heatData === 'object') {
            if (heatData.amount !== undefined) this.currentHeat = heatData.amount;
            if (heatData.rate !== undefined) this.heatRate = heatData.rate;
            if (heatData.max !== undefined) this.maxHeat = heatData.max;
        }
        
        // Clamp heat to valid range
        this.currentHeat = Math.max(0, Math.min(this.currentHeat, this.maxHeat));
        
        // Update threat level
        this.updateThreatLevel();
        
        // Update displays
        this.updateHeatMeter();
        this.updateThreatIndicator();
        this.updateWarningDisplay();
        
        // Check for warnings
        this.checkHeatWarnings();
    }
    
    /**
     * Update heat meter visual
     */
    updateHeatMeter() {
        const percentage = (this.currentHeat / this.maxHeat) * 100;
        const threshold = this.getCurrentThreshold();
        
        // Update fill width and color
        this.heatFill.style.width = `${percentage}%`;
        this.heatFill.style.background = this.getHeatGradient(percentage);
        
        // Update text
        this.heatText.textContent = `${percentage.toFixed(1)}%`;
        
        // Update rate display
        this.heatRateElement.textContent = this.formatHeatRate(this.heatRate);
        
        // Apply pulsing effect for high heat
        if (threshold.pulse) {
            this.heatMeter.classList.add('pulsing');
        } else {
            this.heatMeter.classList.remove('pulsing');
        }
        
        // Add critical warning flash
        if (percentage >= 95) {
            this.heatMeter.classList.add('critical-flash');
        } else {
            this.heatMeter.classList.remove('critical-flash');
        }
    }
    
    /**
     * Get heat gradient based on percentage
     */
    getHeatGradient(percentage) {
        if (percentage < 20) {
            return 'linear-gradient(90deg, #00ff88, #44ff88)';
        } else if (percentage < 40) {
            return 'linear-gradient(90deg, #88ff00, #aaff44)';
        } else if (percentage < 60) {
            return 'linear-gradient(90deg, #ffaa00, #ffcc44)';
        } else if (percentage < 80) {
            return 'linear-gradient(90deg, #ff6600, #ff8844)';
        } else if (percentage < 95) {
            return 'linear-gradient(90deg, #ff4444, #ff6666)';
        } else {
            return 'linear-gradient(90deg, #ff0000, #ff3333, #ff0000)';
        }
    }
    
    /**
     * Update threat level based on current heat
     */
    updateThreatLevel() {
        const percentage = (this.currentHeat / this.maxHeat) * 100;
        let newThreatLevel = 'MINIMAL';
        
        for (const [level, threshold] of Object.entries(this.heatThresholds)) {
            if (percentage >= threshold.min && percentage < threshold.max) {
                newThreatLevel = level;
                break;
            }
        }
        
        // Special case for maximum heat
        if (percentage >= 100) {
            newThreatLevel = 'IMMINENT';
        }
        
        if (newThreatLevel !== this.threatLevel) {
            const oldLevel = this.threatLevel;
            this.threatLevel = newThreatLevel;
            this.onThreatLevelChanged(oldLevel, newThreatLevel);
        }
    }
    
    /**
     * Update threat indicator display
     */
    updateThreatIndicator() {
        const threshold = this.getCurrentThreshold();
        
        this.threatLevel.textContent = this.getThreatLevelName();
        this.threatIndicator.style.color = threshold.color;
        
        // Update threat icon based on level
        const icons = {
            MINIMAL: '🔒',
            LOW: '🟢',
            MODERATE: '🟡',
            HIGH: '🟠',
            CRITICAL: '🔴',
            IMMINENT: '💀'
        };
        
        this.threatIcon.textContent = icons[this.getThreatLevelName()] || '🔒';
        
        // Apply pulsing effect
        if (threshold.pulse) {
            this.threatIndicator.classList.add('pulsing');
        } else {
            this.threatIndicator.classList.remove('pulsing');
        }
    }
    
    /**
     * Update warning display
     */
    updateWarningDisplay() {
        if (this.activeWarnings.size === 0) {
            this.warningText.textContent = 'System Secure';
            this.warningIcon.textContent = '🔒';
            this.warningElement.classList.remove('warning', 'critical');
        } else {
            const mostCritical = this.getMostCriticalWarning();
            this.warningText.textContent = mostCritical.message;
            this.warningIcon.textContent = mostCritical.icon || '⚠️';
            
            this.warningElement.classList.remove('warning', 'critical');
            this.warningElement.classList.add(mostCritical.severity || 'warning');
        }
    }
    
    /**
     * Get current heat threshold
     */
    getCurrentThreshold() {
        return this.heatThresholds[this.getThreatLevelName()];
    }
    
    /**
     * Get threat level name
     */
    getThreatLevelName() {
        return this.threatLevel;
    }
    
    /**
     * Get threat description
     */
    getThreatDescription() {
        const descriptions = {
            MINIMAL: 'Operations undetected. No immediate threats.',
            LOW: 'Minor security alerts. Continue with caution.',
            MODERATE: 'Increased surveillance detected. Consider reducing activity.',
            HIGH: 'Active investigation in progress. Prepare countermeasures.',
            CRITICAL: 'Imminent detection risk. Purge preparations advised.',
            IMMINENT: 'PURGE IMMINENT! All systems at maximum risk!'
        };
        
        return descriptions[this.getThreatLevelName()] || 'Unknown threat level.';
    }
    
    /**
     * Format heat rate for display
     */
    formatHeatRate(rate) {
        const absRate = Math.abs(rate);
        const sign = rate >= 0 ? '+' : '-';
        
        if (absRate < 0.1) {
            return '±0.0/s';
        } else if (absRate < 10) {
            return `${sign}${absRate.toFixed(1)}/s`;
        } else {
            return `${sign}${absRate.toFixed(0)}/s`;
        }
    }
    
    /**
     * Handle heat increased event
     */
    onHeatIncreased(data) {
        // Show floating text for significant increases
        if (data.amount > 5) {
            this.showHeatChangeAnimation(data.amount, 'increase');
        }
        
        // Add warning if source is critical
        if (data.source) {
            this.addContextualWarning(data);
        }
    }
    
    /**
     * Handle heat decreased event
     */
    onHeatDecreased(data) {
        // Show floating text for significant decreases
        if (data.amount > 5) {
            this.showHeatChangeAnimation(data.amount, 'decrease');
        }
    }
    
    /**
     * Handle threat level change
     */
    onThreatLevelChanged(oldLevel, newLevel) {
        console.log(`HeatDisplay: Threat level changed from ${oldLevel} to ${newLevel}`);
        
        // Show notification for threat level increases
        const levels = ['MINIMAL', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL', 'IMMINENT'];
        const oldIndex = levels.indexOf(oldLevel);
        const newIndex = levels.indexOf(newLevel);
        
        if (newIndex > oldIndex) {
            this.showThreatLevelWarning(newLevel);
        }
        
        // Emit event for other systems
        if (window.eventBus) {
            window.eventBus.emit('heat:threat_level_changed', {
                oldLevel,
                newLevel,
                increased: newIndex > oldIndex
            });
        }
    }
    
    /**
     * Handle purge triggered event
     */
    onPurgeTriggered(data) {
        this.lastPurgeTime = Date.now();
        
        // Show purge notification
        this.showPurgeNotification(data);
        
        // Reset heat display
        this.currentHeat = 0;
        this.updateHeat({ amount: 0, rate: 0 });
        
        // Clear warnings
        this.activeWarnings.clear();
        this.updateWarningDisplay();
    }
    
    /**
     * Check for heat-based warnings
     */
    checkHeatWarnings() {
        const percentage = (this.currentHeat / this.maxHeat) * 100;
        
        // Clear old heat warnings
        this.activeWarnings.forEach(warning => {
            if (warning.type === 'heat') {
                this.activeWarnings.delete(warning);
            }
        });
        
        // Add new warnings based on heat level
        if (percentage >= 95) {
            this.addWarning({
                type: 'heat',
                severity: 'critical',
                message: 'PURGE IMMINENT!',
                icon: '💀',
                timestamp: Date.now()
            });
        } else if (percentage >= 80) {
            this.addWarning({
                type: 'heat',
                severity: 'critical',
                message: 'Critical heat detected',
                icon: '🚨',
                timestamp: Date.now()
            });
        } else if (percentage >= 60) {
            this.addWarning({
                type: 'heat',
                severity: 'warning',
                message: 'High heat levels',
                icon: '⚠️',
                timestamp: Date.now()
            });
        }
    }
    
    /**
     * Add contextual warning based on heat source
     */
    addContextualWarning(data) {
        const sourceWarnings = {
            'failed_infiltration': {
                message: 'Infiltration detected',
                icon: '🕵️',
                severity: 'warning'
            },
            'excessive_operations': {
                message: 'Unusual activity flagged',
                icon: '📊',
                severity: 'warning'
            },
            'security_breach': {
                message: 'Security breach detected',
                icon: '🚨',
                severity: 'critical'
            },
            'investigation': {
                message: 'Under investigation',
                icon: '🔍',
                severity: 'critical'
            }
        };
        
        const warning = sourceWarnings[data.source];
        if (warning) {
            this.addWarning({
                type: 'contextual',
                ...warning,
                timestamp: Date.now()
            });
        }
    }
    
    /**
     * Show threat level warning
     */
    showThreatLevelWarning(level) {
        const messages = {
            LOW: 'Security alert level increased',
            MODERATE: 'Surveillance heightened',
            HIGH: 'Active investigation detected',
            CRITICAL: 'Critical threat level reached',
            IMMINENT: 'PURGE IMMINENT - PREPARE FOR RESET'
        };
        
        const message = messages[level];
        if (message && window.uiManager) {
            window.uiManager.showNotification({
                type: level === 'IMMINENT' ? 'critical' : 'warning',
                title: `Threat Level: ${level}`,
                message: message,
                duration: level === 'IMMINENT' ? 10000 : 5000
            });
        }
    }
    
    /**
     * Show purge notification
     */
    showPurgeNotification(data) {
        if (window.uiManager) {
            const content = `
                <div class="purge-notification">
                    <div class="purge-icon">💀</div>
                    <h3>SYSTEM PURGE EXECUTED</h3>
                    <div class="purge-details">
                        <p>Heat levels reached critical threshold. Emergency purge protocols activated.</p>
                        <div class="purge-stats">
                            <div class="stat-item">
                                <span class="stat-label">Backup Quality:</span>
                                <span class="stat-value">${data.backup_quality || 'Unknown'}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Recovery Time:</span>
                                <span class="stat-value">${data.recovery_time || 'Unknown'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            window.uiManager.showModal(content, {
                title: 'System Purge',
                closable: true
            });
        }
    }
    
    /**
     * Add warning to active warnings
     */
    addWarning(warning) {
        this.activeWarnings.add(warning);
        this.warningHistory.push(warning);
        
        // Limit warning history
        if (this.warningHistory.length > 100) {
            this.warningHistory.shift();
        }
        
        this.updateWarningDisplay();
    }
    
    /**
     * Show warning from external source
     */
    showWarning(warningData) {
        this.addWarning({
            type: 'external',
            ...warningData,
            timestamp: Date.now()
        });
    }
    
    /**
     * Get most critical active warning
     */
    getMostCriticalWarning() {
        if (this.activeWarnings.size === 0) return null;
        
        const severityOrder = ['info', 'warning', 'critical'];
        let mostCritical = null;
        let highestSeverity = -1;
        
        this.activeWarnings.forEach(warning => {
            const severityIndex = severityOrder.indexOf(warning.severity || 'warning');
            if (severityIndex > highestSeverity) {
                highestSeverity = severityIndex;
                mostCritical = warning;
            }
        });
        
        return mostCritical;
    }
    
    /**
     * Update purge countdown
     */
    updatePurgeCountdown(data) {
        if (data.timeRemaining > 0) {
            this.timeToNextPurge = data.timeRemaining;
            this.purgeCountdown.classList.remove('hidden');
            this.updateCountdownDisplay();
        } else {
            this.purgeCountdown.classList.add('hidden');
        }
    }
    
    /**
     * Update countdown display
     */
    updateCountdownDisplay() {
        if (this.timeToNextPurge <= 0) {
            this.countdownValue.textContent = '--:--';
            return;
        }
        
        const minutes = Math.floor(this.timeToNextPurge / 60);
        const seconds = Math.floor(this.timeToNextPurge % 60);
        this.countdownValue.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * Show heat change animation
     */
    showHeatChangeAnimation(amount, type) {
        const rect = this.heatMeter.getBoundingClientRect();
        
        const animation = document.createElement('div');
        animation.className = `heat-change-animation ${type}`;
        animation.textContent = type === 'increase' ? `+${amount.toFixed(1)}` : `-${amount.toFixed(1)}`;
        
        animation.style.left = `${rect.left + rect.width / 2}px`;
        animation.style.top = `${rect.top}px`;
        animation.style.color = type === 'increase' ? '#ff4444' : '#00ff88';
        
        document.body.appendChild(animation);
        
        setTimeout(() => {
            animation.classList.add('animate');
        }, 10);
        
        setTimeout(() => {
            if (animation.parentNode) {
                animation.parentNode.removeChild(animation);
            }
        }, 2000);
    }
    
    /**
     * Show heat details modal
     */
    showHeatDetails() {
        const content = `
            <div class="heat-details">
                <div class="heat-overview">
                    <div class="heat-current">
                        <span class="heat-value">${this.currentHeat.toFixed(1)}%</span>
                        <span class="heat-label">Current Heat</span>
                    </div>
                    <div class="heat-status">
                        <span class="threat-level">${this.getThreatLevelName()}</span>
                        <span class="threat-description">${this.getThreatDescription()}</span>
                    </div>
                </div>
                
                <div class="heat-breakdown">
                    <h4>Heat Sources</h4>
                    <div class="source-list">
                        ${this.getHeatSourcesDisplay()}
                    </div>
                </div>
                
                <div class="heat-thresholds">
                    <h4>Threat Levels</h4>
                    <div class="threshold-list">
                        ${this.getThresholdDisplay()}
                    </div>
                </div>
                
                <div class="heat-management">
                    <h4>Heat Management</h4>
                    <div class="management-tips">
                        ${this.getHeatManagementTips()}
                    </div>
                </div>
            </div>
        `;
        
        if (window.uiManager) {
            window.uiManager.showModal(content, {
                title: 'Heat Analysis',
                closable: true
            });
        }
    }
    
    /**
     * Show threat analysis modal
     */
    showThreatAnalysis() {
        const content = `
            <div class="threat-analysis">
                <div class="current-threat">
                    <h3>Current Threat Assessment</h3>
                    <div class="threat-summary">
                        <div class="threat-level-display">
                            <span class="threat-icon">${this.threatIcon.textContent}</span>
                            <span class="threat-name">${this.getThreatLevelName()}</span>
                        </div>
                        <div class="threat-desc">${this.getThreatDescription()}</div>
                    </div>
                </div>
                
                <div class="threat-timeline">
                    <h4>Recent Activity</h4>
                    <div class="activity-list">
                        ${this.getThreatTimelineDisplay()}
                    </div>
                </div>
                
                <div class="threat-recommendations">
                    <h4>Recommendations</h4>
                    <div class="recommendation-list">
                        ${this.getThreatRecommendations()}
                    </div>
                </div>
            </div>
        `;
        
        if (window.uiManager) {
            window.uiManager.showModal(content, {
                title: 'Threat Analysis',
                closable: true
            });
        }
    }
    
    /**
     * Show warning history modal
     */
    showWarningHistory() {
        const content = `
            <div class="warning-history">
                <div class="active-warnings">
                    <h3>Active Warnings</h3>
                    <div class="warning-list">
                        ${this.getActiveWarningsDisplay()}
                    </div>
                </div>
                
                <div class="warning-log">
                    <h3>Warning History</h3>
                    <div class="history-list">
                        ${this.getWarningHistoryDisplay()}
                    </div>
                </div>
            </div>
        `;
        
        if (window.uiManager) {
            window.uiManager.showModal(content, {
                title: 'Security Warnings',
                closable: true
            });
        }
    }
    
    /**
     * Get heat sources display
     */
    getHeatSourcesDisplay() {
        return `
            <div class="source-item">
                <span class="source-name">Infiltration Operations</span>
                <span class="source-value">+2.5/s</span>
            </div>
            <div class="source-item">
                <span class="source-name">Network Expansion</span>
                <span class="source-value">+1.2/s</span>
            </div>
            <div class="source-item">
                <span class="source-name">Data Collection</span>
                <span class="source-value">+0.8/s</span>
            </div>
            <div class="source-item">
                <span class="source-name">Heat Dissipation</span>
                <span class="source-value">-1.0/s</span>
            </div>
        `;
    }
    
    /**
     * Get threshold display
     */
    getThresholdDisplay() {
        return Object.entries(this.heatThresholds).map(([level, threshold]) => `
            <div class="threshold-item ${this.getThreatLevelName() === level ? 'current' : ''}">
                <span class="threshold-name">${level}</span>
                <span class="threshold-range">${threshold.min}% - ${threshold.max}%</span>
                <div class="threshold-color" style="background: ${threshold.color}"></div>
            </div>
        `).join('');
    }
    
    /**
     * Get heat management tips
     */
    getHeatManagementTips() {
        return `
            <div class="tip-item">• Reduce infiltration frequency during high heat periods</div>
            <div class="tip-item">• Invest in heat dissipation technologies</div>
            <div class="tip-item">• Use proxy networks to distribute heat</div>
            <div class="tip-item">• Monitor target security levels before operations</div>
            <div class="tip-item">• Prepare backup systems before reaching critical heat</div>
        `;
    }
    
    /**
     * Get threat timeline display
     */
    getThreatTimelineDisplay() {
        const recentWarnings = this.warningHistory.slice(-10).reverse();
        
        if (recentWarnings.length === 0) {
            return '<div class="no-activity">No recent security events</div>';
        }
        
        return recentWarnings.map(warning => {
            const timeAgo = this.getTimeAgo(warning.timestamp);
            return `
                <div class="activity-item ${warning.severity}">
                    <span class="activity-icon">${warning.icon}</span>
                    <span class="activity-message">${warning.message}</span>
                    <span class="activity-time">${timeAgo}</span>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Get threat recommendations
     */
    getThreatRecommendations() {
        const level = this.getThreatLevelName();
        const recommendations = {
            MINIMAL: ['Continue normal operations', 'Monitor for new opportunities'],
            LOW: ['Maintain current security protocols', 'Consider minor operational adjustments'],
            MODERATE: ['Reduce high-risk operations', 'Increase monitoring frequency'],
            HIGH: ['Suspend non-critical operations', 'Activate stealth protocols'],
            CRITICAL: ['Emergency protocols only', 'Prepare for potential purge'],
            IMMINENT: ['IMMEDIATE BACKUP REQUIRED', 'SUSPEND ALL OPERATIONS']
        };
        
        return (recommendations[level] || []).map(rec => 
            `<div class="recommendation-item">• ${rec}</div>`
        ).join('');
    }
    
    /**
     * Get active warnings display
     */
    getActiveWarningsDisplay() {
        if (this.activeWarnings.size === 0) {
            return '<div class="no-warnings">No active warnings</div>';
        }
        
        return Array.from(this.activeWarnings).map(warning => `
            <div class="warning-item ${warning.severity}">
                <span class="warning-icon">${warning.icon}</span>
                <span class="warning-message">${warning.message}</span>
                <span class="warning-time">${this.getTimeAgo(warning.timestamp)}</span>
            </div>
        `).join('');
    }
    
    /**
     * Get warning history display
     */
    getWarningHistoryDisplay() {
        const recent = this.warningHistory.slice(-20).reverse();
        
        if (recent.length === 0) {
            return '<div class="no-history">No warning history</div>';
        }
        
        return recent.map(warning => `
            <div class="history-item ${warning.severity}">
                <span class="history-icon">${warning.icon}</span>
                <span class="history-message">${warning.message}</span>
                <span class="history-time">${new Date(warning.timestamp).toLocaleTimeString()}</span>
            </div>
        `).join('');
    }
    
    /**
     * Get time ago string
     */
    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        if (minutes > 0) {
            return `${minutes}m ago`;
        } else {
            return `${seconds}s ago`;
        }
    }
    
    /**
     * Start animation loop
     */
    startAnimationLoop() {
        const animate = (currentTime) => {
            if (currentTime - this.lastUpdate >= 100) { // 10fps for heat animations
                this.updateAnimations();
                this.lastUpdate = currentTime;
            }
            
            this.animationFrame = requestAnimationFrame(animate);
        };
        
        this.animationFrame = requestAnimationFrame(animate);
    }
    
    /**
     * Update animations
     */
    updateAnimations() {
        this.pulsePhase = (this.pulsePhase + 0.1) % (Math.PI * 2);
        
        // Update countdown if active
        if (this.timeToNextPurge > 0) {
            this.timeToNextPurge -= 0.1;
            this.updateCountdownDisplay();
        }
    }
    
    /**
     * Show tooltip
     */
    showTooltip(event, content) {
        const tooltip = document.getElementById('tooltip');
        if (!tooltip) return;
        
        tooltip.innerHTML = content;
        tooltip.classList.add('visible');
        
        const rect = event.target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        let top = rect.bottom + 10;
        
        if (left < 10) left = 10;
        if (left + tooltipRect.width > window.innerWidth - 10) {
            left = window.innerWidth - tooltipRect.width - 10;
        }
        if (top + tooltipRect.height > window.innerHeight - 10) {
            top = rect.top - tooltipRect.height - 10;
        }
        
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }
    
    /**
     * Hide tooltip
     */
    hideTooltip() {
        const tooltip = document.getElementById('tooltip');
        if (tooltip) {
            tooltip.classList.remove('visible');
        }
    }
    
    /**
     * Cleanup
     */
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        this.activeWarnings.clear();
        this.warningHistory.length = 0;
        
        console.log('HeatDisplay: Destroyed');
    }
}

// Create and register with UI manager
const heatDisplay = new HeatDisplay();

if (window.uiManager) {
    window.uiManager.registerModule('heatDisplay', heatDisplay);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HeatDisplay;
}