// systems/offlineSystem.js - Offline progression and autonomous decision making

class OfflineSystem {
    constructor(gameState) {
        this.gameState = gameState;
        
        this.lastOnlineTime = Date.now();
        this.offlineStartTime = null;
        this.isOffline = false;
        
        this.autonomousDecisions = [];
        this.offlineEvents = [];
        this.accumulatedProgress = new Map();
        
        this.decisionMakingPersonality = null;
        this.autonomyLevel = 1.0;
        this.aggressionLevel = 0.5;
        this.caution = 0.5;
        
        this.offlineMultipliers = {
            soulGain: 0.5,
            moralityDecay: 0.3,
            temporalEnergyRegen: 0.8,
            consciousnessIntegration: 0.4
        };
        
        // Route instance event helpers to global eventBus so other systems can listen
        if (typeof window !== 'undefined' && window.eventBus) {
            this.on = (...args) => window.eventBus.on(...args);
            this.once = (...args) => window.eventBus.once(...args);
            this.emit = (...args) => window.eventBus.emit(...args);
            this.queue = (...args) => window.eventBus.queue(...args);
        }

        this.init();
    }

    init() {
        this.setupDecisionMaking();
        this.setupOfflineEvents();
        this.setupProgressionSystems();
        this.loadLastSession();
    }

    setupDecisionMaking() {
        this.decisionTypes = {
            SOUL_CONSUMPTION: {
                description: "Consume nearby souls for power",
                moralityImpact: -5,
                soulGain: 10,
                riskLevel: 0.3,
                frequency: 0.4
            },
            MORAL_CHOICE: {
                description: "Make decisions affecting morality",
                moralityImpact: 0, // Variable
                soulGain: 0,
                riskLevel: 0.2,
                frequency: 0.6
            },
            CONSCIOUSNESS_MERGE: {
                description: "Attempt consciousness integration",
                moralityImpact: -2,
                soulGain: 0,
                riskLevel: 0.5,
                frequency: 0.3
            },
            TEMPORAL_MANIPULATION: {
                description: "Use temporal abilities",
                moralityImpact: 0,
                soulGain: 0,
                riskLevel: 0.7,
                frequency: 0.2
            },
            EXPLORATION: {
                description: "Explore new areas",
                moralityImpact: 0,
                soulGain: 5,
                riskLevel: 0.4,
                frequency: 0.8
            },
            REST_AND_RECOVERY: {
                description: "Focus on recovery and stability",
                moralityImpact: 1,
                soulGain: 0,
                riskLevel: 0.1,
                frequency: 0.5
            }
        };

        this.personalityTypes = {
            AGGRESSIVE: {
                name: "Aggressive",
                soulConsumptionBias: 0.8,
                moralityDisregard: 0.7,
                riskTolerance: 0.8,
                explorationBias: 0.6
            },
            CAUTIOUS: {
                name: "Cautious",
                soulConsumptionBias: 0.2,
                moralityDisregard: 0.3,
                riskTolerance: 0.3,
                explorationBias: 0.4
            },
            BALANCED: {
                name: "Balanced",
                soulConsumptionBias: 0.5,
                moralityDisregard: 0.5,
                riskTolerance: 0.5,
                explorationBias: 0.5
            },
            MORAL: {
                name: "Moral",
                soulConsumptionBias: 0.1,
                moralityDisregard: 0.1,
                riskTolerance: 0.4,
                explorationBias: 0.7
            },
            CURIOUS: {
                name: "Curious",
                soulConsumptionBias: 0.3,
                moralityDisregard: 0.4,
                riskTolerance: 0.6,
                explorationBias: 0.9
            }
        };
    }

