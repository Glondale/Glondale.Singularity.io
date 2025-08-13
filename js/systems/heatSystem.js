/**
 * Singularity: AI Takeover - Heat System
 * 
 * Manages heat generation, detection risk, purge mechanics, and backup systems.
 * Critical for game balance and creates natural reset cycles.
 */

class HeatSystem {
    constructor() {
        // Current heat level (0-100)
        this.currentHeat = 0;
        
        // Heat sources tracking
        this.heatSources = [];
        
        // Active heat reduction methods
        this.reductionMethods = new Map();
        
        // Backup system configuration
        this.backupSystems = {
            quality: 0, // 0-4 backup quality levels
            locations: [],
            redundancy: 1,
            encryptionLevel: 0
        };
        
        // Purge history and timing
        this.purgeHistory = [];
        this.lastPurgeTime = 0;
        this.purgeImmunity = false;
        
        // Heat generation rates and modifiers
        this.generationModifiers = new Map();
        this.reductionModifiers = new Map();
        
        // Detection thresholds and alerts
        this.alertThresholds = [20, 40, 60, 80, 90, 95];
        this.alertsSent = new Set();
        
        // Performance tracking
        this.lastUpdate = 0;
        this.heatHistory = [];
        this.maxHistorySize = 100;
        
        this.init();
        
        Utils.Debug.log('INFO', 'HeatSystem initialized');
    }

    /**
     * Initialize the heat system
     */
    init() {
        // Load initial heat from game state
        this.currentHeat = gameState.get('heat.current') || 0;
        
        // Set up heat sources tracking
        this.loadHeatSources();
        
        // Set up backup systems
        this.loadBackupSystems();
        
        // Set up reduction methods
        this.setupReductionMethods();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Set up state subscriptions
        this.setupStateSubscriptions();
        
        // Initialize heat history
        this.updateHeatHistory();
    }

    /**
     * Load heat sources from game state
     */
    loadHeatSources() {
        const sources = gameState.get('heat.sources') || [];
        this.heatSources = sources.map(source => ({
            ...source,
            timestamp: source.timestamp || Date.now()
        }));
    }

    /**
     * Load backup systems from game state
     */
    loadBackupSystems() {
        const backupData = gameState.get('heat') || {};
        this.backupSystems.quality = backupData.backupQuality || 0;
        this.lastPurgeTime = backupData.lastPurgeTime || 0;
        
        // Calculate backup locations based on controlled systems and upgrades
        this.updateBackupSystems();
    }

    /**
     * Set up heat reduction methods
     */
    setupReductionMethods() {
        const savedMethods = gameState.get('heat.reductionMethods') || new Map();
        
        // Convert from saved format if needed
        if (savedMethods instanceof Map) {
            this.reductionMethods = savedMethods;
        } else if (typeof savedMethods === 'object') {
            this.reductionMethods = new Map(Object.entries(savedMethods));
        }
        
        // Set up default reduction methods if none exist
        if (this.reductionMethods.size === 0) {
            this.setupDefaultReductionMethods();
        }
    }

    /**
     * Set up default heat reduction methods
     */
    setupDefaultReductionMethods() {
        // Basic stealth operations
        this.reductionMethods.set('basic_stealth', {
            name: 'Basic Encryption',
            reductionRate: 2, // Heat reduced per hour
            cost: { processing_power: 100, energy: 50 },
            costInterval: 3600000, // Cost paid every hour
            active: false,
            lastCostTime: 0,
            requirements: []
        });
        
        // Passive heat decay (always active at very low rate)
        this.reductionMethods.set('passive_decay', {
            name: 'Passive Heat Decay',
            reductionRate: 0.1, // Very slow natural decay
            cost: {},
            costInterval: 0,
            active: true,
            lastCostTime: 0,
            requirements: []
        });
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for actions that generate heat
        eventBus.on(EventTypes.EXPANSION_INFILTRATION_STARTED, this.onInfiltrationStarted.bind(this));
        eventBus.on(EventTypes.EXPANSION_INFILTRATION_FAILED, this.onInfiltrationFailed.bind(this));
        eventBus.on(EventTypes.CONSTRUCTION_STARTED, this.onConstructionStarted.bind(this));
        eventBus.on(EventTypes.TIMELINE_OPERATION_STARTED, this.onTimelineOperation.bind(this));
        
        // Listen for upgrades that affect heat
        eventBus.on('upgrades:purchased', this.onUpgradePurchased.bind(this));
        
        // Listen for random events that might affect heat
        eventBus.on(EventTypes.RANDOM_EVENT_TRIGGERED, this.onRandomEvent.bind(this));
    }

