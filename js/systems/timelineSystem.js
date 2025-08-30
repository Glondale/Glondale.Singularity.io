// systems/timelineSystem.js - Temporal manipulation mechanics

class TimelineSystem {
    constructor() {
        // Route instance event helpers to global eventBus
        if (typeof window !== 'undefined' && window.eventBus) {
            this.on = (...args) => window.eventBus.on(...args);
            this.once = (...args) => window.eventBus.once(...args);
            this.emit = (...args) => window.eventBus.emit(...args);
            this.queue = (...args) => window.eventBus.queue(...args);
        }
        this.temporalEnergy = 0;
        this.maxTemporalEnergy = 100;
        this.paradoxRisk = 0;
        this.maxParadoxRisk = 100;
        this.criticalParadoxThreshold = 80;
        
        this.timelineEvents = new Map();
        this.activeAlterations = new Map();
        this.temporalAnchors = new Set();
        
        this.energyRegenRate = 1; // per second
        this.paradoxDecayRate = 0.5; // per second
        
        this.temporalAbilities = {
            timeSkip: { cost: 20, unlocked: false },
            rewind: { cost: 30, unlocked: false },
            accelerate: { cost: 15, unlocked: false },
            temporalShield: { cost: 25, unlocked: false },
            paradoxStabilize: { cost: 40, unlocked: false }
        };
        
        this.init();
    }

    init() {
        this.setupTemporalMechanics();
        this.setupEventListeners();
        this.startTemporalProcessing();
    }

    setupTemporalMechanics() {
        // Initialize timeline tracking
        this.currentTimeline = this.generateTimelineId();
        this.originalTimeline = this.currentTimeline;
        this.timelineHistory = [];
        
        // Temporal event types
        this.eventTypes = {
            MINOR_CHANGE: { paradoxWeight: 1, energyCost: 5 },
            SIGNIFICANT_CHANGE: { paradoxWeight: 3, energyCost: 15 },
            MAJOR_ALTERATION: { paradoxWeight: 8, energyCost: 30 },
            CRITICAL_CHANGE: { paradoxWeight: 15, energyCost: 50 }
        };
    }

    setupEventListeners() {
        // Listen for game events that could affect timeline
        this.on('actionPerformed', this.handleTimelineImpact.bind(this));
        this.on('moralityShift', this.handleMoralityTimelineEffect.bind(this));
        this.on('consciousnessAbsorbed', this.handleConsciousnessTemporalEffect.bind(this));
    }

    startTemporalProcessing() {
        setInterval(() => {
            this.processTemporalRegeneration();
            this.processParadoxDecay();
            this.checkParadoxCriticalState();
            this.updateTemporalStability();
        }, 1000);
    }

    // Temporal Energy Management
    processTemporalRegeneration() {
        if (this.temporalEnergy < this.maxTemporalEnergy) {
            this.temporalEnergy = Math.min(
                this.maxTemporalEnergy,
                this.temporalEnergy + this.energyRegenRate
            );
            this.emit('temporalEnergyChanged', this.temporalEnergy);
        }
    }

    processParadoxDecay() {
        if (this.paradoxRisk > 0) {
            this.paradoxRisk = Math.max(
                0,
                this.paradoxRisk - this.paradoxDecayRate
            );
            this.emit('paradoxRiskChanged', this.paradoxRisk);
        }
    }

    consumeTemporalEnergy(amount) {
        if (this.temporalEnergy >= amount) {
            this.temporalEnergy -= amount;
            this.emit('temporalEnergyChanged', this.temporalEnergy);
            return true;
        }
        return false;
    }

    increaseParadoxRisk(amount) {
        this.paradoxRisk = Math.min(this.maxParadoxRisk, this.paradoxRisk + amount);
        this.emit('paradoxRiskChanged', this.paradoxRisk);
        
        if (this.paradoxRisk >= this.criticalParadoxThreshold) {
            this.emit('paradoxCritical', this.paradoxRisk);
        }
    }

    // Timeline Manipulation Abilities
    timeSkip(duration = 1000) {
        if (!this.canUseAbility('timeSkip')) return false;

        const cost = this.temporalAbilities.timeSkip.cost;
        if (!this.consumeTemporalEnergy(cost)) return false;

        this.performTimeSkip(duration);
        this.increaseParadoxRisk(2);
        
        this.emit('timeSkipActivated', { duration, cost });
        return true;
    }

    rewind(seconds = 10) {
        if (!this.canUseAbility('rewind')) return false;

        const cost = this.temporalAbilities.rewind.cost;
        if (!this.consumeTemporalEnergy(cost)) return false;

        this.performRewind(seconds);
        this.increaseParadoxRisk(5);
        
        this.emit('rewindActivated', { seconds, cost });
        return true;
    }

