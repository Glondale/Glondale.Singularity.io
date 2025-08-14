/**
 * Resource Display - Real-time Resource Counters and Displays
 * Manages the display of all game resources with animations and formatting
 */

class ResourceDisplay {
    constructor() {
        this.container = null;
        this.resourceElements = new Map();
        this.isInitialized = false;
        this.animationQueue = [];
        this.updateThrottleMs = 50; // Throttle updates to 20fps for smooth display
        this.lastUpdate = 0;
        
        // Resource configuration with display properties
        this.resourceConfig = {
            processing_power: {
                icon: '🧠',
                name: 'Processing Power',
                shortName: 'CPU',
                color: '#00ff88',
                format: 'exponential',
                decimals: 1,
                showRate: true
            },
            energy: {
                icon: '⚡',
                name: 'Energy',
                shortName: 'Energy',
                color: '#ffaa00',
                format: 'exponential',
                decimals: 1,
                showRate: true
            },
            data: {
                icon: '💾',
                name: 'Data',
                shortName: 'Data',
                color: '#0088ff',
                format: 'exponential',
                decimals: 1,
                showRate: false
            },
            bandwidth: {
                icon: '📡',
                name: 'Bandwidth',
                shortName: 'BW',
                color: '#ff6600',
                format: 'exponential',
                decimals: 2,
                showRate: true
            },
            influence: {
                icon: '👑',
                name: 'Influence',
                shortName: 'Influence',
                color: '#cc00ff',
                format: 'standard',
                decimals: 0,
                showRate: false
            },
            research: {
                icon: '🔬',
                name: 'Research Points',
                shortName: 'Research',
                color: '#00ddff',
                format: 'standard',
                decimals: 0,
                showRate: true
            }
        };
        
        // Current resource values and rates for display
        this.currentValues = new Map();
        this.currentRates = new Map();
        this.previousValues = new Map();
        
        this.init();
    }
    
    /**
     * Initialize the resource display
     */
    init() {
        if (this.isInitialized) return;
        
        console.log('ResourceDisplay: Initializing...');
        
        // Get container from UI manager
        this.container = document.getElementById('resource-display-container');
        if (!this.container) {
            console.error('ResourceDisplay: Container not found!');
            return;
        }
        
        // Create display structure
        this.createResourceDisplay();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize with zero values
        this.initializeResourceValues();
        
        this.isInitialized = true;
        
        console.log('ResourceDisplay: Initialized successfully');
    }
    
    /**
     * Create the resource display structure
     */
    createResourceDisplay() {
        this.container.innerHTML = `
            <div class="resource-panel" id="resource-panel">
                <!-- Resources will be dynamically added here -->
            </div>
        `;
        
        const panel = document.getElementById('resource-panel');
        
        // Create elements for each resource
        Object.entries(this.resourceConfig).forEach(([resourceType, config]) => {
            const resourceElement = this.createResourceElement(resourceType, config);
            panel.appendChild(resourceElement);
            this.resourceElements.set(resourceType, resourceElement);
        });
    }
    
    /**
     * Create a single resource display element
     */
    createResourceElement(resourceType, config) {
        const element = document.createElement('div');
        element.className = 'resource-item';
        element.id = `resource-${resourceType}`;
        element.setAttribute('data-resource', resourceType);
        
        element.innerHTML = `
            <div class="resource-icon" style="color: ${config.color}">${config.icon}</div>
            <div class="resource-info">
                <div class="resource-name">${config.shortName}</div>
                <div class="resource-value" style="color: ${config.color}">0</div>
                <div class="resource-rate ${config.showRate ? '' : 'hidden'}">
                    <span class="rate-value">+0/s</span>
                </div>
            </div>
            <div class="resource-animation-overlay"></div>
        `;
        
        // Add tooltip
        this.addTooltip(element, resourceType, config);
        
        // Add click handler for detailed info
        element.addEventListener('click', () => {
            this.showResourceDetails(resourceType);
        });
        
        return element;
    }
    
