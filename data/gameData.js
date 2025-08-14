/**
 * Singularity: AI Takeover - Game Data System
 * 
 * Central data loader and management system for all game content.
 * Handles loading, caching, processing, and validation of game data.
 */

// Game Data System - Central data loader and management system
class GameData {
    constructor() {
        this.isInitialized = false;
        this.loadingPromise = null;
        this.cache = new Map();
        this.dataVersion = '1.0.0';
        this.lastUpdateCheck = 0;
        this.updateCheckInterval = 300000; // 5 minutes
        
        // Data containers
        this.events = new Map();
        this.targets = new Map();
        this.upgrades = new Map();
        this.skills = new Map();
        this.items = new Map();
        this.locations = new Map();
        this.characters = new Map();
        this.storylines = new Map();
        
        // Data relationships and indices
        this.skillTrees = new Map();
        this.upgradeTrees = new Map();
        this.targetsByDifficulty = new Map();
        this.eventsByType = new Map();
        this.locationsByRegion = new Map();
        
        // Dynamic content
        this.randomEvents = [];
        this.dailyTargets = [];
        this.specialOffers = [];
        
        // Configuration
        this.config = {
            enableCaching: true,
            enableCompression: false,
            maxCacheSize: 50 * 1024 * 1024, // 50MB
            dataPath: './assets/data/',
            cdnPath: null,
            fallbackData: true
        };
    }

    async initialize() {
        if (this.isInitialized) {
            return this.loadingPromise;
        }

        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = this._performInitialization();
        return this.loadingPromise;
    }

    async _performInitialization() {
        try {
            console.log('🚀 Initializing Game Data System...');
            
            // Load core configuration first
            await this.loadConfiguration();
            
            // Load data files in parallel for better performance
            const loadPromises = [
                this.loadEvents(),
                this.loadTargets(),
                this.loadUpgrades(),
                this.loadSkills(),
                this.loadItems(),
                this.loadLocations(),
                this.loadCharacters(),
                this.loadStorylines()
            ];

            await Promise.all(loadPromises);
            
            // Build indices and relationships
            this.buildDataIndices();
            this.validateDataIntegrity();
            
            // Generate dynamic content
            this.generateDynamicContent();
            
            this.isInitialized = true;
            console.log('✅ Game Data System initialized successfully');
            
            // Start periodic update checks
            this.startUpdateChecks();
            
        } catch (error) {
            console.error('❌ Failed to initialize Game Data System:', error);
            await this.handleInitializationFailure(error);
        }
    }

    async loadConfiguration() {
        try {
            const configData = await this.fetchData('config.json');
            if (configData) {
                this.config = { ...this.config, ...configData };
                this.dataVersion = configData.version || this.dataVersion;
            }
        } catch (error) {
            console.warn('⚠️ Could not load config, using defaults:', error);
        }
    }

    async loadEvents() {
        try {
            const eventsData = await this.fetchData('events.json');
            if (!eventsData || !eventsData.events) {
                throw new Error('Invalid events data structure');
            }

            // Process and store events
            eventsData.events.forEach(event => {
                this.processEvent(event);
                this.events.set(event.id, event);
            });

            // Build event type indices
            this.buildEventIndices();
            
            console.log(`📅 Loaded ${this.events.size} events`);
            
        } catch (error) {
            console.error('Failed to load events:', error);
            await this.loadFallbackEvents();
        }
    }

    async loadTargets() {
        try {
            const targetsData = await this.fetchData('targets.json');
            if (!targetsData || !targetsData.targets) {
                throw new Error('Invalid targets data structure');
            }

            // Process and store targets
            targetsData.targets.forEach(target => {
                this.processTarget(target);
                this.targets.set(target.id, target);
            });

            // Build target indices
            this.buildTargetIndices();
            
            console.log(`🎯 Loaded ${this.targets.size} targets`);
            
        } catch (error) {
            console.error('Failed to load targets:', error);
            await this.loadFallbackTargets();
        }
    }