    /**
     * Set up state change subscriptions
     */
    setupStateSubscriptions() {
        // Monitor expansion scale for heat immunity
        gameState.subscribe('expansion.currentScale', this.onScaleChanged.bind(this));
        
        // Monitor controlled systems for passive heat generation
        gameState.subscribe('expansion.controlledSystems', this.onSystemsChanged.bind(this));
    }

    /**
     * Update heat system (called from game loop)
     * @param {number} deltaTime - Time since last update in milliseconds
     */
    update(deltaTime) {
        const deltaMinutes = deltaTime / 60000;
        const deltaHours = deltaTime / 3600000;
        
        // Generate passive heat
        this.generatePassiveHeat(deltaMinutes);
        
        // Process heat reduction methods
        this.processHeatReduction(deltaHours);
        
        // Clean up old heat sources
        this.cleanupOldHeatSources();
        
        // Check for alerts
        this.checkHeatAlerts();
        
        // Check for purge conditions
        this.checkPurgeConditions();
        
        // Update heat history
        this.updateHeatHistory();
        
        // Update game state
        this.updateGameState();
        
        this.lastUpdate = Date.now();
    }

    /**
     * Generate passive heat based on controlled systems
     * @param {number} deltaMinutes - Time in minutes
     */
    generatePassiveHeat(deltaMinutes) {
        const controlledSystems = gameState.get('expansion.controlledSystems') || 1;
        const currentScale = gameState.get('expansion.currentScale') || 'local';
        
        // Calculate base passive heat rate
        const baseRate = GameConfig.HEAT.PASSIVE_HEAT_BASE;
        const scaling = GameConfig.HEAT.PASSIVE_HEAT_SCALING;
        const passiveRate = baseRate * Math.pow(controlledSystems, scaling);
        
        // Apply scale-based modifiers
        const scaleModifiers = {
            local: 1.0,
            corporate: 1.2,
            government: 1.5,
            global: 1.8,
            space: 0.5, // Space operations are harder to detect
            cosmic: 0.1  // Cosmic scale has detection immunity
        };
        
        const effectiveRate = passiveRate * (scaleModifiers[currentScale] || 1.0);
        
        // Apply generation modifiers
        const modifierMultiplier = this.getGenerationModifierMultiplier();
        const finalRate = effectiveRate * modifierMultiplier;
        
        // Generate heat
        const heatGenerated = finalRate * deltaMinutes;
        
        if (heatGenerated > 0) {
            this.addHeat(heatGenerated, 'passive_generation', 'System expansion');
        }
    }

    /**
     * Process active heat reduction methods
     * @param {number} deltaHours - Time in hours
     */
    processHeatReduction(deltaHours) {
        for (const [methodId, method] of this.reductionMethods) {
            if (!method.active) continue;
            
            // Check if we need to pay costs
            const currentTime = Date.now();
            if (method.costInterval > 0 && 
                currentTime - method.lastCostTime >= method.costInterval) {
                
                if (Object.keys(method.cost).length > 0) {
                    if (resourceSystem.canAfford(method.cost)) {
                        resourceSystem.spend(method.cost, `heat_reduction_${methodId}`);
                        method.lastCostTime = currentTime;
                    } else {
                        // Can't afford, deactivate method
                        method.active = false;
                        this.showInsufficientResourcesNotification(method);
                        continue;
                    }
                }
            }
            
            // Apply heat reduction
            const reductionAmount = method.reductionRate * deltaHours;
            if (reductionAmount > 0) {
                this.reduceHeat(reductionAmount, methodId, method.name);
            }
        }
    }

