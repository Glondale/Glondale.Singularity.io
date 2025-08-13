// systems/constructionSystem.js
import { gameState } from '../core/gameState.js';
import { eventBus } from '../core/eventBus.js';
import { resourceManager } from '../managers/resourceManager.js';

class ConstructionSystem {
    constructor() {
        this.projects = new Map();
        this.queue = [];
        this.activeProjects = new Map();
        this.maxConcurrentProjects = 3;
        this.baseConstructionSpeed = 1;
        this.init();
    }

    init() {
        eventBus.on('game-tick', this.update.bind(this));
        eventBus.on('expansion-unlocked', this.checkNewProjects.bind(this));
        eventBus.on('morality-effects-updated', this.updateMoralityEffects.bind(this));
        
        this.registerDefaultProjects();
        setInterval(() => this.processQueue(), 1000);
    }

    // Register a construction project
    registerProject(id, data) {
        this.projects.set(id, {
            id,
            name: data.name,
            description: data.description,
            category: data.category || 'infrastructure',
            cost: data.cost || {},
            buildTime: data.buildTime || 60000, // milliseconds
            prerequisites: data.prerequisites || {},
            effects: data.effects || {},
            repeatable: data.repeatable || false,
            maxBuilt: data.maxBuilt || (data.repeatable ? Infinity : 1),
            timesBuilt: 0,
            unlocked: data.unlocked || false
        });
    }

    // Check if project can be built
    canBuildProject(projectId) {
        const project = this.projects.get(projectId);
        if (!project) return { canBuild: false, reason: 'Project not found' };

        // Check if unlocked
        if (!project.unlocked) {
            return { canBuild: false, reason: 'Project not unlocked' };
        }

        // Check max built limit
        if (project.timesBuilt >= project.maxBuilt) {
            return { canBuild: false, reason: 'Maximum built limit reached' };
        }

        // Check if already in queue or being built
        const inQueue = this.queue.some(item => item.projectId === projectId);
        const inProgress = this.activeProjects.has(projectId) && !project.repeatable;
        
        if (inQueue && !project.repeatable) {
            return { canBuild: false, reason: 'Already in construction queue' };
        }
        
        if (inProgress) {
            return { canBuild: false, reason: 'Already under construction' };
        }

        // Check prerequisites
        const prereqCheck = this.checkPrerequisites(project.prerequisites);
        if (!prereqCheck.met) {
            return { canBuild: false, reason: prereqCheck.reason };
        }

        // Check resource costs
        const costCheck = this.checkCosts(project.cost);
        if (!costCheck.canAfford) {
            return { canBuild: false, reason: costCheck.reason };
        }

        return { canBuild: true };
    }

    // Add project to construction queue
    queueProject(projectId, priority = false) {
        const buildCheck = this.canBuildProject(projectId);
        if (!buildCheck.canBuild) {
            return { success: false, reason: buildCheck.reason };
        }

        const project = this.projects.get(projectId);
        
        // Deduct resources
        this.deductCosts(project.cost);
        
        const queueItem = {
            id: Date.now() + Math.random(),
            projectId,
            startTime: null,
            estimatedCompletion: null,
            progress: 0,
            queuedAt: Date.now()
        };

        if (priority) {
            this.queue.unshift(queueItem);
        } else {
            this.queue.push(queueItem);
        }

        eventBus.emit('project-queued', { projectId, queueItem });
        this.processQueue();
        
        return { success: true, queueItem };
    }

    // Process construction queue
    processQueue() {
        // Start new projects if slots available
        while (this.activeProjects.size < this.maxConcurrentProjects && this.queue.length > 0) {
            const queueItem = this.queue.shift();
            this.startProject(queueItem);
        }
    }

    // Start a project from queue
    startProject(queueItem) {
        const project = this.projects.get(queueItem.projectId);
        if (!project) return;

        const constructionSpeed = this.calculateConstructionSpeed(project);
        const adjustedBuildTime = project.buildTime / constructionSpeed;
        
        queueItem.startTime = Date.now();
        queueItem.estimatedCompletion = Date.now() + adjustedBuildTime;
        queueItem.adjustedBuildTime = adjustedBuildTime;
        
        this.activeProjects.set(queueItem.id, queueItem);
        
        eventBus.emit('project-started', { 
            projectId: queueItem.projectId, 
            queueItem,
            estimatedCompletion: queueItem.estimatedCompletion
        });
    }