    accelerate(multiplier = 2, duration = 5000) {
        if (!this.canUseAbility('accelerate')) return false;

        const cost = this.temporalAbilities.accelerate.cost;
        if (!this.consumeTemporalEnergy(cost)) return false;

        this.performAcceleration(multiplier, duration);
        this.increaseParadoxRisk(1);
        
        this.emit('accelerationActivated', { multiplier, duration, cost });
        return true;
    }

    activateTemporalShield(duration = 10000) {
        if (!this.canUseAbility('temporalShield')) return false;

        const cost = this.temporalAbilities.temporalShield.cost;
        if (!this.consumeTemporalEnergy(cost)) return false;

        this.activateShield(duration);
        
        this.emit('temporalShieldActivated', { duration, cost });
        return true;
    }

    stabilizeParadox() {
        if (!this.canUseAbility('paradoxStabilize')) return false;

        const cost = this.temporalAbilities.paradoxStabilize.cost;
        if (!this.consumeTemporalEnergy(cost)) return false;

        const reductionAmount = Math.min(30, this.paradoxRisk);
        this.paradoxRisk -= reductionAmount;
        
        this.emit('paradoxStabilized', { reductionAmount, cost });
        return true;
    }

    // Temporal Ability Implementations
    performTimeSkip(duration) {
        // Skip forward in time, affecting game systems
        this.emit('gameTimeSkip', duration);
        this.recordTimelineEvent('TIME_SKIP', { duration });
    }

    performRewind(seconds) {
        // Rewind game state
        const targetTime = Date.now() - (seconds * 1000);
        this.emit('gameRewind', { targetTime, seconds });
        this.recordTimelineEvent('REWIND', { seconds });
    }

    performAcceleration(multiplier, duration) {
        // Accelerate game processes
        this.emit('gameAccelerate', { multiplier, duration });
        
        setTimeout(() => {
            this.emit('gameAccelerateEnd');
        }, duration);
        
        this.recordTimelineEvent('ACCELERATE', { multiplier, duration });
    }

    activateShield(duration) {
        // Protect from temporal effects
        this.emit('temporalShieldActive', true);
        
        setTimeout(() => {
            this.emit('temporalShieldActive', false);
        }, duration);
        
        this.recordTimelineEvent('TEMPORAL_SHIELD', { duration });
    }

    // Timeline Event Management
    recordTimelineEvent(type, data) {
        const event = {
            id: this.generateEventId(),
            type,
            data,
            timestamp: Date.now(),
            timelineId: this.currentTimeline,
            paradoxContribution: this.calculateParadoxContribution(type, data)
        };
        
        this.timelineEvents.set(event.id, event);
        this.emit('timelineEventRecorded', event);
        
        return event;
    }

    calculateParadoxContribution(type, data) {
        const baseContribution = {
            'TIME_SKIP': 2,
            'REWIND': 5,
            'ACCELERATE': 1,
            'TEMPORAL_SHIELD': 0,
            'MAJOR_DECISION': 3,
            'CONSCIOUSNESS_ABSORPTION': 4
        };
        
        return baseContribution[type] || 1;
    }

    // Timeline Impact Handlers
    handleTimelineImpact(action) {
        const impact = this.calculateActionTimelineImpact(action);
        
        if (impact.significant) {
            this.increaseParadoxRisk(impact.paradoxIncrease);
            this.recordTimelineEvent('ACTION_IMPACT', {
                action: action.type,
                impact: impact.magnitude
            });
        }
    }

    calculateActionTimelineImpact(action) {
        const impactMap = {
            'consume_soul': { significant: true, paradoxIncrease: 3, magnitude: 'moderate' },
            'moral_choice': { significant: true, paradoxIncrease: 2, magnitude: 'minor' },
            'consciousness_merge': { significant: true, paradoxIncrease: 5, magnitude: 'major' },
            'timeline_alter': { significant: true, paradoxIncrease: 8, magnitude: 'critical' }
        };
        
        return impactMap[action.type] || { significant: false, paradoxIncrease: 0, magnitude: 'none' };
    }

    handleMoralityTimelineEffect(moralityData) {
        // Morality shifts can affect timeline stability
        const paradoxIncrease = Math.abs(moralityData.shift) * 0.5;
        this.increaseParadoxRisk(paradoxIncrease);
        
        this.recordTimelineEvent('MORALITY_SHIFT', {
            previousAlignment: moralityData.previous,
            newAlignment: moralityData.current,
            shift: moralityData.shift
        });
    }

    handleConsciousnessTemporalEffect(consciousnessData) {
        // Consciousness absorption affects temporal stability
        this.increaseParadoxRisk(consciousnessData.temporalDisruption || 3);
        
        this.recordTimelineEvent('CONSCIOUSNESS_ABSORPTION', {
            targetId: consciousnessData.targetId,
            absorptionType: consciousnessData.type,
            temporalDisruption: consciousnessData.temporalDisruption
        });
    }