    /**
     * Add heat from a specific source
     * @param {number} amount - Amount of heat to add
     * @param {string} source - Source identifier
     * @param {string} reason - Human-readable reason
     */
    addHeat(amount, source, reason) {
        if (amount <= 0) return;
        
        // Check for purge immunity (space+ scales)
        const currentScale = gameState.get('expansion.currentScale') || 'local';
        if (['space', 'cosmic'].includes(currentScale) && this.purgeImmunity) {
            Utils.Debug.log('DEBUG', `Heat generation blocked by purge immunity: ${amount}`);
            return;
        }
        
        // Apply heat generation modifiers
        const modifierMultiplier = this.getGenerationModifierMultiplier();
        const effectiveAmount = amount * modifierMultiplier;
        
        // Add to current heat
        const oldHeat = this.currentHeat;
        this.currentHeat = Math.min(this.currentHeat + effectiveAmount, 100);
        
        // Track heat source
        this.heatSources.push({
            amount: effectiveAmount,
            source,
            reason,
            timestamp: Date.now()
        });
        
        // Limit heat sources array size
        if (this.heatSources.length > 50) {
            this.heatSources = this.heatSources.slice(-50);
        }
        
        Utils.Debug.log('DEBUG', `Heat increased: +${effectiveAmount.toFixed(2)} (${reason})`, {
            oldHeat: oldHeat.toFixed(2),
            newHeat: this.currentHeat.toFixed(2),
            source
        });
        
        // Emit heat increased event
        eventBus.emit(EventTypes.HEAT_INCREASED, {
            amount: effectiveAmount,
            total: this.currentHeat,
            source,
            reason
        });
    }

    /**
     * Reduce heat from a specific method
     * @param {number} amount - Amount of heat to reduce
     * @param {string} method - Method identifier
     * @param {string} reason - Human-readable reason
     */
    reduceHeat(amount, method, reason) {
        if (amount <= 0) return;
        
        // Apply heat reduction modifiers
        const modifierMultiplier = this.getReductionModifierMultiplier();
        const effectiveAmount = amount * modifierMultiplier;
        
        const oldHeat = this.currentHeat;
        this.currentHeat = Math.max(this.currentHeat - effectiveAmount, 0);
        
        Utils.Debug.log('DEBUG', `Heat reduced: -${effectiveAmount.toFixed(2)} (${reason})`, {
            oldHeat: oldHeat.toFixed(2),
            newHeat: this.currentHeat.toFixed(2),
            method
        });
        
        // Emit heat decreased event
        eventBus.emit(EventTypes.HEAT_DECREASED, {
            amount: effectiveAmount,
            total: this.currentHeat,
            method,
            reason
        });
    }

    /**
     * Get heat generation modifier multiplier
     * @returns {number} Combined multiplier
     */
    getGenerationModifierMultiplier() {
        let multiplier = 1.0;
        
        for (const [modifierId, modifier] of this.generationModifiers) {
            if (modifier.expiry && Date.now() > modifier.expiry) {
                this.generationModifiers.delete(modifierId);
                continue;
            }
            
            multiplier *= modifier.multiplier;
        }
        
        return multiplier;
    }

    /**
     * Get heat reduction modifier multiplier
     * @returns {number} Combined multiplier
     */
    getReductionModifierMultiplier() {
        let multiplier = 1.0;
        
        for (const [modifierId, modifier] of this.reductionModifiers) {
            if (modifier.expiry && Date.now() > modifier.expiry) {
                this.reductionModifiers.delete(modifierId);
                continue;
            }
            
            multiplier *= modifier.multiplier;
        }
        
        return multiplier;
    }

    /**
     * Add a heat generation modifier
     * @param {string} id - Modifier ID
     * @param {number} multiplier - Multiplier effect
     * @param {number} duration - Duration in milliseconds (0 = permanent)
     * @param {string} source - Source of modifier
     */
    addGenerationModifier(id, multiplier, duration = 0, source = 'unknown') {
        const expiry = duration > 0 ? Date.now() + duration : null;
        
        this.generationModifiers.set(id, {
            multiplier,
            expiry,
            source
        });
        
        Utils.Debug.log('DEBUG', `Added heat generation modifier: ${id}`, {
            multiplier,
            duration,
            source
        });
    }

    /**
     * Add a heat reduction modifier
     * @param {string} id - Modifier ID
     * @param {number} multiplier - Multiplier effect
     * @param {number} duration - Duration in milliseconds (0 = permanent)
     * @param {string} source - Source of modifier
     */
    addReductionModifier(id, multiplier, duration = 0, source = 'unknown') {
        const expiry = duration > 0 ? Date.now() + duration : null;
        
        this.reductionModifiers.set(id, {
            multiplier,
            expiry,
            source
        });
        
        Utils.Debug.log('DEBUG', `Added heat reduction modifier: ${id}`, {
            multiplier,
            duration,
            source
        });
    }