    // Update construction progress
    update(deltaTime) {
        const now = Date.now();
        const completedProjects = [];

        for (const [queueId, queueItem] of this.activeProjects) {
            if (queueItem.startTime) {
                const elapsed = now - queueItem.startTime;
                queueItem.progress = Math.min(1, elapsed / queueItem.adjustedBuildTime);
                
                if (queueItem.progress >= 1) {
                    completedProjects.push(queueItem);
                }
            }
        }

        // Complete finished projects
        completedProjects.forEach(queueItem => {
            this.completeProject(queueItem);
        });

        // Emit progress update
        if (this.activeProjects.size > 0) {
            eventBus.emit('construction-progress', {
                activeProjects: Array.from(this.activeProjects.values())
            });
        }
    }

    // Complete a construction project
    completeProject(queueItem) {
        const project = this.projects.get(queueItem.projectId);
        if (!project) return;

        // Remove from active projects
        this.activeProjects.delete(queueItem.id);
        
        // Apply project effects
        this.applyProjectEffects(project);
        
        // Update project stats
        project.timesBuilt++;
        
        // Update game state
        if (!gameState.data.constructedProjects) {
            gameState.data.constructedProjects = {};
        }
        if (!gameState.data.constructedProjects[project.id]) {
            gameState.data.constructedProjects[project.id] = 0;
        }
        gameState.data.constructedProjects[project.id]++;
        
        gameState.saveData();

        eventBus.emit('project-completed', { 
            projectId: project.id, 
            project,
            queueItem 
        });

        // Continue processing queue
        this.processQueue();
    }

    // Apply effects of completed project
    applyProjectEffects(project) {
        for (const [effectType, effectData] of Object.entries(project.effects)) {
            switch (effectType) {
                case 'production':
                    this.applyProductionEffects(effectData);
                    break;
                case 'storage':
                    this.applyStorageEffects(effectData);
                    break;
                case 'unlock':
                    this.applyUnlockEffects(effectData);
                    break;
                case 'speed':
                    this.applySpeedEffects(effectData);
                    break;
                case 'capacity':
                    this.applyCapacityEffects(effectData);
                    break;
            }
        }
    }

    // Apply production effects
    applyProductionEffects(effects) {
        if (!gameState.data.productionModifiers) {
            gameState.data.productionModifiers = {};
        }

        for (const [resource, modifier] of Object.entries(effects)) {
            if (!gameState.data.productionModifiers[resource]) {
                gameState.data.productionModifiers[resource] = 1;
            }
            gameState.data.productionModifiers[resource] *= modifier;
        }
    }

    // Apply storage effects
    applyStorageEffects(effects) {
        for (const [resource, increase] of Object.entries(effects)) {
            resourceManager.increaseStorageCapacity(resource, increase);
        }
    }

    // Apply unlock effects
    applyUnlockEffects(effects) {
        if (effects.expansions) {
            effects.expansions.forEach(expansionId => {
                eventBus.emit('unlock-expansion', { expansionId });
            });
        }
        
        if (effects.projects) {
            effects.projects.forEach(projectId => {
                this.unlockProject(projectId);
            });
        }
    }

    // Apply speed effects
    applySpeedEffects(effects) {
        if (effects.construction) {
            this.baseConstructionSpeed *= effects.construction;
        }
        
        if (effects.production) {
            eventBus.emit('speed-modifier-changed', {
                type: 'production',
                modifier: effects.production
            });
        }
    }

    // Apply capacity effects
    applyCapacityEffects(effects) {
        if (effects.concurrent) {
            this.maxConcurrentProjects += effects.concurrent;
        }
        
        if (effects.queue) {
            // Increase queue capacity if needed
            this.maxQueueSize = (this.maxQueueSize || 10) + effects.queue;
        }
    }

    // Calculate construction speed for a project
    calculateConstructionSpeed(project) {
        let speed = this.baseConstructionSpeed;
        
        // Apply morality effects
        const moralityEffects = gameState.data.moralityEffects;
        if (moralityEffects?.constructionSpeed) {
            speed *= moralityEffects.constructionSpeed;
        }
        
        // Apply resource-based bonuses
        const resourceBonuses = this.calculateResourceBonuses(project);
        speed *= resourceBonuses;
        
        // Apply category-specific bonuses
        const categoryBonus = this.getCategorySpeedBonus(project.category);
        speed *= categoryBonus;
        
        // Apply worker efficiency
        const workerEfficiency = gameState.data.moralityModifiers?.workerEfficiency || 1;
        speed *= workerEfficiency;
        
        return speed;
    }

