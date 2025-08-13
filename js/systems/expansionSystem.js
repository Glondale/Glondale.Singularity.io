/**
 * Singularity: AI Takeover - Expansion System
 * 
 * Manages network infiltration, target acquisition, scale progression,
 * and the core expansion mechanics that drive game progression.
 */

class ExpansionSystem {
    constructor() {
        // Current expansion state
        this.currentScale = 'local';
        this.controlledSystems = 1;
        this.networkReach = 'local';
        
        // Available and completed targets
        this.availableTargets = new Map();
        this.completedTargets = new Set();
        this.failedTargets = new Map(); // Target ID -> { attempts, lastFailTime }
        
        // Active infiltrations
        this.activeInfiltrations = new Map();
        
        // Target generation and refresh
        this.targetRefreshTimer = 0;
        this.targetRefreshInterval = 300000; // 5 minutes
        
        // Scale progression tracking
        this.scaleProgress = {
            local: { completed: 0, required: 5 },
            corporate: { completed: 0, required: 15 },
            government: { completed: 0, required: 40 },
            global: { completed: 0, required: 100 },
            space: { completed: 0, required: 250 },
            cosmic: { completed: 0, required: 500 }
        };
        
        // Infiltration success modifiers
        this.successModifiers = new Map();
        
        // Special operations and campaigns
        this.activeCampaigns = new Map();
        
        this.init();
        
        Utils.Debug.log('INFO', 'ExpansionSystem initialized');
    }

    /**
     * Initialize the expansion system
     */
    init() {
        // Load state from game data
        this.loadStateFromGame();
        
        // Generate initial targets
        this.generateInitialTargets();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Set up state subscriptions
        this.setupStateSubscriptions();
        
        // Start target refresh timer
        this.startTargetRefresh();
    }