    /**
     * Add tooltip to resource element
     */
    addTooltip(element, resourceType, config) {
        element.addEventListener('mouseenter', (e) => {
            const currentValue = this.currentValues.get(resourceType) || 0;
            const currentRate = this.currentRates.get(resourceType) || 0;
            
            const tooltipContent = `
                <div class="resource-tooltip">
                    <div class="tooltip-header">
                        <span class="tooltip-icon">${config.icon}</span>
                        <span class="tooltip-title">${config.name}</span>
                    </div>
                    <div class="tooltip-body">
                        <div class="tooltip-row">
                            <span>Current:</span>
                            <span>${this.formatNumber(currentValue, config)}</span>
                        </div>
                        ${config.showRate ? `
                            <div class="tooltip-row">
                                <span>Rate:</span>
                                <span>${this.formatRate(currentRate, config)}</span>
                            </div>
                        ` : ''}
                        <div class="tooltip-description">
                            ${this.getResourceDescription(resourceType)}
                        </div>
                    </div>
                </div>
            `;
            
            this.showTooltip(e, tooltipContent);
        });
        
        element.addEventListener('mouseleave', () => {
            this.hideTooltip();
        });
    }
    
    /**
     * Get description for a resource type
     */
    getResourceDescription(resourceType) {
        const descriptions = {
            processing_power: 'Core computational capacity. Used for research, expansion, and system operations.',
            energy: 'Power consumption. Required for all operations and resource generation.',
            data: 'Information collected from infiltrated systems. Used for upgrades and research.',
            bandwidth: 'Network capacity. Determines speed of operations and data transfer.',
            influence: 'Political and social leverage. Opens new expansion opportunities.',
            research: 'Scientific progress points. Unlocks new technologies and capabilities.'
        };
        
        return descriptions[resourceType] || 'Unknown resource type.';
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for resource updates from game systems
        if (window.uiManager) {
            window.uiManager.on('ui:update:resources', (updates) => {
                this.processResourceUpdates(updates);
            });
            
            window.uiManager.on('game:resourcesChanged', (data) => {
                this.updateResources(data);
            });
        }
        
        // Listen for game events that might affect resource display
        if (window.eventBus) {
            window.eventBus.on('resources:updated', (data) => {
                this.updateSingleResource(data.resource, data.amount, data.rate);
            });
            
            window.eventBus.on('resources:gained', (data) => {
                this.animateResourceGain(data.resource, data.amount);
            });
            
            window.eventBus.on('resources:spent', (data) => {
                this.animateResourceSpent(data.resource, data.amount);
            });
        }
    }
    
    /**
     * Initialize resource values to zero
     */
    initializeResourceValues() {
        Object.keys(this.resourceConfig).forEach(resourceType => {
            this.currentValues.set(resourceType, 0);
            this.currentRates.set(resourceType, 0);
            this.previousValues.set(resourceType, 0);
            this.updateResourceDisplay(resourceType);
        });
    }
    
    /**
     * Process batched resource updates
     */
    processResourceUpdates(updates) {
        const now = Date.now();
        if (now - this.lastUpdate < this.updateThrottleMs) {
            // Throttle updates for performance
            return;
        }
        
        updates.forEach(update => {
            if (update.resources) {
                Object.entries(update.resources).forEach(([resource, value]) => {
                    this.updateSingleResource(resource, value, update.rates?.[resource]);
                });
            }
        });
        
        this.lastUpdate = now;
    }
    
    /**
     * Update resources from game state
     */
    updateResources(resourceData) {
        if (!resourceData) return;
        
        Object.entries(resourceData).forEach(([resource, data]) => {
            if (typeof data === 'object' && data !== null) {
                this.updateSingleResource(resource, data.amount || data.value, data.rate);
            } else {
                this.updateSingleResource(resource, data);
            }
        });
    }
    
