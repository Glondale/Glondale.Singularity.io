// systems/moralitySystem.js
// Using global gameState, eventBus, uiManager provided by plain script loading
// (previously used ES module imports)

class MoralitySystem {
    constructor() {
        this.choices = new Map();
        this.consequences = new Map();
        this.moralityThresholds = {
            saint: 80,
            good: 40,
            neutral: -40,
            corrupt: -80
        };
        this.init();
    }

    init() {
        eventBus.on('choice-made', this.handleChoice.bind(this));
        eventBus.on('expansion-unlocked', this.checkMoralityGates.bind(this));
        eventBus.on('game-loaded', this.applyMoralityEffects.bind(this));
    }

    // Register a moral choice
    registerChoice(id, data) {
        this.choices.set(id, {
            id,
            title: data.title,
            description: data.description,
            options: data.options, // Array of {text, moralityChange, consequences}
            conditions: data.conditions || {},
            repeatable: data.repeatable || false,
            cooldown: data.cooldown || 0,
            lastUsed: 0
        });
    }

    // Present a choice to the player
    presentChoice(choiceId) {
        const choice = this.choices.get(choiceId);
        if (!choice) {
            console.warn(`Choice ${choiceId} not found`);
            return;
        }

        // Check conditions
        if (!this.checkConditions(choice.conditions)) {
            return false;
        }

        // Check cooldown
        if (!choice.repeatable && choice.lastUsed > 0) {
            return false;
        }

        if (choice.cooldown > 0 && (Date.now() - choice.lastUsed) < choice.cooldown) {
            return false;
        }

        // Present choice UI
        uiManager.showMoralChoice(choice);
        return true;
    }

    // Handle a choice being made
    handleChoice(data) {
        const { choiceId, optionIndex } = data;
        const choice = this.choices.get(choiceId);
        
        if (!choice || !choice.options[optionIndex]) {
            return;
        }

        const option = choice.options[optionIndex];
        
        // Apply morality change
        this.changeMorality(option.moralityChange || 0);
        
        // Apply consequences
        if (option.consequences) {
            this.applyConsequences(option.consequences);
        }

        // Update choice usage
        choice.lastUsed = Date.now();

        // Store choice in history
        if (!gameState.data.moralityHistory) {
            gameState.data.moralityHistory = [];
        }
        
        gameState.data.moralityHistory.push({
            choiceId,
            optionIndex,
            timestamp: Date.now(),
            moralityChange: option.moralityChange || 0,
            moralityAfter: gameState.data.morality || 0
        });

        // Trigger events
        eventBus.emit('morality-changed', {
            change: option.moralityChange || 0,
            newValue: gameState.data.morality || 0,
            alignment: this.getMoralAlignment()
        });

        eventBus.emit('choice-completed', {
            choiceId,
            optionIndex,
            consequences: option.consequences
        });

        this.checkMoralityGates();
    }

    // Change morality value
    changeMorality(amount) {
        if (!gameState.data.morality) {
            gameState.data.morality = 0;
        }
        
        gameState.data.morality += amount;
        gameState.data.morality = Math.max(-100, Math.min(100, gameState.data.morality));
        
        gameState.saveData();
    }

    // Get current moral alignment
    getMoralAlignment() {
        const morality = gameState.data.morality || 0;
        
        if (morality >= this.moralityThresholds.saint) return 'saint';
        if (morality >= this.moralityThresholds.good) return 'good';
        if (morality >= this.moralityThresholds.neutral) return 'neutral';
        if (morality >= this.moralityThresholds.corrupt) return 'corrupt';
        return 'evil';
    }

    // Apply consequences of choices
    applyConsequences(consequences) {
        for (const [type, data] of Object.entries(consequences)) {
            switch (type) {
                case 'resources':
                    this.applyResourceChanges(data);
                    break;
                case 'unlockExpansion':
                    eventBus.emit('unlock-expansion', { expansionId: data });
                    break;
                case 'lockExpansion':
                    eventBus.emit('lock-expansion', { expansionId: data });
                    break;
                case 'modifyProduction':
                    this.applyProductionModifiers(data);
                    break;
                case 'triggerEvent':
                    eventBus.emit('trigger-random-event', { eventId: data });
                    break;
                case 'reputation':
                    this.changeReputation(data);
                    break;
            }
        }
    }

