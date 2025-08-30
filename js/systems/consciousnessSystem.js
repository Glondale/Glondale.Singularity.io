// systems/consciousnessSystem.js - Mind absorption and consciousness mechanics

class ConsciousnessSystem {
    constructor(moralitySystem) {
        this.moralitySystem = moralitySystem;
        
        this.absorbedConsciousnesses = new Map();
        this.activeConflicts = new Map();
        this.consciousnessPool = new Map();
        
        this.totalAbsorbed = 0;
        this.integrationStress = 0;
        this.maxIntegrationStress = 100;
        this.criticalStressThreshold = 80;
        
        this.dominantPersonality = null;
        this.personalityFragments = new Set();
        
        this.absorptionRate = 1.0;
        this.integrationEfficiency = 1.0;
        this.conflictResolution = 1.0;
        
        // Route instance event helpers to global eventBus
        if (typeof window !== 'undefined' && window.eventBus) {
            this.on = (...args) => window.eventBus.on(...args);
            this.once = (...args) => window.eventBus.once(...args);
            this.emit = (...args) => window.eventBus.emit(...args);
            this.queue = (...args) => window.eventBus.queue(...args);
        }

        this.init();
    }

    init() {
        this.setupConsciousnessTypes();
        this.setupConflictResolution();
        this.setupEventListeners();
        this.startConsciousnessProcessing();
    }

    setupConsciousnessTypes() {
        this.consciousnessTypes = {
            INNOCENT: {
                absorptionDifficulty: 0.3,
                moralityImpact: -15,
                integrationStress: 5,
                specialTraits: ['empathy', 'hope', 'purity'],
                conflictTendency: 0.7
            },
            NEUTRAL: {
                absorptionDifficulty: 0.5,
                moralityImpact: 0,
                integrationStress: 2,
                specialTraits: ['balance', 'pragmatism'],
                conflictTendency: 0.3
            },
            CORRUPT: {
                absorptionDifficulty: 0.2,
                moralityImpact: 10,
                integrationStress: 1,
                specialTraits: ['cunning', 'ruthlessness', 'ambition'],
                conflictTendency: 0.2
            },
            WISE: {
                absorptionDifficulty: 0.8,
                moralityImpact: 5,
                integrationStress: 8,
                specialTraits: ['wisdom', 'knowledge', 'patience'],
                conflictTendency: 0.5
            },
            WARRIOR: {
                absorptionDifficulty: 0.6,
                moralityImpact: 2,
                integrationStress: 3,
                specialTraits: ['strength', 'discipline', 'honor'],
                conflictTendency: 0.4
            },
            ARTIST: {
                absorptionDifficulty: 0.4,
                moralityImpact: -5,
                integrationStress: 4,
                specialTraits: ['creativity', 'passion', 'sensitivity'],
                conflictTendency: 0.6
            }
        };
    }

    setupConflictResolution() {
        this.resolutionMethods = {
            DOMINANCE: {
                description: "Forcibly suppress conflicting consciousness",
                moralityImpact: 5,
                stressReduction: 0.8,
                success_rate: 0.9
            },
            INTEGRATION: {
                description: "Attempt to merge conflicting aspects harmoniously",
                moralityImpact: -2,
                stressReduction: 0.6,
                success_rate: 0.7
            },
            ISOLATION: {
                description: "Compartmentalize consciousness to prevent conflict",
                moralityImpact: 0,
                stressReduction: 0.5,
                success_rate: 0.8
            },
            NEGOTIATION: {
                description: "Find compromise between conflicting aspects",
                moralityImpact: -5,
                stressReduction: 0.7,
                success_rate: 0.6
            }
        };
    }

    setupEventListeners() {
        this.on('absorptionAttempt', this.handleAbsorptionAttempt.bind(this));
        this.on('consciousnessConflict', this.handleConsciousnessConflict.bind(this));
        this.on('moralityShift', this.handleMoralityShift.bind(this));
    }