    // Calculate resource-based speed bonuses
    calculateResourceBonuses(project) {
        let bonus = 1;
        
        // Example: Having excess materials speeds up construction
        if (project.cost.materials) {
            const currentMaterials = gameState.data.resources.materials || 0;
            const requiredMaterials = project.cost.materials;
            
            if (currentMaterials > requiredMaterials * 2) {
                bonus *= 1.2; // 20% speed bonus for abundant materials
            }
        }
        
        return bonus;
    }

    // Get category-specific speed bonuses
    getCategorySpeedBonus(category) {
        const bonuses = {
            infrastructure: 1,
            production: 1.1,
            research: 0.8,
            military: 1.2,
            social: 0.9
        };
        
        return bonuses[category] || 1;
    }

    // Check prerequisites for a project
    checkPrerequisites(prerequisites) {
        if (!prerequisites || Object.keys(prerequisites).length === 0) {
            return { met: true };
        }

        for (const [type, requirement] of Object.entries(prerequisites)) {
            switch (type) {
                case 'projects':
                    for (const projectId of requirement) {
                        const timesBuilt = gameState.data.constructedProjects?.[projectId] || 0;
                        if (timesBuilt === 0) {
                            return { 
                                met: false, 
                                reason: `Requires completion of ${this.projects.get(projectId)?.name || projectId}` 
                            };
                        }
                    }
                    break;
                    
                case 'expansions':
                    for (const expansionId of requirement) {
                        if (!gameState.data.unlockedExpansions?.includes(expansionId)) {
                            return { 
                                met: false, 
                                reason: `Requires ${expansionId} expansion` 
                            };
                        }
                    }
                    break;
                    
                case 'resources':
                    for (const [resource, amount] of Object.entries(requirement)) {
                        if ((gameState.data.resources[resource] || 0) < amount) {
                            return { 
                                met: false, 
                                reason: `Requires ${amount} ${resource}` 
                            };
                        }
                    }
                    break;
                    
                case 'morality':
                    const morality = gameState.data.morality || 0;
                    if (requirement.min !== undefined && morality < requirement.min) {
                        return { 
                            met: false, 
                            reason: `Requires morality of at least ${requirement.min}` 
                        };
                    }
                    if (requirement.max !== undefined && morality > requirement.max) {
                        return { 
                            met: false, 
                            reason: `Requires morality of at most ${requirement.max}` 
                        };
                    }
                    break;
            }
        }
        
        return { met: true };
    }

    // Check if player can afford project costs
    checkCosts(costs) {
        const missingResources = [];
        
        for (const [resource, amount] of Object.entries(costs)) {
            const available = gameState.data.resources[resource] || 0;
            if (available < amount) {
                missingResources.push(`${amount - available} ${resource}`);
            }
        }
        
        if (missingResources.length > 0) {
            return { 
                canAfford: false, 
                reason: `Need ${missingResources.join(', ')}` 
            };
        }
        
        return { canAfford: true };
    }

    // Deduct costs from resources
    deductCosts(costs) {
        for (const [resource, amount] of Object.entries(costs)) {
            if (gameState.data.resources[resource]) {
                gameState.data.resources[resource] -= amount;
            }
        }
        gameState.saveData();
    }

    // Cancel a project in queue
    cancelProject(queueId) {
        // Find in queue
        const queueIndex = this.queue.findIndex(item => item.id === queueId);
        if (queueIndex !== -1) {
            const queueItem = this.queue.splice(queueIndex, 1)[0];
            this.refundProject(queueItem.projectId);
            eventBus.emit('project-cancelled', { queueItem });
            return true;
        }
        
        // Find in active projects
        const activeProject = this.activeProjects.get(queueId);
        if (activeProject) {
            this.activeProjects.delete(queueId);
            this.refundProject(activeProject.projectId, activeProject.progress);
            eventBus.emit('project-cancelled', { queueItem: activeProject });
            this.processQueue(); // Start next project
            return true;
        }
        
        return false;
    }