    // Apply resource changes
    applyResourceChanges(changes) {
        for (const [resource, amount] of Object.entries(changes)) {
            if (!gameState.data.resources[resource]) {
                gameState.data.resources[resource] = 0;
            }
            gameState.data.resources[resource] += amount;
        }
        gameState.saveData();
    }

    // Apply production modifiers
    applyProductionModifiers(modifiers) {
        if (!gameState.data.moralityModifiers) {
            gameState.data.moralityModifiers = {};
        }

        for (const [type, modifier] of Object.entries(modifiers)) {
            if (!gameState.data.moralityModifiers[type]) {
                gameState.data.moralityModifiers[type] = 1;
            }
            gameState.data.moralityModifiers[type] *= modifier;
        }
        gameState.saveData();
    }

    // Change reputation with factions
    changeReputation(changes) {
        if (!gameState.data.reputation) {
            gameState.data.reputation = {};
        }

        for (const [faction, amount] of Object.entries(changes)) {
            if (!gameState.data.reputation[faction]) {
                gameState.data.reputation[faction] = 0;
            }
            gameState.data.reputation[faction] += amount;
            gameState.data.reputation[faction] = Math.max(-100, Math.min(100, gameState.data.reputation[faction]));
        }
        gameState.saveData();
    }

    // Check if conditions are met
    checkConditions(conditions) {
        if (!conditions || Object.keys(conditions).length === 0) {
            return true;
        }

        for (const [type, requirement] of Object.entries(conditions)) {
            switch (type) {
                case 'morality':
                    const morality = gameState.data.morality || 0;
                    if (requirement.min !== undefined && morality < requirement.min) return false;
                    if (requirement.max !== undefined && morality > requirement.max) return false;
                    break;
                    
                case 'resources':
                    for (const [resource, amount] of Object.entries(requirement)) {
                        if ((gameState.data.resources[resource] || 0) < amount) return false;
                    }
                    break;
                    
                case 'expansions':
                    for (const expansionId of requirement) {
                        if (!gameState.data.unlockedExpansions?.includes(expansionId)) return false;
                    }
                    break;
                    
                case 'reputation':
                    for (const [faction, minRep] of Object.entries(requirement)) {
                        if ((gameState.data.reputation?.[faction] || 0) < minRep) return false;
                    }
                    break;
                    
                case 'alignment':
                    if (this.getMoralAlignment() !== requirement) return false;
                    break;
            }
        }
        return true;
    }

    // Check for morality-gated content
    checkMoralityGates() {
        const alignment = this.getMoralAlignment();
        const morality = gameState.data.morality || 0;

        // Check for alignment-specific expansions
        eventBus.emit('check-alignment-gates', { alignment, morality });
        
        // Apply morality effects to existing systems
        this.applyMoralityEffects();
    }

    // Apply ongoing morality effects
    applyMoralityEffects() {
        const alignment = this.getMoralAlignment();
        const morality = gameState.data.morality || 0;

        // Calculate morality multipliers
        const effects = this.calculateMoralityEffects(alignment, morality);
        
        // Store effects for other systems to use
        gameState.data.moralityEffects = effects;
        gameState.saveData();

        eventBus.emit('morality-effects-updated', effects);
    }

    // Calculate morality effects on various systems
    calculateMoralityEffects(alignment, morality) {
        const effects = {
            productionMultiplier: 1,
            resourceEfficiency: 1,
            populationHappiness: 0,
            constructionSpeed: 1,
            eventChances: {},
            availableChoices: [],
            lockedExpansions: [],
            unlockedExpansions: []
        };

        switch (alignment) {
            case 'saint':
                effects.productionMultiplier = 1.2;
                effects.populationHappiness = 25;
                effects.eventChances.positive = 1.5;
                effects.eventChances.negative = 0.5;
                break;
                
            case 'good':
                effects.productionMultiplier = 1.1;
                effects.populationHappiness = 10;
                effects.eventChances.positive = 1.2;
                break;
                
            case 'neutral':
                // No modifications
                break;
                
            case 'corrupt':
                effects.productionMultiplier = 1.15; // Short-term gains
                effects.resourceEfficiency = 0.9;
                effects.populationHappiness = -15;
                effects.eventChances.negative = 1.3;
                effects.constructionSpeed = 1.1;
                break;
                
            case 'evil':
                effects.productionMultiplier = 1.25; // High short-term gains
                effects.resourceEfficiency = 0.8;
                effects.populationHappiness = -30;
                effects.eventChances.negative = 1.8;
                effects.eventChances.crisis = 1.5;
                effects.constructionSpeed = 1.2;
                break;
        }

        return effects;
    }