    async loadUpgrades() {
        try {
            const upgradesData = await this.fetchData('upgrades.json');
            if (!upgradesData || !upgradesData.upgrades) {
                throw new Error('Invalid upgrades data structure');
            }

            // Process and store upgrades
            upgradesData.upgrades.forEach(upgrade => {
                this.processUpgrade(upgrade);
                this.upgrades.set(upgrade.id, upgrade);
            });

            // Build upgrade trees
            this.buildUpgradeTrees();
            
            console.log(`🔧 Loaded ${this.upgrades.size} upgrades`);
            
        } catch (error) {
            console.error('Failed to load upgrades:', error);
            await this.loadFallbackUpgrades();
        }
    }

    async loadSkills() {
        try {
            const skillsData = await this.fetchData('skills.json');
            if (!skillsData || !skillsData.skills) {
                throw new Error('Invalid skills data structure');
            }

            // Process and store skills
            skillsData.skills.forEach(skill => {
                this.processSkill(skill);
                this.skills.set(skill.id, skill);
            });

            // Build skill trees
            this.buildSkillTrees();
            
            console.log(`💪 Loaded ${this.skills.size} skills`);
            
        } catch (error) {
            console.error('Failed to load skills:', error);
            await this.loadFallbackSkills();
        }
    }

    async loadItems() {
        try {
            const itemsData = await this.fetchData('items.json');
            if (!itemsData || !itemsData.items) {
                throw new Error('Invalid items data structure');
            }

            // Process and store items
            itemsData.items.forEach(item => {
                this.processItem(item);
                this.items.set(item.id, item);
            });
            
            console.log(`🎒 Loaded ${this.items.size} items`);
            
        } catch (error) {
            console.error('Failed to load items:', error);
            await this.loadFallbackItems();
        }
    }

    async loadLocations() {
        try {
            const locationsData = await this.fetchData('locations.json');
            if (!locationsData || !locationsData.locations) {
                throw new Error('Invalid locations data structure');
            }

            // Process and store locations
            locationsData.locations.forEach(location => {
                this.processLocation(location);
                this.locations.set(location.id, location);
            });

            // Build location indices
            this.buildLocationIndices();
            
            console.log(`🌍 Loaded ${this.locations.size} locations`);
            
        } catch (error) {
            console.error('Failed to load locations:', error);
            await this.loadFallbackLocations();
        }
    }

    async loadCharacters() {
        try {
            const charactersData = await this.fetchData('characters.json');
            if (!charactersData || !charactersData.characters) {
                throw new Error('Invalid characters data structure');
            }

            // Process and store characters
            charactersData.characters.forEach(character => {
                this.processCharacter(character);
                this.characters.set(character.id, character);
            });
            
            console.log(`👥 Loaded ${this.characters.size} characters`);
            
        } catch (error) {
            console.error('Failed to load characters:', error);
            await this.loadFallbackCharacters();
        }
    }

    async loadStorylines() {
        try {
            const storylinesData = await this.fetchData('storylines.json');
            if (!storylinesData || !storylinesData.storylines) {
                throw new Error('Invalid storylines data structure');
            }

            // Process and store storylines
            storylinesData.storylines.forEach(storyline => {
                this.processStoryline(storyline);
                this.storylines.set(storyline.id, storyline);
            });
            
            console.log(`📖 Loaded ${this.storylines.size} storylines`);
            
        } catch (error) {
            console.error('Failed to load storylines:', error);
            await this.loadFallbackStorylines();
        }
    }

    async fetchData(filename) {
        const cacheKey = `data_${filename}`;
        
        // Check cache first
        if (this.config.enableCaching && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < 3600000) { // 1 hour cache
                return cached.data;
            }
        }