    setupOfflineEvents() {
        this.eventTypes = {
            SOUL_DISCOVERY: {
                description: "Discovered wandering souls",
                probability: 0.3,
                impact: { souls: 15, morality: -2 }
            },
            MORAL_DILEMMA: {
                description: "Faced with moral choice",
                probability: 0.4,
                impact: { morality: 0 } // Variable
            },
            TEMPORAL_ANOMALY: {
                description: "Encountered temporal disturbance",
                probability: 0.1,
                impact: { temporalEnergy: -20, paradoxRisk: 5 }
            },
            CONSCIOUSNESS_CONFLICT: {
                description: "Internal consciousness conflict",
                probability: 0.2,
                impact: { integrationStress: 10 }
            },
            MEMORY_FRAGMENT: {
                description: "Recovered memory fragment",
                probability: 0.25,
                impact: { knowledge: 1 }
            },
            SAFE_HAVEN: {
                description: "Found place of rest",
                probability: 0.15,
                impact: { morality: 3, integrationStress: -15 }
            },
            HOSTILE_ENCOUNTER: {
                description: "Confronted by hostile forces",
                probability: 0.2,
                impact: { souls: -5, temporalEnergy: -10 }
            }
        };
    }

    setupProgressionSystems() {
        this.progressionRates = {
            // Per hour when offline
            soulGeneration: 5,
            moralityDecay: -1,
            temporalEnergyRegen: 10,
            consciousnessIntegration: 0.1,
            explorationProgress: 2
        };
    }

    // Offline Session Management
    startOfflineSession() {
        if (this.isOffline) return;
        
        this.isOffline = true;
        this.offlineStartTime = Date.now();
        this.autonomousDecisions = [];
        this.offlineEvents = [];
        this.accumulatedProgress.clear();
        
        this.determineOfflinePersonality();
        
        this.emit('offlineSessionStarted', {
            startTime: this.offlineStartTime,
            personality: this.decisionMakingPersonality
        });
    }

    endOfflineSession() {
        if (!this.isOffline) return null;
        
        const endTime = Date.now();
        const offlineDuration = endTime - this.offlineStartTime;
        
        this.isOffline = false;
        this.lastOnlineTime = endTime;
        
        const summary = this.generateOfflineSummary(offlineDuration);
        
        this.emit('offlineSessionEnded', summary);
        
        return summary;
    }

    processOfflineTime(duration) {
        // Duration should be in milliseconds
        const hours = duration / (1000 * 60 * 60);
        
        this.simulateOfflineProgression(hours);
        this.makeAutonomousDecisions(hours);
        this.generateOfflineEvents(hours);
        
        return this.generateOfflineSummary(duration);
    }

    // Autonomous Decision Making
    determineOfflinePersonality() {
        const gameState = this.gameState.getState();
        
        // Base personality on current game state
        let personalityScore = {
            aggressive: 0,
            cautious: 0,
            moral: 0,
            curious: 0
        };
        
        // Morality influence
        if (gameState.morality < -0.5) {
            personalityScore.aggressive += 0.3;
        } else if (gameState.morality > 0.5) {
            personalityScore.moral += 0.3;
            personalityScore.cautious += 0.2;
        }
        
        // Consciousness influence
        if (gameState.consciousnessStats?.conflicted > 3) {
            personalityScore.cautious += 0.2;
        }
        
        // Temporal stability influence
        if (gameState.paradoxRisk > 50) {
            personalityScore.cautious += 0.3;
        }
        
        // Soul count influence
        if (gameState.souls > 100) {
            personalityScore.aggressive += 0.2;
            personalityScore.curious += 0.2;
        }
        
        // Default curiosity
        personalityScore.curious += 0.1;
        
        // Select dominant personality
        const dominant = Object.entries(personalityScore)
            .sort((a, b) => b[1] - a[1])[0][0];
        
        const personalityMap = {
            aggressive: 'AGGRESSIVE',
            cautious: 'CAUTIOUS',
            moral: 'MORAL',
            curious: 'CURIOUS'
        };
        
        this.decisionMakingPersonality = this.personalityTypes[personalityMap[dominant]] || this.personalityTypes.BALANCED;
    }