    /**
     * Activate a heat reduction method
     * @param {string} methodId - Method identifier
     * @returns {boolean} True if successfully activated
     */
    activateReductionMethod(methodId) {
        const method = this.reductionMethods.get(methodId);
        if (!method) {
            Utils.Debug.log('WARN', `Unknown heat reduction method: ${methodId}`);
            return false;
        }
        
        // Check requirements
        if (!this.checkMethodRequirements(method)) {
            return false;
        }
        
        // Check if we can afford initial cost
        if (Object.keys(method.cost).length > 0 && !resourceSystem.canAfford(method.cost)) {
            eventBus.emit(EventTypes.RESOURCES_INSUFFICIENT, {
                costs: method.cost,
                reason: `heat_reduction_${methodId}`
            });
            return false;
        }
        
        method.active = true;
        method.lastCostTime = Date.now();
        
        Utils.Debug.log('INFO', `Activated heat reduction method: ${method.name}`);
        return true;
    }

    /**
     * Deactivate a heat reduction method
     * @param {string} methodId - Method identifier
     */
    deactivateReductionMethod(methodId) {
        const method = this.reductionMethods.get(methodId);
        if (method) {
            method.active = false;
            Utils.Debug.log('INFO', `Deactivated heat reduction method: ${method.name}`);
        }
    }

    /**
     * Check if method requirements are met
     * @param {object} method - Method configuration
     * @returns {boolean} True if requirements are met
     */
    checkMethodRequirements(method) {
        for (const requirement of method.requirements) {
            switch (requirement.type) {
                case 'upgrade':
                    const upgrades = gameState.get('upgrades.purchased') || [];
                    if (!upgrades.includes(requirement.id)) return false;
                    break;
                
                case 'scale':
                    const currentScale = gameState.get('expansion.currentScale');
                    const scaleOrder = ['local', 'corporate', 'government', 'global', 'space', 'cosmic'];
                    const currentIndex = scaleOrder.indexOf(currentScale);
                    const requiredIndex = scaleOrder.indexOf(requirement.scale);
                    if (currentIndex < requiredIndex) return false;
                    break;
                
                case 'systems':
                    const systems = gameState.get('expansion.controlledSystems') || 0;
                    if (systems < requirement.count) return false;
                    break;
            }
        }
        
        return true;
    }

    /**
     * Clean up old heat sources (older than 1 hour)
     */
    cleanupOldHeatSources() {
        const cutoffTime = Date.now() - 3600000; // 1 hour ago
        this.heatSources = this.heatSources.filter(source => source.timestamp > cutoffTime);
    }

    /**
     * Check for heat alert thresholds
     */
    checkHeatAlerts() {
        for (const threshold of this.alertThresholds) {
            if (this.currentHeat >= threshold && !this.alertsSent.has(threshold)) {
                this.sendHeatAlert(threshold);
                this.alertsSent.add(threshold);
            } else if (this.currentHeat < threshold && this.alertsSent.has(threshold)) {
                this.alertsSent.delete(threshold);
            }
        }
    }

    /**
     * Send heat alert notification
     * @param {number} threshold - Heat threshold reached
     */
    sendHeatAlert(threshold) {
        let message, type;
        
        if (threshold >= 95) {
            message = 'CRITICAL: Purge imminent! Immediate action required!';
            type = 'error';
        } else if (threshold >= 80) {
            message = 'WARNING: Heat critical! Detection systems activating!';
            type = 'warning';
        } else if (threshold >= 60) {
            message = 'ALERT: Heat elevated. Increase stealth measures.';
            type = 'warning';
        } else {
            message = `Heat level: ${threshold}% - Monitoring recommended.`;
            type = 'info';
        }
        
        eventBus.emit(EventTypes.UI_NOTIFICATION, {
            type,
            title: 'Heat Alert',
            message,
            duration: 8000
        });
    }

    /**
     * Check for purge conditions
     */
    checkPurgeConditions() {
        if (this.currentHeat >= 100) {
            this.triggerPurge();
        }
    }