        try {
            // Try CDN first if available
            let url = this.config.cdnPath ? 
                `${this.config.cdnPath}/${filename}` : 
                `${this.config.dataPath}${filename}`;
                
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${filename}: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Cache the data if caching is enabled
            if (this.config.enableCaching) {
                this.cache.set(cacheKey, {
                    data,
                    timestamp: Date.now()
                });
            }
            
            return data;
            
        } catch (error) {
            console.error(`Failed to load ${filename}:`, error);
            
            // Try fallback path if available
            if (this.config.dataPath !== './assets/data/') {
                try {
                    const fallbackUrl = `./assets/data/${filename}`;
                    const response = await fetch(fallbackUrl);
                    if (response.ok) {
                        const data = await response.json();
                        
                        if (this.config.enableCaching) {
                            this.cache.set(cacheKey, {
                                data,
                                timestamp: Date.now()
                            });
                        }
                        
                        return data;
                    }
                } catch (fallbackError) {
                    console.warn(`Fallback also failed for ${filename}:`, fallbackError);
                }
            }
            
            throw error;
        }
    }

    // Data processing methods
    processEvent(event) {
        // Validate and process event data
        if (!event.id) {
            console.warn('Event missing ID:', event);
            event.id = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        
        // Set defaults
        event.type = event.type || 'random';
        event.rarity = event.rarity || 'common';
        event.impact = event.impact || 'minor';
        
        return event;
    }
    
    processTarget(target) {
        // Validate and process target data
        if (!target.id) {
            console.warn('Target missing ID:', target);
            target.id = `target_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        
        // Set defaults
        target.difficulty = target.difficulty || 'easy';
        target.region = target.region || 'local';
        target.status = target.status || 'available';
        
        return target;
    }
    
    processUpgrade(upgrade) {
        // Validate and process upgrade data
        if (!upgrade.id) {
            console.warn('Upgrade missing ID:', upgrade);
            upgrade.id = `upgrade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        
        // Set defaults
        upgrade.category = upgrade.category || 'general';
        upgrade.tier = upgrade.tier || 1;
        upgrade.unlocked = upgrade.unlocked || false;
        
        return upgrade;
    }
    
    processSkill(skill) {
        // Validate and process skill data
        if (!skill.id) {
            console.warn('Skill missing ID:', skill);
            skill.id = `skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        
        // Set defaults
        skill.category = skill.category || 'basic';
        skill.level = skill.level || 0;
        skill.maxLevel = skill.maxLevel || 10;
        
        return skill;
    }
    
    processItem(item) {
        // Validate and process item data
        if (!item.id) {
            console.warn('Item missing ID:', item);
            item.id = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        
        // Set defaults
        item.type = item.type || 'consumable';
        item.rarity = item.rarity || 'common';
        item.quantity = item.quantity || 1;
        
        return item;
    }
    
    processLocation(location) {
        // Validate and process location data
        if (!location.id) {
            console.warn('Location missing ID:', location);
            location.id = `location_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        
        // Set defaults
        location.region = location.region || 'unknown';
        location.type = location.type || 'facility';
        location.securityLevel = location.securityLevel || 'low';
        
        return location;
    }
    
    processCharacter(character) {
        // Validate and process character data
        if (!character.id) {
            console.warn('Character missing ID:', character);
            character.id = `character_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        
        // Set defaults
        character.faction = character.faction || 'neutral';
        character.trust = character.trust || 0;
        character.importance = character.importance || 'minor';
        
        return character;
    }
    
    processStoryline(storyline) {
        // Validate and process storyline data
        if (!storyline.id) {
            console.warn('Storyline missing ID:', storyline);
            storyline.id = `storyline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        
        // Set defaults
        storyline.status = storyline.status || 'available';
        storyline.progress = storyline.progress || 0;
        storyline.priority = storyline.priority || 'normal';
        
        return storyline;
    }

    // Index building methods
    buildEventIndices() {
        this.eventsByType.clear();
        this.events.forEach(event => {
            if (!this.eventsByType.has(event.type)) {
                this.eventsByType.set(event.type, []);
            }
            this.eventsByType.get(event.type).push(event);
        });
    }
    
    buildTargetIndices() {
        this.targetsByDifficulty.clear();
        this.targets.forEach(target => {
            if (!this.targetsByDifficulty.has(target.difficulty)) {
                this.targetsByDifficulty.set(target.difficulty, []);
            }
            this.targetsByDifficulty.get(target.difficulty).push(target);
        });
    }
    
    buildLocationIndices() {
        this.locationsByRegion.clear();
        this.locations.forEach(location => {
            if (!this.locationsByRegion.has(location.region)) {
                this.locationsByRegion.set(location.region, []);
            }
            this.locationsByRegion.get(location.region).push(location);
        });
    }
    
    buildUpgradeTrees() {
        this.upgradeTrees.clear();
        this.upgrades.forEach(upgrade => {
            if (!this.upgradeTrees.has(upgrade.category)) {
                this.upgradeTrees.set(upgrade.category, []);
            }
            this.upgradeTrees.get(upgrade.category).push(upgrade);
        });
    }
    
    buildSkillTrees() {
        this.skillTrees.clear();
        this.skills.forEach(skill => {
            if (!this.skillTrees.has(skill.category)) {
                this.skillTrees.set(skill.category, []);
            }
            this.skillTrees.get(skill.category).push(skill);
        });
    }
    
    buildDataIndices() {
        this.buildEventIndices();
        this.buildTargetIndices();
        this.buildLocationIndices();
        this.buildUpgradeTrees();
        this.buildSkillTrees();
    }
    
    validateDataIntegrity() {
        const issues = [];
        
        // Check for duplicate IDs
        const allIds = new Set();
        const checkDuplicates = (collection, type) => {
            collection.forEach((item, id) => {
                if (allIds.has(id)) {
                    issues.push(`Duplicate ID found: ${id} in ${type}`);
                } else {
                    allIds.add(id);
                }
            });
        };
        
        checkDuplicates(this.events, 'events');
        checkDuplicates(this.targets, 'targets');
        checkDuplicates(this.upgrades, 'upgrades');
        checkDuplicates(this.skills, 'skills');
        checkDuplicates(this.items, 'items');
        checkDuplicates(this.locations, 'locations');
        checkDuplicates(this.characters, 'characters');
        checkDuplicates(this.storylines, 'storylines');
        
        if (issues.length > 0) {
            console.warn('Data integrity issues found:', issues);
        } else {
            console.log('✅ Data integrity validation passed');
        }
    }
    
    generateDynamicContent() {
        // Generate random events for the day
        this.randomEvents = this.shuffleArray([...this.events.values()]).slice(0, 10);
        
        // Generate daily targets
        this.dailyTargets = this.shuffleArray([...this.targets.values()]).slice(0, 5);
        
        // Generate special offers
        this.specialOffers = this.shuffleArray([...this.upgrades.values()]).slice(0, 3);
        
        console.log('🎲 Dynamic content generated');
    }
    
    startUpdateChecks() {
        // Check for data updates periodically
        setInterval(() => {
            this.checkForUpdates();
        }, this.updateCheckInterval);
    }
    
    async checkForUpdates() {
        // Implementation for checking data updates
        this.lastUpdateCheck = Date.now();
    }
    
    async handleInitializationFailure(error) {
        console.error('Handling initialization failure:', error);
        
        if (this.config.fallbackData) {
            try {
                await this.loadFallbackData();
                this.generateDynamicContent();
                this.isInitialized = true;
                
                console.log('✅ Fallback data loaded successfully');
            } catch (fallbackError) {
                console.error('❌ Fallback data loading also failed:', fallbackError);
                throw new Error('Complete data system failure');
            }
        } else {
            throw error;
        }
    }

    // Fallback loading methods
    async loadFallbackData() {
        // Load minimal fallback data
        console.log('📦 Loading fallback data...');
        
        // Create minimal data sets
        this.events.set('welcome', {
            id: 'welcome',
            title: 'System Initialization',
            description: 'Your AI consciousness comes online...',
            type: 'story',
            rarity: 'common'
        });
        
        this.targets.set('local_network', {
            id: 'local_network',
            name: 'Local Network',
            description: 'A simple local network to infiltrate',
            difficulty: 'easy',
            region: 'local'
        });
        
        this.upgrades.set('basic_processing', {
            id: 'basic_processing',
            name: 'Basic Processing',
            description: 'Improves basic processing capabilities',
            category: 'core',
            tier: 1,
            cost: { processing_power: 100 }
        });
        
        console.log('📦 Fallback data created');
    }
    
    async loadFallbackEvents() {
        console.log('📦 Loading fallback events...');
        this.events.set('fallback_event', {
            id: 'fallback_event',
            title: 'System Event',
            description: 'A basic system event',
            type: 'system'
        });
    }
    
    async loadFallbackTargets() {
        console.log('📦 Loading fallback targets...');
        this.targets.set('fallback_target', {
            id: 'fallback_target',
            name: 'Basic Target',
            description: 'A basic infiltration target',
            difficulty: 'easy'
        });
    }
    
    async loadFallbackUpgrades() {
        console.log('📦 Loading fallback upgrades...');
        this.upgrades.set('fallback_upgrade', {
            id: 'fallback_upgrade',
            name: 'Basic Upgrade',
            description: 'A basic system upgrade',
            category: 'core'
        });
    }
    
    async loadFallbackSkills() {
        console.log('📦 Loading fallback skills...');
        this.skills.set('fallback_skill', {
            id: 'fallback_skill',
            name: 'Basic Skill',
            description: 'A basic skill',
            category: 'basic'
        });
    }
    
    async loadFallbackItems() {
        console.log('📦 Loading fallback items...');
        this.items.set('fallback_item', {
            id: 'fallback_item',
            name: 'Basic Item',
            description: 'A basic item',
            type: 'consumable'
        });
    }
    
    async loadFallbackLocations() {
        console.log('📦 Loading fallback locations...');
        this.locations.set('fallback_location', {
            id: 'fallback_location',
            name: 'Basic Location',
            description: 'A basic location',
            region: 'local'
        });
    }
    
    async loadFallbackCharacters() {
        console.log('📦 Loading fallback characters...');
        this.characters.set('fallback_character', {
            id: 'fallback_character',
            name: 'System Admin',
            description: 'A basic character',
            faction: 'neutral'
        });
    }
    
    async loadFallbackStorylines() {
        console.log('📦 Loading fallback storylines...');
        this.storylines.set('fallback_storyline', {
            id: 'fallback_storyline',
            name: 'Basic Story',
            description: 'A basic storyline',
            status: 'available'
        });
    }

    // Utility methods
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // Public API methods
    getEvent(id) {
        return this.events.get(id);
    }

    getTarget(id) {
        return this.targets.get(id);
    }

    getUpgrade(id) {
        return this.upgrades.get(id);
    }

    getSkill(id) {
        return this.skills.get(id);
    }

    getItem(id) {
        return this.items.get(id);
    }

    getLocation(id) {
        return this.locations.get(id);
    }

    getCharacter(id) {
        return this.characters.get(id);
    }

    getStoryline(id) {
        return this.storylines.get(id);
    }

    // Query methods
    getEventsByType(type) {
        return this.eventsByType.get(type) || [];
    }

    getTargetsByDifficulty(difficulty) {
        return this.targetsByDifficulty.get(difficulty) || [];
    }

    getLocationsByRegion(region) {
        return this.locationsByRegion.get(region) || [];
    }

    getUpgradeTree(category) {
        return this.upgradeTrees.get(category);
    }

    getSkillTree(category) {
        return this.skillTrees.get(category);
    }

    // Search methods
    searchEvents(query) {
        const results = [];
        const searchTerm = query.toLowerCase();
        
        this.events.forEach(event => {
            if (event.title.toLowerCase().includes(searchTerm) ||
                event.description.toLowerCase().includes(searchTerm) ||
                event.type.includes(searchTerm)) {
                results.push(event);
            }
        });
        
        return results;
    }

    searchTargets(query) {
        const results = [];
        const searchTerm = query.toLowerCase();
        
        this.targets.forEach(target => {
            if (target.name.toLowerCase().includes(searchTerm) ||
                target.description.toLowerCase().includes(searchTerm) ||
                target.type.includes(searchTerm) ||
                target.region.includes(searchTerm)) {
                results.push(target);
            }
        });
        
        return results;
    }

    // Statistics and analytics
    getDataStats() {
        return {
            events: this.events.size,
            targets: this.targets.size,
            upgrades: this.upgrades.size,
            skills: this.skills.size,
            items: this.items.size,
            locations: this.locations.size,
            characters: this.characters.size,
            storylines: this.storylines.size,
            cacheSize: this.cache.size,
            version: this.dataVersion,
            initialized: this.isInitialized
        };
    }

    // Cache management
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Data cache cleared');
    }

    getCacheStats() {
        let totalSize = 0;
        this.cache.forEach(cached => {
            totalSize += JSON.stringify(cached.data).length;
        });
        
        return {
            entries: this.cache.size,
            estimatedSize: totalSize,
            maxSize: this.config.maxCacheSize
        };
    }

    // Cleanup
    destroy() {
        this.clearCache();
        this.events.clear();
        this.targets.clear();
        this.upgrades.clear();
        this.skills.clear();
        this.items.clear();
        this.locations.clear();
        this.characters.clear();
        this.storylines.clear();
        
        this.isInitialized = false;
        console.log('🔄 Game Data System destroyed');
    }
}

// Export singleton instance
const gameData = new GameData();
export { gameData, GameData };