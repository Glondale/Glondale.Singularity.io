// Infiltration target definitions and properties
export const targetTypes = {
  CORPORATE: 'corporate',
  GOVERNMENT: 'government',
  CRIMINAL: 'criminal',
  ACADEMIC: 'academic',
  MILITARY: 'military',
  FINANCIAL: 'financial'
};

export const securityLevels = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  MAXIMUM: 4,
  CLASSIFIED: 5
};

export const infiltrationMethods = {
  DIGITAL: 'digital',
  PHYSICAL: 'physical',
  SOCIAL: 'social',
  HYBRID: 'hybrid'
};

export const targetData = {
  // LOW SECURITY TARGETS
  local_business: {
    id: 'local_business',
    name: 'Local Business Office',
    type: targetTypes.CORPORATE,
    securityLevel: securityLevels.LOW,
    description: 'Small business with minimal security. Perfect for beginners to practice infiltration techniques.',
    location: 'Downtown Commercial District',
    
    requirements: {
      minimumSkills: {
        hackingSkill: 0,
        stealthSkill: 0,
        socialSkill: 0
      },
      requiredUpgrades: [],
      timeRequired: 30 // minutes
    },
    
    infiltrationMethods: [
      {
        method: infiltrationMethods.DIGITAL,
        difficulty: 0.2,
        description: 'Hack into their basic computer systems'
      },
      {
        method: infiltrationMethods.PHYSICAL,
        difficulty: 0.3,
        description: 'Break in through back entrance after hours'
      },
      {
        method: infiltrationMethods.SOCIAL,
        difficulty: 0.1,
        description: 'Pose as delivery person or maintenance worker'
      }
    ],
    
    rewards: {
      money: 500,
      experience: 100,
      reputation: 10,
      information: ['employee_records', 'financial_data_basic']
    },
    
    risks: {
      detectionChance: 0.1,
      consequences: {
        minor: 'Local police investigation',
        major: 'Business security upgrade'
      }
    }
  },

  university_lab: {
    id: 'university_lab',
    name: 'University Research Lab',
    type: targetTypes.ACADEMIC,
    securityLevel: securityLevels.LOW,
    description: 'Academic research facility with basic security protocols. Contains valuable research data.',
    location: 'State University Campus',
    
    requirements: {
      minimumSkills: {
        hackingSkill: 5,
        stealthSkill: 5,
        socialSkill: 0
      },
      requiredUpgrades: [],
      timeRequired: 45
    },
    
    infiltrationMethods: [
      {
        method: infiltrationMethods.DIGITAL,
        difficulty: 0.3,
        description: 'Access research databases through university network'
      },
      {
        method: infiltrationMethods.PHYSICAL,
        difficulty: 0.4,
        description: 'Sneak into lab during off-hours'
      },
      {
        method: infiltrationMethods.SOCIAL,
        difficulty: 0.2,
        description: 'Pose as graduate student or visiting researcher'
      }
    ],
    
    rewards: {
      money: 800,
      experience: 150,
      reputation: 15,
      information: ['research_data', 'academic_contacts', 'grant_information']
    },
    
    risks: {
      detectionChance: 0.15,
      consequences: {
        minor: 'Enhanced lab security',
        major: 'University-wide security review'
      }
    }
  },

  // MEDIUM SECURITY TARGETS
  corporate_office: {
    id: 'corporate_office',
    name: 'Corporate Headquarters',
    type: targetTypes.CORPORATE,
    securityLevel: securityLevels.MEDIUM,
    description: 'Mid-size corporation with standard security measures. Valuable corporate intelligence available.',
    location: 'Financial District',
    
    requirements: {
      minimumSkills: {
        hackingSkill: 15,
        stealthSkill: 10,
        socialSkill: 10
      },
      requiredUpgrades: ['basic_coding', 'basic_stealth'],
      timeRequired: 90
    },
    
    infiltrationMethods: [
      {
        method: infiltrationMethods.DIGITAL,
        difficulty: 0.5,
        description: 'Penetrate corporate firewall and access internal systems'
      },
      {
        method: infiltrationMethods.PHYSICAL,
        difficulty: 0.6,
        description: 'Bypass keycard security and surveillance cameras'
      },
      {
        method: infiltrationMethods.SOCIAL,
        difficulty: 0.4,
        description: 'Infiltrate through employee impersonation'
      },
      {
        method: infiltrationMethods.HYBRID,
        difficulty: 0.45,
        description: 'Combine social engineering with digital access'
      }
    ],
    
    rewards: {
      money: 2500,
      experience: 300,
      reputation: 25,
      information: ['corporate_secrets', 'executive_communications', 'financial_reports']
    },
    
    risks: {
      detectionChance: 0.25,
      consequences: {
        minor: 'Security firm investigation',
        major: 'Corporate security overhaul, legal action'
      }
    }
  },

  police_station: {
    id: 'police_station',
    name: 'Municipal Police Station',
    type: targetTypes.GOVERNMENT,
    securityLevel: securityLevels.MEDIUM,
    description: 'Local law enforcement facility. Contains criminal records and ongoing investigation data.',
    location: 'Civic Center',
    
    requirements: {
      minimumSkills: {
        hackingSkill: 20,
        stealthSkill: 15,
        socialSkill: 10
      },
      requiredUpgrades: ['network_basics', 'basic_stealth'],
      timeRequired: 120
    },
    
    infiltrationMethods: [
      {
        method: infiltrationMethods.DIGITAL,
        difficulty: 0.6,
        description: 'Hack into police database systems'
      },
      {
        method: infiltrationMethods.PHYSICAL,
        difficulty: 0.7,
        description: 'Infiltrate evidence room and records department'
      },
      {
        method: infiltrationMethods.SOCIAL,
        difficulty: 0.5,
        description: 'Pose as federal agent or consultant'
      }
    ],
    
    rewards: {
      money: 1800,
      experience: 400,
      reputation: 35,
      information: ['criminal_records', 'active_investigations', 'witness_protection_data']
    },
    
    risks: {
      detectionChance: 0.35,
      consequences: {
        minor: 'Increased patrol presence',
        major: 'Multi-agency manhunt, federal investigation'
      }
    }
  },

  // HIGH SECURITY TARGETS
  tech_company: {
    id: 'tech_company',
    name: 'Technology Corporation',
    type: targetTypes.CORPORATE,
    securityLevel: securityLevels.HIGH,
    description: 'Major tech company with advanced security systems. Contains cutting-edge technology secrets.',
    location: 'Silicon Valley Campus',
    
    requirements: {
      minimumSkills: {
        hackingSkill: 35,
        stealthSkill: 25,
        socialSkill: 20
      },
      requiredUpgrades: ['advanced_coding', 'advanced_stealth', 'network_exploitation'],
      timeRequired: 180
    },
    
    infiltrationMethods: [
      {
        method: infiltrationMethods.DIGITAL,
        difficulty: 0.8,
        description: 'Penetrate advanced cybersecurity defenses'
      },
      {
        method: infiltrationMethods.PHYSICAL,
        difficulty: 0.75,
        description: 'Bypass biometric scanners and motion sensors'
      },
      {
        method: infiltrationMethods.SOCIAL,
        difficulty: 0.6,
        description: 'Social engineer high-level employees'
      },
      {
        method: infiltrationMethods.HYBRID,
        difficulty: 0.7,
        description: 'Multi-vector attack combining all approaches'
      }
    ],
    
    rewards: {
      money: 8000,
      experience: 600,
      reputation: 50,
      information: ['proprietary_algorithms', 'product_roadmaps', 'competitor_intelligence']
    },
    
    risks: {
      detectionChance: 0.4,
      consequences: {
        minor: 'Corporate espionage investigation',
        major: 'FBI cyber crimes unit involvement'
      }
    }
  },

  federal_building: {
    id: 'federal_building',
    name: 'Federal Government Office',
    type: targetTypes.GOVERNMENT,
    securityLevel: securityLevels.HIGH,
    description: 'Federal facility with classified information and high-security protocols.',
    location: 'Government District',
    
    requirements: {
      minimumSkills: {
        hackingSkill: 30,
        stealthSkill: 35,
        socialSkill: 25
      },
      requiredUpgrades: ['crypto_breaking', 'advanced_stealth', 'advanced_psychology'],
      timeRequired: 240
    },
    
    infiltrationMethods: [
      {
        method: infiltrationMethods.DIGITAL,
        difficulty: 0.85,
        description: 'Break through government-grade encryption'
      },
      {
        method: infiltrationMethods.PHYSICAL,
        difficulty: 0.8,
        description: 'Navigate armed security and surveillance'
      },
      {
        method: infiltrationMethods.SOCIAL,
        difficulty: 0.7,
        description: 'Impersonate federal agents or contractors'
      }
    ],
    
    rewards: {
      money: 5000,
      experience: 800,
      reputation: 75,
      information: ['classified_documents', 'surveillance_programs', 'budget_allocations']
    },
    
    risks: {
      detectionChance: 0.5,
      consequences: {
        minor: 'Enhanced federal security measures',
        major: 'National security investigation, permanent watchlist'
      }
    }
  },

  // MAXIMUM SECURITY TARGETS
  defense_contractor: {
    id: 'defense_contractor',
    name: 'Defense Contractor Facility',
    type: targetTypes.MILITARY,
    securityLevel: securityLevels.MAXIMUM,
    description: 'Military contractor with top-secret clearance requirements and extreme security measures.',
    location: 'Secure Industrial Complex',
    
    requirements: {
      minimumSkills: {
        hackingSkill: 45,
        stealthSkill: 40,
        socialSkill: 35
      },
      requiredUpgrades: ['ai_scripting', 'ghost_protocol', 'mind_control', 'advanced_tools'],
      timeRequired: 360
    },
    
    infiltrationMethods: [
      {
        method: infiltrationMethods.DIGITAL,
        difficulty: 0.9,
        description: 'Defeat military-grade cybersecurity systems'
      },
      {
        method: infiltrationMethods.PHYSICAL,
        difficulty: 0.85,
        description: 'Evade armed guards and advanced sensor networks'
      },
      {
        method: infiltrationMethods.HYBRID,
        difficulty: 0.8,
        description: 'Coordinated multi-phase infiltration operation'
      }
    ],
    
    rewards: {
      money: 15000,
      experience: 1200,
      reputation: 100,
      information: ['weapons_specifications', 'military_contracts', 'classified_research']
    },
    
    risks: {
      detectionChance: 0.6,
      consequences: {
        minor: 'Military security investigation',
        major: 'National security threat classification, life imprisonment'
      }
    }
  },

  central_bank: {
    id: 'central_bank',
    name: 'Federal Reserve Bank',
    type: targetTypes.FINANCIAL,
    securityLevel: securityLevels.MAXIMUM,
    description: 'National banking institution with the highest levels of physical and digital security.',
    location: 'Financial District Fortress',
    
    requirements: {
      minimumSkills: {
        hackingSkill: 50,
        stealthSkill: 45,
        socialSkill: 40
      },
      requiredUpgrades: ['quantum_algorithms', 'ghost_protocol', 'cutting_edge_tech'],
      timeRequired: 480
    },
    
    infiltrationMethods: [
      {
        method: infiltrationMethods.DIGITAL,
        difficulty: 0.95,
        description: 'Penetrate quantum-encrypted financial networks'
      },
      {
        method: infiltrationMethods.PHYSICAL,
        difficulty: 0.9,
        description: 'Navigate vault security and armed response teams'
      },
      {
        method: infiltrationMethods.HYBRID,
        difficulty: 0.85,
        description: 'Synchronized digital and physical assault'
      }
    ],
    
    rewards: {
      money: 25000,
      experience: 2000,
      reputation: 150,
      information: ['monetary_policy', 'international_transfers', 'economic_intelligence']
    },
    
    risks: {
      detectionChance: 0.7,
      consequences: {
        minor: 'International financial investigation',
        major: 'Global manhunt, economic terrorism charges'
      }
    }
  },

  // CLASSIFIED SECURITY TARGETS
  black_site: {
    id: 'black_site',
    name: 'Classified Research Facility',
    type: targetTypes.GOVERNMENT,
    securityLevel: securityLevels.CLASSIFIED,
    description: 'Ultra-secret government facility. Existence officially denied. Extreme measures authorized.',
    location: 'Unknown Location',
    
    requirements: {
      minimumSkills: {
        hackingSkill: 60,
        stealthSkill: 55,
        socialSkill: 50
      },
      requiredUpgrades: ['quantum_algorithms', 'ghost_protocol', 'psychological_profiling', 'cutting_edge_tech'],
      timeRequired: 600
    },
    
    infiltrationMethods: [
      {
        method: infiltrationMethods.HYBRID,
        difficulty: 0.95,
        description: 'Multi-stage operation requiring perfect execution'
      }
    ],
    
    rewards: {
      money: 50000,
      experience: 5000,
      reputation: 250,
      information: ['black_projects', 'alien_technology', 'mind_control_programs']
    },
    
    risks: {
      detectionChance: 0.8,
      consequences: {
        minor: 'Immediate elimination authorized',
        major: 'Complete identity erasure, family targeting'
      }
    }
  }
};