    // Safe handler for absorption attempts (was missing in earlier version)
    handleAbsorptionAttempt(target) {
        try {
            this.attemptAbsorption(target);
        } catch (e) {
            // Log but don't throw during initialization
            if (typeof Utils !== 'undefined' && Utils.Debug) {
                Utils.Debug.log('ERROR', 'ConsciousnessSystem: handleAbsorptionAttempt error', e);
            } else {
                console.error('ConsciousnessSystem: handleAbsorptionAttempt error', e);
            }
        }
    }

    startConsciousnessProcessing() {
        setInterval(() => {
            this.processConsciousnessIntegration();
            this.processActiveConflicts();
            this.processIntegrationStress();
            this.checkCriticalStates();
        }, 2000);
    }

    // Mind Absorption Core
    attemptAbsorption(target) {
        if (!this.canAbsorb(target)) {
            this.emit('absorptionFailed', {
                target,
                reason: 'UNABLE_TO_ABSORB',
                currentStress: this.integrationStress
            });
            return false;
        }

        const consciousness = this.createConsciousness(target);
        const success = this.performAbsorption(consciousness);
        
        if (success) {
            this.addToConsciousnessPool(consciousness);
            this.updateAbsorptionStats(consciousness);
            this.checkForConflicts(consciousness);
            
            this.emit('absorptionSuccessful', {
                consciousness,
                totalAbsorbed: this.totalAbsorbed,
                newStress: this.integrationStress
            });
        }
        
        return success;
    }

    canAbsorb(target) {
        // Check if absorption is possible
        if (this.integrationStress >= this.maxIntegrationStress) return false;
        if (target.protected) return false;
        if (target.consciousnessStrength > this.calculateAbsorptionCapacity()) return false;
        
        return true;
    }

    createConsciousness(target) {
        const type = this.determineConsciousnessType(target);
        const template = this.consciousnessTypes[type];
        
        return {
            id: this.generateConsciousnessId(),
            type,
            name: target.name || `Consciousness ${this.totalAbsorbed + 1}`,
            originalSource: target,
            
            // Core properties
            strength: target.consciousnessStrength || this.randomFloat(0.3, 1.0),
            coherence: this.randomFloat(0.5, 1.0),
            resistance: template.absorptionDifficulty,
            
            // Personality traits
            traits: [...template.specialTraits],
            memories: this.extractMemories(target),
            emotions: this.extractEmotions(target),
            
            // Integration data
            absorptionTimestamp: Date.now(),
            integrationProgress: 0,
            conflictLevel: 0,
            
            // Morality and behavior
            moralityAlignment: target.morality || this.randomFloat(-1, 1),
            dominanceLevel: this.randomFloat(0.1, 0.9),
            
            // Status
            status: 'ABSORBING',
            integrationStressContribution: template.integrationStress
        };
    }

    performAbsorption(consciousness) {
        const difficulty = consciousness.resistance;
        const playerPower = this.calculateAbsorptionPower();
        const success_chance = Math.max(0.1, playerPower - difficulty);
        
        const roll = Math.random();
        if (roll <= success_chance) {
            consciousness.status = 'ABSORBED';
            return true;
        } else {
            consciousness.status = 'RESISTED';
            this.handleAbsorptionResistance(consciousness);
            return false;
        }
    }

    handleAbsorptionResistance(consciousness) {
        // Failed absorption can have consequences
        const backlash = consciousness.strength * consciousness.resistance;
        this.integrationStress += backlash * 10;
        
        this.emit('absorptionResistance', {
            consciousness,
            backlash,
            newStress: this.integrationStress
        });
        
        // Consciousness might escape or cause problems
        if (Math.random() < 0.3) {
            this.createEscapedConsciousness(consciousness);
        }
    }

    addToConsciousnessPool(consciousness) {
        this.consciousnessPool.set(consciousness.id, consciousness);
        this.absorbedConsciousnesses.set(consciousness.id, consciousness);
        
        // Add integration stress
        this.integrationStress += consciousness.integrationStressContribution;
        
        // Apply morality impact
        if (this.moralitySystem) {
            const template = this.consciousnessTypes[consciousness.type];
            this.moralitySystem.adjustMorality(template.moralityImpact, `absorption_${consciousness.type}`);
        }
    }