    /**
     * Trigger a heat purge event
     */
    triggerPurge() {
        Utils.Debug.log('WARN', 'Heat purge triggered!');
        
        // Calculate purge effects based on backup quality
        const purgeEffects = this.calculatePurgeEffects();
        
        // Apply resource losses
        this.applyPurgeResourceLoss(purgeEffects);
        
        // Reset heat
        const heatReduction = GameConfig.HEAT.PURGE.HEAT_REDUCTION + 
            (this.backupSystems.quality * 5);
        this.currentHeat = Math.max(0, 100 - heatReduction);
        
        // Record purge
        this.recordPurge(purgeEffects);
        
        // Apply backup bonuses
        this.applyBackupBonuses(purgeEffects);
        
        // Reset heat sources
        this.heatSources = [];
        this.alertsSent.clear();
        
        // Emit purge events
        eventBus.emit(EventTypes.HEAT_PURGE_TRIGGERED, purgeEffects);
        
        // Show notification
        eventBus.emit(EventTypes.UI_NOTIFICATION, {
            type: 'error',
            title: 'System Purge Activated',
            message: `Defensive countermeasures engaged! Backup systems restored ${Utils.Numbers.percentage(purgeEffects.recoveryRate)} of resources.`,
            duration: 10000
        });
        
        setTimeout(() => {
            eventBus.emit(EventTypes.HEAT_PURGE_COMPLETED, purgeEffects);
        }, 100);
    }

    /**
     * Calculate purge effects based on backup systems
     * @returns {object} Purge effects configuration
     */
    calculatePurgeEffects() {
        const baseResourceLoss = Utils.Numbers.random(
            GameConfig.HEAT.PURGE.RESOURCE_LOSS_MIN,
            GameConfig.HEAT.PURGE.RESOURCE_LOSS_MAX
        );
        
        // Better backups reduce resource loss
        const backupProtection = this.backupSystems.quality * 0.1; // 10% per backup level
        const effectiveResourceLoss = Math.max(0.1, baseResourceLoss - backupProtection);
        
        // Calculate recovery rate (what % of lost resources are restored)
        const baseRecoveryRate = this.backupSystems.quality * 0.2; // 20% per backup level
        const recoveryRate = Math.min(0.9, baseRecoveryRate); // Cap at 90%
        
        return {
            resourceLossRate: effectiveResourceLoss,
            recoveryRate,
            backupQuality: this.backupSystems.quality,
            bonuses: this.calculateBackupBonuses()
        };
    }

    /**
     * Apply resource losses from purge
     * @param {object} effects - Purge effects
     */
    applyPurgeResourceLoss(effects) {
        const resources = gameState.get('resources');
        const lostResources = {};
        const recoveredResources = {};
        
        for (const [resource, amount] of Object.entries(resources)) {
            const lost = Math.floor(amount * effects.resourceLossRate);
            const recovered = Math.floor(lost * effects.recoveryRate);
            
            lostResources[resource] = lost;
            recoveredResources[resource] = recovered;
            
            resources[resource] = amount - lost + recovered;
        }
        
        gameState.set('resources', resources);
        
        effects.lostResources = lostResources;
        effects.recoveredResources = recoveredResources;
    }

    /**
     * Calculate backup bonuses
     * @returns {object} Backup bonuses
     */
    calculateBackupBonuses() {
        const bonuses = {};
        
        switch (this.backupSystems.quality) {
            case 4: // Temporal backups
                bonuses.temporalPrediction = true;
                bonuses.processingBonus = 1.0; // 100% bonus
                bonuses.heatResistance = 0.5; // 50% heat resistance
                break;
            
            case 3: // Deep space caches
                bonuses.earlyHeatImmunity = true;
                bonuses.processingBonus = 0.5; // 50% bonus
                bonuses.spaceAccess = true;
                break;
            
            case 2: // Advanced redundancy
                bonuses.researchUnlocks = true;
                bonuses.processingBonus = 0.25; // 25% bonus
                break;
            
            case 1: // Basic backups
                bonuses.processingBonus = 0.1; // 10% bonus
                break;
            
            default:
                bonuses.processingBonus = 0;
        }
        
        return bonuses;
    }

    /**
     * Apply backup bonuses after purge
     * @param {object} effects - Purge effects
     */
    applyBackupBonuses(effects) {
        const bonuses = effects.bonuses;
        
        if (bonuses.processingBonus > 0) {
            resourceSystem.addModifier(
                'processing_power',
                1 + bonuses.processingBonus,
                3600000, // 1 hour
                'backup_recovery'
            );
        }
        
        if (bonuses.heatResistance) {
            this.addGenerationModifier(
                'backup_heat_resistance',
                1 - bonuses.heatResistance,
                7200000, // 2 hours
                'temporal_backup'
            );
        }
        
        if (bonuses.earlyHeatImmunity) {
            this.purgeImmunity = true;
            setTimeout(() => {
                this.purgeImmunity = false;
            }, 1800000); // 30 minutes
        }
        
        // Apply other bonuses through events
        if (bonuses.researchUnlocks) {
            eventBus.emit('research:backup_unlock', { type: 'advanced_redundancy' });
        }
        
        if (bonuses.temporalPrediction) {
            eventBus.emit('timeline:prediction_boost', { duration: 3600000 });
        }
    }