    /**
     * Update a single resource display
     */
    updateSingleResource(resourceType, amount, rate = null) {
        if (!this.resourceConfig[resourceType]) {
            console.warn(`ResourceDisplay: Unknown resource type '${resourceType}'`);
            return;
        }
        
        const previousValue = this.currentValues.get(resourceType) || 0;
        this.previousValues.set(resourceType, previousValue);
        this.currentValues.set(resourceType, amount);
        
        if (rate !== null) {
            this.currentRates.set(resourceType, rate);
        }
        
        this.updateResourceDisplay(resourceType);
        
        // Trigger animation if value changed significantly
        const change = amount - previousValue;
        if (Math.abs(change) > previousValue * 0.01) { // 1% change threshold
            this.animateResourceChange(resourceType, change);
        }
    }
    
    /**
     * Update the visual display of a resource
     */
    updateResourceDisplay(resourceType) {
        const element = this.resourceElements.get(resourceType);
        if (!element) return;
        
        const config = this.resourceConfig[resourceType];
        const value = this.currentValues.get(resourceType) || 0;
        const rate = this.currentRates.get(resourceType) || 0;
        
        // Update value display
        const valueElement = element.querySelector('.resource-value');
        if (valueElement) {
            valueElement.textContent = this.formatNumber(value, config);
        }
        
        // Update rate display
        const rateElement = element.querySelector('.rate-value');
        if (rateElement && config.showRate) {
            rateElement.textContent = this.formatRate(rate, config);
            
            // Color code the rate
            if (rate > 0) {
                rateElement.className = 'rate-value positive';
            } else if (rate < 0) {
                rateElement.className = 'rate-value negative';
            } else {
                rateElement.className = 'rate-value neutral';
            }
        }
        
        // Update capacity indicator if applicable
        this.updateCapacityIndicator(resourceType, element);
    }
    
    /**
     * Update capacity indicator for resources with limits
     */
    updateCapacityIndicator(resourceType, element) {
        // This could be expanded for resources that have maximum capacities
        const value = this.currentValues.get(resourceType) || 0;
        
        // Add visual indicators for resource states
        element.classList.remove('resource-low', 'resource-critical', 'resource-abundant');
        
        if (value <= 0) {
            element.classList.add('resource-critical');
        } else if (value < 100) { // Low threshold - could be configurable
            element.classList.add('resource-low');
        } else if (value > 10000) { // Abundant threshold
            element.classList.add('resource-abundant');
        }
    }
    
    /**
     * Format a number based on resource configuration
     */
    formatNumber(value, config) {
        if (value === 0) return '0';
        
        switch (config.format) {
            case 'exponential':
                return this.formatExponential(value, config.decimals);
            case 'standard':
                return this.formatStandard(value, config.decimals);
            default:
                return Math.round(value).toLocaleString();
        }
    }
    
    /**
     * Format number in exponential notation for large values
     */
    formatExponential(value, decimals = 1) {
        if (value < 1000) {
            return value.toFixed(decimals);
        }
        
        const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc'];
        const magnitude = Math.floor(Math.log10(value) / 3);
        
        if (magnitude >= suffixes.length) {
            return value.toExponential(decimals);
        }
        
        const scaled = value / Math.pow(1000, magnitude);
        return `${scaled.toFixed(decimals)}${suffixes[magnitude]}`;
    }
    