    makeAutonomousDecisions(hours) {
        const decisionsToMake = Math.floor(hours * 2); // 2 decisions per hour
        
        for (let i = 0; i < decisionsToMake; i++) {
            const decision = this.makeAutonomousDecision();
            if (decision) {
                this.autonomousDecisions.push(decision);
                this.applyDecisionEffects(decision);
            }
        }
    }

    makeAutonomousDecision() {
        const personality = this.decisionMakingPersonality;
        const gameState = this.gameState.getState();
        
        // Weight decisions based on personality and current state
        const decisionWeights = this.calculateDecisionWeights(personality, gameState);
        
        // Select decision based on weights
        const selectedDecision = this.weightedRandomSelection(decisionWeights);
        
        if (!selectedDecision) return null;
        
        const decision = {
            id: this.generateDecisionId(),
            type: selectedDecision,
            timestamp: Date.now(),
            personality: personality.name,
            reasoning: this.generateDecisionReasoning(selectedDecision, personality),
            effects: this.calculateDecisionEffects(selectedDecision, personality)
        };
        
        return decision;
    }

    calculateDecisionWeights(personality, gameState) {
        const weights = {};
        
        for (const [decisionType, decisionData] of Object.entries(this.decisionTypes)) {
            let weight = decisionData.frequency;
            
            // Personality modifiers
            switch (decisionType) {
                case 'SOUL_CONSUMPTION':
                    weight *= personality.soulConsumptionBias;
                    if (gameState.souls < 50) weight *= 1.5; // Need more souls
                    break;
                    
                case 'MORAL_CHOICE':
                    weight *= (1 - personality.moralityDisregard);
                    if (Math.abs(gameState.morality) > 0.8) weight *= 0.5; // Avoid extremes
                    break;
                    
                case 'CONSCIOUSNESS_MERGE':
                    weight *= personality.riskTolerance;
                    if (gameState.integrationStress > 70) weight *= 0.3; // Too risky
                    break;
                    
                case 'TEMPORAL_MANIPULATION':
                    weight *= personality.riskTolerance;
                    if (gameState.paradoxRisk > 60) weight *= 0.2; // Too dangerous
                    if (gameState.temporalEnergy < 30) weight *= 0.1; // Not enough energy
                    break;
                    
                case 'EXPLORATION':
                    weight *= personality.explorationBias;
                    break;
                    
                case 'REST_AND_RECOVERY':
                    if (gameState.integrationStress > 50) weight *= 2;
                    if (gameState.paradoxRisk > 50) weight *= 1.5;
                    weight *= (1 - personality.riskTolerance) + 0.3;
                    break;
            }
            
            // Risk assessment
            if (decisionData.riskLevel > personality.riskTolerance) {
                weight *= 0.5;
            }
            
            weights[decisionType] = Math.max(0, weight);
        }
        
        return weights;
    }

    generateDecisionReasoning(decisionType, personality) {
        const reasoningTemplates = {
            'SOUL_CONSUMPTION': [
                "Sensed vulnerable souls nearby - power calls",
                "Hunger for more essence drives the decision",
                "Opportunity for growth through consumption"
            ],
            'MORAL_CHOICE': [
                "Confronted with ethical dilemma",
                "Conscience weighs heavily on decision",
                "Moral compass guides the choice"
            ],
            'CONSCIOUSNESS_MERGE': [
                "Internal voices seek harmony",
                "Conflicting thoughts demand resolution",
                "Integration offers greater understanding"
            ],
            'TEMPORAL_MANIPULATION': [
                "Time itself seems malleable here",
                "Temporal energies surge with possibility",
                "The timeline beckons for alteration"
            ],
            'EXPLORATION': [
                "Curiosity drives forward movement",
                "Unknown territories call for investigation",
                "New discoveries await beyond the horizon"
            ],
            'REST_AND_RECOVERY': [
                "Wisdom suggests patience and healing",
                "Current instability requires stabilization",
                "Rest is necessary for continued progress"
            ]
        };
        
        const templates = reasoningTemplates[decisionType] || ["Unknown motivation"];
        return templates[Math.floor(Math.random() * templates.length)];
    }