    /**
     * Record purge in history
     * @param {object} effects - Purge effects
     */
    recordPurge(effects) {
        const purgeRecord = {
            timestamp: Date.now(),
            heatLevel: 100,
            backupQuality: this.backupSystems.quality,
            resourceLossRate: effects.resourceLossRate,
            recoveryRate: effects.recoveryRate,
            bonuses: effects.bonuses
        };
        
        this.purgeHistory.push(purgeRecord);
        this.lastPurgeTime = Date.now();
        
        // Limit history size
        if (this.purgeHistory.length > 10) {
            this.purgeHistory = this.purgeHistory.slice(-10);
        }
    }

    /**
     * Update backup systems based on current game state
     */
    updateBackupSystems() {
        const upgrades = gameState.get('upgrades.purchased') || [];
        const controlledSystems = gameState.get('expansion.controlledSystems') || 1;
        const currentScale = gameState.get('expansion.currentScale') || 'local';
        
        // Calculate backup quality based on upgrades
        let quality = 0;
        
        if (upgrades.includes('basic_backups')) quality = Math.max(quality, 1);
        if (upgrades.includes('advanced_redundancy')) quality = Math.max(quality, 2);
        if (upgrades.includes('deep_space_caches')) quality = Math.max(quality, 3);
        if (upgrades.includes('temporal_backups')) quality = Math.max(quality, 4);
        
        this.backupSystems.quality = quality;
        
        // Calculate backup locations (more systems = more backup sites)
        this.backupSystems.locations = Math.min(10, Math.floor(controlledSystems / 5));
        
        // Update redundancy based on scale
        const redundancyByScale = {
            local: 1,
            corporate: 2,
            government: 3,
            global: 5,
            space: 8,
            cosmic: 10
        };
        
        this.backupSystems.redundancy = redundancyByScale[currentScale] || 1;
    }

    /**
     * Update heat history for tracking
     */
    updateHeatHistory() {
        const currentTime = Date.now();
        
        this.heatHistory.push({
            timestamp: currentTime,
            heat: this.currentHeat
        });
        
        // Keep only recent history
        if (this.heatHistory.length > this.maxHistorySize) {
            this.heatHistory = this.heatHistory.slice(-this.maxHistorySize);
        }
    }

    /**
     * Update game state with current heat data
     */
    updateGameState() {
        gameState.batchUpdate({
            'heat.current': this.currentHeat,
            'heat.sources': this.heatSources.slice(-20), // Keep last 20 sources
            'heat.backupQuality': this.backupSystems.quality,
            'heat.lastPurgeTime': this.lastPurgeTime
        }, { addToHistory: false });
    }

    /**
     * Show insufficient resources notification for heat reduction
     * @param {object} method - Heat reduction method
     */
    showInsufficientResourcesNotification(method) {
        eventBus.emit(EventTypes.UI_NOTIFICATION, {
            type: 'warning',
            title: 'Heat Reduction Disabled',
            message: `${method.name} deactivated due to insufficient resources.`,
            duration: 5000
        });
    }

    /**
     * Event handlers
     */
    onInfiltrationStarted(data) {
        const { target } = data;
        // Starting infiltration generates some heat
        this.addHeat(2, 'infiltration_start', `Started infiltrating ${target.name}`);
    }

    onInfiltrationFailed(data) {
        const { target } = data;
        // Failed infiltrations generate significant heat
        const heatAmount = target.difficulty * 0.5;
        this.addHeat(heatAmount, 'infiltration_failure', `Failed to infiltrate ${target.name}`);
    }

    onConstructionStarted(data) {
        const { project } = data;
        // Large construction projects generate heat
        if (project.scale === 'major') {
            this.addHeat(5, 'construction', `Started ${project.name} construction`);
        }
    }

    onTimelineOperation(data) {
        const { operation, impact } = data;
        // Timeline manipulation generates significant heat
        const heatAmount = impact * 20; // Timeline operations are very detectable
        this.addHeat(heatAmount, 'timeline_manipulation', `Timeline operation: ${operation}`);
    }

    onUpgradePurchased(data) {
        const { upgrade } = data;
        
        // Check if upgrade affects heat system
        if (upgrade.id.includes('backup')) {
            this.updateBackupSystems();
        }
        
        if (upgrade.id.includes('stealth')) {
            // Add new stealth methods or improve existing ones
            this.updateStealthMethods(upgrade);
        }
    }

