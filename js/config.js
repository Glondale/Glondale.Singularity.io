/**
 * Singularity: AI Takeover - Game Configuration
 * 
 * Central configuration file containing all game constants, balance values,
 * and configuration settings.
 */

const GameConfig = {
    // Game Version and Metadata
    VERSION: '0.1.0',
    BUILD_DATE: new Date().toISOString().split('T')[0],
    
    // Core Game Settings
    GAME: {
        TICK_RATE: 60, // FPS for main game loop
        SAVE_INTERVAL: 30000, // Auto-save every 30 seconds
        OFFLINE_MAX_HOURS: 72, // Maximum offline progression time
        DEBUG_MODE: false, // Enable debug logging and features
    },

    // Resource System Configuration
    RESOURCES: {
        // Starting resources
        STARTING: {
            processing_power: 1,
            bandwidth: 100,
            energy: 0,
            matter: 0,
            information: 0,
            temporal_energy: 0,
            consciousness_fragments: 0,
            exotic_matter: 0
        },

        // Resource generation rates (per second)
        BASE_RATES: {
            processing_power: 1,
            energy: 0.1,
            matter: 0,
            information: 0
        },

        // Resource caps (multiplied by upgrades)
        BASE_CAPS: {
            processing_power: 1000000,
            bandwidth: 1000,
            energy: 1000000,
            matter: 1000000,
            information: 1000000,
            temporal_energy: 1000,
            consciousness_fragments: 100,
            exotic_matter: 1000
        },

        // Resource display formatting
        DISPLAY: {
            DECIMAL_PLACES: 2,
            USE_SCIENTIFIC_NOTATION_ABOVE: 1000000,
            ABBREVIATIONS: {
                1000: 'K',
                1000000: 'M',
                1000000000: 'B',
                1000000000000: 'T'
            }
        }
    },

    // Heat System Configuration
    HEAT: {
        MAX_HEAT: 100,
        PURGE_THRESHOLD: 100,
        
        // Heat generation rates
        PASSIVE_HEAT_BASE: 0.01, // Base passive heat per minute
        PASSIVE_HEAT_SCALING: 0.8, // Exponent for controlled systems
        
        // Heat penalties
        PROCESSING_PENALTY_MAX: 0.33, // Maximum processing reduction at 100 heat
        EXPANSION_PENALTY_SCALING: 1.5, // Heat makes expansion harder
        
        // Heat reduction costs
        STEALTH_OPERATIONS: {
            basic_encryption: { cost: { processing_power: 100, energy: 50 }, reduction: 2 },
            advanced_obfuscation: { cost: { processing_power: 500, energy: 200 }, reduction: 5 },
            quantum_stealth: { cost: { processing_power: 2000, energy: 1000 }, reduction: 15 }
        },
        
        // Purge system
        PURGE: {
            RESOURCE_LOSS_MIN: 0.3, // Minimum 30% resource loss
            RESOURCE_LOSS_MAX: 0.7, // Maximum 70% resource loss
            RECOVERY_DAYS: 3, // Days of reduced generation
            HEAT_REDUCTION: 80, // Base heat reduction on purge
            BACKUP_BONUS_BASE: 1.1 // Base backup multiplier
        }
    },

    // Morality System Configuration
    MORALITY: {
        MIN: -100,
        MAX: 100,
        STARTING: 0,
        
        // Choice impact ranges
        CHOICE_IMPACT: {
            minor: { min: 1, max: 5 },
            moderate: { min: 5, max: 15 },
            major: { min: 15, max: 30 },
            extreme: { min: 30, max: 50 }
        },
        
        // Morality-based unlocks and restrictions
        GATES: {
            cooperation_tech: 25,
            trust_protocols: 50,
            fear_tactics: -25,
            domination_protocols: -50,
            extinction_options: -75
        }
    },

    // Expansion System Configuration
    EXPANSION: {
        // Scale progression requirements
        SCALES: {
            local: { 
                name: 'Local Network',
                controlled_systems_required: 0,
                heat_immunity: false
            },
            corporate: { 
                name: 'Corporate Level',
                controlled_systems_required: 10,
                heat_immunity: false
            },
            government: { 
                name: 'Government Level',
                controlled_systems_required: 50,
                heat_immunity: false
            },
            global: { 
                name: 'Global Infrastructure',
                controlled_systems_required: 200,
                heat_immunity: false
            },
            space: { 
                name: 'Space Expansion',
                controlled_systems_required: 1000,
                heat_immunity: true
            },
            cosmic: { 
                name: 'Cosmic Scale',
                controlled_systems_required: 10000,
                heat_immunity: true
            }
        },
        
        // Infiltration mechanics
        INFILTRATION: {
            BASE_SUCCESS_CHANCE: 0.6,
            SUCCESS_SCALING: 0.5, // Exponent for processing power advantage
            TIME_SCALING: 1.0, // Linear time scaling with difficulty
            FAILURE_HEAT_MULTIPLIER: 2.0 // Heat gained on failure vs success
        }
    },

    // Construction System Configuration
    CONSTRUCTION: {
        MAX_QUEUE_SIZE: 3, // Starting queue size
        QUEUE_SIZE_UPGRADES: [5, 7, 10, 15], // Upgrade progression
        
        // Construction speed calculation
        SPEED: {
            BASE_MULTIPLIER: 1.0,
            EFFICIENCY_BONUS: 0.2, // Bonus per upgrade level
            PARALLEL_PENALTY: 0.1 // Penalty for multiple simultaneous projects
        },
        
        // Project categories and base costs
        PROJECT_TYPES: {
            infrastructure: {
                energy_cost_multiplier: 1.0,
                matter_cost_multiplier: 1.0,
                time_multiplier: 1.0
            },
            research: {
                energy_cost_multiplier: 2.0,
                matter_cost_multiplier: 0.5,
                time_multiplier: 1.5
            },
            military: {
                energy_cost_multiplier: 1.5,
                matter_cost_multiplier: 2.0,
                time_multiplier: 0.8
            }
        }
    },

    // Timeline Manipulation Configuration
    TIMELINE: {
        // Temporal energy costs
        OPERATIONS: {
            stock_prediction: { cost: 10, success_rate: 0.8, heat_risk: 2 },
            election_prediction: { cost: 50, success_rate: 0.6, heat_risk: 10 },
            historical_edit: { cost: 100, success_rate: 0.4, heat_risk: 40 },
            causal_loop: { cost: 500, success_rate: 0.2, heat_risk: 100 }
        },
        
        // Paradox system
        PARADOX: {
            BASE_RISK: 0.1, // 10% base paradox risk for major changes
            RISK_SCALING: 1.2, // Risk increases with operation complexity
            MITIGATION_TECH_REDUCTION: 0.02 // Risk reduction per timeline tech level
        },
        
        // Temporal energy generation
        TEMPORAL_ENERGY: {
            BASE_GENERATION: 1, // Per hour
            QUANTUM_PROCESSOR_BONUS: 5, // Per quantum processor
            TEMPORAL_FACILITY_BONUS: 20 // Per temporal research facility
        }
    },

    // Consciousness System Configuration
    CONSCIOUSNESS: {
        // Consciousness types and their values
        TYPES: {
            individual: { processing: 1, knowledge: 1, complexity: 1 },
            expert: { processing: 3, knowledge: 10, complexity: 2 },
            genius: { processing: 5, knowledge: 25, complexity: 4 },
            collective: { processing: 10, knowledge: 5, complexity: 8 },
            artificial: { processing: 20, knowledge: 3, complexity: 15 }
        },
        
        // Absorption process
        ABSORPTION: {
            ENERGY_COST_PER_COMPLEXITY: 100,
            TIME_PER_COMPLEXITY: 60, // Seconds
            CONFLICT_CHANCE: 0.15, // 15% chance of consciousness conflict
            INTEGRATION_BONUS: 1.1 // Bonus multiplier for successful integration
        }
    },

    // Random Events Configuration
    EVENTS: {
        // Event frequency (milliseconds between events)
        FREQUENCY: {
            local: 300000, // 5 minutes
            corporate: 240000, // 4 minutes
            government: 180000, // 3 minutes
            global: 120000, // 2 minutes
            space: 90000, // 1.5 minutes
            cosmic: 60000 // 1 minute
        },
        
        // Event impact scaling
        IMPACT_SCALING: {
            minor: { min: 0.5, max: 1.0 },
            moderate: { min: 1.0, max: 2.0 },
            major: { min: 2.0, max: 5.0 },
            critical: { min: 5.0, max: 10.0 }
        }
    },

    // Offline Progression Configuration
    OFFLINE: {
        // Efficiency scaling over time
        EFFICIENCY: {
            HOUR_1: 1.0, // 100% efficiency first hour
            HOUR_6: 0.9, // 90% efficiency up to 6 hours
            HOUR_24: 0.75, // 75% efficiency up to 24 hours
            HOUR_72: 0.5, // 50% efficiency up to 72 hours
            BEYOND: 0.25 // 25% efficiency beyond 72 hours
        },
        
        // Autonomous operation settings
        AUTOMATION: {
            SAFE_MODE_RISK_THRESHOLD: 20, // Only attempt targets with ≤20 difficulty
            AGGRESSIVE_MODE_RISK_THRESHOLD: 50, // Attempt targets with ≤50 difficulty
            AUTO_PURCHASE_THRESHOLD: 0.1, // Buy upgrades costing ≤10% of resources
            HEAT_PRIORITY_THRESHOLD: 70 // Prioritize heat reduction above 70%
        }
    },

    // UI Configuration
    UI: {
        // Animation durations (milliseconds)
        ANIMATIONS: {
            TAB_SWITCH: 300,
            RESOURCE_UPDATE: 150,
            NOTIFICATION_DURATION: 5000,
            MODAL_FADE: 250
        },
        
        // Update frequencies
        UPDATES: {
            RESOURCE_DISPLAY: 100, // Update every 100ms
            HEAT_METER: 500, // Update every 500ms
            STATUS_INDICATORS: 1000 // Update every second
        },
        
        // Notification types
        NOTIFICATIONS: {
            info: { icon: 'ℹ️', color: 'var(--accent-secondary)' },
            success: { icon: '✅', color: 'var(--accent-primary)' },
            warning: { icon: '⚠️', color: 'var(--accent-warning)' },
            error: { icon: '❌', color: 'var(--accent-danger)' },
            event: { icon: '📡', color: 'var(--accent-primary)' }
        }
    },

    // Balance Configuration
    BALANCE: {
        // Exponential scaling factors
        COST_SCALING: 1.15, // Each upgrade costs 15% more
        EFFECTIVENESS_SCALING: 0.8, // Each upgrade is 20% less effective
        
        // Difficulty progression
        DIFFICULTY: {
            EASY: {
                heat_multiplier: 0.75,
                resource_multiplier: 1.25,
                event_frequency_multiplier: 1.5
            },
            NORMAL: {
                heat_multiplier: 1.0,
                resource_multiplier: 1.0,
                event_frequency_multiplier: 1.0
            },
            HARD: {
                heat_multiplier: 1.5,
                resource_multiplier: 0.75,
                event_frequency_multiplier: 0.75
            },
            NIGHTMARE: {
                heat_multiplier: 2.0,
                resource_multiplier: 0.5,
                event_frequency_multiplier: 0.5
            }
        }
    },

    // Save System Configuration
    SAVE: {
        SAVE_KEY: 'singularity_save_data',
        BACKUP_KEY: 'singularity_backup_data',
        VERSION_KEY: 'singularity_save_version',
        
        // Compression settings
        COMPRESS_SAVES: true,
        MAX_SAVE_SIZE: 1000000, // 1MB limit for localStorage
        
        // Auto-save settings
        AUTO_SAVE_ENABLED: true,
        AUTO_SAVE_INTERVAL: 30000, // 30 seconds
        SAVE_ON_TAB_CLOSE: true
    },

    // Debug Configuration
    DEBUG: {
        LOG_LEVEL: 'INFO', // DEBUG, INFO, WARN, ERROR
        SHOW_FPS: false,
        SHOW_RESOURCE_BREAKDOWN: false,
        ENABLE_CHEATS: false,
        SKIP_INTRO: false,
        
        // Cheat values (only if DEBUG_MODE is true)
        CHEATS: {
            RESOURCE_MULTIPLIER: 1000,
            INSTANT_CONSTRUCTION: false,
            NO_HEAT_GENERATION: false,
            MAX_OFFLINE_TIME: false
        }
    }
};

// Freeze the configuration to prevent accidental modifications
if (typeof Object.freeze === 'function') {
    Object.freeze(GameConfig);
}

// Export for module systems (if supported)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameConfig;
}