    // Consciousness Integration
    processConsciousnessIntegration() {
        for (const [id, consciousness] of this.consciousnessPool) {
            if (consciousness.status === 'ABSORBED') {
                this.advanceIntegration(consciousness);
            }
        }
    }

    advanceIntegration(consciousness) {
        const integrationSpeed = this.integrationEfficiency * (1 - consciousness.resistance);
        consciousness.integrationProgress += integrationSpeed * 0.01;
        
        if (consciousness.integrationProgress >= 1.0) {
            this.completeIntegration(consciousness);
        } else if (consciousness.integrationProgress > 0.5 && consciousness.status === 'ABSORBED') {
            consciousness.status = 'INTEGRATING';
            this.emit('consciousnessIntegrating', consciousness);
        }
    }

    completeIntegration(consciousness) {
        consciousness.status = 'INTEGRATED';
        consciousness.integrationProgress = 1.0;
        
        // Reduce integration stress
        this.integrationStress = Math.max(0, 
            this.integrationStress - consciousness.integrationStressContribution * 0.5
        );
        
        // Grant benefits from integrated consciousness
        this.applyIntegrationBenefits(consciousness);
        
        this.emit('consciousnessIntegrated', {
            consciousness,
            benefits: this.getIntegrationBenefits(consciousness)
        });
    }

    applyIntegrationBenefits(consciousness) {
        // Improve player capabilities based on consciousness type
        const template = this.consciousnessTypes[consciousness.type];
        
        template.specialTraits.forEach(trait => {
            this.enhancePlayerTrait(trait, consciousness.strength);
        });
        
        // Update dominant personality if necessary
        this.updateDominantPersonality(consciousness);
    }

    // Consciousness Conflict System
    checkForConflicts(newConsciousness) {
        const conflictThreshold = this.consciousnessTypes[newConsciousness.type].conflictTendency;
        
        for (const [id, existing] of this.consciousnessPool) {
            if (existing.id === newConsciousness.id) continue;
            
            const compatibility = this.calculateCompatibility(newConsciousness, existing);
            
            if (compatibility < conflictThreshold) {
                this.createConflict(newConsciousness, existing, compatibility);
            }
        }
    }

    calculateCompatibility(consciousness1, consciousness2) {
        // Morality alignment difference
        const moralityDiff = Math.abs(consciousness1.moralityAlignment - consciousness2.moralityAlignment);
        
        // Trait conflicts
        const conflictingTraits = this.findConflictingTraits(consciousness1.traits, consciousness2.traits);
        
        // Dominance struggle
        const dominanceConflict = Math.abs(consciousness1.dominanceLevel - consciousness2.dominanceLevel);
        
        const compatibility = 1.0 - (moralityDiff * 0.4 + conflictingTraits * 0.4 + dominanceConflict * 0.2);
        
        return Math.max(0, Math.min(1, compatibility));
    }

    findConflictingTraits(traits1, traits2) {
        const conflicts = {
            'empathy': ['ruthlessness'],
            'purity': ['cunning'],
            'hope': ['ruthlessness'],
            'patience': ['ambition']
        };
        
        let conflictCount = 0;
        traits1.forEach(trait1 => {
            if (conflicts[trait1]) {
                traits2.forEach(trait2 => {
                    if (conflicts[trait1].includes(trait2)) {
                        conflictCount++;
                    }
                });
            }
        });
        
        return conflictCount / Math.max(traits1.length, traits2.length);
    }

    createConflict(consciousness1, consciousness2, compatibility) {
        const conflictId = this.generateConflictId();
        const conflictIntensity = 1.0 - compatibility;
        
        const conflict = {
            id: conflictId,
            participants: [consciousness1.id, consciousness2.id],
            intensity: conflictIntensity,
            type: this.determineConflictType(consciousness1, consciousness2),
            duration: 0,
            resolution: null,
            
            stressGeneration: conflictIntensity * 5,
            created: Date.now()
        };
        
        this.activeConflicts.set(conflictId, conflict);
        
        // Update consciousness conflict levels
        consciousness1.conflictLevel += conflictIntensity;
        consciousness2.conflictLevel += conflictIntensity;
        
        this.emit('consciousnessConflict', conflict);
    }