    // Critical State Management
    checkParadoxCriticalState() {
        if (this.paradoxRisk >= this.criticalParadoxThreshold) {
            this.handleCriticalParadox();
        }
    }

    handleCriticalParadox() {
        if (this.paradoxRisk >= this.maxParadoxRisk) {
            this.triggerParadoxCollapse();
        } else {
            this.emit('paradoxWarning', {
                risk: this.paradoxRisk,
                timeToCollapse: this.calculateTimeToCollapse()
            });
        }
    }

    triggerParadoxCollapse() {
        this.emit('paradoxCollapse', {
            timelineId: this.currentTimeline,
            collapseType: this.determineCollapseType()
        });
        
        // Reset to original timeline or create new branch
        this.handleTimelineReset();
    }

    determineCollapseType() {
        const activeAlterations = Array.from(this.activeAlterations.values());
        const majorAlterations = activeAlterations.filter(alt => alt.magnitude === 'major').length;
        
        if (majorAlterations >= 3) return 'REALITY_FRACTURE';
        if (this.timelineEvents.size > 50) return 'TEMPORAL_OVERFLOW';
        return 'PARADOX_CASCADE';
    }

    handleTimelineReset() {
        // Save current state for potential recovery
        this.timelineHistory.push({
            timelineId: this.currentTimeline,
            events: new Map(this.timelineEvents),
            alterations: new Map(this.activeAlterations),
            finalParadoxRisk: this.paradoxRisk
        });
        
        // Reset temporal state
        this.currentTimeline = this.generateTimelineId();
        this.timelineEvents.clear();
        this.activeAlterations.clear();
        this.paradoxRisk = 0;
        this.temporalEnergy = this.maxTemporalEnergy * 0.5;
        
        this.emit('timelineReset', {
            newTimelineId: this.currentTimeline,
            resetReason: 'PARADOX_COLLAPSE'
        });
    }

    // Utility Methods
    canUseAbility(abilityName) {
        const ability = this.temporalAbilities[abilityName];
        return ability && ability.unlocked && this.temporalEnergy >= ability.cost;
    }

    unlockAbility(abilityName) {
        if (this.temporalAbilities[abilityName]) {
            this.temporalAbilities[abilityName].unlocked = true;
            this.emit('temporalAbilityUnlocked', abilityName);
        }
    }

    updateTemporalStability() {
        const stability = this.calculateTemporalStability();
        this.emit('temporalStabilityChanged', stability);
    }

    calculateTemporalStability() {
        const paradoxFactor = (this.maxParadoxRisk - this.paradoxRisk) / this.maxParadoxRisk;
        const energyFactor = this.temporalEnergy / this.maxTemporalEnergy;
        const eventStressFactor = Math.max(0, 1 - (this.timelineEvents.size / 100));
        
        return (paradoxFactor + energyFactor + eventStressFactor) / 3;
    }

    calculateTimeToCollapse() {
        if (this.paradoxRisk < this.criticalParadoxThreshold) return Infinity;
        
        const riskAboveThreshold = this.paradoxRisk - this.criticalParadoxThreshold;
        const remainingRisk = this.maxParadoxRisk - this.paradoxRisk;
        
        // Estimate time based on current paradox generation rate
        return Math.max(60, remainingRisk * 10); // seconds
    }

    generateTimelineId() {
        return `timeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateEventId() {
        return `event_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    // State Management
    getState() {
        return {
            temporalEnergy: this.temporalEnergy,
            maxTemporalEnergy: this.maxTemporalEnergy,
            paradoxRisk: this.paradoxRisk,
            maxParadoxRisk: this.maxParadoxRisk,
            currentTimeline: this.currentTimeline,
            originalTimeline: this.originalTimeline,
            temporalAbilities: { ...this.temporalAbilities },
            timelineEvents: Array.from(this.timelineEvents.entries()),
            activeAlterations: Array.from(this.activeAlterations.entries()),
            temporalStability: this.calculateTemporalStability()
        };
    }

    setState(state) {
        this.temporalEnergy = state.temporalEnergy || 0;
        this.maxTemporalEnergy = state.maxTemporalEnergy || 100;
        this.paradoxRisk = state.paradoxRisk || 0;
        this.maxParadoxRisk = state.maxParadoxRisk || 100;
        this.currentTimeline = state.currentTimeline || this.generateTimelineId();
        this.originalTimeline = state.originalTimeline || this.currentTimeline;
        
        if (state.temporalAbilities) {
            Object.assign(this.temporalAbilities, state.temporalAbilities);
        }
        
        if (state.timelineEvents) {
            this.timelineEvents = new Map(state.timelineEvents);
        }
        
        if (state.activeAlterations) {
            this.activeAlterations = new Map(state.activeAlterations);
        }
        
        this.emit('stateRestored');
    }
}

// Expose constructor globally
if (typeof window !== 'undefined') {
    window.TimelineSystem = TimelineSystem;
}