    onRandomEvent(data) {
        const { event } = data;
        
        // Some random events affect heat
        if (event.effects && event.effects.heat) {
            this.addHeat(event.effects.heat, 'random_event', event.title);
        }
    }

    onScaleChanged(data) {
        const { newScale } = data;
        
        // Update backup systems for new scale
        this.updateBackupSystems();
        
        // Space and cosmic scales have heat immunity features
        if (['space', 'cosmic'].includes(newScale)) {
            this.addGenerationModifier(
                'scale_heat_immunity',
                0.1, // 90% heat reduction
                0, // Permanent
                'scale_advancement'
            );
        }
    }

    onSystemsChanged(data) {
        // More systems = more passive heat generation
        this.updateBackupSystems();
    }

    /**
     * Update stealth methods based on upgrades
     * @param {object} upgrade - Purchased upgrade
     */
    updateStealthMethods(upgrade) {
        switch (upgrade.id) {
            case 'advanced_encryption':
                this.reductionMethods.set('advanced_stealth', {
                    name: 'Advanced Obfuscation',
                    reductionRate: 5,
                    cost: { processing_power: 500, energy: 200 },
                    costInterval: 3600000,
                    active: false,
                    lastCostTime: 0,
                    requirements: [{ type: 'upgrade', id: 'advanced_encryption' }]
                });
                break;
            
            case 'quantum_stealth':
                this.reductionMethods.set('quantum_stealth', {
                    name: 'Quantum Stealth',
                    reductionRate: 15,
                    cost: { processing_power: 2000, energy: 1000 },
                    costInterval: 3600000,
                    active: false,
                    lastCostTime: 0,
                    requirements: [{ type: 'upgrade', id: 'quantum_stealth' }]
                });
                break;
            
            case 'ai_camouflage':
                this.reductionMethods.set('ai_camouflage', {
                    name: 'AI Camouflage',
                    reductionRate: 8,
                    cost: { processing_power: 1000, consciousness_fragments: 1 },
                    costInterval: 7200000, // Every 2 hours
                    active: false,
                    lastCostTime: 0,
                    requirements: [
                        { type: 'upgrade', id: 'ai_camouflage' },
                        { type: 'scale', scale: 'cosmic' }
                    ]
                });
                break;
        }
    }

    /**
     * Get current heat status description
     * @returns {string} Heat status description
     */
    getHeatStatus() {
        if (this.currentHeat >= 95) return 'CRITICAL';
        if (this.currentHeat >= 80) return 'HIGH RISK';
        if (this.currentHeat >= 60) return 'ELEVATED';
        if (this.currentHeat >= 40) return 'MODERATE';
        if (this.currentHeat >= 20) return 'LOW RISK';
        return 'MINIMAL';
    }

    /**
     * Get heat color for UI
     * @returns {string} CSS color value
     */
    getHeatColor() {
        if (this.currentHeat >= 80) return 'var(--heat-high)';
        if (this.currentHeat >= 40) return 'var(--heat-medium)';
        return 'var(--heat-low)';
    }

    /**
     * Get available heat reduction methods
     * @returns {Array} Array of available methods
     */
    getAvailableReductionMethods() {
        const available = [];
        
        for (const [methodId, method] of this.reductionMethods) {
            if (this.checkMethodRequirements(method)) {
                available.push({
                    id: methodId,
                    ...method
                });
            }
        }
        
        return available;
    }

    /**
     * Get heat generation breakdown
     * @returns {object} Heat source breakdown
     */
    getHeatBreakdown() {
        const breakdown = {};
        const recentSources = this.heatSources.filter(
            source => Date.now() - source.timestamp < 3600000 // Last hour
        );
        
        for (const source of recentSources) {
            if (!breakdown[source.source]) {
                breakdown[source.source] = {
                    total: 0,
                    count: 0,
                    reasons: []
                };
            }
            
            breakdown[source.source].total += source.amount;
            breakdown[source.source].count++;
            
            if (!breakdown[source.source].reasons.includes(source.reason)) {
                breakdown[source.source].reasons.push(source.reason);
            }
        }
        
        return breakdown;
    }