    // Refund project costs (partial for in-progress projects)
    refundProject(projectId, progress = 0) {
        const project = this.projects.get(projectId);
        if (!project) return;
        
        const refundRate = 1 - (progress * 0.5); // Lose up to 50% of costs based on progress
        
        for (const [resource, amount] of Object.entries(project.cost)) {
            const refundAmount = Math.floor(amount * refundRate);
            if (!gameState.data.resources[resource]) {
                gameState.data.resources[resource] = 0;
            }
            gameState.data.resources[resource] += refundAmount;
        }
        
        gameState.saveData();
    }

    // Unlock a project
    unlockProject(projectId) {
        const project = this.projects.get(projectId);
        if (project) {
            project.unlocked = true;
            eventBus.emit('project-unlocked', { projectId, project });
        }
    }

    // Get construction queue status
    getQueueStatus() {
        return {
            queue: this.queue.map(item => ({
                ...item,
                project: this.projects.get(item.projectId)
            })),
            activeProjects: Array.from(this.activeProjects.values()).map(item => ({
                ...item,
                project: this.projects.get(item.projectId)
            })),
            maxConcurrent: this.maxConcurrentProjects,
            baseSpeed: this.baseConstructionSpeed
        };
    }

    // Get available projects
    getAvailableProjects() {
        return Array.from(this.projects.values())
            .filter(project => project.unlocked)
            .map(project => ({
                ...project,
                canBuild: this.canBuildProject(project.id),
                constructionSpeed: this.calculateConstructionSpeed(project),
                estimatedTime: project.buildTime / this.calculateConstructionSpeed(project)
            }));
    }

    // Get project by category
    getProjectsByCategory() {
        const projects = this.getAvailableProjects();
        const categories = {};
        
        projects.forEach(project => {
            if (!categories[project.category]) {
                categories[project.category] = [];
            }
            categories[project.category].push(project);
        });
        
        return categories;
    }

    // Rush a project (pay extra to speed up)
    rushProject(queueId, rushMultiplier = 2) {
        const activeProject = this.activeProjects.get(queueId);
        if (!activeProject) return { success: false, reason: 'Project not found' };
        
        const project = this.projects.get(activeProject.projectId);
        const rushCost = this.calculateRushCost(project, rushMultiplier);
        
        // Check if can afford rush cost
        const costCheck = this.checkCosts(rushCost);
        if (!costCheck.canAfford) {
            return { success: false, reason: costCheck.reason };
        }
        
        // Deduct rush cost
        this.deductCosts(rushCost);
        
        // Apply rush effect
        const remainingTime = activeProject.adjustedBuildTime - (Date.now() - activeProject.startTime);
        const newRemainingTime = remainingTime / rushMultiplier;
        
        activeProject.adjustedBuildTime -= (remainingTime - newRemainingTime);
        activeProject.estimatedCompletion = Date.now() + newRemainingTime;
        
        eventBus.emit('project-rushed', { 
            queueId, 
            rushMultiplier, 
            rushCost,
            newCompletion: activeProject.estimatedCompletion 
        });
        
        return { success: true };
    }

    // Calculate rush cost
    calculateRushCost(project, multiplier) {
        const rushCost = {};
        
        for (const [resource, amount] of Object.entries(project.cost)) {
            rushCost[resource] = Math.floor(amount * (multiplier - 1) * 0.5);
        }
        
        return rushCost;
    }

    // Update morality effects on construction
    updateMoralityEffects(effects) {
        // Construction speed is handled in calculateConstructionSpeed
        // This could trigger UI updates or recalculate project times
        eventBus.emit('construction-speed-changed', {
            newSpeed: this.baseConstructionSpeed * (effects.constructionSpeed || 1)
        });
    }

    // Check for newly unlocked projects
    checkNewProjects(data) {
        // This could unlock projects based on expansions
        // Implementation depends on specific project unlock conditions
    }