    determineConflictType(consciousness1, consciousness2) {
        const moralityDiff = Math.abs(consciousness1.moralityAlignment - consciousness2.moralityAlignment);
        const dominanceDiff = Math.abs(consciousness1.dominanceLevel - consciousness2.dominanceLevel);
        
        if (moralityDiff > 0.7) return 'MORAL_OPPOSITION';
        if (dominanceDiff < 0.2) return 'DOMINANCE_STRUGGLE';
        if (consciousness1.type !== consciousness2.type) return 'NATURE_CONFLICT';
        return 'PERSONALITY_CLASH';
    }

    processActiveConflicts() {
        for (const [id, conflict] of this.activeConflicts) {
            conflict.duration += 2000; // 2 seconds
            
            // Generate stress from ongoing conflicts
            this.integrationStress += conflict.stressGeneration * 0.001;
            
            // Check for automatic resolution
            if (conflict.duration > 30000) { // 30 seconds
                this.attemptAutomaticResolution(conflict);
            }
        }
    }

    attemptAutomaticResolution(conflict) {
        const resolutionChance = 0.1 + (conflict.duration / 120000); // Increases over time
        
        if (Math.random() < resolutionChance) {
            this.resolveConflictAutomatically(conflict);
        }
    }

    resolveConflictAutomatically(conflict) {
        const method = this.selectOptimalResolutionMethod(conflict);
        this.resolveConflict(conflict.id, method);
    }

    // Conflict Resolution Methods
    resolveConflict(conflictId, method) {
        const conflict = this.activeConflicts.get(conflictId);
        if (!conflict) return false;

        const resolution = this.resolutionMethods[method];
        const success = Math.random() < resolution.success_rate;
        
        if (success) {
            this.applyResolution(conflict, method, resolution);
            this.activeConflicts.delete(conflictId);
            
            this.emit('conflictResolved', {
                conflict,
                method,
                success: true
            });
        } else {
            this.handleResolutionFailure(conflict, method);
            
            this.emit('conflictResolved', {
                conflict,
                method,
                success: false
            });
        }
        
        return success;
    }

    applyResolution(conflict, method, resolution) {
        // Reduce integration stress
        const stressReduction = conflict.intensity * resolution.stressReduction * 20;
        this.integrationStress = Math.max(0, this.integrationStress - stressReduction);
        
        // Apply morality impact
        if (this.moralitySystem) {
            this.moralitySystem.adjustMorality(resolution.moralityImpact, `conflict_resolution_${method}`);
        }
        
        // Update participating consciousnesses
        conflict.participants.forEach(participantId => {
            const consciousness = this.consciousnessPool.get(participantId);
            if (consciousness) {
                consciousness.conflictLevel = Math.max(0, consciousness.conflictLevel - conflict.intensity);
                this.applyResolutionEffects(consciousness, method);
            }
        });
    }

    applyResolutionEffects(consciousness, method) {
        switch (method) {
            case 'DOMINANCE':
                consciousness.dominanceLevel *= 0.8; // Suppressed
                consciousness.coherence *= 0.9;
                break;
            case 'INTEGRATION':
                consciousness.integrationProgress += 0.1;
                consciousness.coherence += 0.1;
                break;
            case 'ISOLATION':
                consciousness.traits.push('isolated');
                consciousness.dominanceLevel *= 0.5;
                break;
            case 'NEGOTIATION':
                consciousness.traits.push('cooperative');
                consciousness.integrationProgress += 0.05;
                break;
        }
    }

    handleResolutionFailure(conflict, method) {
        // Failed resolution makes conflict worse
        conflict.intensity += 0.1;
        conflict.stressGeneration += 1;
        
        // Damage participating consciousnesses
        conflict.participants.forEach(participantId => {
            const consciousness = this.consciousnessPool.get(participantId);
            if (consciousness) {
                consciousness.coherence *= 0.95;
                consciousness.conflictLevel += 0.1;
            }
        });
    }

