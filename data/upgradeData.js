// Upgrade definitions and tech tree structure
const upgradeCategories = {
  HACKING: 'hacking',
  STEALTH: 'stealth',
  SOCIAL: 'social',
  PHYSICAL: 'physical',
  INTELLIGENCE: 'intelligence',
  EQUIPMENT: 'equipment'
};

const upgradeData = {
  // HACKING TREE
  basic_coding: {
    id: 'basic_coding',
    name: 'Basic Coding',
    category: upgradeCategories.HACKING,
    description: 'Learn fundamental programming concepts. Increases success rate on basic hacking attempts.',
    cost: 100,
    prerequisites: [],
    effects: {
      hackingSkill: 10,
      digitalInfiltrationBonus: 0.05
    },
    unlocks: ['advanced_coding', 'network_basics']
  },

  advanced_coding: {
    id: 'advanced_coding',
    name: 'Advanced Programming',
    category: upgradeCategories.HACKING,
    description: 'Master complex algorithms and data structures. Significantly improves hacking capabilities.',
    cost: 250,
    prerequisites: ['basic_coding'],
    effects: {
      hackingSkill: 25,
      digitalInfiltrationBonus: 0.15,
      systemAccessTime: -0.2
    },
    unlocks: ['ai_scripting', 'crypto_breaking']
  },

  network_basics: {
    id: 'network_basics',
    name: 'Network Fundamentals',
    category: upgradeCategories.HACKING,
    description: 'Understand network protocols and architecture. Enables reconnaissance of target systems.',
    cost: 200,
    prerequisites: ['basic_coding'],
    effects: {
      hackingSkill: 15,
      networkReconBonus: 0.3,
      targetInfoAccuracy: 0.1
    },
    unlocks: ['network_exploitation', 'wireless_hacking']
  },

  ai_scripting: {
    id: 'ai_scripting',
    name: 'AI-Assisted Scripting',
    category: upgradeCategories.HACKING,
    description: 'Use AI tools to automate complex hacking tasks. Greatly reduces time required for digital infiltration.',
    cost: 500,
    prerequisites: ['advanced_coding'],
    effects: {
      hackingSkill: 35,
      automationLevel: 0.4,
      systemAccessTime: -0.4
    },
    unlocks: ['quantum_algorithms']
  },

  crypto_breaking: {
    id: 'crypto_breaking',
    name: 'Cryptography Breaking',
    category: upgradeCategories.HACKING,
    description: 'Advanced techniques for breaking encryption. Unlocks heavily secured targets.',
    cost: 400,
    prerequisites: ['advanced_coding'],
    effects: {
      hackingSkill: 30,
      encryptionBypassChance: 0.6,
      highSecurityAccess: true
    },
    unlocks: ['quantum_algorithms']
  },

  // STEALTH TREE
  basic_stealth: {
    id: 'basic_stealth',
    name: 'Basic Stealth',
    category: upgradeCategories.STEALTH,
    description: 'Learn to move quietly and avoid detection. Reduces chance of being caught during infiltration.',
    cost: 80,
    prerequisites: [],
    effects: {
      stealthSkill: 10,
      detectionRisk: -0.1,
      physicalInfiltrationBonus: 0.05
    },
    unlocks: ['advanced_stealth', 'lock_picking']
  },

  advanced_stealth: {
    id: 'advanced_stealth',
    name: 'Advanced Stealth',
    category: upgradeCategories.STEALTH,
    description: 'Master the art of invisibility. Become nearly undetectable in most situations.',
    cost: 300,
    prerequisites: ['basic_stealth'],
    effects: {
      stealthSkill: 25,
      detectionRisk: -0.25,
      shadowMovement: true
    },
    unlocks: ['ghost_protocol', 'surveillance_evasion']
  },

  lock_picking: {
    id: 'lock_picking',
    name: 'Lock Picking',
    category: upgradeCategories.STEALTH,
    description: 'Bypass mechanical security systems. Opens new infiltration routes.',
    cost: 150,
    prerequisites: ['basic_stealth'],
    effects: {
      stealthSkill: 15,
      mechanicalBypassChance: 0.7,
      alternativeRoutes: 0.2
    },
    unlocks: ['security_systems', 'safe_cracking']
  },

  ghost_protocol: {
    id: 'ghost_protocol',
    name: 'Ghost Protocol',
    category: upgradeCategories.STEALTH,
    description: 'Become completely invisible to security systems. Elite-level stealth capabilities.',
    cost: 600,
    prerequisites: ['advanced_stealth'],
    effects: {
      stealthSkill: 40,
      detectionRisk: -0.5,
      digitalFootprint: -0.8
    },
    unlocks: []
  },

  // SOCIAL TREE
  basic_psychology: {
    id: 'basic_psychology',
    name: 'Basic Psychology',
    category: upgradeCategories.SOCIAL,
    description: 'Understand human behavior and motivations. Improves social engineering attempts.',
    cost: 120,
    prerequisites: [],
    effects: {
      socialSkill: 10,
      persuasionBonus: 0.1,
      socialEngineeringChance: 0.15
    },
    unlocks: ['advanced_psychology', 'communication_skills']
  },

  advanced_psychology: {
    id: 'advanced_psychology',
    name: 'Advanced Psychology',
    category: upgradeCategories.SOCIAL,
    description: 'Master manipulation and influence techniques. Significantly improves social infiltration.',
    cost: 350,
    prerequisites: ['basic_psychology'],
    effects: {
      socialSkill: 30,
      persuasionBonus: 0.25,
      trustBuildingRate: 0.4
    },
    unlocks: ['mind_control', 'group_dynamics']
  },

  communication_skills: {
    id: 'communication_skills',
    name: 'Communication Skills',
    category: upgradeCategories.SOCIAL,
    description: 'Improve verbal and non-verbal communication. Better information extraction from targets.',
    cost: 180,
    prerequisites: ['basic_psychology'],
    effects: {
      socialSkill: 20,
      informationExtractionRate: 0.3,
      conversationControl: 0.2
    },
    unlocks: ['interrogation', 'networking']
  },

  // PHYSICAL TREE
  basic_fitness: {
    id: 'basic_fitness',
    name: 'Basic Fitness',
    category: upgradeCategories.PHYSICAL,
    description: 'Improve physical condition and endurance. Reduces fatigue during long operations.',
    cost: 100,
    prerequisites: [],
    effects: {
      physicalSkill: 10,
      stamina: 20,
      operationDuration: 0.15
    },
    unlocks: ['advanced_fitness', 'parkour']
  },

  advanced_fitness: {
    id: 'advanced_fitness',
    name: 'Advanced Fitness',
    category: upgradeCategories.PHYSICAL,
    description: 'Peak physical condition. Greatly improves all physical infiltration methods.',
    cost: 280,
    prerequisites: ['basic_fitness'],
    effects: {
      physicalSkill: 25,
      stamina: 50,
      physicalInfiltrationBonus: 0.2
    },
    unlocks: ['combat_training', 'endurance_specialist']
  },

  parkour: {
    id: 'parkour',
    name: 'Parkour',
    category: upgradeCategories.PHYSICAL,
    description: 'Master environmental navigation. Access previously unreachable infiltration points.',
    cost: 220,
    prerequisites: ['basic_fitness'],
    effects: {
      physicalSkill: 20,
      mobilityBonus: 0.35,
      alternativeRoutes: 0.25
    },
    unlocks: ['urban_climbing', 'escape_artist']
  },

  // INTELLIGENCE TREE
  pattern_recognition: {
    id: 'pattern_recognition',
    name: 'Pattern Recognition',
    category: upgradeCategories.INTELLIGENCE,
    description: 'Identify patterns in security systems and human behavior. Improves planning effectiveness.',
    cost: 150,
    prerequisites: [],
    effects: {
      intelligenceSkill: 15,
      patternAnalysisBonus: 0.2,
      planningEfficiency: 0.15
    },
    unlocks: ['data_analysis', 'behavioral_prediction']
  },

  data_analysis: {
    id: 'data_analysis',
    name: 'Data Analysis',
    category: upgradeCategories.INTELLIGENCE,
    description: 'Process large amounts of information efficiently. Better target reconnaissance.',
    cost: 300,
    prerequisites: ['pattern_recognition'],
    effects: {
      intelligenceSkill: 25,
      informationProcessing: 0.4,
      targetAnalysisAccuracy: 0.3
    },
    unlocks: ['predictive_modeling', 'signal_intelligence']
  },

  behavioral_prediction: {
    id: 'behavioral_prediction',
    name: 'Behavioral Prediction',
    category: upgradeCategories.INTELLIGENCE,
    description: 'Predict target behavior patterns. Anticipate security responses and plan accordingly.',
    cost: 320,
    prerequisites: ['pattern_recognition'],
    effects: {
      intelligenceSkill: 30,
      behaviorPredictionAccuracy: 0.5,
      contingencyPlanBonus: 0.25
    },
    unlocks: ['psychological_profiling']
  },

  // EQUIPMENT TREE
  basic_tools: {
    id: 'basic_tools',
    name: 'Basic Tools',
    category: upgradeCategories.EQUIPMENT,
    description: 'Essential infiltration equipment. Lockpicks, basic electronics, and communication gear.',
    cost: 200,
    prerequisites: [],
    effects: {
      equipmentQuality: 1,
      toolEffectiveness: 0.2,
      missionSuccessBonus: 0.1
    },
    unlocks: ['advanced_tools', 'surveillance_equipment']
  },

  advanced_tools: {
    id: 'advanced_tools',
    name: 'Advanced Tools',
    category: upgradeCategories.EQUIPMENT,
    description: 'Professional-grade infiltration equipment. Significantly improves operation success rates.',
    cost: 500,
    prerequisites: ['basic_tools'],
    effects: {
      equipmentQuality: 2,
      toolEffectiveness: 0.5,
      specializedGearAccess: true
    },
    unlocks: ['cutting_edge_tech', 'custom_equipment']
  },

  surveillance_equipment: {
    id: 'surveillance_equipment',
    name: 'Surveillance Equipment',
    category: upgradeCategories.EQUIPMENT,
    description: 'Advanced monitoring and recording devices. Better intelligence gathering capabilities.',
    cost: 350,
    prerequisites: ['basic_tools'],
    effects: {
      equipmentQuality: 1.5,
      surveillanceEffectiveness: 0.6,
      intelligenceGatheringBonus: 0.3
    },
    unlocks: ['drone_technology', 'signal_interception']
  },

  cutting_edge_tech: {
    id: 'cutting_edge_tech',
    name: 'Cutting-Edge Technology',
    category: upgradeCategories.EQUIPMENT,
    description: 'Access to experimental and prototype equipment. Unlocks the most challenging targets.',
    cost: 800,
    prerequisites: ['advanced_tools'],
    effects: {
      equipmentQuality: 3,
      prototypeAccess: true,
      eliteTargetAccess: true
    },
    unlocks: []
  }
};