    calculateDecisionEffects(decisionType, personality) {
        const baseEffects = { ...this.decisionTypes[decisionType] };
        
        // Personality modifiers
        if (decisionType === 'SOUL_CONSUMPTION') {
            baseEffects.soulGain *= (0.5 + personality.soulConsumptionBias);
        }
        
        if (decisionType === 'MORAL_CHOICE') {
            // Random moral impact influenced by personality
            const moralDirection = personality.moralityDisregard > 0.5 ? -1 : 1;
            baseEffects.moralityImpact = moralDirection * Math.random() * 10;
        }
        
        return baseEffects;
    }

    applyDecisionEffects(decision) {
        const effects = decision.effects;
        
        // Apply effects to accumulated progress
        if (effects.soulGain) {
            this.addAccumulatedProgress('souls', effects.soulGain);
        }
        
        if (effects.moralityImpact) {
            this.addAccumulatedProgress('morality', effects.moralityImpact);
        }
        
        if (effects.temporalEnergyGain) {
            this.addAccumulatedProgress('temporalEnergy', effects.temporalEnergyGain);
        }
        
        if (effects.integrationStressChange) {
            this.addAccumulatedProgress('integrationStress', effects.integrationStressChange);
        }
    }

    // Offline Event Generation
    generateOfflineEvents(hours) {
        const eventsToGenerate = Math.floor(hours * 1.5); // 1.5 events per hour
        
        for (let i = 0; i < eventsToGenerate; i++) {
            const event = this.generateRandomEvent();
            if (event) {
                this.offlineEvents.push(event);
                this.applyEventEffects(event);
            }
        }
    }

    generateRandomEvent() {
        // Select event based on probability
        const eventEntries = Object.entries(this.eventTypes);
        
        for (const [eventType, eventData] of eventEntries) {
            if (Math.random() < eventData.probability) {
                const event = {
                    id: this.generateEventId(),
                    type: eventType,
                    description: eventData.description,
                    timestamp: Date.now(),
                    impact: { ...eventData.impact },
                    resolution: this.generateEventResolution(eventType)
                };
                
                return event;
            }
        }
        
        return null;
    }

    generateEventResolution(eventType) {
        const personality = this.decisionMakingPersonality;
        
        const resolutionTemplates = {
            'SOUL_DISCOVERY': [
                "Consumed the souls without hesitation",
                "Carefully absorbed the essence",
                "Reluctantly took what was needed"
            ],
            'MORAL_DILEMMA': [
                "Chose the path of least resistance",
                "Made the morally difficult choice",
                "Found a creative third option"
            ],
            'TEMPORAL_ANOMALY': [
                "Attempted to stabilize the disturbance",
                "Avoided the dangerous area",
                "Investigated despite the risk"
            ],
            'CONSCIOUSNESS_CONFLICT': [
                "Forcibly suppressed the conflict",
                "Sought peaceful resolution",
                "Let the voices battle it out"
            ],
            'MEMORY_FRAGMENT': [
                "Absorbed the memory completely",
                "Carefully examined the fragment",
                "Filed it away for later analysis"
            ],
            'SAFE_HAVEN': [
                "Rested and recovered fully",
                "Remained vigilant while resting",
                "Used the time for introspection"
            ],
            'HOSTILE_ENCOUNTER': [
                "Fought aggressively",
                "Attempted diplomatic solution",
                "Retreated to fight another day"
            ]
        };
        
        const templates = resolutionTemplates[eventType] || ["Handled the situation"];
        return templates[Math.floor(Math.random() * templates.length)];
    }