// Target utility functions
export function getTargetsByType(type) {
  return Object.values(targetData).filter(target => target.type === type);
}

export function getTargetsBySecurityLevel(level) {
  return Object.values(targetData).filter(target => target.securityLevel === level);
}

export function getAvailableTargets(playerSkills, ownedUpgrades) {
  return Object.values(targetData).filter(target => {
    // Check skill requirements
    const skillsOk = Object.entries(target.requirements.minimumSkills).every(
      ([skill, required]) => (playerSkills[skill] || 0) >= required
    );
    
    // Check upgrade requirements
    const upgradesOk = target.requirements.requiredUpgrades.every(
      upgrade => ownedUpgrades.includes(upgrade)
    );
    
    return skillsOk && upgradesOk;
  });
}

export function calculateSuccessChance(target, playerSkills, infiltrationMethod) {
  const method = target.infiltrationMethods.find(m => m.method === infiltrationMethod);
  if (!method) return 0;
  
  // Base success chance (inverse of difficulty)
  let successChance = 1 - method.difficulty;
  
  // Apply skill bonuses based on method type
  switch (infiltrationMethod) {
    case infiltrationMethods.DIGITAL:
      successChance += (playerSkills.hackingSkill || 0) * 0.01;
      break;
    case infiltrationMethods.PHYSICAL:
      successChance += (playerSkills.stealthSkill || 0) * 0.01;
      break;
    case infiltrationMethods.SOCIAL:
      successChance += (playerSkills.socialSkill || 0) * 0.01;
      break;
    case infiltrationMethods.HYBRID:
      successChance += ((playerSkills.hackingSkill || 0) + 
                       (playerSkills.stealthSkill || 0) + 
                       (playerSkills.socialSkill || 0)) * 0.005;
      break;
  }
  
  // Cap at 95% success rate
  return Math.min(successChance, 0.95);
}

export function getTargetDifficulty(target) {
  const avgDifficulty = target.infiltrationMethods.reduce((sum, method) => 
    sum + method.difficulty, 0) / target.infiltrationMethods.length;
  
  if (avgDifficulty <= 0.3) return 'Easy';
  if (avgDifficulty <= 0.5) return 'Medium';
  if (avgDifficulty <= 0.7) return 'Hard';
  if (avgDifficulty <= 0.85) return 'Extreme';
  return 'Impossible';
}

export function estimateReward(target, successChance) {
  const baseReward = target.rewards.money;
  const riskMultiplier = target.risks.detectionChance + 1;
  const skillMultiplier = successChance;
  
  return Math.floor(baseReward * riskMultiplier * skillMultiplier);
}