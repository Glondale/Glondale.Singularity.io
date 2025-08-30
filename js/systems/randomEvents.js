// systems/randomEvents.js
// Using global gameState, eventBus, eventData provided by plain script loading

class RandomEventsSystem {
    constructor() {
        this.events = new Map();
        this.activeEvents = new Map();
        this.eventHistory = [];
        this.baseEventChance = 0.1; // 10% chance per check
        this.checkInterval = 30000; // Check every 30 seconds
        this.lastCheck = 0;
        this.init();
    }

    init() {
        eventBus.on('game-tick', this.update.bind(this));
        eventBus.on('trigger-random-event', this.triggerSpecificEvent.bind(this));
        eventBus.on('morality-effects-updated', this.updateEventChances.bind(this));
        eventBus.on('expansion-unlocked', this.checkContextualEvents.bind(this));
        
        this.loadEvents();
        this.startEventTimer();
    }

    // Load event definitions
    loadEvents() {
        Object.entries(eventData).forEach(([id, event]) => {
            this.registerEvent(id, event);
        });
    }

    // Register an event
    registerEvent(id, data) {
        this.events.set(id, {
            id,
            title: data.title,
            description: data.description,
            category: data.category || 'general',
            rarity: data.rarity || 'common',
            duration: data.duration || 0, // 0 = instant
            conditions: data.conditions || {},
            effects: data.effects || {},
            choices: data.choices || null,
            repeatable: data.repeatable || true,
            cooldown: data.cooldown || 0,
            lastTriggered: 0,
            contextRequirements: data.contextRequirements || {},
            moralityInfluence: data.moralityInfluence || 0
        });
    }

    // Start the event checking timer
    startEventTimer() {
        setInterval(() => {
            this.checkForEvents();
        }, this.checkInterval);
    }

    // Main update loop
    update(deltaTime) {
        this.updateActiveEvents(deltaTime);
    }

    // Check if random events should trigger
    checkForEvents() {
        const now = Date.now();
        if (now - this.lastCheck < this.checkInterval) return;
        
        this.lastCheck = now;
        
        const eventChance = this.calculateEventChance();
        if (Math.random() < eventChance) {
            this.triggerRandomEvent();
        }
    }

    // Calculate current event chance based on various factors
    calculateEventChance() {
    const now = Date.now();
    let chance = this.baseEventChance;
        
        // Apply morality effects
        const moralityEffects = gameState.data.moralityEffects || {};
        if (moralityEffects.eventChances) {
            if (moralityEffects.eventChances.positive) {
                chance *= moralityEffects.eventChances.positive;
            }
            if (moralityEffects.eventChances.negative) {
                chance *= moralityEffects.eventChances.negative;
            }
        }
        
        // Increase chance based on time since last event
        const timeSinceLastEvent = now - (this.eventHistory[this.eventHistory.length - 1]?.timestamp || 0);
        const timeMultiplier = Math.min(2, 1 + (timeSinceLastEvent / 300000)); // Max 2x after 5 minutes
        chance *= timeMultiplier;
        
        // Reduce chance if too many recent events
        const recentEvents = this.eventHistory.filter(e => now - e.timestamp < 120000).length;
        if (recentEvents > 2) {
            chance *= 0.5;
        }
        
        return Math.min(0.8, chance); // Cap at 80%
    }

    // Trigger a random event
    triggerRandomEvent() {
        const availableEvents = this.getAvailableEvents();
        if (availableEvents.length === 0) return;
        
        const selectedEvent = this.selectEventByRarity(availableEvents);
        this.triggerEvent(selectedEvent.id);
    }

    // Get events that can currently trigger
    getAvailableEvents() {
        const now = Date.now();
        const available = [];
        
        for (const [id, event] of this.events) {
            // Check cooldown
            if (!event.repeatable && event.lastTriggered > 0) continue;
            if (event.cooldown > 0 && (now - event.lastTriggered) < event.cooldown) continue;
            
            // Check conditions
            if (!this.checkConditions(event.conditions)) continue;
            
            // Check context requirements
            if (!this.checkContextRequirements(event.contextRequirements)) continue;
            
            available.push(event);
        }
        
        return available;
    }