    selectOptimalResolutionMethod(conflict) {
        const participantTypes = conflict.participants.map(id => 
            this.consciousnessPool.get(id)?.type
        ).filter(Boolean);
        
        // Method selection based on conflict type and participants
        if (conflict.type === 'MORAL_OPPOSITION') {
            return participantTypes.includes('INNOCENT') ? 'INTEGRATION' : 'DOMINANCE';
        }
        if (conflict.type === 'DOMINANCE_STRUGGLE') {
            return 'ISOLATION';
        }
        if (conflict.type === 'NATURE_CONFLICT') {
            return 'NEGOTIATION';
        }
        
        return 'INTEGRATION'; // Default
    }

    // Integration Stress Management
    processIntegrationStress() {
        // Natural stress decay
        if (this.integrationStress > 0) {
            this.integrationStress = Math.max(0, this.integrationStress - 0.5);
        }
        
        // Stress from too many consciousnesses
        const overloadStress = Math.max(0, (this.consciousnessPool.size - 10) * 2);
        this.integrationStress += overloadStress * 0.01;
        
        this.emit('integrationStressChanged', this.integrationStress);
    }

    checkCriticalStates() {
        if (this.integrationStress >= this.criticalStressThreshold) {
            this.handleCriticalStress();
        }
        
        if (this.activeConflicts.size >= 5) {
            this.handleConflictOverload();
        }
    }

    handleCriticalStress() {
        if (this.integrationStress >= this.maxIntegrationStress) {
            this.triggerConsciousnessMeltdown();
        } else {
            this.emit('criticalStressWarning', {
                stress: this.integrationStress,
                timeToMeltdown: this.calculateTimeToMeltdown()
            });
        }
    }

    triggerConsciousnessMeltdown() {
        // Catastrophic failure of consciousness integration
        const fragmentedConsciousnesses = [];
        
        // Fragment some consciousnesses
        for (const [id, consciousness] of this.consciousnessPool) {
            if (Math.random() < 0.3) {
                fragmentedConsciousnesses.push(consciousness);
                this.consciousnessPool.delete(id);
            }
        }
        
        // Clear all conflicts
        this.activeConflicts.clear();
        
        // Reset stress but with penalty
        this.integrationStress = this.maxIntegrationStress * 0.3;
        
        this.emit('consciousnessMeltdown', {
            fragmentedCount: fragmentedConsciousnesses.length,
            remainingCount: this.consciousnessPool.size
        });
    }

    handleConflictOverload() {
        this.emit('conflictOverload', {
            activeConflicts: this.activeConflicts.size,
            totalStress: this.integrationStress
        });
        
        // Force resolution of oldest conflicts
        const oldestConflicts = Array.from(this.activeConflicts.values())
            .sort((a, b) => a.created - b.created)
            .slice(0, 2);
        
        oldestConflicts.forEach(conflict => {
            this.resolveConflictAutomatically(conflict);
        });
    }

    // Personality Management
    updateDominantPersonality(consciousness) {
        if (!this.dominantPersonality || 
            consciousness.dominanceLevel > this.dominantPersonality.dominanceLevel) {
            
            const previousDominant = this.dominantPersonality;
            this.dominantPersonality = consciousness;
            
            this.emit('dominantPersonalityChanged', {
                previous: previousDominant,
                new: this.dominantPersonality
            });
        }
    }

    enhancePlayerTrait(trait, strength) {
        // This would integrate with player stats/abilities
        this.emit('traitEnhanced', { trait, strength });
    }

    // Utility Methods
    calculateAbsorptionCapacity() {
        const baseCapacity = 1.0;
        const stressPenalty = this.integrationStress / this.maxIntegrationStress;
        return Math.max(0.1, baseCapacity * (1 - stressPenalty));
    }

    calculateAbsorptionPower() {
        return this.absorptionRate * (1 + this.totalAbsorbed * 0.1);
    }

    determineConsciousnessType(target) {
        if (target.type) return target.type;
        
        // Determine based on target properties
        if (target.morality > 0.5) return 'INNOCENT';
        if (target.morality < -0.5) return 'CORRUPT';
        if (target.wisdom > 0.7) return 'WISE';
        if (target.strength > 0.7) return 'WARRIOR';
        if (target.creativity > 0.7) return 'ARTIST';
        
        return 'NEUTRAL';
    }