    applyEventEffects(event) {
        const impact = event.impact;
        
        Object.entries(impact).forEach(([effectType, value]) => {
            this.addAccumulatedProgress(effectType, value);
        });
    }

    // Progress Simulation
    simulateOfflineProgression(hours) {
        // Calculate base progression
        Object.entries(this.progressionRates).forEach(([progressType, ratePerHour]) => {
            const multiplier = this.offlineMultipliers[this.getMultiplierKey(progressType)] || 1.0;
            const progress = ratePerHour * hours * multiplier;
            
            this.addAccumulatedProgress(progressType, progress);
        });
        
        // Simulate system-specific progression
        this.simulateConsciousnessProgression(hours);
        this.simulateTemporalProgression(hours);
        this.simulateMoralityProgression(hours);
    }

    simulateConsciousnessProgression(hours) {
        const gameState = this.gameState.getState();
        
        if (gameState.consciousnessStats?.integrating > 0) {
            const integrationProgress = hours * this.offlineMultipliers.consciousnessIntegration;
            this.addAccumulatedProgress('consciousnessIntegration', integrationProgress);
        }
        
        // Stress reduction over time
        if (gameState.integrationStress > 0) {
            const stressReduction = Math.min(gameState.integrationStress, hours * 2);
            this.addAccumulatedProgress('integrationStress', -stressReduction);
        }
    }

    simulateTemporalProgression(hours) {
        // Temporal energy regeneration
        const energyRegen = hours * this.progressionRates.temporalEnergyRegen * this.offlineMultipliers.temporalEnergyRegen;
        this.addAccumulatedProgress('temporalEnergy', energyRegen);
        
        // Paradox risk decay
        const gameState = this.gameState.getState();
        if (gameState.paradoxRisk > 0) {
            const paradoxDecay = Math.min(gameState.paradoxRisk, hours * 3);
            this.addAccumulatedProgress('paradoxRisk', -paradoxDecay);
        }
    }

    simulateMoralityProgression(hours) {
        // Natural morality drift toward neutral
        const gameState = this.gameState.getState();
        const currentMorality = gameState.morality || 0;
        
        if (Math.abs(currentMorality) > 0.1) {
            const driftDirection = currentMorality > 0 ? -1 : 1;
            const driftAmount = Math.min(Math.abs(currentMorality), hours * 0.5) * driftDirection;
            this.addAccumulatedProgress('morality', driftAmount);
        }
    }

    // Progress Accumulation
    addAccumulatedProgress(type, amount) {
        const current = this.accumulatedProgress.get(type) || 0;
        this.accumulatedProgress.set(type, current + amount);
    }

    getMultiplierKey(progressType) {
        const multiplierMap = {
            'soulGeneration': 'soulGain',
            'moralityDecay': 'moralityDecay',
            'temporalEnergyRegen': 'temporalEnergyRegen',
            'consciousnessIntegration': 'consciousnessIntegration'
        };
        
        return multiplierMap[progressType] || progressType;
    }

    // Offline Summary Generation
    generateOfflineSummary(duration) {
        const hours = duration / (1000 * 60 * 60);
        
        const summary = {
            duration: {
                milliseconds: duration,
                hours: Math.floor(hours),
                minutes: Math.floor((hours % 1) * 60)
            },
            personality: this.decisionMakingPersonality.name,
            decisions: this.autonomousDecisions.length,
            events: this.offlineEvents.length,
            progress: Object.fromEntries(this.accumulatedProgress),
            significantDecisions: this.getSignificantDecisions(),
            majorEvents: this.getMajorEvents(),
            overallImpact: this.calculateOverallImpact()
        };
        
        return summary;
    }

    getSignificantDecisions() {
        return this.autonomousDecisions.filter(decision => {
            const effects = decision.effects;
            return (
                Math.abs(effects.moralityImpact || 0) > 5 ||
                (effects.soulGain || 0) > 15 ||
                effects.riskLevel > 0.6
            );
        });
    }