    // Get available choices for current state
    getAvailableChoices() {
        const available = [];
        
        for (const [id, choice] of this.choices) {
            if (this.checkConditions(choice.conditions)) {
                // Check cooldown
                if (choice.repeatable || choice.lastUsed === 0) {
                    if (choice.cooldown === 0 || (Date.now() - choice.lastUsed) >= choice.cooldown) {
                        available.push(choice);
                    }
                }
            }
        }
        
        return available;
    }

    // Get morality-based content access
    getContentAccess() {
        const alignment = this.getMoralAlignment();
        const morality = gameState.data.morality || 0;
        
        return {
            alignment,
            morality,
            canAccessSaintExpansions: alignment === 'saint',
            canAccessEvilExpansions: alignment === 'evil' || alignment === 'corrupt',
            canAccessNeutralExpansions: alignment === 'neutral' || alignment === 'good',
            restrictedActions: this.getRestrictedActions(alignment),
            bonusActions: this.getBonusActions(alignment)
        };
    }

    // Get actions restricted by morality
    getRestrictedActions(alignment) {
        const restricted = [];
        
        switch (alignment) {
            case 'saint':
                restricted.push('exploitation', 'forcedLabor', 'environmentalDestruction');
                break;
            case 'good':
                restricted.push('forcedLabor', 'massExploitation');
                break;
            case 'evil':
                restricted.push('charity', 'environmentalProtection', 'workerRights');
                break;
            case 'corrupt':
                restricted.push('transparency', 'fairWages');
                break;
        }
        
        return restricted;
    }

    // Get bonus actions available due to morality
    getBonusActions(alignment) {
        const bonus = [];
        
        switch (alignment) {
            case 'saint':
                bonus.push('divineIntervention', 'miraclousEfficiency', 'holyBlessing');
                break;
            case 'good':
                bonus.push('communitySupport', 'volunteerWork', 'charitableGiving');
                break;
            case 'evil':
                bonus.push('intimidation', 'blackmarket', 'forcedCompliance');
                break;
            case 'corrupt':
                bonus.push('bribery', 'corruption', 'underdealings');
                break;
        }
        
        return bonus;
    }

    // Trigger a random moral choice
    triggerRandomChoice() {
        const available = this.getAvailableChoices();
        if (available.length === 0) return false;
        
        const randomChoice = available[Math.floor(Math.random() * available.length)];
        return this.presentChoice(randomChoice.id);
    }

    // Check if specific expansion is morality-gated
    isExpansionMoralityGated(expansionId, requiredAlignment = null, requiredMorality = null) {
        const alignment = this.getMoralAlignment();
        const morality = gameState.data.morality || 0;
        
        if (requiredAlignment && alignment !== requiredAlignment) {
            return { blocked: true, reason: `Requires ${requiredAlignment} alignment` };
        }
        
        if (requiredMorality !== null) {
            if (requiredMorality > 0 && morality < requiredMorality) {
                return { blocked: true, reason: `Requires morality of at least ${requiredMorality}` };
            }
            if (requiredMorality < 0 && morality > requiredMorality) {
                return { blocked: true, reason: `Requires morality of at most ${requiredMorality}` };
            }
        }
        
        return { blocked: false };
    }

    // Get morality status for UI
    getMoralityStatus() {
        const morality = gameState.data.morality || 0;
        const alignment = this.getMoralAlignment();
        
        return {
            value: morality,
            alignment,
            description: this.getAlignmentDescription(alignment),
            effects: gameState.data.moralityEffects || {},
            nextThreshold: this.getNextThreshold(morality),
            choicesMade: gameState.data.moralityHistory?.length || 0
        };
    }

    // Get description for alignment
    getAlignmentDescription(alignment) {
        const descriptions = {
            saint: "Your pure moral conduct inspires all. Divine favor smiles upon your endeavors.",
            good: "You strive to do right by your people. Your moral compass guides you well.",
            neutral: "You balance pragmatism with principle. Your choices reflect practical wisdom.",
            corrupt: "Power has begun to corrupt your judgment. Short-term gains come at moral cost.",
            evil: "You have embraced darkness for power. Your reign brings fear and suffering."
        };
        
        return descriptions[alignment] || descriptions.neutral;
    }