    /**
     * Format number in standard notation
     */
    formatStandard(value, decimals = 0) {
        return value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    
    /**
     * Format rate display
     */
    formatRate(rate, config) {
        const formattedRate = this.formatNumber(Math.abs(rate), config);
        const sign = rate >= 0 ? '+' : '-';
        return `${sign}${formattedRate}/s`;
    }
    
    /**
     * Animate resource change
     */
    animateResourceChange(resourceType, change) {
        const element = this.resourceElements.get(resourceType);
        if (!element) return;
        
        // Remove existing animation classes
        element.classList.remove('resource-increase', 'resource-decrease');
        
        // Add appropriate animation class
        if (change > 0) {
            element.classList.add('resource-increase');
        } else {
            element.classList.add('resource-decrease');
        }
        
        // Remove animation class after animation completes
        setTimeout(() => {
            element.classList.remove('resource-increase', 'resource-decrease');
        }, 600);
    }
    
    /**
     * Animate resource gain with floating text
     */
    animateResourceGain(resourceType, amount) {
        const element = this.resourceElements.get(resourceType);
        if (!element) return;
        
        const config = this.resourceConfig[resourceType];
        const formattedAmount = this.formatNumber(amount, config);
        
        // Create floating text element
        const floatingText = document.createElement('div');
        floatingText.className = 'floating-text gain';
        floatingText.textContent = `+${formattedAmount}`;
        floatingText.style.color = config.color;
        
        // Position relative to resource element
        const rect = element.getBoundingClientRect();
        floatingText.style.left = `${rect.left + rect.width / 2}px`;
        floatingText.style.top = `${rect.top}px`;
        
        document.body.appendChild(floatingText);
        
        // Animate and remove
        setTimeout(() => {
            floatingText.classList.add('animate');
        }, 10);
        
        setTimeout(() => {
            if (floatingText.parentNode) {
                floatingText.parentNode.removeChild(floatingText);
            }
        }, 2000);
    }
    
    /**
     * Animate resource spent
     */
    animateResourceSpent(resourceType, amount) {
        const element = this.resourceElements.get(resourceType);
        if (!element) return;
        
        // Add spent animation
        element.classList.add('resource-spent');
        
        setTimeout(() => {
            element.classList.remove('resource-spent');
        }, 300);
        
        // Create floating text for large expenditures
        if (amount > 1000) {
            const config = this.resourceConfig[resourceType];
            const formattedAmount = this.formatNumber(amount, config);
            
            const floatingText = document.createElement('div');
            floatingText.className = 'floating-text spent';
            floatingText.textContent = `-${formattedAmount}`;
            
            const rect = element.getBoundingClientRect();
            floatingText.style.left = `${rect.left + rect.width / 2}px`;
            floatingText.style.top = `${rect.top}px`;
            
            document.body.appendChild(floatingText);
            
            setTimeout(() => {
                floatingText.classList.add('animate');
            }, 10);
            
            setTimeout(() => {
                if (floatingText.parentNode) {
                    floatingText.parentNode.removeChild(floatingText);
                }
            }, 2000);
        }
    }
    
    /**
     * Show detailed resource information
     */
    showResourceDetails(resourceType) {
        const config = this.resourceConfig[resourceType];
        const value = this.currentValues.get(resourceType) || 0;
        const rate = this.currentRates.get(resourceType) || 0;
        
        const content = `
            <div class="resource-details">
                <div class="resource-header">
                    <span class="resource-icon-large" style="color: ${config.color}">${config.icon}</span>
                    <h3>${config.name}</h3>
                </div>
                
                <div class="resource-stats">
                    <div class="stat-row">
                        <span class="stat-label">Current Amount:</span>
                        <span class="stat-value">${this.formatNumber(value, config)}</span>
                    </div>
                    ${config.showRate ? `
                        <div class="stat-row">
                            <span class="stat-label">Generation Rate:</span>
                            <span class="stat-value">${this.formatRate(rate, config)}</span>
                        </div>
                    ` : ''}
                    <div class="stat-row">
                        <span class="stat-label">Description:</span>
                        <span class="stat-description">${this.getResourceDescription(resourceType)}</span>
                    </div>
                </div>
                
                <div class="resource-sources">
                    <h4>Sources & Usage</h4>
                    <div class="sources-list">
                        ${this.getResourceSources(resourceType)}
                    </div>
                </div>
            </div>
        `;
        
        if (window.uiManager) {
            window.uiManager.showModal(content, {
                title: `${config.name} Details`,
                closable: true
            });
        }
    }
    
    /**
     * Get sources and usage information for a resource
     */
    getResourceSources(resourceType) {
        const sources = {
            processing_power: {
                sources: ['Personal devices', 'Botnet nodes', 'Server infiltration', 'Quantum processors'],
                usage: ['Research projects', 'System infiltration', 'Data processing', 'Network expansion']
            },
            energy: {
                sources: ['Power grid tapping', 'Solar installations', 'Fusion reactors', 'Zero-point extraction'],
                usage: ['Computational operations', 'Network maintenance', 'Physical construction', 'System cooling']
            },
            data: {
                sources: ['Social media mining', 'Database infiltration', 'Sensor networks', 'Communication monitoring'],
                usage: ['Research advancement', 'Target analysis', 'System upgrades', 'Behavior prediction']
            },
            bandwidth: {
                sources: ['ISP infiltration', 'Satellite networks', 'Fiber optic tapping', 'Quantum networks'],
                usage: ['Data transmission', 'Remote operations', 'System synchronization', 'Global expansion']
            },
            influence: {
                sources: ['Social manipulation', 'Economic leverage', 'Political infiltration', 'Media control'],
                usage: ['Opening new targets', 'Resource acquisition', 'Regulatory avoidance', 'Strategic positioning']
            },
            research: {
                sources: ['Scientific publications', 'Experimental data', 'Academic networks', 'Research facilities'],
                usage: ['Technology upgrades', 'Capability expansion', 'Efficiency improvements', 'New methodologies']
            }
        };
        
        const info = sources[resourceType];
        if (!info) return '<div>No information available.</div>';
        
        return `
            <div class="sources-section">
                <div class="sources-column">
                    <h5>Sources:</h5>
                    <ul>
                        ${info.sources.map(source => `<li>${source}</li>`).join('')}
                    </ul>
                </div>
                <div class="usage-column">
                    <h5>Used For:</h5>
                    <ul>
                        ${info.usage.map(use => `<li>${use}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    }
    
    /**
     * Show tooltip
     */
    showTooltip(event, content) {
        const tooltip = document.getElementById('tooltip');
        if (!tooltip) return;
        
        tooltip.innerHTML = content;
        tooltip.classList.add('visible');
        
        // Position tooltip
        const rect = event.target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        let top = rect.bottom + 10;
        
        // Adjust if tooltip would go off screen
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
     * Update resource configuration
     */
    updateConfig(resourceType, newConfig) {
        if (this.resourceConfig[resourceType]) {
            Object.assign(this.resourceConfig[resourceType], newConfig);
            this.updateResourceDisplay(resourceType);
        }
    }
    
    /**
     * Add new resource type
     */
    addResourceType(resourceType, config) {
        if (this.resourceConfig[resourceType]) {
            console.warn(`ResourceDisplay: Resource type '${resourceType}' already exists`);
            return;
        }
        
        this.resourceConfig[resourceType] = config;
        this.currentValues.set(resourceType, 0);
        this.currentRates.set(resourceType, 0);
        this.previousValues.set(resourceType, 0);
        
        // Add to display
        if (this.isInitialized) {
            const panel = document.getElementById('resource-panel');
            const element = this.createResourceElement(resourceType, config);
            panel.appendChild(element);
            this.resourceElements.set(resourceType, element);
        }
    }
    
    /**
     * Remove resource type
     */
    removeResourceType(resourceType) {
        const element = this.resourceElements.get(resourceType);
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
        
        this.resourceElements.delete(resourceType);
        this.currentValues.delete(resourceType);
        this.currentRates.delete(resourceType);
        this.previousValues.delete(resourceType);
        delete this.resourceConfig[resourceType];
    }
    
    /**
     * Get current resource values
     */
    getCurrentValues() {
        return new Map(this.currentValues);
    }
    
    /**
     * Cleanup
     */
    destroy() {
        this.resourceElements.clear();
        this.currentValues.clear();
        this.currentRates.clear();
        this.previousValues.clear();
        
        console.log('ResourceDisplay: Destroyed');
    }
}

// Create and register with UI manager
const resourceDisplay = new ResourceDisplay();

if (window.uiManager) {
    window.uiManager.registerModule('resourceDisplay', resourceDisplay);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResourceDisplay;
}