    getMajorEvents() {
        return this.offlineEvents.filter(event => {
            const impact = event.impact;
            return (
                Math.abs(impact.morality || 0) > 3 ||
                Math.abs(impact.souls || 0) > 10 ||
                Math.abs(impact.temporalEnergy || 0) > 15
            );
        });
    }

    calculateOverallImpact() {
        const totalSouls = this.accumulatedProgress.get('souls') || 0;
        const totalMorality = this.accumulatedProgress.get('morality') || 0;
        const totalStress = this.accumulatedProgress.get('integrationStress') || 0;
        
        let impactLevel = 'MINIMAL';
        
        if (Math.abs(totalSouls) > 50 || Math.abs(totalMorality) > 20 || Math.abs(totalStress) > 30) {
            impactLevel = 'MAJOR';
        } else if (Math.abs(totalSouls) > 20 || Math.abs(totalMorality) > 10 || Math.abs(totalStress) > 15) {
            impactLevel = 'MODERATE';
        } else if (Math.abs(totalSouls) > 5 || Math.abs(totalMorality) > 5 || Math.abs(totalStress) > 5) {
            impactLevel = 'MINOR';
        }
        
        return {
            level: impactLevel,
            primaryChanges: this.identifyPrimaryChanges(),
            warnings: this.generateWarnings()
        };
    }

    identifyPrimaryChanges() {
        const changes = [];
        
        this.accumulatedProgress.forEach((value, key) => {
            if (Math.abs(value) > 5) {
                changes.push({
                    type: key,
                    change: value,
                    direction: value > 0 ? 'increased' : 'decreased'
                });
            }
        });
        
        return changes.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    }

    generateWarnings() {
        const warnings = [];
        
        const moralityChange = this.accumulatedProgress.get('morality') || 0;
        const stressChange = this.accumulatedProgress.get('integrationStress') || 0;
        const paradoxChange = this.accumulatedProgress.get('paradoxRisk') || 0;
        
        if (moralityChange < -15) {
            warnings.push("Significant moral degradation occurred while offline");
        }
        
        if (stressChange > 20) {
            warnings.push("Integration stress increased substantially");
        }
        
        if (paradoxChange > 15) {
            warnings.push("Paradox risk escalated during absence");
        }
        
        if (this.autonomousDecisions.filter(d => d.effects.riskLevel > 0.7).length > 2) {
            warnings.push("Multiple high-risk decisions were made autonomously");
        }
        
        return warnings;
    }

    // Welcome Back Interface
    generateWelcomeBackInterface(summary) {
        const welcomeInterface = {
            title: "Welcome Back, Consciousness",
            subtitle: `You were absent for ${summary.duration.hours}h ${summary.duration.minutes}m`,
            
            personalityReport: {
                dominantPersonality: summary.personality,
                description: this.getPersonalityDescription(summary.personality),
                decisionCount: summary.decisions
            },
            
            progressHighlights: this.formatProgressHighlights(summary.progress),
            
            significantEvents: summary.majorEvents.map(event => ({
                description: event.description,
                resolution: event.resolution,
                impact: this.formatEventImpact(event.impact)
            })),
            
            importantDecisions: summary.significantDecisions.map(decision => ({
                type: decision.type,
                reasoning: decision.reasoning,
                impact: this.formatDecisionImpact(decision.effects)
            })),
            
            warnings: summary.overallImpact.warnings,
            
            recommendations: this.generateRecommendations(summary),
            
            continueOptions: this.generateContinueOptions(summary)
        };
        
    return welcomeInterface;
    }

