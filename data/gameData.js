async loadFallbackStorylines() {
        if (!this.config.fallbackData) return;
        
        console.log('📖 Loading fallback storylines...');
        const fallbackStorylines = this.createFallbackStorylines();
        
        fallbackStorylines.forEach(storyline => {
            this.processStoryline(storyline);
            this.storylines.set(storyline.id, storyline);
        });
    }

    // Fallback data creation methods
    createFallbackEvents() {
        return [
            {
                id: 'welcome_event',
                title: 'System Initialization',
                description: 'Welcome to the cyber infiltration network. Your first mission awaits.',
                type: 'tutorial',
                icon: '🚀',
                choices: [
                    {
                        text: 'Begin operations',
                        consequences: { funds: 100, reputation: 1 }
                    }
                ]
            },
            {
                id: 'random_opportunity',
                title: 'Data Breach Alert',
                description: 'A security vulnerability has been detected. Quick action could yield rewards.',
                type: 'random',
                icon: '⚡',
                choices: [
                    {
                        text: 'Exploit immediately',
                        consequences: { funds: 500, heatLevel: 2 }
                    },
                    {
                        text: 'Gather more intelligence first',
                        consequences: { reputation: 2, experience: 10 }
                    },
                    {
                        text: 'Report to authorities',
                        consequences: { reputation: 5, funds: -100 }
                    }
                ]
            }
        ];
    }

    createFallbackTargets() {
        return [
            {
                id: 'small_corp',
                name: 'TechStart Inc.',
                description: 'A small technology startup with minimal security measures.',
                difficulty: 'easy',
                type: 'corporate',
                region: 'north_america',
                requirements: { hackingSkill: 1 },
                rewards: { funds: 1000, reputation: 2, experience: 15 },
                risks: { heatIncrease: 1, detectionChance: 0.1 }
            },
            {
                id: 'medium_bank',
                name: 'Regional Credit Union',
                description: 'A mid-sized financial institution with standard security protocols.',
                difficulty: 'normal',
                type: 'financial',
                region: 'north_america',
                requirements: { hackingSkill: 3, socialSkill: 2 },
                rewards: { funds: 5000, reputation: 5, experience: 30 },
                risks: { heatIncrease: 3, detectionChance: 0.25 }
            },
            {
                id: 'crypto_exchange',
                name: 'CryptoVault Exchange',
                description: 'A cryptocurrency exchange with advanced security measures.',
                difficulty: 'hard',
                type: 'crypto',
                region: 'global',
                requirements: { hackingSkill: 7, cryptographySkill: 5 },
                rewards: { funds: 25000, reputation: 15, experience: 75 },
                risks: { heatIncrease: 5, detectionChance: 0.4 }
            }
        ];
    }

    createFallbackUpgrades() {
        return [
            {
                id: 'basic_encryption',
                name: 'Basic Encryption',
                description: 'Improves data security and reduces detection risk.',
                category: 'security',
                tier: 1,
                cost: { funds: 500 },
                effects: { detectionReduction: 0.1 },
                requirements: { level: 2 },
                prerequisites: []
            },
            {
                id: 'advanced_proxy',
                name: 'Advanced Proxy Network',
                description: 'Routes connections through multiple proxies for better anonymity.',
                category: 'security',
                tier: 2,
                cost: { funds: 2000, reputation: 5 },
                effects: { detectionReduction: 0.2, heatReduction: 0.15 },
                requirements: { level: 5 },
                prerequisites: ['basic_encryption']
            },
            {
                id: 'auto_hacking_tools',
                name: 'Automated Hacking Suite',
                description: 'Automated tools that increase hacking efficiency.',
                category: 'offensive',
                tier: 1,
                cost: { funds: 1000 },
                effects: { hackingBonus: 1, timeReduction: 0.1 },
                requirements: { hackingSkill: 3 },
                prerequisites: []
            }
        ];
    }

    createFallbackSkills() {
        return [
            {
                id: 'hacking',
                name: 'Hacking',
                description: 'Ability to break into computer systems and networks.',
                category: 'technical',
                maxLevel: 100,
                baseXP: 100,
                xpMultiplier: 1.5,
                effects: {
                    successChance: 0.02, // +2% per level
                    criticalChance: 0.01 // +1% per level
                }
            },
            {
                id: 'social_engineering',
                name: 'Social Engineering',
                description: 'Manipulation and persuasion techniques to gain information.',
                category: 'social',
                maxLevel: 100,
                baseXP: 120,
                xpMultiplier: 1.4,
                effects: {
                    persuasionBonus: 0.03,
                    informationGain: 0.01
                }
            },
            {
                id: 'cryptography',
                name: 'Cryptography',
                description: 'Understanding of encryption and decryption techniques.',
                category: 'technical',
                maxLevel: 100,
                baseXP: 150,
                xpMultiplier: 1.6,
                effects: {
                    encryptionStrength: 0.02,
                    decryptionSpeed: 0.015
                }
            },
            {
                id: 'stealth',
                name: 'Digital Stealth',
                description: 'Ability to remain undetected during operations.',
                category: 'defensive',
                maxLevel: 100,
                baseXP: 80,
                xpMultiplier: 1.3,
                effects: {
                    detectionReduction: 0.015,
                    heatReduction: 0.01
                }
            }
        ];
    }

    createFallbackItems() {
        return [
            {
                id: 'encryption_key',
                name: 'Encryption Key',
                description: 'A one-time use encryption key for secure communications.',
                type: 'consumable',
                rarity: 'common',
                value: 50,
                effects: { securityBonus: 10 }
            },
            {
                id: 'vpn_token',
                name: 'VPN Access Token',
                description: 'Provides temporary access to a secure VPN network.',
                type: 'consumable',
                rarity: 'uncommon',
                value: 200,
                effects: { anonymityBonus: 20, duration: 3600 }
            },
            {
                id: 'zero_day_exploit',
                name: 'Zero-Day Exploit',
                description: 'A previously unknown security vulnerability.',
                type: 'tool',
                rarity: 'rare',
                value: 5000,
                stackable: false,
                effects: { hackingBonus: 50, successGuarantee: true }
            }
        ];
    }

    createFallbackLocations() {
        return [
            {
                id: 'silicon_valley',
                name: 'Silicon Valley',
                description: 'The heart of the tech industry with numerous high-value targets.',
                region: 'north_america',
                type: 'tech_hub',
                securityLevel: 'high',
                connections: ['san_francisco', 'los_angeles'],
                services: ['black_market', 'tech_support', 'data_broker']
            },
            {
                id: 'financial_district',
                name: 'Financial District',
                description: 'Major banking and financial centers worldwide.',
                region: 'global',
                type: 'financial_hub',
                securityLevel: 'maximum',
                connections: ['wall_street', 'london_city', 'hong_kong'],
                services: ['money_laundering', 'crypto_exchange', 'offshore_banking']
            },
            {
                id: 'underground_market',
                name: 'Digital Underground',
                description: 'Hidden marketplaces in the dark web.',
                region: 'darkweb',
                type: 'black_market',
                securityLevel: 'variable',
                connections: ['tor_network', 'i2p_network'],
                services: ['weapon_trade', 'information_broker', 'hacker_for_hire']
            }
        ];
    }

    createFallbackCharacters() {
        return [
            {
                id: 'data_broker',
                name: 'The Broker',
                description: 'A mysterious figure who trades in valuable information.',
                role: 'merchant',
                location: 'underground_market',
                reputation: 0,
                dialogue: {
                    greeting: 'Welcome to my domain. I have information you need.',
                    trade: 'Everything has a price. What are you willing to pay?',
                    farewell: 'May your data stay secure... for now.'
                },
                services: ['buy_information', 'sell_information', 'reputation_boost']
            },
            {
                id: 'tech_support',
                name: 'Ghost',
                description: 'A skilled hacker who provides technical assistance.',
                role: 'ally',
                location: 'silicon_valley',
                reputation: 10,
                dialogue: {
                    greeting: 'Need some tech support? I\'ve got you covered.',
                    help: 'Here\'s what I can do for you...',
                    farewell: 'Stay safe out there in the digital wilderness.'
                },
                services: ['upgrade_equipment', 'skill_training', 'mission_support']
            }
        ];
    }

    createFallbackStorylines() {
        return [
            {
                id: 'origin_story',
                title: 'The Awakening',
                description: 'Your journey into the world of cyber infiltration begins.',
                chapters: [
                    {
                        id: 'chapter_1',
                        title: 'First Steps',
                        description: 'Learn the basics of the trade.',
                        objectives: ['complete_tutorial', 'first_hack', 'meet_broker'],
                        rewards: { funds: 1000, experience: 100 }
                    },
                    {
                        id: 'chapter_2',
                        title: 'Building Reputation',
                        description: 'Establish yourself in the underground community.',
                        objectives: ['complete_5_targets', 'reach_reputation_10'],
                        rewards: { funds: 5000, experience: 500, unlockUpgrade: 'reputation_network' }
                    }
                ],
                requirements: {},
                rewards: { 
                    funds: 10000, 
                    experience: 1000, 
                    title: 'Cyber Initiate',
                    unlockLocation: 'advanced_darknet'
                }
            }
        ];
    }

    // Update checking and hot reloading
    startUpdateChecks() {
        if (this.updateCheckInterval <= 0) return;

        setInterval(() => {
            this.checkForUpdates();
        }, this.updateCheckInterval);
    }

    async checkForUpdates() {
        try {
            const versionData = await this.fetchData('version.json');
            if (versionData && versionData.version !== this.dataVersion) {
                console.log(`📦 New data version available: ${versionData.version}`);
                await this.handleDataUpdate(versionData);
            }
        } catch (error) {
            console.warn('Update check failed:', error);
        }
    }

    async handleDataUpdate(versionData) {
        // Implement hot reloading logic here
        // For now, just log the availability
        console.log('🔄 Data update detected but hot reloading not implemented');
        
        // You could implement selective reloading:
        // if (versionData.changedFiles.includes('events.json')) {
        //     await this.loadEvents();
        // }
    }

    async handleInitializationFailure(error) {
        console.error('🚨 Critical initialization failure:', error);
        
        if (this.config.fallbackData) {
            console.log('🛡️ Attempting to use fallback data...');
            try {
                await Promise.all([
                    this.loadFallbackEvents(),
                    this.loadFallbackTargets(),
                    this.loadFallbackUpgrades(),
                    this.loadFallbackSkills(),
                    this.loadFallbackItems(),
                    this.loadFallbackLocations(),
                    this.loadFallbackCharacters(),
                    this.loadFallbackStorylines()
                ]);
                
                this.buildDataIndices();
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
export { gameData, GameData };// Game Data System - Central data loader and management system
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
                `${this.config.dataPath}/${filename}`;

            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Cache the data
            if (this.config.enableCaching) {
                this.cache.set(cacheKey, {
                    data: data,
                    timestamp: Date.now()
                });
            }

            return data;
            
        } catch (error) {
            console.warn(`Failed to fetch ${filename}:`, error);
            
            // Try fallback URL
            if (this.config.cdnPath) {
                try {
                    const fallbackUrl = `${this.config.dataPath}/${filename}`;
                    const response = await fetch(fallbackUrl);
                    
                    if (response.ok) {
                        const data = await response.json();
                        
                        if (this.config.enableCaching) {
                            this.cache.set(cacheKey, {
                                data: data,
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
        // Validate required fields
        if (!event.id || !event.title || !event.description) {
            throw new Error(`Invalid event data: ${JSON.stringify(event)}`);
        }

        // Set defaults
        event.type = event.type || 'random';
        event.rarity = event.rarity || 'common';
        event.cooldown = event.cooldown || 0;
        event.conditions = event.conditions || {};
        event.consequences = event.consequences || {};
        
        // Process choices
        if (event.choices) {
            event.choices.forEach((choice, index) => {
                choice.id = choice.id || `${event.id}_choice_${index}`;
                choice.requirements = choice.requirements || {};
                choice.consequences = choice.consequences || {};
            });
        }

        // Calculate dynamic properties
        event.difficultyScore = this.calculateEventDifficulty(event);
        event.rewardValue = this.calculateEventReward(event);
        
        return event;
    }

    processTarget(target) {
        // Validate required fields
        if (!target.id || !target.name || !target.description) {
            throw new Error(`Invalid target data: ${JSON.stringify(target)}`);
        }

        // Set defaults
        target.difficulty = target.difficulty || 'easy';
        target.type = target.type || 'corporate';
        target.region = target.region || 'global';
        target.requirements = target.requirements || {};
        target.rewards = target.rewards || {};
        target.risks = target.risks || {};
        
        // Calculate dynamic properties
        target.difficultyScore = this.calculateTargetDifficulty(target);
        target.profitability = this.calculateTargetProfitability(target);
        target.riskLevel = this.calculateTargetRisk(target);
        
        return target;
    }

    processUpgrade(upgrade) {
        // Validate required fields
        if (!upgrade.id || !upgrade.name || !upgrade.description) {
            throw new Error(`Invalid upgrade data: ${JSON.stringify(upgrade)}`);
        }

        // Set defaults
        upgrade.category = upgrade.category || 'general';
        upgrade.tier = upgrade.tier || 1;
        upgrade.cost = upgrade.cost || {};
        upgrade.effects = upgrade.effects || {};
        upgrade.requirements = upgrade.requirements || {};
        upgrade.prerequisites = upgrade.prerequisites || [];
        
        // Calculate unlock requirements
        upgrade.unlockScore = this.calculateUpgradeUnlockScore(upgrade);
        
        return upgrade;
    }

    processSkill(skill) {
        // Validate required fields
        if (!skill.id || !skill.name || !skill.description) {
            throw new Error(`Invalid skill data: ${JSON.stringify(skill)}`);
        }

        // Set defaults
        skill.category = skill.category || 'general';
        skill.maxLevel = skill.maxLevel || 100;
        skill.baseXP = skill.baseXP || 100;
        skill.xpMultiplier = skill.xpMultiplier || 1.5;
        skill.effects = skill.effects || {};
        
        // Pre-calculate XP requirements for each level
        skill.xpRequirements = this.calculateSkillXPRequirements(skill);
        
        return skill;
    }

    processItem(item) {
        // Validate required fields
        if (!item.id || !item.name) {
            throw new Error(`Invalid item data: ${JSON.stringify(item)}`);
        }

        // Set defaults
        item.type = item.type || 'consumable';
        item.rarity = item.rarity || 'common';
        item.stackable = item.stackable !== false;
        item.value = item.value || 0;
        item.effects = item.effects || {};
        
        return item;
    }

    processLocation(location) {
        // Validate required fields
        if (!location.id || !location.name) {
            throw new Error(`Invalid location data: ${JSON.stringify(location)}`);
        }

        // Set defaults
        location.region = location.region || 'unknown';
        location.type = location.type || 'city';
        location.securityLevel = location.securityLevel || 'medium';
        location.connections = location.connections || [];
        location.services = location.services || [];
        
        return location;
    }

    processCharacter(character) {
        // Validate required fields
        if (!character.id || !character.name) {
            throw new Error(`Invalid character data: ${JSON.stringify(character)}`);
        }

        // Set defaults
        character.role = character.role || 'neutral';
        character.location = character.location || 'unknown';
        character.reputation = character.reputation || 0;
        character.dialogue = character.dialogue || {};
        character.services = character.services || [];
        
        return character;
    }

    processStoryline(storyline) {
        // Validate required fields
        if (!storyline.id || !storyline.title) {
            throw new Error(`Invalid storyline data: ${JSON.stringify(storyline)}`);
        }

        // Set defaults
        storyline.chapters = storyline.chapters || [];
        storyline.requirements = storyline.requirements || {};
        storyline.rewards = storyline.rewards || {};
        storyline.status = 'locked';
        
        return storyline;
    }

    // Index building methods
    buildDataIndices() {
        this.buildEventIndices();
        this.buildTargetIndices();
        this.buildLocationIndices();
        this.buildUpgradeTrees();
        this.buildSkillTrees();
    }

    buildEventIndices() {
        this.eventsByType.clear();
        
        this.events.forEach(event => {
            const type = event.type;
            if (!this.eventsByType.has(type)) {
                this.eventsByType.set(type, []);
            }
            this.eventsByType.get(type).push(event);
        });
    }

    buildTargetIndices() {
        this.targetsByDifficulty.clear();
        
        this.targets.forEach(target => {
            const difficulty = target.difficulty;
            if (!this.targetsByDifficulty.has(difficulty)) {
                this.targetsByDifficulty.set(difficulty, []);
            }
            this.targetsByDifficulty.get(difficulty).push(target);
        });
    }

    buildLocationIndices() {
        this.locationsByRegion.clear();
        
        this.locations.forEach(location => {
            const region = location.region;
            if (!this.locationsByRegion.has(region)) {
                this.locationsByRegion.set(region, []);
            }
            this.locationsByRegion.get(region).push(location);
        });
    }

    buildUpgradeTrees() {
        this.upgradeTrees.clear();
        
        // Group upgrades by category
        const categories = new Map();
        this.upgrades.forEach(upgrade => {
            const category = upgrade.category;
            if (!categories.has(category)) {
                categories.set(category, []);
            }
            categories.get(category).push(upgrade);
        });

        // Build trees for each category
        categories.forEach((upgrades, category) => {
            const tree = this.buildTree(upgrades, 'prerequisites');
            this.upgradeTrees.set(category, tree);
        });
    }

    buildSkillTrees() {
        this.skillTrees.clear();
        
        // Group skills by category
        const categories = new Map();
        this.skills.forEach(skill => {
            const category = skill.category;
            if (!categories.has(category)) {
                categories.set(category, []);
            }
            categories.get(category).push(skill);
        });

        // Build trees for each category
        categories.forEach((skills, category) => {
            const tree = this.buildTree(skills, 'prerequisites');
            this.skillTrees.set(category, tree);
        });
    }

    buildTree(items, prerequisiteField) {
        const tree = {
            roots: [],
            nodes: new Map(),
            children: new Map(),
            parents: new Map()
        };

        // Create nodes
        items.forEach(item => {
            tree.nodes.set(item.id, item);
            tree.children.set(item.id, []);
            tree.parents.set(item.id, []);
        });

        // Build relationships
        items.forEach(item => {
            const prerequisites = item[prerequisiteField] || [];
            
            if (prerequisites.length === 0) {
                tree.roots.push(item);
            } else {
                prerequisites.forEach(prereqId => {
                    if (tree.nodes.has(prereqId)) {
                        tree.children.get(prereqId).push(item);
                        tree.parents.get(item.id).push(prereqId);
                    }
                });
            }
        });

        return tree;
    }

    // Calculation methods
    calculateEventDifficulty(event) {
        let score = 0;
        
        // Base difficulty by type
        const typeDifficulty = {
            'tutorial': 1,
            'random': 3,
            'consequence': 5,
            'crisis': 8,
            'boss': 10
        };
        
        score += typeDifficulty[event.type] || 3;
        
        // Requirements difficulty
        if (event.conditions) {
            Object.keys(event.conditions).forEach(condition => {
                score += 1;
            });
        }
        
        // Choice complexity
        if (event.choices) {
            score += Math.min(event.choices.length, 5);
        }
        
        return Math.max(1, Math.min(10, score));
    }

    calculateEventReward(event) {
        let value = 0;
        
        if (event.consequences) {
            value += Math.abs(event.consequences.funds || 0) * 0.1;
            value += Math.abs(event.consequences.reputation || 0) * 10;
            value += Math.abs(event.consequences.experience || 0) * 5;
        }
        
        return Math.floor(value);
    }

    calculateTargetDifficulty(target) {
        const difficultyMap = {
            'trivial': 1,
            'easy': 2,
            'normal': 4,
            'hard': 7,
            'extreme': 10
        };
        
        return difficultyMap[target.difficulty] || 4;
    }

    calculateTargetProfitability(target) {
        const rewards = target.rewards || {};
        const risks = target.risks || {};
        
        const potential = (rewards.funds || 0) + (rewards.reputation || 0) * 100;
        const risk = (risks.heatIncrease || 0) * 50 + (risks.failurePenalty || 0);
        
        return Math.max(0, potential - risk);
    }

    calculateTargetRisk(target) {
        const risks = target.risks || {};
        let riskScore = 0;
        
        riskScore += (risks.heatIncrease || 0) * 2;
        riskScore += (risks.detectionChance || 0) * 10;
        riskScore += (risks.failurePenalty || 0) * 0.01;
        
        return Math.max(0, Math.min(10, riskScore));
    }

    calculateUpgradeUnlockScore(upgrade) {
        let score = 0;
        
        const requirements = upgrade.requirements || {};
        score += (requirements.level || 0) * 2;
        score += (requirements.reputation || 0) * 0.1;
        score += upgrade.prerequisites.length * 5;
        score += upgrade.tier * 10;
        
        return score;
    }

    calculateSkillXPRequirements(skill) {
        const requirements = [];
        let totalXP = 0;
        
        for (let level = 1; level <= skill.maxLevel; level++) {
            const xpForLevel = Math.floor(skill.baseXP * Math.pow(skill.xpMultiplier, level - 1));
            totalXP += xpForLevel;
            requirements.push({
                level: level,
                xpForLevel: xpForLevel,
                totalXP: totalXP
            });
        }
        
        return requirements;
    }

    // Dynamic content generation
    generateDynamicContent() {
        this.generateRandomEvents();
        this.generateDailyTargets();
        this.generateSpecialOffers();
    }

    generateRandomEvents() {
        this.randomEvents = [];
        const randomEventTypes = this.eventsByType.get('random') || [];
        
        // Select events for current session
        randomEventTypes.forEach(event => {
            if (Math.random() < (event.spawnChance || 0.1)) {
                this.randomEvents.push(event);
            }
        });
    }

    generateDailyTargets() {
        this.dailyTargets = [];
        const allTargets = Array.from(this.targets.values());
        
        // Select 3-5 targets for daily rotation
        const targetCount = 3 + Math.floor(Math.random() * 3);
        const shuffled = this.shuffleArray([...allTargets]);
        this.dailyTargets = shuffled.slice(0, targetCount);
    }

    generateSpecialOffers() {
        this.specialOffers = [];
        const allUpgrades = Array.from(this.upgrades.values());
        
        // Generate special discount offers
        allUpgrades.forEach(upgrade => {
            if (Math.random() < 0.05) { // 5% chance for special offer
                this.specialOffers.push({
                    type: 'upgrade_discount',
                    upgradeId: upgrade.id,
                    discount: 0.1 + Math.random() * 0.4, // 10-50% discount
                    expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
                });
            }
        });
    }

    // Data validation
    validateDataIntegrity() {
        console.log('🔍 Validating data integrity...');
        
        const errors = [];
        
        // Validate event references
        this.events.forEach(event => {
            if (event.consequences && event.consequences.triggerEvent) {
                if (!this.events.has(event.consequences.triggerEvent)) {
                    errors.push(`Event ${event.id} references unknown event ${event.consequences.triggerEvent}`);
                }
            }
        });

        // Validate upgrade prerequisites
        this.upgrades.forEach(upgrade => {
            upgrade.prerequisites.forEach(prereqId => {
                if (!this.upgrades.has(prereqId)) {
                    errors.push(`Upgrade ${upgrade.id} references unknown prerequisite ${prereqId}`);
                }
            });
        });

        // Validate target locations
        this.targets.forEach(target => {
            if (target.location && !this.locations.has(target.location)) {
                errors.push(`Target ${target.id} references unknown location ${target.location}`);
            }
        });

        if (errors.length > 0) {
            console.warn('⚠️ Data integrity issues found:', errors);
        } else {
            console.log('✅ Data integrity validation passed');
        }
        
        return errors;
    }

    // Fallback data loaders
    async loadFallbackEvents() {
        if (!this.config.fallbackData) return;
        
        console.log('📅 Loading fallback events...');
        const fallbackEvents = this.createFallbackEvents();
        
        fallbackEvents.forEach(event => {
            this.processEvent(event);
            this.events.set(event.id, event);
        });
        
        this.buildEventIndices();
    }

    async loadFallbackTargets() {
        if (!this.config.fallbackData) return;
        
        console.log('🎯 Loading fallback targets...');
        const fallbackTargets = this.createFallbackTargets();
        
        fallbackTargets.forEach(target => {
            this.processTarget(target);
            this.targets.set(target.id, target);
        });
        
        this.buildTargetIndices();
    }

    async loadFallbackUpgrades() {
        if (!this.config.fallbackData) return;
        
        console.log('🔧 Loading fallback upgrades...');
        const fallbackUpgrades = this.createFallbackUpgrades();
        
        fallbackUpgrades.forEach(upgrade => {
            this.processUpgrade(upgrade);
            this.upgrades.set(upgrade.id, upgrade);
        });
        
        this.buildUpgradeTrees();
    }

    async loadFallbackSkills() {
        if (!this.config.fallbackData) return;
        
        console.log('💪 Loading fallback skills...');
        const fallbackSkills = this.createFallbackSkills();
        
        fallbackSkills.forEach(skill => {
            this.processSkill(skill);
            this.skills.set(skill.id, skill);
        });
        
        this.buildSkillTrees();
    }

    async loadFallbackItems() {
        if (!this.config.fallbackData) return;
        
        console.log('🎒 Loading fallback items...');
        const fallbackItems = this.createFallbackItems();
        
        fallbackItems.forEach(item => {
            this.processItem(item);
            this.items.set(item.id, item);
        });
    }

    async loadFallbackLocations() {
        if (!this.config.fallbackData) return;
        
        console.log('🌍 Loading fallback locations...');
        const fallbackLocations = this.createFallbackLocations();
        
        fallbackLocations.forEach(location => {
            this.processLocation(location);
            this.locations.set(location.id, location);
        });
        
        this.buildLocationIndices();
    }

    async loadFallbackCharacters() {
        if (!this.config.fallbackData) return;
        
        console.log('👥 Loading fallback characters...');
        const fallbackCharacters = this.createFallbackCharacters();
        
        fallbackCharacters.forEach(character => {
            this.processCharacter(character);
            this.characters.set(character.id, character);
        });
    }

    async loadFallbackStorylines() {
        if (!this.config.fallbackData) return;
        
        console.log('📖 Loading fallback storylines...');
        const fallbackStorylines = this.createFallbackStorylines();
        
        fallbackStorylines.forEach(storyline => {
            this.processStoryline(storyline);
            this.storylines.set(storyline.id, storyline);
        });
    }