// Tech tree structure helpers
function getUpgradesByCategory(category) {
  return Object.values(upgradeData).filter(upgrade => upgrade.category === category);
}

function getAvailableUpgrades(ownedUpgrades) {
  return Object.values(upgradeData).filter(upgrade => {
    // Check if already owned
    if (ownedUpgrades.includes(upgrade.id)) return false;
    
    // Check if prerequisites are met
    return upgrade.prerequisites.every(prereq => ownedUpgrades.includes(prereq));
  });
}

function calculateTotalCost(upgradeIds) {
  return upgradeIds.reduce((total, id) => {
    const upgrade = upgradeData[id];
    return total + (upgrade ? upgrade.cost : 0);
  }, 0);
}

function getUpgradeEffects(ownedUpgrades) {
  const totalEffects = {};
  
  ownedUpgrades.forEach(upgradeId => {
    const upgrade = upgradeData[upgradeId];
    if (upgrade && upgrade.effects) {
      Object.entries(upgrade.effects).forEach(([effect, value]) => {
        if (typeof value === 'number') {
          totalEffects[effect] = (totalEffects[effect] || 0) + value;
        } else if (typeof value === 'boolean' && value) {
          totalEffects[effect] = true;
        }
      });
    }
  });
  
  return totalEffects;
}

// Expose to global scope
window.upgradeCategories = upgradeCategories;
window.upgradeData = upgradeData;
window.getUpgradesByCategory = getUpgradesByCategory;
window.getAvailableUpgrades = getAvailableUpgrades;
window.calculateTotalCost = calculateTotalCost;
window.getUpgradeEffects = getUpgradeEffects;