    // Select event based on rarity weights
    selectEventByRarity(events) {
        const rarityWeights = {
            common: 10,
            uncommon: 5,
            rare: 2,
            epic: 1,
            legendary: 0.5
        };
        
        const weightedEvents = events.map(event => ({
            event,
            weight: rarityWeights[event.rarity] || 1
        }));
        
        const totalWeight = weightedEvents.reduce((sum, item) => sum + item.weight, 0);
        const random = Math.random() * totalWeight;
        
        let currentWeight = 0;
        for (const item of weightedEvents) {
            currentWeight += item.weight;
            if (random <= currentWeight) {
                return item.event;
            }
        }
        
        return weightedEvents[0].event; // Fallback
    }

    // Trigger a specific event by ID
    triggerEvent(eventId) {
        const event = this.events.get(eventId);
        if (!event) {
            console.warn(`Event ${eventId} not found`);
            return false;
        }
        
        // Update last triggered
        event.lastTriggered = Date.now();
        
        // Add to history
        const eventRecord = {
            id: eventId,
            timestamp: Date.now(),
            resolved: false
        };
        this.eventHistory.push(eventRecord);
        
        // Handle event based on type
        if (event.choices) {
            this.presentEventChoice(event, eventRecord);
        } else {
            this.applyEventEffects(event);
            eventRecord.resolved = true;
        }
        
        // Add to active events if it has duration
        if (event.duration > 0) {
            this.activeEvents.set(eventRecord.id, {
                ...eventRecord,
                event,
                startTime: Date.now(),
                endTime: Date.now() + event.duration
            });
        }
        
        eventBus.emit('random-event-triggered', { event, eventRecord });
        return true;
    }

    // Trigger specific event (from external systems)
    triggerSpecificEvent(data) {
        this.triggerEvent(data.eventId);
    }

    // Present event with choices to player
    presentEventChoice(event, eventRecord) {
        eventBus.emit('event-choice-presented', {
            event,
            eventRecord,
            choices: event.choices
        });
    }

    // Handle event choice selection
    handleEventChoice(eventRecordId, choiceIndex) {
        const eventRecord = this.eventHistory.find(e => e.id === eventRecordId);
        if (!eventRecord || eventRecord.resolved) return;
        
        const event = this.events.get(eventRecord.id);
        if (!event || !event.choices || !event.choices[choiceIndex]) return;
        
        const choice = event.choices[choiceIndex];
        
        // Apply choice effects
        if (choice.effects) {
            this.applyEventEffects({ effects: choice.effects });
        }
        
        // Apply morality change
        if (choice.moralityChange) {
            eventBus.emit('morality-change', { amount: choice.moralityChange });
        }
        
        // Mark as resolved
        eventRecord.resolved = true;
        eventRecord.choiceIndex = choiceIndex;
        
        eventBus.emit('event-choice-made', {
            eventRecord,
            choiceIndex,
            choice
        });
    }

    // Apply effects of an event
    applyEventEffects(event) {
        if (!event.effects) return;
        
        for (const [effectType, effectData] of Object.entries(event.effects)) {
            switch (effectType) {
                case 'resources':
                    this.applyResourceEffects(effectData);
                    break;
                case 'production':
                    this.applyProductionEffects(effectData);
                    break;
                case 'unlock':
                    this.applyUnlockEffects(effectData);
                    break;
                case 'construction':
                    this.applyConstructionEffects(effectData);
                    break;
                case 'morality':
                    eventBus.emit('morality-change', { amount: effectData });
                    break;
                case 'reputation':
                    this.applyReputationEffects(effectData);
                    break;
                case 'special':
                    this.applySpecialEffects(effectData);
                    break;
            }
        }
    }

    // Apply resource effects
    applyResourceEffects(effects) {
        for (const [resource, amount] of Object.entries(effects)) {
            if (!gameState.data.resources[resource]) {
                gameState.data.resources[resource] = 0;
            }
            gameState.data.resources[resource] += amount;
            gameState.data.resources[resource] = Math.max(0, gameState.data.resources[resource]);
        }
        gameState.saveData();
    }

    // Apply production effects
    applyProductionEffects(effects) {
        if (!gameState.data.eventModifiers) {
            gameState.data.eventModifiers = {};
        }
        
        for (const [resource, modifier] of Object.entries(effects)) {
            if (!gameState.data.eventModifiers[resource]) {
                gameState.data.eventModifiers[resource] = 1;
            }
            gameState.data.eventModifiers[resource] *= modifier;
        }
        gameState.saveData();
    }