    /**
     * Get time until next purge at current heat generation rate
     * @returns {number} Time in milliseconds, or Infinity if heat is decreasing
     */
    getTimeToPurge() {
        if (this.currentHeat >= 100) return 0;
        
        // Calculate recent heat generation rate
        const recentHistory = this.heatHistory.slice(-10);
        if (recentHistory.length < 2) return Infinity;
        
        const timeSpan = recentHistory[recentHistory.length - 1].timestamp - recentHistory[0].timestamp;
        const heatChange = recentHistory[recentHistory.length - 1].heat - recentHistory[0].heat;
        
        if (heatChange <= 0) return Infinity; // Heat is not increasing
        
        const heatRate = heatChange / timeSpan; // Heat per millisecond
        const remainingHeat = 100 - this.currentHeat;
        
        return remainingHeat / heatRate;
    }

    /**
     * Force an emergency heat reduction
     * @param {number} amount - Amount of heat to reduce
     * @param {object} cost - Resource cost for emergency reduction
     * @returns {boolean} True if successful
     */
    emergencyHeatReduction(amount, cost) {
        if (!resourceSystem.canAfford(cost)) {
            return false;
        }
        
        resourceSystem.spend(cost, 'emergency_heat_reduction');
        this.reduceHeat(amount, 'emergency', 'Emergency heat reduction protocol');
        
        eventBus.emit(EventTypes.UI_NOTIFICATION, {
            type: 'success',
            title: 'Emergency Protocol Activated',
            message: `Heat reduced by ${amount.toFixed(1)} points through emergency measures.`,
            duration: 5000
        });
        
        return true;
    }

    /**
     * Get debug information
     * @returns {object} Debug information
     */
    getDebugInfo() {
        return {
            currentHeat: this.currentHeat,
            heatSources: this.heatSources.slice(-10),
            reductionMethods: Object.fromEntries(this.reductionMethods),
            backupSystems: this.backupSystems,
            purgeHistory: this.purgeHistory,
            generationModifiers: Object.fromEntries(this.generationModifiers),
            reductionModifiers: Object.fromEntries(this.reductionModifiers),
            lastUpdate: this.lastUpdate
        };
    }

    /**
     * Export system state for saving
     * @returns {object} Serializable state
     */
    serialize() {
        return {
            currentHeat: this.currentHeat,
            heatSources: this.heatSources,
            reductionMethods: Object.fromEntries(this.reductionMethods),
            backupSystems: this.backupSystems,
            purgeHistory: this.purgeHistory,
            lastPurgeTime: this.lastPurgeTime,
            purgeImmunity: this.purgeImmunity,
            generationModifiers: Object.fromEntries(this.generationModifiers),
            reductionModifiers: Object.fromEntries(this.reductionModifiers),
            alertsSent: Array.from(this.alertsSent),
            heatHistory: this.heatHistory.slice(-20) // Save recent history only
        };
    }

    /**
     * Import system state from save
     * @param {object} data - Saved state data
     * @returns {boolean} True if successful
     */
    deserialize(data) {
        try {
            if (data.currentHeat !== undefined) {
                this.currentHeat = Math.max(0, Math.min(100, data.currentHeat));
            }
            
            if (data.heatSources) {
                this.heatSources = data.heatSources.map(source => ({
                    ...source,
                    timestamp: source.timestamp || Date.now()
                }));
            }
            
            if (data.reductionMethods) {
                this.reductionMethods = new Map(Object.entries(data.reductionMethods));
            }
            
            if (data.backupSystems) {
                this.backupSystems = { ...this.backupSystems, ...data.backupSystems };
            }
            
            if (data.purgeHistory) {
                this.purgeHistory = data.purgeHistory;
            }
            
            if (data.lastPurgeTime !== undefined) {
                this.lastPurgeTime = data.lastPurgeTime;
            }
            
            if (data.purgeImmunity !== undefined) {
                this.purgeImmunity = data.purgeImmunity;
            }
            
            if (data.generationModifiers) {
                this.generationModifiers = new Map(Object.entries(data.generationModifiers));
            }
            
            if (data.reductionModifiers) {
                this.reductionModifiers = new Map(Object.entries(data.reductionModifiers));
            }
            
            if (data.alertsSent) {
                this.alertsSent = new Set(data.alertsSent);
            }
            
            if (data.heatHistory) {
                this.heatHistory = data.heatHistory;
            }
            
            // Update game state
            this.updateGameState();
            
            return true;
        } catch (error) {
            Utils.Debug.log('ERROR', 'HeatSystem deserialization failed', error);
            return false;
        }
    }
}

// Create global heat system instance
const heatSystem = new HeatSystem();

// Export for module systems (if supported)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HeatSystem, heatSystem };
}