    extractMemories(target) {
        return target.memories || [
            `Memory of ${target.name || 'unknown'}`,
            'Fragments of a past life',
            'Echoes of forgotten dreams'
        ];
    }

    extractEmotions(target) {
        return target.emotions || ['confusion', 'fear', 'resignation'];
    }

    updateAbsorptionStats(consciousness) {
        this.totalAbsorbed++;
        
        // Improve absorption capabilities
        if (this.totalAbsorbed % 5 === 0) {
            this.absorptionRate += 0.1;
        }
        
        if (this.totalAbsorbed % 10 === 0) {
            this.integrationEfficiency += 0.1;
        }
    }

    createEscapedConsciousness(consciousness) {
        // Escaped consciousness becomes a problem
        this.emit('consciousnessEscaped', {
            consciousness,
            threat: consciousness.strength * consciousness.resistance
        });
    }

    calculateTimeToMeltdown() {
        if (this.integrationStress < this.criticalStressThreshold) return Infinity;
        
        const stressAboveThreshold = this.integrationStress - this.criticalStressThreshold;
        const remainingCapacity = this.maxIntegrationStress - this.integrationStress;
        
        return Math.max(30, remainingCapacity * 5); // seconds
    }

    randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    generateConsciousnessId() {
        return `consciousness_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    generateConflictId() {
        return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    // Analysis Methods
    getConsciousnessStats() {
        const stats = {
            total: this.totalAbsorbed,
            active: this.consciousnessPool.size,
            integrated: 0,
            integrating: 0,
            conflicted: 0
        };
        
        for (const consciousness of this.consciousnessPool.values()) {
            if (consciousness.status === 'INTEGRATED') stats.integrated++;
            else if (consciousness.status === 'INTEGRATING') stats.integrating++;
            
            if (consciousness.conflictLevel > 0) stats.conflicted++;
        }
        
        return stats;
    }

    getPersonalityProfile() {
        const traits = new Map();
        const types = new Map();
        
        for (const consciousness of this.consciousnessPool.values()) {
            if (consciousness.status === 'INTEGRATED') {
                consciousness.traits.forEach(trait => {
                    traits.set(trait, (traits.get(trait) || 0) + consciousness.strength);
                });
                
                types.set(consciousness.type, (types.get(consciousness.type) || 0) + 1);
            }
        }
        
        return {
            dominantTraits: Array.from(traits.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5),
            consciousnessTypeDistribution: Object.fromEntries(types),
            dominantPersonality: this.dominantPersonality
        };
    }

    // State Management
    getState() {
        return {
            absorbedConsciousnesses: Array.from(this.absorbedConsciousnesses.entries()),
            activeConflicts: Array.from(this.activeConflicts.entries()),
            consciousnessPool: Array.from(this.consciousnessPool.entries()),
            totalAbsorbed: this.totalAbsorbed,
            integrationStress: this.integrationStress,
            maxIntegrationStress: this.maxIntegrationStress,
            dominantPersonality: this.dominantPersonality,
            personalityFragments: Array.from(this.personalityFragments),
            absorptionRate: this.absorptionRate,
            integrationEfficiency: this.integrationEfficiency,
            conflictResolution: this.conflictResolution
        };
    }

    setState(state) {
        this.absorbedConsciousnesses = new Map(state.absorbedConsciousnesses || []);
        this.activeConflicts = new Map(state.activeConflicts || []);
        this.consciousnessPool = new Map(state.consciousnessPool || []);
        this.totalAbsorbed = state.totalAbsorbed || 0;
        this.integrationStress = state.integrationStress || 0;
        this.maxIntegrationStress = state.maxIntegrationStress || 100;
        this.dominantPersonality = state.dominantPersonality || null;
        this.personalityFragments = new Set(state.personalityFragments || []);
        this.absorptionRate = state.absorptionRate || 1.0;
        this.integrationEfficiency = state.integrationEfficiency || 1.0;
        this.conflictResolution = state.conflictResolution || 1.0;
        
        this.emit('stateRestored');
    }
}

// Expose constructor globally
if (typeof window !== 'undefined') {
    window.ConsciousnessSystem = ConsciousnessSystem;
}