    getPersonalityDescription(personalityName) {
        const descriptions = {
            'Aggressive': "Your consciousness embraced power and dominance",
            'Cautious': "Your consciousness proceeded with careful deliberation",
            'Balanced': "Your consciousness maintained equilibrium in all decisions",
            'Moral': "Your consciousness was guided by ethical considerations",
            'Curious': "Your consciousness sought knowledge and new experiences"
        };
        
        return descriptions[personalityName] || "Your consciousness acted according to its nature";
    }

    formatProgressHighlights(progress) {
        const highlights = [];
        
        Object.entries(progress).forEach(([type, value]) => {
            if (Math.abs(value) > 3) {
                highlights.push({
                    type: this.formatProgressType(type),
                    value: this.formatProgressValue(type, value),
                    significant: Math.abs(value) > 15
                });
            }
        });
        
        return highlights.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    }

    formatProgressType(type) {
        const typeNames = {
            'souls': 'Soul Energy',
            'morality': 'Moral Alignment',
            'temporalEnergy': 'Temporal Energy',
            'integrationStress': 'Integration Stress',
            'paradoxRisk': 'Paradox Risk',
            'consciousnessIntegration': 'Consciousness Integration'
        };
        
        return typeNames[type] || type;
    }

    formatProgressValue(type, value) {
        if (type === 'morality') {
            return value > 0 ? `+${value.toFixed(1)} (toward good)` : `${value.toFixed(1)} (toward evil)`;
        }
        
        return value > 0 ? `+${Math.floor(value)}` : `${Math.floor(value)}`;
    }

    formatEventImpact(impact) {
        return Object.entries(impact)
            .filter(([key, value]) => Math.abs(value) > 0)
            .map(([key, value]) => `${this.formatProgressType(key)}: ${this.formatProgressValue(key, value)}`)
            .join(', ');
    }

    formatDecisionImpact(effects) {
        const impacts = [];
        
        if (effects.soulGain) impacts.push(`+${effects.soulGain} souls`);
        if (effects.moralityImpact) impacts.push(`${effects.moralityImpact > 0 ? '+' : ''}${effects.moralityImpact} morality`);
        if (effects.riskLevel > 0.5) impacts.push('High risk taken');
        
        return impacts.join(', ') || 'Minor effects';
    }

    generateRecommendations(summary) {
        const recommendations = [];
        
        const moralityChange = summary.progress.morality || 0;
        const stressChange = summary.progress.integrationStress || 0;
        
        if (moralityChange < -10) {
            recommendations.push("Consider taking actions to restore moral balance");
        }
        
        if (stressChange > 15) {
            recommendations.push("Focus on consciousness integration and stress reduction");
        }
        
        if (summary.decisions > summary.duration.hours * 3) {
            recommendations.push("Your consciousness was very active - consider what drove such intensity");
        }
        
        if (summary.significantDecisions.length === 0) {
            recommendations.push("Your consciousness played it safe - perhaps it's time for bolder action");
        }
        
        return recommendations;
    }

    generateContinueOptions(summary) {
        const options = [
            {
                id: 'continue_normal',
                label: 'Continue where you left off',
                description: 'Resume normal gameplay with all offline progress applied'
            },
            {
                id: 'review_decisions',
                label: 'Review autonomous decisions',
                description: 'Examine each decision made while offline before continuing'
            }
        ];
        
        if (summary.overallImpact.warnings.length > 0) {
            options.push({
                id: 'address_warnings',
                label: 'Address critical issues first',
                description: 'Handle problems that arose during your absence'
            });
        }
        
        if (summary.significantDecisions.length > 0) {
            options.push({
                id: 'adjust_personality',
                label: 'Adjust autonomous behavior',
                description: 'Modify how your consciousness acts when offline'
            });
        }
        
        return options;
    }

    // Utility Methods
    weightedRandomSelection(weights) {
        const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
        
        if (totalWeight === 0) return null;
        
        let random = Math.random() * totalWeight;
        
        for (const [option, weight] of Object.entries(weights)) {
            random -= weight;
            if (random <= 0) {
                return option;
            }
        }
        
        return null;
    }

