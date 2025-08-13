// data/eventData.js
export const eventData = {
    // Common Events
    marketFluctuation: {
        title: "Market Fluctuation",
        description: "Market prices have shifted unexpectedly, affecting your revenue streams.",
        category: "economic",
        rarity: "common",
        effects: {
            resources: { money: () => Math.floor((Math.random() - 0.5) * 5000) }
        },
        repeatable: true,
        cooldown: 60000
    },

    workerStrike: {
        title: "Worker Strike",
        description: "Your workers are demanding better conditions. How do you respond?",
        category: "labor",
        rarity: "common",
        choices: [
            {
                text: "Negotiate and meet their demands",
                effects: {
                    resources: { money: -3000 },
                    production: { materials: 1.2, money: 1.1 }
                },
                moralityChange: 10
            },
            {
                text: "Hire security to break the strike",
                effects: {
                    resources: { money: -1000 },
                    production: { materials: 0.8 }
                },
                moralityChange: -15
            },
            {
                text: "Try to find a compromise",
                effects: {
                    resources: { money: -1500 },
                    production: { materials: 1.05 }
                },
                moralityChange: 3
            }
        ],
        conditions: {
            resources: { money: 1000 }
        },
        contextRequirements: {
            recentMoralChoice: 300000 // 5 minutes
        }
    },

    supplyShortage: {
        title: "Supply Chain Disruption",
        description: "A key supplier has failed to deliver critical materials.",
        category: "logistics",
        rarity: "common",
        effects: {
            resources: { materials: -1000 },
            production: { materials: 0.7 }
        },
        duration: 120000, // 2 minutes
        endEffects: {
            production: { materials: 1.0 } // Restore normal production
        }
    },

    // Uncommon Events
    techBreakthrough: {
        title: "Technological Breakthrough",
        description: "Your research team has made an unexpected discovery!",
        category: "research",
        rarity: "uncommon",
        effects: {
            production: { energy: 1.3, materials: 1.2 },
            resources: { money: -2000 } // Research costs
        },
        conditions: {
            projects: ["researchLab"]
        }
    },

    governmentContract: {
        title: "Government Contract Opportunity",
        description: "The government is offering a lucrative contract, but it comes with strings attached.",
        category: "political",
        rarity: "uncommon",
        choices: [
            {
                text: "Accept the contract",
                effects: {
                    resources: { money: 15000 },
                    reputation: { government: 20 }
                },
                moralityChange: -5
            },
            {
                text: "Decline politely",
                effects: {
                    reputation: { government: 5 }
                },
                moralityChange: 2
            },
            {
                text: "Negotiate better terms",
                effects: {
                    resources: { money: 8000 },
                    reputation: { government: 10 }
                },
                moralityChange: 5
            }
        ],
        conditions: {
            reputation: { government: -50 } // Min reputation to be offered
        }
    },

    environmentalCrisis: {
        title: "Environmental Crisis",
        description: "Pollution levels have reached critical thresholds in your area.",
        category: "environmental",
        rarity: "uncommon",
        choices: [
            {
                text: "Implement emergency cleanup",
                effects: {
                    resources: { money: -8000, energy: -2000 },
                    reputation: { environmentalists: 30 }
                },
                moralityChange: 15
            },
            {
                text: "Ignore and continue operations",
                effects: {
                    reputation: { environmentalists: -40, government: -20 }
                },
                moralityChange: -20
            },
            {
                text: "Shift blame to competitors",
                effects: {
                    reputation: { environmentalists: -10 }
                },
                moralityChange: -10
            }
        ],
        conditions: {
            morality: { max: 50 } // Only triggers if not too moral
        }
    },

    // Rare Events
    corporateEspionage: {
        title: "Corporate Espionage Discovered",
        description: "You've discovered competitors trying to steal your trade secrets.",
        category: "security",
        rarity: "rare",
        choices: [
            {
                text: "Report to authorities",
                effects: {
                    reputation: { government: 15 },
                    special: { triggerEvent: "governmentInvestigation" }
                },
                moralityChange: 10
            },
            {
                text: "Use counter-intelligence",
                effects: {
                    resources: { money: -5000 },
                    production: { money: 1.2 }
                },
                moralityChange: -5
            },
            {
                text: "Engage in corporate warfare",
                effects: {
                    resources: { money: -10000 },
                    reputation: { competitors: -30 }
                },
                moralityChange: -15
            }
        ],
        conditions: {
            resources: { money: 5000 }
        }
    },

    naturalDisaster: {
        title: "Natural Disaster",
        description: "A severe storm has damaged your facilities and disrupted operations.",
        category: "disaster",
        rarity: "rare",
        effects: {
            resources: { materials: -5000, money: -10000 },
            construction: { speedModifier: 0.5 }
        },
        duration: 300000, // 5 minutes
        endEffects: {
            construction: { speedModifier: 1.0 }
        }
    },

    mysteriousBenefactor: {
        title: "Mysterious Benefactor",
        description: "An anonymous donor has offered substantial funding for your operations.",
        category: "mysterious",
        rarity: "rare",
        choices: [
            {
                text: "Accept the funding gratefully",
                effects: {
                    resources: { money: 25000 },
                    special: { triggerEvent: "benefactorDemands" }
                },
                moralityChange: -2
            },
            {
                text: "Investigate the source first",
                effects: {
                    resources: { money: 5000 } // Smaller amount after investigation
                },
                moralityChange: 5
            },
            {
                text: "Reject the offer",
                effects: {
                    reputation: { mysterious_factions: -20 }
                },
                moralityChange: 8
            }
        ]
    },

    // Epic Events
    economicCollapse: {
        title: "Economic Collapse",
        description: "The entire economic system is collapsing. Your response will define your future.",
        category: "crisis",
        rarity: "epic",
        choices: [
            {
                text: "Provide aid to struggling communities",
                effects: {
                    resources: { money: -20000, materials: -10000 },
                    reputation: { people: 50 },
                    unlock: { expansions: ["humanitarian_leader"] }
                },
                moralityChange: 30
            },
            {
                text: "Exploit the chaos for profit",
                effects: {
                    resources: { money: 50000 },
                    reputation: { people: -50 },
                    unlock: { expansions: ["crisis_profiteer"] }
                },
                moralityChange: -40
            },
            {
                text: "Focus on self-preservation",
                effects: {
                    resources: { money: -5000 },
                    production: { materials: 0.5, money: 0.5 }
                },
                moralityChange: -10
            }
        ],
        conditions: {
            timeInGame: 1800000, // 30 minutes into game
            resources: { money: 10000 }
        }
    },

    alienContact: {
        title: "First Contact",
        description: "Extraterrestrial beings have made contact with your organization.",
        category: "sci-fi",
        rarity: "epic",
        choices: [
            {
                text: "Welcome them openly",
                effects: {
                    unlock: { expansions: ["alien_technology"] },
                    production: { energy: 2.0 }
                },
                moralityChange: 20
            },
            {
                text: "Attempt to capture their technology",
                effects: {
                    resources: { energy: 10000 },
                    unlock: { expansions: ["stolen_alien_tech"] }
                },
                moralityChange: -25
            },
            {
                text: "Report to world governments",
                effects: {
                    reputation: { government: 40 },
                    special: { triggerEvent: "governmentTakeover" }
                },
                moralityChange: 5
            }
        ],
        conditions: {
            expansions: ["advanced_tech"],
            morality: { min: -50, max: 80 } // Not available for pure evil
        }
    },

    // Legendary Events
    timeParadox: {
        title: "Temporal Anomaly",
        description: "Reality itself seems to be unraveling. Your choices echo across time.",
        category: "cosmic",
        rarity: "legendary",
        choices: [
            {
                text: "Attempt to stabilize the timeline",
                effects: {
                    resources: { money: 0, materials: 0, energy: 0 }, // Reset all resources
                    special: { resetCooldowns: true },
                    morality: 0 // Reset morality
                },
                moralityChange: 0
            },
            {
                text: "Exploit the chaos for ultimate power",
                effects: {
                    resources: { money: 100000, materials: 50000, energy: 25000 },
                    unlock: { expansions: ["temporal_dominion"] }
                },
                moralityChange: -50
            },
            {
                text: "Sacrifice yourself to save reality",
                effects: {
                    special: { triggerEvent: "heroicSacrifice" },
                    unlock: { expansions: ["martyr_legacy"] }
                },
                moralityChange: 50
            }
        ],
        conditions: {
            timeInGame: 3600000, // 1 hour into game
            morality: { min: -80, max: 80 }
        }
    },

    // Morality-Specific Events
    divineIntervention: {
        title: "Divine Intervention",
        description: "Your virtuous actions have attracted divine attention.",
        category: "divine",
        rarity: "rare",
        effects: {
            resources: { money: 20000, materials: 10000, energy: 5000 },
            production: { money: 1.5, materials: 1.3, energy: 1.2 }
        },
        conditions: {
            morality: { min: 60 }
        }
    },

    demonicPact: {
        title: "Demonic Pact",
        description: "Dark forces offer you unimaginable power for a price.",
        category: "dark",
        rarity: "rare",
        choices: [
            {
                text: "Accept the pact",
                effects: {
                    production: { money: 3.0, materials: 2.0 },
                    reputation: { people: -30 }
                },
                moralityChange: -30
            },
            {
                text: "Reject the offer",
                effects: {
                    reputation: { divine_forces: 20 }
                },
                moralityChange: 15
            }
        ],
        conditions: {
            morality: { max: -40 }
        }
    },

    // Context-Sensitive Events
    constructionAccident: {
        title: "Construction Accident",
        description: "A serious accident has occurred at one of your construction sites.",
        category: "safety",
        rarity: "uncommon",
        choices: [
            {
                text: "Provide full medical support",
                effects: {
                    resources: { money: -8000 },
                    reputation: { workers: 25 }
                },
                moralityChange: 15
            },
            {
                text: "Provide minimum required aid",
                effects: {
                    resources: { money: -2000 },
                    reputation: { workers: 5 }
                },
                moralityChange: 0
            },
            {
                text: "Cover up the incident",
                effects: {
                    resources: { money: -1000 },
                    reputation: { workers: -20 }
                },
                moralityChange: -20
            }
        ],
        contextRequirements: {
            activeConstruction: true
        }
    },

    resourceDiscovery: {
        title: "Resource Discovery",
        description: "Geological surveys have revealed valuable deposits in your territory.",
        category: "discovery",
        rarity: "uncommon",
        effects: {
            resources: { materials: 15000 },
            production: { materials: 1.4 }
        },
        contextRequirements: {
            lowResources: { materials: 5000 }
        }
    },

    // Seasonal Events
    harvestFestival: {
        title: "Harvest Festival",
        description: "The community celebrates a bountiful harvest season.",
        category: "seasonal",
        rarity: "common",
        effects: {
            resources: { money: 3000, materials: 2000 },
            reputation: { people: 10 }
        },
        contextRequirements: {
            season: "autumn"
        },
        repeatable: false
    },

    winterStorm: {
        title: "Winter Storm",
        description: "A harsh winter storm disrupts operations and strains resources.",
        category: "seasonal",
        rarity: "common",
        effects: {
            resources: { energy: -2000 },
            production: { materials: 0.8, energy: 0.9 }
        },
        duration: 180000, // 3 minutes
        contextRequirements: {
            season: "winter"
        }
    },

    // Chain Events (Events that trigger other events)
    governmentInvestigation: {
        title: "Government Investigation",
        description: "Government agents are investigating your operations.",
        category: "political",
        rarity: "uncommon",
        duration: 240000, // 4 minutes
        effects: {
            production: { money: 0.7, materials: 0.8 }
        },
        endEffects: {
            production: { money: 1.0, materials: 1.0 },
            special: { triggerEvent: "investigationResults" }
        }
    },

    investigationResults: {
        title: "Investigation Concluded",
        description: "The government investigation has concluded.",
        category: "political",
        rarity: "uncommon",
        choices: [
            {
                text: "Cleared of wrongdoing",
                effects: {
                    reputation: { government: 20, people: 15 }
                },
                moralityChange: 5
            },
            {
                text: "Minor violations found",
                effects: {
                    resources: { money: -5000 },
                    reputation: { government: -10 }
                },
                moralityChange: -5
            },
            {
                text: "Major corruption exposed",
                effects: {
                    resources: { money: -15000 },
                    reputation: { government: -30, people: -25 }
                },
                moralityChange: -15
            }
        ]
    },

    benefactorDemands: {
        title: "Benefactor's Demands",
        description: "Your mysterious benefactor is calling in favors.",
        category: "mysterious",
        rarity: "rare",
        choices: [
            {
                text: "Comply with their demands",
                effects: {
                    resources: { money: 10000 },
                    reputation: { mysterious_factions: 20 }
                },
                moralityChange: -10
            },
            {
                text: "Refuse and return the money",
                effects: {
                    resources: { money: -25000 },
                    reputation: { mysterious_factions: -30 }
                },
                moralityChange: 10
            }
        ]
    },

    // High-Stakes Events
    hostileTakeover: {
        title: "Hostile Takeover Attempt",
        description: "A rival corporation is attempting to take over your operations.",
        category: "corporate",
        rarity: "rare",
        choices: [
            {
                text: "Fight back with everything",
                effects: {
                    resources: { money: -20000 },
                    production: { money: 1.3 }
                },
                moralityChange: 0
            },
            {
                text: "Negotiate a merger",
                effects: {
                    resources: { money: 15000 },
                    production: { materials: 1.2, energy: 1.1 }
                },
                moralityChange: 5
            },
            {
                text: "Sell at a premium",
                effects: {
                    resources: { money: 50000 },
                    special: { triggerEvent: "newOwnership" }
                },
                moralityChange: -5
            }
        ],
        conditions: {
            resources: { money: 20000 },
            timeInGame: 1200000 // 20 minutes
        }
    }
};

// Event categories for organization
export const eventCategories = {
    economic: "Economic Events",
    labor: "Labor Relations",
    logistics: "Supply Chain",
    research: "Research & Development",
    political: "Political Affairs",
    environmental: "Environmental Issues",
    security: "Security Concerns",
    disaster: "Natural Disasters",
    mysterious: "Mysterious Events",
    crisis: "Major Crises",
    "sci-fi": "Science Fiction",
    cosmic: "Cosmic Events",
    divine: "Divine Events",
    dark: "Dark Events",
    safety: "Safety Issues",
    discovery: "Discoveries",
    seasonal: "Seasonal Events",
    corporate: "Corporate Affairs"
};

// Rarity definitions
export const eventRarities = {
    common: { weight: 10, color: "#ffffff" },
    uncommon: { weight: 5, color: "#00ff00" },
    rare: { weight: 2, color: "#0080ff" },
    epic: { weight: 1, color: "#8000ff" },
    legendary: { weight: 0.5, color: "#ff8000" }
};