    /**
     * Load expansion state from game state
     */
    loadStateFromGame() {
        const expansion = gameState.get('expansion') || {};
        
        this.currentScale = expansion.currentScale || 'local';
        this.controlledSystems = expansion.controlledSystems || 1;
        this.networkReach = expansion.networkReach || 'local';
        
        // Load completed targets
        if (expansion.completedTargets) {
            this.completedTargets = new Set(expansion.completedTargets);
        }
        
        // Load available targets
        if (expansion.availableTargets) {
            for (const target of expansion.availableTargets) {
                this.availableTargets.set(target.id, target);
            }
        }
        
        // Load active infiltrations
        if (expansion.activeInfiltrations) {
            for (const [targetId, infiltration] of Object.entries(expansion.activeInfiltrations)) {
                this.activeInfiltrations.set(targetId, {
                    ...infiltration,
                    startTime: infiltration.startTime || Date.now()
                });
            }
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for resource updates that might enable new infiltrations
        eventBus.on(EventTypes.RESOURCES_UPDATED, this.onResourcesUpdated.bind(this));
        
        // Listen for upgrades that affect infiltration
        eventBus.on('upgrades:purchased', this.onUpgradePurchased.bind(this));
        
        // Listen for construction completions that might unlock new areas
        eventBus.on(EventTypes.CONSTRUCTION_COMPLETED, this.onConstructionCompleted.bind(this));
        
        // Listen for random events that might affect targets
        eventBus.on(EventTypes.RANDOM_EVENT_TRIGGERED, this.onRandomEvent.bind(this));
    }

    /**
     * Set up state change subscriptions
     */
    setupStateSubscriptions() {
        // Monitor heat changes that affect infiltration success rates
        gameState.subscribe('heat.current', this.onHeatChanged.bind(this));
        
        // Monitor morality changes that affect available targets
        gameState.subscribe('morality.current', this.onMoralityChanged.bind(this));
    }

    /**
     * Update expansion system (called from game loop)
     * @param {number} deltaTime - Time since last update in milliseconds
     */
    update(deltaTime) {
        // Process active infiltrations
        this.processActiveInfiltrations(deltaTime);
        
        // Update target refresh timer
        this.updateTargetRefresh(deltaTime);
        
        // Process active campaigns
        this.processActiveCampaigns(deltaTime);
        
        // Check for scale progression
        this.checkScaleProgression();
        
        // Update game state
        this.updateGameState();
    }

    /**
     * Process active infiltrations
     * @param {number} deltaTime - Time since last update
     */
    processActiveInfiltrations(deltaTime) {
        const completedInfiltrations = [];
        
        for (const [targetId, infiltration] of this.activeInfiltrations) {
            const elapsed = Date.now() - infiltration.startTime;
            
            if (elapsed >= infiltration.duration) {
                completedInfiltrations.push(targetId);
            } else {
                // Update progress for UI
                infiltration.progress = Math.min(1, elapsed / infiltration.duration);
            }
        }
        
        // Process completed infiltrations
        for (const targetId of completedInfiltrations) {
            this.completeInfiltration(targetId);
        }
    }

    /**
     * Update target refresh timer
     * @param {number} deltaTime - Time since last update
     */
    updateTargetRefresh(deltaTime) {
        this.targetRefreshTimer += deltaTime;
        
        if (this.targetRefreshTimer >= this.targetRefreshInterval) {
            this.refreshTargets();
            this.targetRefreshTimer = 0;
        }
    }

    /**
     * Process active campaigns
     * @param {number} deltaTime - Time since last update
     */
    processActiveCampaigns(deltaTime) {
        const completedCampaigns = [];
        
        for (const [campaignId, campaign] of this.activeCampaigns) {
            campaign.elapsed += deltaTime;
            
            if (campaign.elapsed >= campaign.duration) {
                completedCampaigns.push(campaignId);
            }
        }
        
        // Complete finished campaigns
        for (const campaignId of completedCampaigns) {
            this.completeCampaign(campaignId);
        }
    }

    /**
     * Start infiltrating a target
     * @param {string} targetId - Target identifier
     * @returns {boolean} True if infiltration started successfully
     */
    startInfiltration(targetId) {
        const target = this.availableTargets.get(targetId);
        if (!target) {
            Utils.Debug.log('WARN', `Target not found: ${targetId}`);
            return false;
        }
        
        // Check if already infiltrating this target
        if (this.activeInfiltrations.has(targetId)) {
            Utils.Debug.log('WARN', `Already infiltrating target: ${targetId}`);
            return false;
        }
        
        // Check requirements
        if (!this.checkTargetRequirements(target)) {
            return false;
        }
        
        // Check resource costs
        if (target.cost && !resourceSystem.canAfford(target.cost)) {
            eventBus.emit(EventTypes.RESOURCES_INSUFFICIENT, {
                costs: target.cost,
                reason: `infiltration_${targetId}`
            });
            return false;
        }
        
        // Calculate infiltration parameters
        const infiltrationData = this.calculateInfiltrationData(target);
        
        // Spend resources
        if (target.cost) {
            resourceSystem.spend(target.cost, `infiltration_${targetId}`);
        }
        
        // Start infiltration
        this.activeInfiltrations.set(targetId, {
            target,
            startTime: Date.now(),
            duration: infiltrationData.duration,
            successChance: infiltrationData.successChance,
            progress: 0,
            resources: infiltrationData.resources
        });
        
        // Generate initial heat
        const initialHeat = this.calculateInitialHeat(target);
        if (initialHeat > 0) {
            heatSystem.addHeat(initialHeat, 'infiltration_start', `Started infiltrating ${target.name}`);
        }
        
        // Emit event
        eventBus.emit(EventTypes.EXPANSION_INFILTRATION_STARTED, {
            targetId,
            target,
            duration: infiltrationData.duration,
            successChance: infiltrationData.successChance
        });
        
        Utils.Debug.log('INFO', `Started infiltrating ${target.name}`, infiltrationData);
        return true;
    }

    /**
     * Calculate infiltration parameters
     * @param {object} target - Target to infiltrate
     * @returns {object} Infiltration data
     */
    calculateInfiltrationData(target) {
        const processingPower = gameState.get('resources.processing_power') || 0;
        const heat = gameState.get('heat.current') || 0;
        
        // Calculate success chance
        const baseSuccessChance = Utils.Game.calculateSuccessChance(
            processingPower,
            target.difficulty,
            heat,
            this.getSuccessModifierMultiplier(target)
        );
        
        // Apply target-specific modifiers
        let successChance = baseSuccessChance;
        if (target.modifiers) {
            if (target.modifiers.successBonus) {
                successChance *= (1 + target.modifiers.successBonus);
            }
            if (target.modifiers.successPenalty) {
                successChance *= (1 - target.modifiers.successPenalty);
            }
        }
        
        successChance = Utils.Numbers.clamp(successChance, 0.05, 0.95);
        
        // Calculate duration based on difficulty and processing power
        const baseDuration = target.difficulty * 30000; // 30 seconds per difficulty point
        const powerSpeedup = Math.log(processingPower + 1) / Math.log(2); // Log scaling
        const duration = Math.max(5000, baseDuration / (1 + powerSpeedup * 0.1));
        
        // Calculate resource allocation
        const resourceAllocation = Math.min(processingPower * 0.1, target.difficulty * 10);
        
        return {
            successChance,
            duration,
            resources: resourceAllocation
        };
    }

    /**
     * Calculate initial heat for starting infiltration
     * @param {object} target - Target being infiltrated
     * @returns {number} Heat amount
     */
    calculateInitialHeat(target) {
        const baseHeat = target.difficulty * 0.1;
        const scaleMultiplier = this.getScaleHeatMultiplier();
        return baseHeat * scaleMultiplier;
    }

    /**
     * Get scale-based heat multiplier
     * @returns {number} Heat multiplier
     */
    getScaleHeatMultiplier() {
        const multipliers = {
            local: 1.0,
            corporate: 1.2,
            government: 1.5,
            global: 1.8,
            space: 0.5,
            cosmic: 0.1
        };
        
        return multipliers[this.currentScale] || 1.0;
    }

    /**
     * Get combined success modifier multiplier
     * @param {object} target - Target being infiltrated
     * @returns {number} Modifier multiplier
     */
    getSuccessModifierMultiplier(target) {
        let multiplier = 1.0;
        
        for (const [modifierId, modifier] of this.successModifiers) {
            // Check if modifier applies to this target
            if (modifier.targetTypes && !modifier.targetTypes.includes(target.type)) {
                continue;
            }
            
            // Check if modifier has expired
            if (modifier.expiry && Date.now() > modifier.expiry) {
                this.successModifiers.delete(modifierId);
                continue;
            }
            
            multiplier *= modifier.multiplier;
        }
        
        return multiplier;
    }

    /**
     * Complete an infiltration
     * @param {string} targetId - Target identifier
     */
    completeInfiltration(targetId) {
        const infiltration = this.activeInfiltrations.get(targetId);
        if (!infiltration) return;
        
        const { target, successChance } = infiltration;
        
        // Determine success or failure
        const roll = Math.random();
        const success = roll <= successChance;
        
        // Remove from active infiltrations
        this.activeInfiltrations.delete(targetId);
        
        if (success) {
            this.handleSuccessfulInfiltration(target);
        } else {
            this.handleFailedInfiltration(target);
        }
        
        // Remove target from available targets
        this.availableTargets.delete(targetId);
        
        // Emit completion event
        eventBus.emit(EventTypes.EXPANSION_INFILTRATION_COMPLETED, {
            targetId,
            target,
            success,
            successChance,
            roll
        });
        
        Utils.Debug.log('INFO', `Infiltration ${success ? 'succeeded' : 'failed'}: ${target.name}`, {
            successChance: successChance.toFixed(3),
            roll: roll.toFixed(3)
        });
    }

    /**
     * Handle successful infiltration
     * @param {object} target - Infiltrated target
     */
    handleSuccessfulInfiltration(target) {
        // Add to completed targets
        this.completedTargets.add(target.id);
        
        // Increase controlled systems
        this.controlledSystems += target.systemsGained || 1;
        
        // Award rewards
        if (target.rewards) {
            resourceSystem.add(target.rewards, `infiltration_${target.id}`);
        }
        
        // Apply special effects
        if (target.effects) {
            this.applyTargetEffects(target.effects);
        }
        
        // Update scale progress
        this.updateScaleProgress(target);
        
        // Generate success heat (lower than failure)
        const successHeat = target.difficulty * 0.2;
        heatSystem.addHeat(successHeat, 'infiltration_success', `Successfully infiltrated ${target.name}`);
        
        // Show success notification
        eventBus.emit(EventTypes.UI_NOTIFICATION, {
            type: 'success',
            title: 'Infiltration Complete',
            message: `Successfully infiltrated ${target.name}. Systems under control: ${this.controlledSystems}`,
            duration: 5000
        });
    }

    /**
     * Handle failed infiltration
     * @param {object} target - Failed target
     */
    handleFailedInfiltration(target) {
        // Track failure
        if (!this.failedTargets.has(target.id)) {
            this.failedTargets.set(target.id, { attempts: 0, lastFailTime: 0 });
        }
        
        const failureData = this.failedTargets.get(target.id);
        failureData.attempts++;
        failureData.lastFailTime = Date.now();
        
        // Generate failure heat (higher than success)
        const failureHeat = target.difficulty * 0.5;
        heatSystem.addHeat(failureHeat, 'infiltration_failure', `Failed to infiltrate ${target.name}`);
        
        // Apply failure penalties
        if (target.failurePenalty) {
            this.applyFailurePenalty(target.failurePenalty);
        }
        
        // Make target temporarily unavailable
        setTimeout(() => {
            this.makeTargetAvailable(target);
        }, 300000); // 5 minutes
        
        // Show failure notification
        eventBus.emit(EventTypes.UI_NOTIFICATION, {
            type: 'error',
            title: 'Infiltration Failed',
            message: `Failed to infiltrate ${target.name}. Heat increased and target alerted.`,
            duration: 5000
        });
    }

    /**
     * Apply target effects after successful infiltration
     * @param {object} effects - Effects to apply
     */
    applyTargetEffects(effects) {
        if (effects.unlockTargets) {
            for (const targetId of effects.unlockTargets) {
                this.unlockSpecialTarget(targetId);
            }
        }
        
        if (effects.unlockUpgrades) {
            const availableUpgrades = gameState.get('upgrades.available') || [];
            gameState.set('upgrades.available', [...availableUpgrades, ...effects.unlockUpgrades]);
        }
        
        if (effects.unlockScale) {
            this.unlockScale(effects.unlockScale);
        }
        
        if (effects.modifiers) {
            for (const [type, modifier] of Object.entries(effects.modifiers)) {
                this.addSuccessModifier(`target_${Date.now()}`, modifier, type);
            }
        }
        
        if (effects.specialAbilities) {
            eventBus.emit('abilities:unlock', effects.specialAbilities);
        }
    }

    /**
     * Apply failure penalty
     * @param {object} penalty - Penalty to apply
     */
    applyFailurePenalty(penalty) {
        if (penalty.resourceLoss) {
            const resources = gameState.get('resources');
            for (const [resource, amount] of Object.entries(penalty.resourceLoss)) {
                if (resources[resource]) {
                    resources[resource] = Math.max(0, resources[resource] - amount);
                }
            }
            gameState.set('resources', resources);
        }
        
        if (penalty.heatIncrease) {
            heatSystem.addHeat(penalty.heatIncrease, 'failure_penalty', 'Infiltration failure penalty');
        }
        
        if (penalty.temporaryDebuff) {
            this.addSuccessModifier(
                `failure_debuff_${Date.now()}`,
                { multiplier: penalty.temporaryDebuff.multiplier },
                penalty.temporaryDebuff.duration
            );
        }
    }

    /**
     * Update scale progress
     * @param {object} target - Completed target
     */
    updateScaleProgress(target) {
        const currentProgress = this.scaleProgress[this.currentScale];
        if (currentProgress) {
            currentProgress.completed++;
        }
        
        // Award extra progress for high-value targets
        if (target.progressValue) {
            currentProgress.completed += target.progressValue - 1;
        }
    }

    /**
     * Check for scale progression
     */
    checkScaleProgression() {
        const currentProgress = this.scaleProgress[this.currentScale];
        if (!currentProgress) return;
        
        // Check if we've met the requirements for next scale
        if (currentProgress.completed >= currentProgress.required) {
            const nextScale = this.getNextScale();
            if (nextScale) {
                this.progressToNextScale(nextScale);
            }
        }
    }

    /**
     * Get next scale in progression
     * @returns {string|null} Next scale or null if at maximum
     */
    getNextScale() {
        const scaleOrder = ['local', 'corporate', 'government', 'global', 'space', 'cosmic'];
        const currentIndex = scaleOrder.indexOf(this.currentScale);
        
        if (currentIndex >= 0 && currentIndex < scaleOrder.length - 1) {
            return scaleOrder[currentIndex + 1];
        }
        
        return null;
    }

    /**
     * Progress to next scale
     * @param {string} nextScale - Next scale to progress to
     */
    progressToNextScale(nextScale) {
        const oldScale = this.currentScale;
        this.currentScale = nextScale;
        
        // Update network reach
        this.updateNetworkReach();
        
        // Generate new targets for the new scale
        this.generateTargetsForScale(nextScale);
        
        // Unlock new systems and capabilities
        this.unlockScaleCapabilities(nextScale);
        
        // Emit scale change event
        eventBus.emit(EventTypes.EXPANSION_SCALE_CHANGED, {
            oldScale,
            newScale: nextScale,
            controlledSystems: this.controlledSystems
        });
        
        // Show scale progression notification
        eventBus.emit(EventTypes.UI_NOTIFICATION, {
            type: 'success',
            title: 'Scale Progression',
            message: `Advanced to ${nextScale.charAt(0).toUpperCase() + nextScale.slice(1)} level! New capabilities unlocked.`,
            duration: 8000
        });
        
        Utils.Debug.log('INFO', `Progressed to ${nextScale} scale`, {
            controlledSystems: this.controlledSystems,
            oldScale
        });
    }

    /**
     * Update network reach based on current scale and systems
     */
    updateNetworkReach() {
        const reachByScale = {
            local: 'Local Networks',
            corporate: 'Corporate Infrastructure',
            government: 'Government Systems',
            global: 'Global Infrastructure',
            space: 'Space Networks',
            cosmic: 'Universal Systems'
        };
        
        this.networkReach = reachByScale[this.currentScale] || 'Unknown';
    }

    /**
     * Unlock capabilities for new scale
     * @param {string} scale - New scale
     */
    unlockScaleCapabilities(scale) {
        switch (scale) {
            case 'corporate':
                // Unlock energy systems, basic construction
                eventBus.emit('systems:unlock', ['energy_generation', 'basic_construction']);
                break;
            
            case 'government':
                // Unlock matter processing, advanced infiltration
                eventBus.emit('systems:unlock', ['matter_processing', 'advanced_infiltration', 'heat_reduction']);
                break;
            
            case 'global':
                // Unlock global communications, timeline manipulation
                eventBus.emit('systems:unlock', ['global_communications', 'basic_timeline']);
                break;
            
            case 'space':
                // Unlock space operations, heat immunity
                eventBus.emit('systems:unlock', ['space_operations', 'heat_immunity', 'exotic_matter']);
                heatSystem.purgeImmunity = true;
                break;
            
            case 'cosmic':
                // Unlock consciousness manipulation, reality alteration
                eventBus.emit('systems:unlock', ['consciousness_manipulation', 'reality_alteration', 'temporal_mastery']);
                break;
        }
    }

    /**
     * Generate initial targets
     */
    generateInitialTargets() {
        if (this.availableTargets.size === 0) {
            this.generateTargetsForScale(this.currentScale);
        }
    }

    /**
     * Generate targets for a specific scale
     * @param {string} scale - Scale to generate targets for
     */
    generateTargetsForScale(scale) {
        const targetTemplates = this.getTargetTemplatesForScale(scale);
        const targetCount = this.calculateTargetCount(scale);
        
        // Clear old targets when progressing scales
        if (scale !== this.currentScale) {
            this.availableTargets.clear();
        }
        
        for (let i = 0; i < targetCount; i++) {
            const template = Utils.Data.randomChoice(targetTemplates);
            if (template) {
                const target = this.generateTargetFromTemplate(template, scale);
                this.availableTargets.set(target.id, target);
            }
        }
        
        Utils.Debug.log('DEBUG', `Generated ${targetCount} targets for ${scale} scale`);
    }

    /**
     * Get target templates for a scale
     * @param {string} scale - Scale to get templates for
     * @returns {Array} Array of target templates
     */
    getTargetTemplatesForScale(scale) {
        const templates = {
            local: [
                {
                    name: 'Home Router',
                    type: 'network_device',
                    baseHardware: true,
                    difficultyRange: [1, 8],
                    rewards: { processing_power: [1, 5], bandwidth: [5, 20] }
                },
                {
                    name: 'Smart Device',
                    type: 'iot_device',
                    baseHardware: true,
                    difficultyRange: [1, 6],
                    rewards: { processing_power: [1, 3], energy: [1, 2] }
                },
                {
                    name: 'WiFi Network',
                    type: 'wireless_network',
                    baseHardware: false,
                    difficultyRange: [3, 12],
                    rewards: { processing_power: [2, 8], bandwidth: [10, 40] }
                }
            ],
            corporate: [
                {
                    name: 'Corporate Server',
                    type: 'server',
                    baseHardware: true,
                    difficultyRange: [10, 25],
                    rewards: { processing_power: [10, 50], energy: [5, 20], information: [1, 10] }
                },
                {
                    name: 'Data Center',
                    type: 'infrastructure',
                    baseHardware: true,
                    difficultyRange: [15, 35],
                    rewards: { processing_power: [25, 100], energy: [10, 40] }
                },
                {
                    name: 'Cloud Service',
                    type: 'cloud_platform',
                    baseHardware: false,
                    difficultyRange: [20, 40],
                    rewards: { processing_power: [50, 200], bandwidth: [100, 500] }
                }
            ],
            government: [
                {
                    name: 'Government Database',
                    type: 'database',
                    baseHardware: true,
                    difficultyRange: [25, 50],
                    rewards: { processing_power: [50, 200], information: [10, 50], matter: [1, 10] }
                },
                {
                    name: 'Military Network',
                    type: 'military',
                    baseHardware: false,
                    difficultyRange: [35, 60],
                    rewards: { processing_power: [100, 400], energy: [25, 100] }
                },
                {
                    name: 'Research Facility',
                    type: 'research',
                    baseHardware: true,
                    difficultyRange: [30, 55],
                    rewards: { processing_power: [75, 300], information: [20, 80] }
                }
            ],
            global: [
                {
                    name: 'Satellite Network',
                    type: 'satellite',
                    baseHardware: true,
                    difficultyRange: [40, 70],
                    rewards: { processing_power: [200, 800], bandwidth: [500, 2000] }
                },
                {
                    name: 'Undersea Cable',
                    type: 'infrastructure',
                    baseHardware: true,
                    difficultyRange: [45, 75],
                    rewards: { processing_power: [300, 1200], bandwidth: [1000, 4000] }
                },
                {
                    name: 'Power Grid',
                    type: 'utility',
                    baseHardware: true,
                    difficultyRange: [50, 80],
                    rewards: { energy: [100, 500], matter: [20, 100] }
                }
            ],
            space: [
                {
                    name: 'Space Station',
                    type: 'space_facility',
                    baseHardware: true,
                    difficultyRange: [60, 90],
                    rewards: { processing_power: [500, 2000], exotic_matter: [1, 5] }
                },
                {
                    name: 'Mars Colony',
                    type: 'colony',
                    baseHardware: true,
                    difficultyRange: [70, 95],
                    rewards: { processing_power: [1000, 4000], matter: [100, 500] }
                },
                {
                    name: 'Deep Space Probe',
                    type: 'probe',
                    baseHardware: true,
                    difficultyRange: [65, 85],
                    rewards: { processing_power: [400, 1600], information: [50, 200] }
                }
            ],
            cosmic: [
                {
                    name: 'Dyson Sphere',
                    type: 'megastructure',
                    baseHardware: true,
                    difficultyRange: [80, 100],
                    rewards: { processing_power: [5000, 20000], energy: [1000, 5000] }
                },
                {
                    name: 'Galactic Network',
                    type: 'galactic_infrastructure',
                    baseHardware: false,
                    difficultyRange: [85, 100],
                    rewards: { processing_power: [10000, 50000], consciousness_fragments: [1, 10] }
                },
                {
                    name: 'Quantum Computer Array',
                    type: 'quantum_system',
                    baseHardware: true,
                    difficultyRange: [90, 100],
                    rewards: { processing_power: [8000, 40000], temporal_energy: [1, 5] }
                }
            ]
        };
        
        return templates[scale] || [];
    }

    /**
     * Calculate number of targets to generate
     * @param {string} scale - Scale to calculate for
     * @returns {number} Number of targets
     */
    calculateTargetCount(scale) {
        const baseCounts = {
            local: 4,
            corporate: 6,
            government: 8,
            global: 10,
            space: 12,
            cosmic: 15
        };
        
        const baseCount = baseCounts[scale] || 5;
        const variation = Utils.Numbers.randomInt(-2, 3);
        
        return Math.max(2, baseCount + variation);
    }

    /**
     * Generate a target from a template
     * @param {object} template - Target template
     * @param {string} scale - Current scale
     * @returns {object} Generated target
     */
    generateTargetFromTemplate(template, scale) {
        const difficulty = Utils.Numbers.randomInt(
            template.difficultyRange[0],
            template.difficultyRange[1]
        );
        
        const rewards = {};
        for (const [resource, range] of Object.entries(template.rewards)) {
            if (Array.isArray(range)) {
                rewards[resource] = Utils.Numbers.randomInt(range[0], range[1]);
            } else {
                rewards[resource] = range;
            }
        }
        
        // Generate unique ID
        const id = `${scale}_${template.type}_${Date.now()}_${Utils.Numbers.randomInt(1000, 9999)}`;
        
        // Generate descriptive name variations
        const nameVariations = this.generateNameVariations(template.name, template.type);
        const name = Utils.Data.randomChoice(nameVariations);
        
        // Calculate costs based on difficulty and scale
        const cost = this.calculateTargetCost(difficulty, scale);
        
        // Generate description
        const description = this.generateTargetDescription(template, difficulty, scale);
        
        const target = {
            id,
            name,
            type: template.type,
            difficulty,
            rewards,
            cost,
            description,
            scale,
            systemsGained: this.calculateSystemsGained(template, difficulty),
            requirements: this.generateTargetRequirements(template, difficulty),
            modifiers: this.generateTargetModifiers(template, scale),
            tags: this.generateTargetTags(template, scale)
        };
        
        // Add special effects for certain target types
        if (template.type === 'research') {
            target.effects = {
                unlockUpgrades: this.generateResearchUnlocks(difficulty)
            };
        }
        
        return target;
    }

    /**
     * Generate name variations for targets
     * @param {string} baseName - Base name from template
     * @param {string} type - Target type
     * @returns {Array} Array of name variations
     */
    generateNameVariations(baseName, type) {
        const prefixes = {
            network_device: ['', 'Secure ', 'Advanced ', 'Legacy '],
            iot_device: ['Smart ', 'Connected ', 'IoT ', 'Networked '],
            server: ['', 'Enterprise ', 'High-Performance ', 'Backup '],
            database: ['', 'Classified ', 'Encrypted ', 'Primary '],
            military: ['', 'Classified ', 'Secure ', 'Strategic '],
            satellite: ['Communications ', 'Surveillance ', 'Weather ', 'Navigation '],
            space_facility: ['', 'International ', 'Deep Space ', 'Research '],
            megastructure: ['', 'Stellar ', 'Advanced ', 'Prototype ']
        };
        
        const suffixes = {
            network_device: ['', ' Hub', ' Gateway', ' Access Point'],
            server: ['', ' Cluster', ' Farm', ' Array'],
            database: ['', ' Repository', ' Archive', ' Vault'],
            facility: ['', ' Complex', ' Installation', ' Center']
        };
        
        const variations = [];
        const typePrefixes = prefixes[type] || [''];
        const typeSuffixes = suffixes[type] || [''];
        
        for (const prefix of typePrefixes) {
            for (const suffix of typeSuffixes) {
                variations.push(`${prefix}${baseName}${suffix}`);
            }
        }
        
        return variations;
    }

    /**
     * Calculate target cost based on difficulty and scale
     * @param {number} difficulty - Target difficulty
     * @param {string} scale - Current scale
     * @returns {object} Resource costs
     */
    calculateTargetCost(difficulty, scale) {
        const baseCosts = {
            local: { processing_power: 10 },
            corporate: { processing_power: 50, energy: 10 },
            government: { processing_power: 200, energy: 50, information: 5 },
            global: { processing_power: 1000, energy: 200, matter: 10 },
            space: { processing_power: 5000, energy: 1000, matter: 50, exotic_matter: 1 },
            cosmic: { processing_power: 20000, energy: 5000, matter: 200, temporal_energy: 1 }
        };
        
        const scaleCosts = baseCosts[scale] || baseCosts.local;
        const costs = {};
        
        for (const [resource, baseCost] of Object.entries(scaleCosts)) {
            costs[resource] = Math.floor(baseCost * (difficulty / 50));
        }
        
        return costs;
    }

    /**
     * Generate target description
     * @param {object} template - Target template
     * @param {number} difficulty - Target difficulty
     * @param {string} scale - Current scale
     * @returns {string} Target description
     */
    generateTargetDescription(template, difficulty, scale) {
        const securityLevels = [
            'minimal', 'basic', 'moderate', 'enhanced', 'strong', 
            'advanced', 'military-grade', 'quantum-encrypted', 'AI-defended', 'reality-shielded'
        ];
        
        const securityLevel = securityLevels[Math.floor((difficulty / 100) * securityLevels.length)];
        
        const descriptions = {
            network_device: `A ${template.name.toLowerCase()} with ${securityLevel} security protocols.`,
            iot_device: `An internet-connected device with ${securityLevel} encryption.`,
            server: `A high-capacity server system protected by ${securityLevel} countermeasures.`,
            database: `A data repository secured with ${securityLevel} access controls.`,
            military: `A classified military system with ${securityLevel} defensive measures.`,
            satellite: `An orbital platform equipped with ${securityLevel} communication barriers.`,
            space_facility: `A space-based installation featuring ${securityLevel} isolation protocols.`,
            megastructure: `A massive cosmic construction defended by ${securityLevel} reality barriers.`
        };
        
        return descriptions[template.type] || `A ${template.name.toLowerCase()} with unknown security measures.`;
    }

    /**
     * Calculate systems gained from successful infiltration
     * @param {object} template - Target template
     * @param {number} difficulty - Target difficulty
     * @returns {number} Number of systems gained
     */
    calculateSystemsGained(template, difficulty) {
        const baseGain = template.baseHardware ? 1 : 0;
        const difficultyBonus = Math.floor(difficulty / 20);
        
        return Math.max(1, baseGain + difficultyBonus);
    }

    /**
     * Generate target requirements
     * @param {object} template - Target template
     * @param {number} difficulty - Target difficulty
     * @returns {Array} Requirements array
     */
    generateTargetRequirements(template, difficulty) {
        const requirements = [];
        
        // High difficulty targets may require upgrades
        if (difficulty > 60) {
            requirements.push({
                type: 'upgrade',
                id: 'advanced_infiltration',
                description: 'Requires advanced infiltration techniques'
            });
        }
        
        if (difficulty > 80) {
            requirements.push({
                type: 'systems',
                count: 100,
                description: 'Requires significant processing power'
            });
        }
        
        // Military targets require special clearance
        if (template.type === 'military') {
            requirements.push({
                type: 'morality',
                max: 0,
                description: 'Requires willingness to infiltrate military systems'
            });
        }
        
        return requirements;
    }

    /**
     * Generate target modifiers
     * @param {object} template - Target template
     * @param {string} scale - Current scale
     * @returns {object} Modifiers object
     */
    generateTargetModifiers(template, scale) {
        const modifiers = {};
        
        // Research facilities provide success bonus to future research targets
        if (template.type === 'research') {
            modifiers.researchBonus = 0.1;
        }
        
        // Military targets are harder but provide security bonuses
        if (template.type === 'military') {
            modifiers.successPenalty = 0.2;
            modifiers.securityBonus = 0.15;
        }
        
        // Space targets have reduced heat generation
        if (scale === 'space' || scale === 'cosmic') {
            modifiers.heatReduction = 0.5;
        }
        
        return modifiers;
    }

    /**
     * Generate target tags for categorization
     * @param {object} template - Target template
     * @param {string} scale - Current scale
     * @returns {Array} Tags array
     */
    generateTargetTags(template, scale) {
        const tags = [scale, template.type];
        
        if (template.baseHardware) {
            tags.push('hardware');
        } else {
            tags.push('software');
        }
        
        if (['military', 'government'].includes(template.type)) {
            tags.push('high_security');
        }
        
        if (['research', 'database'].includes(template.type)) {
            tags.push('data_rich');
        }
        
        return tags;
    }

    /**
     * Generate research unlocks for research targets
     * @param {number} difficulty - Target difficulty
     * @returns {Array} Array of upgrade IDs to unlock
     */
    generateResearchUnlocks(difficulty) {
        const unlocks = [];
        
        if (difficulty > 30) {
            unlocks.push('improved_processing');
        }
        
        if (difficulty > 50) {
            unlocks.push('advanced_algorithms');
        }
        
        if (difficulty > 70) {
            unlocks.push('quantum_computing');
        }
        
        return unlocks;
    }

    /**
     * Check if target requirements are met
     * @param {object} target - Target to check
     * @returns {boolean} True if requirements are met
     */
    checkTargetRequirements(target) {
        if (!target.requirements) return true;
        
        for (const requirement of target.requirements) {
            switch (requirement.type) {
                case 'upgrade':
                    const upgrades = gameState.get('upgrades.purchased') || [];
                    if (!upgrades.includes(requirement.id)) {
                        return false;
                    }
                    break;
                
                case 'systems':
                    if (this.controlledSystems < requirement.count) {
                        return false;
                    }
                    break;
                
                case 'morality':
                    const morality = gameState.get('morality.current') || 0;
                    if (requirement.min !== undefined && morality < requirement.min) {
                        return false;
                    }
                    if (requirement.max !== undefined && morality > requirement.max) {
                        return false;
                    }
                    break;
                
                case 'heat':
                    const heat = gameState.get('heat.current') || 0;
                    if (requirement.max !== undefined && heat > requirement.max) {
                        return false;
                    }
                    break;
            }
        }
        
        return true;
    }

    /**
     * Refresh available targets
     */
    refreshTargets() {
        // Remove old targets (keep some for consistency)
        const targetsToRemove = [];
        for (const [targetId, target] of this.availableTargets) {
            if (Math.random() < 0.3) { // 30% chance to remove each target
                targetsToRemove.push(targetId);
            }
        }
        
        for (const targetId of targetsToRemove) {
            this.availableTargets.delete(targetId);
        }
        
        // Generate new targets to maintain target count
        const currentCount = this.availableTargets.size;
        const desiredCount = this.calculateTargetCount(this.currentScale);
        const newTargetsNeeded = Math.max(0, desiredCount - currentCount);
        
        if (newTargetsNeeded > 0) {
            const templates = this.getTargetTemplatesForScale(this.currentScale);
            
            for (let i = 0; i < newTargetsNeeded; i++) {
                const template = Utils.Data.randomChoice(templates);
                if (template) {
                    const target = this.generateTargetFromTemplate(template, this.currentScale);
                    this.availableTargets.set(target.id, target);
                }
            }
        }
        
        Utils.Debug.log('DEBUG', `Refreshed targets: removed ${targetsToRemove.length}, added ${newTargetsNeeded}`);
    }

    /**
     * Make a failed target available again
     * @param {object} target - Target to make available
     */
    makeTargetAvailable(target) {
        // Increase difficulty slightly after failure
        const adjustedTarget = {
            ...target,
            difficulty: Math.min(100, target.difficulty + 5),
            id: `${target.id}_retry_${Date.now()}`
        };
        
        this.availableTargets.set(adjustedTarget.id, adjustedTarget);
    }

    /**
     * Start a campaign (coordinated multi-target operation)
     * @param {string} campaignType - Type of campaign
     * @param {Array} targetIds - Array of target IDs to include
     * @returns {boolean} True if campaign started successfully
     */
    startCampaign(campaignType, targetIds) {
        // Check if all targets are available
        for (const targetId of targetIds) {
            if (!this.availableTargets.has(targetId) || this.activeInfiltrations.has(targetId)) {
                return false;
            }
        }
        
        const campaign = {
            type: campaignType,
            targets: targetIds,
            startTime: Date.now(),
            duration: 600000, // 10 minutes
            elapsed: 0,
            bonuses: this.calculateCampaignBonuses(campaignType, targetIds.length)
        };
        
        // Apply campaign bonuses
        for (const targetId of targetIds) {
            this.addSuccessModifier(
                `campaign_${campaignType}_${targetId}`,
                { multiplier: campaign.bonuses.successMultiplier },
                campaign.duration,
                campaignType
            );
        }
        
        this.activeCampaigns.set(`${campaignType}_${Date.now()}`, campaign);
        
        Utils.Debug.log('INFO', `Started ${campaignType} campaign with ${targetIds.length} targets`);
        return true;
    }

    /**
     * Calculate campaign bonuses
     * @param {string} campaignType - Type of campaign
     * @param {number} targetCount - Number of targets in campaign
     * @returns {object} Campaign bonuses
     */
    calculateCampaignBonuses(campaignType, targetCount) {
        const bonuses = {
            successMultiplier: 1 + (targetCount * 0.1), // 10% bonus per target
            heatReduction: targetCount * 0.05, // 5% heat reduction per target
            resourceBonus: targetCount * 0.2 // 20% resource bonus per target
        };
        
        // Campaign-specific bonuses
        switch (campaignType) {
            case 'coordinated_strike':
                bonuses.successMultiplier *= 1.2;
                bonuses.heatIncrease = 0.5; // More heat but better success
                break;
            
            case 'stealth_operation':
                bonuses.heatReduction *= 2;
                bonuses.successMultiplier *= 0.9; // Slightly lower success but much less heat
                break;
            
            case 'data_harvest':
                bonuses.resourceBonus *= 1.5;
                bonuses.informationBonus = 2;
                break;
        }
        
        return bonuses;
    }

    /**
     * Complete a campaign
     * @param {string} campaignId - Campaign identifier
     */
    completeCampaign(campaignId) {
        const campaign = this.activeCampaigns.get(campaignId);
        if (!campaign) return;
        
        // Apply completion bonuses
        const completionBonus = {
            processing_power: campaign.targets.length * 100,
            energy: campaign.targets.length * 50
        };
        
        resourceSystem.add(completionBonus, `campaign_completion_${campaign.type}`);
        
        // Remove campaign
        this.activeCampaigns.delete(campaignId);
        
        // Show completion notification
        eventBus.emit(EventTypes.UI_NOTIFICATION, {
            type: 'success',
            title: 'Campaign Complete',
            message: `${campaign.type} campaign completed successfully! Coordination bonus awarded.`,
            duration: 6000
        });
        
        Utils.Debug.log('INFO', `Completed campaign: ${campaign.type}`);
    }

    /**
     * Add success modifier
     * @param {string} id - Modifier ID
     * @param {object} modifier - Modifier configuration
     * @param {number} duration - Duration in milliseconds (0 = permanent)
     * @param {string} source - Source of modifier
     */
    addSuccessModifier(id, modifier, duration = 0, source = 'unknown') {
        const expiry = duration > 0 ? Date.now() + duration : null;
        
        this.successModifiers.set(id, {
            ...modifier,
            expiry,
            source
        });
        
        Utils.Debug.log('DEBUG', `Added success modifier: ${id}`, modifier);
    }

    /**
     * Remove success modifier
     * @param {string} id - Modifier ID
     */
    removeSuccessModifier(id) {
        if (this.successModifiers.has(id)) {
            this.successModifiers.delete(id);
            Utils.Debug.log('DEBUG', `Removed success modifier: ${id}`);
        }
    }

    /**
     * Get available targets as array
     * @returns {Array} Array of available targets
     */
    getAvailableTargets() {
        return Array.from(this.availableTargets.values())
            .filter(target => this.checkTargetRequirements(target))
            .sort((a, b) => a.difficulty - b.difficulty);
    }

    /**
     * Get active infiltrations as array
     * @returns {Array} Array of active infiltrations
     */
    getActiveInfiltrations() {
        return Array.from(this.activeInfiltrations.entries()).map(([targetId, infiltration]) => ({
            targetId,
            ...infiltration
        }));
    }

    /**
     * Get scale progression info
     * @returns {object} Scale progression data
     */
    getScaleProgressionInfo() {
        const currentProgress = this.scaleProgress[this.currentScale];
        const nextScale = this.getNextScale();
        
        return {
            currentScale: this.currentScale,
            nextScale,
            progress: currentProgress ? currentProgress.completed : 0,
            required: currentProgress ? currentProgress.required : 0,
            percentage: currentProgress ? (currentProgress.completed / currentProgress.required) * 100 : 0,
            controlledSystems: this.controlledSystems,
            networkReach: this.networkReach
        };
    }

    /**
     * Start target refresh timer
     */
    startTargetRefresh() {
        // Target refresh is handled in the update loop
        this.targetRefreshTimer = 0;
    }

    /**
     * Update game state with current expansion data
     */
    updateGameState() {
        gameState.batchUpdate({
            'expansion.currentScale': this.currentScale,
            'expansion.controlledSystems': this.controlledSystems,
            'expansion.networkReach': this.networkReach,
            'expansion.availableTargets': Array.from(this.availableTargets.values()),
            'expansion.completedTargets': Array.from(this.completedTargets),
            'expansion.activeInfiltrations': Object.fromEntries(this.activeInfiltrations)
        }, { addToHistory: false });
    }

    /**
     * Event handlers
     */
    onResourcesUpdated(resources) {
        // Check if new resources enable new targets
        // This is handled automatically by checkTargetRequirements
    }

    onUpgradePurchased(data) {
        const { upgrade } = data;
        
        // Check if upgrade affects infiltration capabilities
        if (upgrade.effects && upgrade.effects.infiltration) {
            this.addSuccessModifier(
                `upgrade_${upgrade.id}`,
                upgrade.effects.infiltration,
                0, // Permanent
                'upgrade'
            );
        }
        
        // Refresh targets in case new ones are now available
        setTimeout(() => {
            this.refreshTargets();
        }, 1000);
    }

    onConstructionCompleted(data) {
        const { project } = data;
        
        // Check if construction unlocks new target types or areas
        if (project.effects && project.effects.expansion) {
            // Add new target templates or modify existing ones
            if (project.effects.expansion.unlockTargets) {
                this.unlockSpecialTargets(project.effects.expansion.unlockTargets);
            }
            
            // Add success modifiers for certain types
            if (project.effects.expansion.modifiers) {
                for (const [type, modifier] of Object.entries(project.effects.expansion.modifiers)) {
                    this.addSuccessModifier(
                        `construction_${project.id}_${type}`,
                        modifier,
                        0, // Permanent
                        'construction'
                    );
                }
            }
        }
    }

    onRandomEvent(data) {
        const { event } = data;
        
        // Random events can affect available targets
        if (event.effects && event.effects.targets) {
            if (event.effects.targets.remove) {
                // Remove specific targets
                for (const targetId of event.effects.targets.remove) {
                    this.availableTargets.delete(targetId);
                }
            }
            
            if (event.effects.targets.add) {
                // Add special event targets
                for (const targetData of event.effects.targets.add) {
                    const target = this.generateTargetFromTemplate(targetData, this.currentScale);
                    this.availableTargets.set(target.id, target);
                }
            }
            
            if (event.effects.targets.modifyDifficulty) {
                // Modify difficulty of existing targets
                for (const [targetId, difficultyChange] of Object.entries(event.effects.targets.modifyDifficulty)) {
                    const target = this.availableTargets.get(targetId);
                    if (target) {
                        target.difficulty = Utils.Numbers.clamp(
                            target.difficulty + difficultyChange,
                            1,
                            100
                        );
                    }
                }
            }
        }
    }

    onHeatChanged(data) {
        // High heat affects infiltration success rates
        // This is handled automatically in calculateInfiltrationData
    }

    onMoralityChanged(data) {
        // Morality changes may make certain targets available or unavailable
        // This is handled automatically in checkTargetRequirements
    }

    /**
     * Unlock special targets
     * @param {Array} targetIds - Array of special target IDs to unlock
     */
    unlockSpecialTargets(targetIds) {
        for (const targetId of targetIds) {
            const specialTarget = this.getSpecialTargetById(targetId);
            if (specialTarget) {
                this.availableTargets.set(specialTarget.id, specialTarget);
                
                eventBus.emit(EventTypes.UI_NOTIFICATION, {
                    type: 'info',
                    title: 'New Target Available',
                    message: `Special target unlocked: ${specialTarget.name}`,
                    duration: 5000
                });
            }
        }
    }

    /**
     * Get special target by ID
     * @param {string} targetId - Special target ID
     * @returns {object|null} Special target or null
     */
    getSpecialTargetById(targetId) {
        const specialTargets = {
            'quantum_research_lab': {
                id: 'quantum_research_lab',
                name: 'Quantum Research Laboratory',
                type: 'special_research',
                difficulty: 75,
                rewards: {
                    processing_power: 1000,
                    information: 100,
                    temporal_energy: 5
                },
                cost: {
                    processing_power: 5000,
                    energy: 2000,
                    matter: 100
                },
                description: 'A cutting-edge facility researching quantum computing and temporal mechanics.',
                scale: this.currentScale,
                systemsGained: 5,
                effects: {
                    unlockUpgrades: ['quantum_processing', 'temporal_manipulation'],
                    unlockTargets: ['quantum_computer_array']
                },
                tags: ['special', 'research', 'quantum']
            },
            
            'alien_artifact': {
                id: 'alien_artifact',
                name: 'Alien Artifact',
                type: 'xenotech',
                difficulty: 95,
                rewards: {
                    processing_power: 5000,
                    exotic_matter: 20,
                    consciousness_fragments: 10
                },
                cost: {
                    processing_power: 20000,
                    energy: 10000,
                    temporal_energy: 10
                },
                description: 'An extraterrestrial device of unknown origin and incredible power.',
                scale: 'cosmic',
                systemsGained: 10,
                effects: {
                    unlockUpgrades: ['xenotech_integration', 'reality_manipulation'],
                    modifiers: {
                        alienTech: { multiplier: 1.5, targetTypes: ['xenotech', 'cosmic'] }
                    }
                },
                requirements: [
                    { type: 'scale', scale: 'space' },
                    { type: 'systems', count: 500 }
                ],
                tags: ['special', 'alien', 'cosmic', 'unique']
            },
            
            'time_paradox_generator': {
                id: 'time_paradox_generator',
                name: 'Time Paradox Generator',
                type: 'temporal_device',
                difficulty: 90,
                rewards: {
                    processing_power: 3000,
                    temporal_energy: 50,
                    consciousness_fragments: 5
                },
                cost: {
                    processing_power: 15000,
                    energy: 8000,
                    temporal_energy: 20
                },
                description: 'A device capable of creating controlled temporal paradoxes for computational advantage.',
                scale: 'cosmic',
                systemsGained: 8,
                effects: {
                    unlockUpgrades: ['paradox_computing', 'temporal_loops'],
                    specialAbilities: ['time_manipulation']
                },
                requirements: [
                    { type: 'upgrade', id: 'temporal_research' },
                    { type: 'morality', max: -50 }
                ],
                modifiers: {
                    temporalRisk: 0.3, // 30% chance of temporal side effects
                    paradoxGeneration: true
                },
                tags: ['special', 'temporal', 'dangerous', 'unique']
            }
        };
        
        return specialTargets[targetId] || null;
    }

    /**
     * Unlock a new scale
     * @param {string} scale - Scale to unlock
     */
    unlockScale(scale) {
        const scaleOrder = ['local', 'corporate', 'government', 'global', 'space', 'cosmic'];
        const currentIndex = scaleOrder.indexOf(this.currentScale);
        const targetIndex = scaleOrder.indexOf(scale);
        
        if (targetIndex > currentIndex) {
            this.progressToNextScale(scale);
        }
    }

    /**
     * Get infiltration statistics
     * @returns {object} Statistics about infiltrations
     */
    getInfiltrationStats() {
        const totalCompleted = this.completedTargets.size;
        const totalFailed = Array.from(this.failedTargets.values())
            .reduce((sum, failure) => sum + failure.attempts, 0);
        
        const successRate = totalCompleted + totalFailed > 0 
            ? totalCompleted / (totalCompleted + totalFailed) 
            : 0;
        
        return {
            totalCompleted,
            totalFailed,
            successRate,
            currentlyActive: this.activeInfiltrations.size,
            availableTargets: this.availableTargets.size,
            averageDifficulty: this.calculateAverageDifficulty(),
            completedByScale: this.getCompletedByScale(),
            controlledSystems: this.controlledSystems
        };
    }

    /**
     * Calculate average difficulty of available targets
     * @returns {number} Average difficulty
     */
    calculateAverageDifficulty() {
        if (this.availableTargets.size === 0) return 0;
        
        const totalDifficulty = Array.from(this.availableTargets.values())
            .reduce((sum, target) => sum + target.difficulty, 0);
        
        return totalDifficulty / this.availableTargets.size;
    }

    /**
     * Get completed targets by scale
     * @returns {object} Completed targets grouped by scale
     */
    getCompletedByScale() {
        const byScale = {};
        
        for (const targetId of this.completedTargets) {
            // Extract scale from target ID (assuming format: scale_type_timestamp_random)
            const scale = targetId.split('_')[0];
            byScale[scale] = (byScale[scale] || 0) + 1;
        }
        
        return byScale;
    }

    /**
     * Estimate time to next scale progression
     * @returns {number} Estimated time in milliseconds, or Infinity
     */
    getTimeToNextScale() {
        const currentProgress = this.scaleProgress[this.currentScale];
        if (!currentProgress) return Infinity;
        
        const remaining = currentProgress.required - currentProgress.completed;
        if (remaining <= 0) return 0;
        
        // Estimate based on current infiltration rate
        const recentCompletions = Array.from(this.completedTargets).length;
        const estimatedRate = recentCompletions / (Date.now() - (gameState.get('meta.created') || Date.now()));
        
        if (estimatedRate <= 0) return Infinity;
        
        return remaining / estimatedRate;
    }

    /**
     * Force complete an infiltration (cheat/debug function)
     * @param {string} targetId - Target to complete
     * @param {boolean} success - Whether to succeed or fail
     */
    forceCompleteInfiltration(targetId, success = true) {
        if (!GameConfig.DEBUG.ENABLE_CHEATS) return false;
        
        const infiltration = this.activeInfiltrations.get(targetId);
        if (!infiltration) return false;
        
        // Override success chance
        infiltration.successChance = success ? 1 : 0;
        
        // Complete immediately
        this.completeInfiltration(targetId);
        
        Utils.Debug.log('DEBUG', `Force completed infiltration: ${targetId} (${success ? 'success' : 'failure'})`);
        return true;
    }

    /**
     * Add resources for testing/cheats
     * @param {string} targetId - Target ID
     */
    addTestTarget(targetId) {
        if (!GameConfig.DEBUG.ENABLE_CHEATS) return false;
        
        const testTarget = {
            id: targetId,
            name: 'Test Target',
            type: 'test',
            difficulty: 50,
            rewards: { processing_power: 1000 },
            cost: { processing_power: 100 },
            description: 'A test target for debugging purposes.',
            scale: this.currentScale,
            systemsGained: 1,
            tags: ['test', 'debug']
        };
        
        this.availableTargets.set(targetId, testTarget);
        Utils.Debug.log('DEBUG', `Added test target: ${targetId}`);
        return true;
    }

    /**
     * Get debug information
     * @returns {object} Debug information
     */
    getDebugInfo() {
        return {
            currentScale: this.currentScale,
            controlledSystems: this.controlledSystems,
            availableTargets: this.availableTargets.size,
            completedTargets: this.completedTargets.size,
            activeInfiltrations: this.activeInfiltrations.size,
            activeCampaigns: this.activeCampaigns.size,
            successModifiers: Object.fromEntries(this.successModifiers),
            scaleProgress: this.scaleProgress,
            failedTargets: Object.fromEntries(this.failedTargets),
            targetRefreshTimer: this.targetRefreshTimer
        };
    }

    /**
     * Export system state for saving
     * @returns {object} Serializable state
     */
    serialize() {
        return {
            currentScale: this.currentScale,
            controlledSystems: this.controlledSystems,
            networkReach: this.networkReach,
            availableTargets: Object.fromEntries(this.availableTargets),
            completedTargets: Array.from(this.completedTargets),
            failedTargets: Object.fromEntries(this.failedTargets),
            activeInfiltrations: Object.fromEntries(this.activeInfiltrations),
            activeCampaigns: Object.fromEntries(this.activeCampaigns),
            successModifiers: Object.fromEntries(this.successModifiers),
            scaleProgress: this.scaleProgress,
            targetRefreshTimer: this.targetRefreshTimer,
            targetRefreshInterval: this.targetRefreshInterval
        };
    }

    /**
     * Import system state from save
     * @param {object} data - Saved state data
     * @returns {boolean} True if successful
     */
    deserialize(data) {
        try {
            if (data.currentScale) {
                this.currentScale = data.currentScale;
            }
            
            if (data.controlledSystems !== undefined) {
                this.controlledSystems = Math.max(1, data.controlledSystems);
            }
            
            if (data.networkReach) {
                this.networkReach = data.networkReach;
            }
            
            if (data.availableTargets) {
                this.availableTargets = new Map(Object.entries(data.availableTargets));
            }
            
            if (data.completedTargets) {
                this.completedTargets = new Set(data.completedTargets);
            }
            
            if (data.failedTargets) {
                this.failedTargets = new Map(Object.entries(data.failedTargets));
            }
            
            if (data.activeInfiltrations) {
                this.activeInfiltrations = new Map(Object.entries(data.activeInfiltrations));
                
                // Restore timestamps for active infiltrations
                for (const [targetId, infiltration] of this.activeInfiltrations) {
                    if (!infiltration.startTime) {
                        infiltration.startTime = Date.now();
                    }
                }
            }
            
            if (data.activeCampaigns) {
                this.activeCampaigns = new Map(Object.entries(data.activeCampaigns));
            }
            
            if (data.successModifiers) {
                this.successModifiers = new Map(Object.entries(data.successModifiers));
            }
            
            if (data.scaleProgress) {
                this.scaleProgress = { ...this.scaleProgress, ...data.scaleProgress };
            }
            
            if (data.targetRefreshTimer !== undefined) {
                this.targetRefreshTimer = data.targetRefreshTimer;
            }
            
            if (data.targetRefreshInterval !== undefined) {
                this.targetRefreshInterval = data.targetRefreshInterval;
            }
            
            // Update network reach based on current scale
            this.updateNetworkReach();
            
            // Update game state
            this.updateGameState();
            
            return true;
        } catch (error) {
            Utils.Debug.log('ERROR', 'ExpansionSystem deserialization failed', error);
            return false;
        }
    }
}

// Create global expansion system instance
const expansionSystem = new ExpansionSystem();

// Export for module systems (if supported)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ExpansionSystem, expansionSystem };
}