    loadLastSession() {
        // Load the last session data if available
        const lastSession = localStorage.getItem('lastOfflineSession');
        if (lastSession) {
            try {
                const sessionData = JSON.parse(lastSession);
                this.lastOnlineTime = sessionData.lastOnlineTime || Date.now();
            } catch (error) {
                console.warn('Failed to load last session data:', error);
            }
        }
    }

    saveSessionData() {
        const sessionData = {
            lastOnlineTime: this.lastOnlineTime,
            offlineStartTime: this.offlineStartTime,
            isOffline: this.isOffline
        };
        
        localStorage.setItem('lastOfflineSession', JSON.stringify(sessionData));
    }

    generateDecisionId() {
        return `decision_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    generateEventId() {
        return `event_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    // State Management
    getState() {
        return {
            lastOnlineTime: this.lastOnlineTime,
            offlineStartTime: this.offlineStartTime,
            isOffline: this.isOffline,
            autonomousDecisions: this.autonomousDecisions,
            offlineEvents: this.offlineEvents,
            accumulatedProgress: Object.fromEntries(this.accumulatedProgress),
            decisionMakingPersonality: this.decisionMakingPersonality,
            autonomyLevel: this.autonomyLevel,
            aggressionLevel: this.aggressionLevel,
            caution: this.caution,
            offlineMultipliers: { ...this.offlineMultipliers }
        };
    }

    setState(state) {
        this.lastOnlineTime = state.lastOnlineTime || Date.now();
        this.offlineStartTime = state.offlineStartTime || null;
        this.isOffline = state.isOffline || false;
        this.autonomousDecisions = state.autonomousDecisions || [];
        this.offlineEvents = state.offlineEvents || [];
        this.accumulatedProgress = new Map(Object.entries(state.accumulatedProgress || {}));
        this.decisionMakingPersonality = state.decisionMakingPersonality || this.personalityTypes.BALANCED;
        this.autonomyLevel = state.autonomyLevel || 1.0;
        this.aggressionLevel = state.aggressionLevel || 0.5;
        this.caution = state.caution || 0.5;
        
        if (state.offlineMultipliers) {
            Object.assign(this.offlineMultipliers, state.offlineMultipliers);
        }
        
        this.emit('stateRestored');
    }

    // Public Interface Methods
    checkForOfflineProgress() {
        const now = Date.now();
        const timeSinceLastOnline = now - this.lastOnlineTime;
        
        // Only process if offline for more than 1 minute
        if (timeSinceLastOnline > 60000) {
            return this.processOfflineTime(timeSinceLastOnline);
        }
        
        return null;
    }

    applyOfflineProgress(summary) {
        // Apply accumulated progress to game state
        this.emit('applyOfflineProgress', summary.progress);
        
        // Update last online time
        this.lastOnlineTime = Date.now();
        this.saveSessionData();
    }

    adjustOfflineBehavior(adjustments) {
        if (adjustments.autonomyLevel !== undefined) {
            this.autonomyLevel = Math.max(0, Math.min(2, adjustments.autonomyLevel));
        }
        
        if (adjustments.aggressionLevel !== undefined) {
            this.aggressionLevel = Math.max(0, Math.min(1, adjustments.aggressionLevel));
        }
        
        if (adjustments.caution !== undefined) {
            this.caution = Math.max(0, Math.min(1, adjustments.caution));
        }
        
        if (adjustments.multipliers) {
            Object.assign(this.offlineMultipliers, adjustments.multipliers);
        }
        
        this.emit('offlineBehaviorAdjusted', {
            autonomyLevel: this.autonomyLevel,
            aggressionLevel: this.aggressionLevel,
            caution: this.caution,
            multipliers: this.offlineMultipliers
        });
    }
}

// Expose constructor globally
if (typeof window !== 'undefined') {
    window.OfflineSystem = OfflineSystem;
}