    // Apply unlock effects
    applyUnlockEffects(effects) {
        if (effects.expansions) {
            effects.expansions.forEach(expansionId => {
                eventBus.emit('unlock-expansion', { expansionId });
            });
        }
        
        if (effects.events) {
            effects.events.forEach(eventId => {
                const event = this.events.get(eventId);
                if (event) {
                    event.unlocked = true;
                }
            });
        }
    }

    // Apply construction effects
    applyConstructionEffects(effects) {
        if (effects.speedModifier) {
            eventBus.emit('construction-speed-event', { modifier: effects.speedModifier });
        }
        
        if (effects.cancelProjects) {
            eventBus.emit('cancel-random-projects', { count: effects.cancelProjects });
        }
    }

    // Apply reputation effects
    applyReputationEffects(effects) {
        if (!gameState.data.reputation) {
            gameState.data.reputation = {};
        }
        
        for (const [faction, amount] of Object.entries(effects)) {
            if (!gameState.data.reputation[faction]) {
                gameState.data.reputation[faction] = 0;
            }
            gameState.data.reputation[faction] += amount;
            gameState.data.reputation[faction] = Math.max(-100, Math.min(100, gameState.data.reputation[faction]));
        }
        gameState.saveData();
    }

    // Apply special effects
    applySpecialEffects(effects) {
        for (const [effectName, data] of Object.entries(effects)) {
            switch (effectName) {
                case 'triggerEvent':
                    setTimeout(() => this.triggerEvent(data), 5000);
                    break;
                case 'modifyEventChance':
                    this.baseEventChance *= data;
                    break;
                case 'resetCooldowns':
                    this.resetAllCooldowns();
                    break;
            }
        }
    }

    // Update active (ongoing) events
    updateActiveEvents(deltaTime) {
        const now = Date.now();
        const expiredEvents = [];
        
        for (const [id, activeEvent] of this.activeEvents) {
            if (now >= activeEvent.endTime) {
                expiredEvents.push(activeEvent);
            }
        }
        
        // Remove expired events
        expiredEvents.forEach(activeEvent => {
            this.activeEvents.delete(activeEvent.id);
            this.resolveOngoingEvent(activeEvent);
        });
    }

    // Resolve an ongoing event that has expired
    resolveOngoingEvent(activeEvent) {
        // Apply end effects if any
        if (activeEvent.event.endEffects) {
            this.applyEventEffects({ effects: activeEvent.event.endEffects });
        }
        
        eventBus.emit('ongoing-event-ended', { activeEvent });
    }

    // Check conditions for event triggering
    checkConditions(conditions) {
        if (!conditions || Object.keys(conditions).length === 0) {
            return true;
        }

        for (const [type, requirement] of Object.entries(conditions)) {
            switch (type) {
                case 'resources':
                    for (const [resource, amount] of Object.entries(requirement)) {
                        if ((gameState.data.resources[resource] || 0) < amount) return false;
                    }
                    break;
                    
                case 'morality':
                    const morality = gameState.data.morality || 0;
                    if (requirement.min !== undefined && morality < requirement.min) return false;
                    if (requirement.max !== undefined && morality > requirement.max) return false;
                    break;
                    
                case 'expansions':
                    for (const expansionId of requirement) {
                        if (!gameState.data.unlockedExpansions?.includes(expansionId)) return false;
                    }
                    break;
                    
                case 'projects':
                    for (const projectId of requirement) {
                        if (!(gameState.data.constructedProjects?.[projectId] > 0)) return false;
                    }
                    break;
                    
                case 'reputation':
                    for (const [faction, minRep] of Object.entries(requirement)) {
                        if ((gameState.data.reputation?.[faction] || 0) < minRep) return false;
                    }
                    break;
                    
                case 'timeInGame':
                    const gameTime = Date.now() - (gameState.data.gameStartTime || Date.now());
                    if (gameTime < requirement) return false;
                    break;
            }
        }
        return true;
    }