    // Register default construction projects
    registerDefaultProjects() {
        const defaultProjects = {
            warehouse: {
                name: "Warehouse",
                description: "Increases storage capacity for all resources",
                category: "infrastructure",
                cost: { money: 1000, materials: 500 },
                buildTime: 30000,
                effects: {
                    storage: { 
                        money: 10000,
                        materials: 1000,
                        energy: 500
                    }
                },
                repeatable: true,
                unlocked: true
            },
            
            factory: {
                name: "Manufacturing Plant",
                description: "Boosts production of all resources",
                category: "production",
                cost: { money: 5000, materials: 2000, energy: 1000 },
                buildTime: 60000,
                effects: {
                    production: { 
                        materials: 1.5,
                        money: 1.2
                    }
                },
                repeatable: true,
                unlocked: true
            },
            
            powerPlant: {
                name: "Power Plant",
                description: "Generates energy for your operations",
                category: "infrastructure",
                cost: { money: 8000, materials: 3000 },
                buildTime: 90000,
                effects: {
                    production: { energy: 2.0 }
                },
                repeatable: true,
                unlocked: true
            },
            
            researchLab: {
                name: "Research Laboratory",
                description: "Unlocks new technologies and expansions",
                category: "research",
                cost: { money: 15000, materials: 5000, energy: 2000 },
                buildTime: 120000,
                effects: {
                    unlock: { 
                        expansions: ['advanced_tech'],
                        projects: ['supercomputer', 'nanoFactory']
                    }
                },
                maxBuilt: 1,
                unlocked: true
            },
            
            trainingCenter: {
                name: "Worker Training Center",
                description: "Improves worker efficiency across all operations",
                category: "social",
                cost: { money: 3000, materials: 1000 },
                buildTime: 45000,
                effects: {
                    speed: { production: 1.3 }
                },
                maxBuilt: 3,
                unlocked: true
            },
            
            securityComplex: {
                name: "Security Complex",
                description: "Protects against negative events and enables authoritarian control",
                category: "military",
                cost: { money: 12000, materials: 4000, energy: 1500 },
                buildTime: 75000,
                prerequisites: {
                    morality: { max: 20 }
                },
                effects: {
                    unlock: { expansions: ['authoritarian_control'] }
                },
                maxBuilt: 1,
                unlocked: false
            },
            
            charitableFoundation: {
                name: "Charitable Foundation",
                description: "Improves public relations and unlocks humanitarian options",
                category: "social",
                cost: { money: 10000, materials: 2000 },
                buildTime: 60000,
                prerequisites: {
                    morality: { min: 30 }
                },
                effects: {
                    unlock: { expansions: ['humanitarian_aid'] }
                },
                maxBuilt: 1,
                unlocked: false
            },
            
            supercomputer: {
                name: "Quantum Supercomputer",
                description: "Dramatically accelerates all operations",
                category: "research",
                cost: { money: 50000, materials: 20000, energy: 10000 },
                buildTime: 300000,
                prerequisites: {
                    projects: ['researchLab'],
                    expansions: ['advanced_tech']
                },
                effects: {
                    speed: { 
                        construction: 2.0,
                        production: 1.8
                    }
                },
                maxBuilt: 1,
                unlocked: false
            },
            
            nanoFactory: {
                name: "Nanoscale Factory",
                description: "Revolutionary production capabilities",
                category: "production",
                cost: { money: 75000, materials: 30000, energy: 15000 },
                buildTime: 450000,
                prerequisites: {
                    projects: ['researchLab'],
                    expansions: ['advanced_tech']
                },
                effects: {
                    production: {
                        materials: 5.0,
                        money: 3.0,
                        energy: 2.0
                    }
                },
                maxBuilt: 1,
                unlocked: false
            }
        };

        Object.entries(defaultProjects).forEach(([id, project]) => {
            this.registerProject(id, project);
        });
    }

    // Save/Load methods
    saveState() {
        return {
            queue: this.queue,
            activeProjects: Array.from(this.activeProjects.entries()),
            maxConcurrentProjects: this.maxConcurrentProjects,
            baseConstructionSpeed: this.baseConstructionSpeed,
            projectStats: Array.from(this.projects.entries()).map(([id, project]) => ({
                id,
                timesBuilt: project.timesBuilt,
                unlocked: project.unlocked
            }))
        };
    }

    loadState(data) {
        if (data.queue) {
            this.queue = data.queue;
        }
        
        if (data.activeProjects) {
            this.activeProjects = new Map(data.activeProjects);
        }
        
        if (data.maxConcurrentProjects) {
            this.maxConcurrentProjects = data.maxConcurrentProjects;
        }
        
        if (data.baseConstructionSpeed) {
            this.baseConstructionSpeed = data.baseConstructionSpeed;
        }
        
        if (data.projectStats) {
            data.projectStats.forEach(stat => {
                const project = this.projects.get(stat.id);
                if (project) {
                    project.timesBuilt = stat.timesBuilt;
                    project.unlocked = stat.unlocked;
                }
            });
        }
    }
}

const constructionSystem = new ConstructionSystem();
export { constructionSystem };