    // Get next morality threshold
    getNextThreshold(currentMorality) {
        const thresholds = Object.entries(this.moralityThresholds)
            .sort((a, b) => a[1] - b[1]);
        
        for (const [name, value] of thresholds) {
            if (currentMorality < value) {
                return { name, value, difference: value - currentMorality };
            }
        }
        
        return null; // Already at maximum
    }

    // Reset morality (for special events)
    resetMorality() {
        gameState.data.morality = 0;
        gameState.data.moralityHistory = [];
        gameState.saveData();
        
        eventBus.emit('morality-reset');
        this.applyMoralityEffects();
    }

    // Get reputation summary
    getReputationSummary() {
        const reputation = gameState.data.reputation || {};
        const summary = {};
        
        for (const [faction, rep] of Object.entries(reputation)) {
            let status;
            if (rep >= 60) status = 'revered';
            else if (rep >= 30) status = 'respected';
            else if (rep >= -30) status = 'neutral';
            else if (rep >= -60) status = 'disliked';
            else status = 'hated';
            
            summary[faction] = { value: rep, status };
        }
        
        return summary;
    }

    // Save/Load methods
    saveState() {
        return {
            choicesUsage: Array.from(this.choices.entries()).map(([id, choice]) => ({
                id,
                lastUsed: choice.lastUsed
            }))
        };
    }

    loadState(data) {
        if (data.choicesUsage) {
            data.choicesUsage.forEach(usage => {
                const choice = this.choices.get(usage.id);
                if (choice) {
                    choice.lastUsed = usage.lastUsed;
                }
            });
        }
    }
}

// Pre-defined moral choices
const defaultChoices = {
    workerWages: {
        title: "Worker Compensation",
        description: "Your workers demand better wages. How do you respond?",
        options: [
            {
                text: "Grant generous raises and benefits",
                moralityChange: 15,
                consequences: {
                    resources: { money: -5000 },
                    modifyProduction: { workerEfficiency: 1.2 }
                }
            },
            {
                text: "Provide modest increases",
                moralityChange: 5,
                consequences: {
                    resources: { money: -2000 },
                    modifyProduction: { workerEfficiency: 1.05 }
                }
            },
            {
                text: "Refuse and threaten layoffs",
                moralityChange: -20,
                consequences: {
                    modifyProduction: { workerEfficiency: 0.8 },
                    reputation: { workers: -30 }
                }
            }
        ],
        conditions: {
            resources: { money: 1000 }
        },
        repeatable: true,
        cooldown: 300000 // 5 minutes
    },

    environmentalChoice: {
        title: "Environmental Regulations",
        description: "New environmental laws threaten your profits. What's your approach?",
        options: [
            {
                text: "Exceed compliance standards",
                moralityChange: 20,
                consequences: {
                    resources: { money: -10000 },
                    reputation: { environmentalists: 40 },
                    modifyProduction: { pollution: 0.3 }
                }
            },
            {
                text: "Meet minimum requirements",
                moralityChange: 0,
                consequences: {
                    resources: { money: -3000 },
                    modifyProduction: { pollution: 0.7 }
                }
            },
            {
                text: "Find loopholes and exploit them",
                moralityChange: -25,
                consequences: {
                    reputation: { government: -20, environmentalists: -50 },
                    modifyProduction: { pollution: 1.5 }
                }
            }
        ]
    },

    corruptionOffer: {
        title: "Corrupt Official",
        description: "A government official offers to expedite permits for a 'donation'.",
        options: [
            {
                text: "Report the official",
                moralityChange: 15,
                consequences: {
                    reputation: { government: 30 },
                    triggerEvent: 'governmentInvestigation'
                }
            },
            {
                text: "Decline politely",
                moralityChange: 5,
                consequences: {}
            },
            {
                text: "Pay the bribe",
                moralityChange: -15,
                consequences: {
                    resources: { money: -5000 },
                    modifyProduction: { constructionSpeed: 1.3 },
                    reputation: { government: -10 }
                }
            }
        ],
        conditions: {
            morality: { max: 50 } // Only appears if not too moral
        }
    }
};

// Initialize and register default choices
const moralitySystem = new MoralitySystem();

// Register default choices
Object.entries(defaultChoices).forEach(([id, choice]) => {
    moralitySystem.registerChoice(id, choice);
});

// Expose to global scope
if (typeof window !== 'undefined') {
    window.moralitySystem = moralitySystem;
}