    // Check context requirements (situational triggers)
    checkContextRequirements(requirements) {
        if (!requirements || Object.keys(requirements).length === 0) {
            return true;
        }

        for (const [type, requirement] of Object.entries(requirements)) {
            switch (type) {
                case 'activeConstruction':
                    // Requires construction to be ongoing
                    if (!this.hasActiveConstruction()) return false;
                    break;
                    
                case 'lowResources':
                    // Triggers when resources are low
                    if (!this.hasLowResources(requirement)) return false;
                    break;
                    
                case 'highProduction':
                    // Triggers when production is high
                    if (!this.hasHighProduction(requirement)) return false;
                    break;
                    
                case 'recentMoralChoice':
                    // Triggers after recent moral choices
                    if (!this.hasRecentMoralChoice(requirement)) return false;
                    break;
                    
                case 'season':
                    // Seasonal events
                    if (!this.isCorrectSeason(requirement)) return false;
                    break;
                    
                case 'conflictingExpansions':
                    // Events that trigger when player has conflicting expansions
                    if (!this.hasConflictingExpansions(requirement)) return false;
                    break;
            }
        }
        return true;
    }

    // Helper methods for context requirements
    hasActiveConstruction() {
        // Check if construction system has active projects
        try {
            if (typeof window !== 'undefined' && window.constructionSystem) {
                const cs = window.constructionSystem;
                const hasActive = (cs.activeProjects && cs.activeProjects.size > 0) || (cs.queue && cs.queue.length > 0);
                return !!hasActive;
            }
        } catch (e) {
            console.warn('RandomEventsSystem: hasActiveConstruction check failed', e);
        }
        return false;
    }

    hasLowResources(threshold) {
        const resources = gameState.data.resources || {};
        for (const [resource, minAmount] of Object.entries(threshold)) {
            if ((resources[resource] || 0) < minAmount) {
                return true;
            }
        }
        return false;
    }

    hasHighProduction(threshold) {
        // Derive simple production rate estimates from resourceSystem.generators
        try {
            if (typeof window !== 'undefined' && window.resourceSystem) {
                const rs = window.resourceSystem;
                const productionRates = {};

                // Use generator baseRate as a conservative estimate
                for (const [resource, gen] of rs.generators) {
                    productionRates[resource] = gen.baseRate || 0;
                }

                for (const [resource, minRate] of Object.entries(threshold)) {
                    if ((productionRates[resource] || 0) >= minRate) {
                        return true;
                    }
                }
            }
        } catch (e) {
            console.warn('RandomEventsSystem: hasHighProduction check failed', e);
        }

        return false;
    }

    hasRecentMoralChoice(timeframe) {
        const recentChoices = gameState.data.moralityHistory?.filter(
            choice => Date.now() - choice.timestamp < timeframe
        ) || [];
        return recentChoices.length > 0;
    }

    isCorrectSeason(seasonName) {
        // Simple season calculation based on date
        const month = new Date().getMonth();
        const seasons = {
            spring: [2, 3, 4],
            summer: [5, 6, 7],
            autumn: [8, 9, 10],
            winter: [11, 0, 1]
        };
        return seasons[seasonName]?.includes(month) || false;
    }

    hasConflictingExpansions(conflictPairs) {
        const unlockedExpansions = gameState.data.unlockedExpansions || [];
        for (const [exp1, exp2] of conflictPairs) {
            if (unlockedExpansions.includes(exp1) && unlockedExpansions.includes(exp2)) {
                return true;
            }
        }
        return false;
    }

    // Update event chances based on morality effects
    updateEventChances(effects) {
        // Event chances are applied in calculateEventChance method
        // This could trigger immediate event checks if dramatic changes occur
        if (effects.eventChances?.crisis && effects.eventChances.crisis > 1.5) {
            // High crisis chance might trigger immediate check
            setTimeout(() => this.checkForEvents(), 1000);
        }
    }

    // Check for contextual events when expansions are unlocked
    checkContextualEvents(data) {
        // Look for events that should trigger when specific expansions are unlocked
        const contextualEvents = Array.from(this.events.values()).filter(event => 
            event.contextRequirements?.expansionUnlocked?.includes(data.expansionId)
        );
        
        contextualEvents.forEach(event => {
            if (this.checkConditions(event.conditions)) {
                // Higher chance to trigger contextual events
                if (Math.random() < 0.6) {
                    setTimeout(() => this.triggerEvent(event.id), 2000);
                }
            }
        });
    }

    // Reset all event cooldowns (special effect)
    resetAllCooldowns() {
        for (const [id, event] of this.events) {
            event.lastTriggered = 0;
        }
    }

    // Get event statistics
    getEventStatistics() {
        const stats = {
            totalEvents: this.eventHistory.length,
            resolvedEvents: this.eventHistory.filter(e => e.resolved).length,
            activeEvents: this.activeEvents.size,
            eventsByCategory: {},
            eventsByRarity: {},
            recentEvents: this.eventHistory.filter(e => Date.now() - e.timestamp < 3600000) // Last hour
        };

        // Count by category and rarity
        this.eventHistory.forEach(eventRecord => {
            const event = this.events.get(eventRecord.id);
            if (event) {
                stats.eventsByCategory[event.category] = (stats.eventsByCategory[event.category] || 0) + 1;
                stats.eventsByRarity[event.rarity] = (stats.eventsByRarity[event.rarity] || 0) + 1;
            }
        });

        return stats;
    }

    // Get available choices for active events
    getActiveChoices() {
        return this.eventHistory
            .filter(e => !e.resolved)
            .map(eventRecord => {
                const event = this.events.get(eventRecord.id);
                return {
                    eventRecord,
                    event,
                    choices: event?.choices || []
                };
            });
    }

    // Force trigger event (for testing/admin)
    forceEvent(eventId) {
        const event = this.events.get(eventId);
        if (event) {
            event.lastTriggered = 0; // Reset cooldown
            return this.triggerEvent(eventId);
        }
        return false;
    }

    // Get events by category
    getEventsByCategory(category) {
        return Array.from(this.events.values()).filter(event => event.category === category);
    }

    // Get weighted event list for preview
    getWeightedEventPreview() {
        const available = this.getAvailableEvents();
        const rarityWeights = {
            common: 10,
            uncommon: 5,
            rare: 2,
            epic: 1,
            legendary: 0.5
        };

        return available.map(event => ({
            ...event,
            weight: rarityWeights[event.rarity] || 1,
            chance: (rarityWeights[event.rarity] || 1) / available.reduce((sum, e) => sum + (rarityWeights[e.rarity] || 1), 0)
        })).sort((a, b) => b.chance - a.chance);
    }

    // Create custom event (for modding/expansion)
    createCustomEvent(id, eventData) {
        if (this.events.has(id)) {
            console.warn(`Event ${id} already exists, overwriting`);
        }
        this.registerEvent(id, eventData);
        return this.events.get(id);
    }

    // Remove event
    removeEvent(eventId) {
        this.events.delete(eventId);
        // Remove from active events if present
        for (const [id, activeEvent] of this.activeEvents) {
            if (activeEvent.event.id === eventId) {
                this.activeEvents.delete(id);
            }
        }
    }

    // Pause/Resume event system
    pauseEvents() {
        this.paused = true;
    }

    resumeEvents() {
        this.paused = false;
    }

    // Check if event system is ready
    isReady() {
        return this.events.size > 0;
    }

    // Save/Load methods
    saveState() {
        return {
            eventHistory: this.eventHistory,
            activeEvents: Array.from(this.activeEvents.entries()),
            lastCheck: this.lastCheck,
            baseEventChance: this.baseEventChance,
            eventStats: Array.from(this.events.entries()).map(([id, event]) => ({
                id,
                lastTriggered: event.lastTriggered
            }))
        };
    }

    loadState(data) {
        if (data.eventHistory) {
            this.eventHistory = data.eventHistory;
        }
        
        if (data.activeEvents) {
            this.activeEvents = new Map(data.activeEvents);
        }
        
        if (data.lastCheck) {
            this.lastCheck = data.lastCheck;
        }
        
        if (data.baseEventChance) {
            this.baseEventChance = data.baseEventChance;
        }
        
        if (data.eventStats) {
            data.eventStats.forEach(stat => {
                const event = this.events.get(stat.id);
                if (event) {
                    event.lastTriggered = stat.lastTriggered;
                }
            });
        }
    }
}

const randomEventsSystem = new RandomEventsSystem();

// Handle event choices from UI
eventBus.on('event-choice-selected', (data) => {
    randomEventsSystem.handleEventChoice(data.eventRecordId, data.choiceIndex);
});

// Expose to global scope
if (typeof window !== 'undefined') {
    window.randomEventsSystem = randomEventsSystem;
}