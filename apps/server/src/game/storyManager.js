/**
 * Dynamic Storytelling System for Igapó
 * Handles consequence chains, emergent narratives, and world persistence
 */

import ContentGenerator from "./contentGenerator.js";

class StoryManager {
  constructor() {
    this.contentGenerator = new ContentGenerator();
    this.consequenceChains = new Map();
    this.worldState = new Map();
    this.playerChoices = new Map();
    this.emergentNarratives = new Map();
  }

  /**
   * Record player choice and its consequences
   */
  recordChoice(sessionId, choiceId, choice, context) {
    const choiceRecord = {
      id: choiceId,
      choice: choice,
      context: context,
      timestamp: Date.now(),
      consequences: []
    };

    if (!this.playerChoices.has(sessionId)) {
      this.playerChoices.set(sessionId, []);
    }

    this.playerChoices.get(sessionId).push(choiceRecord);
    
    // Generate immediate consequences
    const immediateConsequences = this.generateImmediateConsequences(choice, context);
    choiceRecord.consequences.push(...immediateConsequences);

    // Generate long-term consequences
    const longTermConsequences = this.generateLongTermConsequences(choice, context);
    this.scheduleConsequences(sessionId, choiceId, longTermConsequences);

    return choiceRecord;
  }

  /**
   * Generate immediate consequences of a choice
   */
  generateImmediateConsequences(choice, context) {
    const consequences = [];

    // Reputation changes
    if (choice.type === "dialogue") {
      const reputationChange = this.calculateReputationChange(choice, context);
      if (reputationChange) {
        consequences.push({
          type: "reputation",
          effect: reputationChange,
          immediate: true,
          description: this.generateReputationDescription(reputationChange, context)
        });
      }
    }

    // Resource changes
    if (choice.type === "action") {
      const resourceChange = this.calculateResourceChange(choice, context);
      if (resourceChange) {
        consequences.push({
          type: "resources",
          effect: resourceChange,
          immediate: true,
          description: this.generateResourceDescription(resourceChange, context)
        });
      }
    }

    // Relationship changes
    if (choice.type === "social") {
      const relationshipChange = this.calculateRelationshipChange(choice, context);
      if (relationshipChange) {
        consequences.push({
          type: "relationship",
          effect: relationshipChange,
          immediate: true,
          description: this.generateRelationshipDescription(relationshipChange, context)
        });
      }
    }

    return consequences;
  }

  /**
   * Generate long-term consequences of a choice
   */
  generateLongTermConsequences(choice, context) {
    const consequences = [];

    // World state changes
    const worldStateChange = this.calculateWorldStateChange(choice, context);
    if (worldStateChange) {
      consequences.push({
        type: "world_state",
        effect: worldStateChange,
        immediate: false,
        delay: this.calculateConsequenceDelay(choice, context),
        description: this.generateWorldStateDescription(worldStateChange, context)
      });
    }

    // Future encounter modifications
    const encounterModification = this.calculateEncounterModification(choice, context);
    if (encounterModification) {
      consequences.push({
        type: "encounter_modification",
        effect: encounterModification,
        immediate: false,
        delay: this.calculateConsequenceDelay(choice, context),
        description: this.generateEncounterDescription(encounterModification, context)
      });
    }

    // Reputation diffusion
    const reputationDiffusion = this.calculateReputationDiffusion(choice, context);
    if (reputationDiffusion) {
      consequences.push({
        type: "reputation_diffusion",
        effect: reputationDiffusion,
        immediate: false,
        delay: this.calculateConsequenceDelay(choice, context),
        description: this.generateReputationDiffusionDescription(reputationDiffusion, context)
      });
    }

    return consequences;
  }

  /**
   * Schedule consequences to be applied later
   */
  scheduleConsequences(sessionId, choiceId, consequences) {
    consequences.forEach(consequence => {
      const consequenceId = `${sessionId}_${choiceId}_${consequence.type}_${Date.now()}`;
      
      if (!this.consequenceChains.has(sessionId)) {
        this.consequenceChains.set(sessionId, []);
      }

      this.consequenceChains.get(sessionId).push({
        id: consequenceId,
        choiceId: choiceId,
        consequence: consequence,
        scheduledFor: Date.now() + consequence.delay,
        applied: false
      });
    });
  }

  /**
   * Apply scheduled consequences
   */
  applyScheduledConsequences(sessionId) {
    if (!this.consequenceChains.has(sessionId)) {
      return [];
    }

    const consequences = this.consequenceChains.get(sessionId);
    const now = Date.now();
    const appliedConsequences = [];

    consequences.forEach(consequence => {
      if (!consequence.applied && consequence.scheduledFor <= now) {
        this.applyConsequence(sessionId, consequence);
        consequence.applied = true;
        appliedConsequences.push(consequence);
      }
    });

    // Remove applied consequences
    this.consequenceChains.set(sessionId, 
      consequences.filter(c => !c.applied)
    );

    return appliedConsequences;
  }

  /**
   * Apply a specific consequence
   */
  applyConsequence(sessionId, consequence) {
    const { effect, type } = consequence.consequence;

    switch (type) {
      case "world_state":
        this.applyWorldStateChange(sessionId, effect);
        break;
      case "encounter_modification":
        this.applyEncounterModification(sessionId, effect);
        break;
      case "reputation_diffusion":
        this.applyReputationDiffusion(sessionId, effect);
        break;
    }
  }

  /**
   * Generate emergent narrative based on player choices
   */
  generateEmergentNarrative(sessionId, currentContext) {
    const playerChoices = this.playerChoices.get(sessionId) || [];
    const worldState = this.worldState.get(sessionId) || {};
    
    // Analyze player patterns
    const patterns = this.analyzePlayerPatterns(playerChoices);
    
    // Generate narrative based on patterns
    const narrative = this.createNarrativeFromPatterns(patterns, currentContext, worldState);
    
    // Store emergent narrative
    if (!this.emergentNarratives.has(sessionId)) {
      this.emergentNarratives.set(sessionId, []);
    }
    
    this.emergentNarratives.get(sessionId).push({
      id: `narrative_${Date.now()}`,
      narrative: narrative,
      patterns: patterns,
      context: currentContext,
      timestamp: Date.now()
    });

    return narrative;
  }

  /**
   * Analyze player choice patterns
   */
  analyzePlayerPatterns(choices) {
    const patterns = {
      dialogueStyle: "neutral",
      riskTolerance: "moderate",
      socialApproach: "balanced",
      resourceManagement: "conservative",
      explorationStyle: "methodical"
    };

    if (choices.length === 0) {
      return patterns;
    }

    // Analyze dialogue choices
    const dialogueChoices = choices.filter(c => c.choice.type === "dialogue");
    if (dialogueChoices.length > 0) {
      patterns.dialogueStyle = this.analyzeDialogueStyle(dialogueChoices);
    }

    // Analyze risk tolerance
    const riskChoices = choices.filter(c => c.choice.riskLevel > 0);
    if (riskChoices.length > 0) {
      patterns.riskTolerance = this.analyzeRiskTolerance(riskChoices);
    }

    // Analyze social approach
    const socialChoices = choices.filter(c => c.choice.type === "social");
    if (socialChoices.length > 0) {
      patterns.socialApproach = this.analyzeSocialApproach(socialChoices);
    }

    // Analyze resource management
    const resourceChoices = choices.filter(c => c.choice.type === "resource");
    if (resourceChoices.length > 0) {
      patterns.resourceManagement = this.analyzeResourceManagement(resourceChoices);
    }

    // Analyze exploration style
    const explorationChoices = choices.filter(c => c.choice.type === "exploration");
    if (explorationChoices.length > 0) {
      patterns.explorationStyle = this.analyzeExplorationStyle(explorationChoices);
    }

    return patterns;
  }

  /**
   * Create narrative from player patterns
   */
  createNarrativeFromPatterns(patterns, context, worldState) {
    const narratives = [];

    // Dialogue style narrative
    if (patterns.dialogueStyle === "diplomatic") {
      narratives.push("Your diplomatic approach has earned you respect among the river communities.");
    } else if (patterns.dialogueStyle === "aggressive") {
      narratives.push("Your direct approach has made you known as someone not to be trifled with.");
    } else if (patterns.dialogueStyle === "mysterious") {
      narratives.push("Your enigmatic nature has sparked curiosity and speculation about your true intentions.");
    }

    // Risk tolerance narrative
    if (patterns.riskTolerance === "high") {
      narratives.push("Your willingness to take risks has opened up opportunities others would never attempt.");
    } else if (patterns.riskTolerance === "low") {
      narratives.push("Your cautious approach has kept you safe, though some opportunities may have passed you by.");
    }

    // Social approach narrative
    if (patterns.socialApproach === "charismatic") {
      narratives.push("Your charisma has won you many allies along the river.");
    } else if (patterns.socialApproach === "solitary") {
      narratives.push("Your preference for solitude has made you self-reliant but perhaps isolated.");
    }

    // Resource management narrative
    if (patterns.resourceManagement === "generous") {
      narratives.push("Your generosity has created a network of grateful contacts throughout the region.");
    } else if (patterns.resourceManagement === "hoarding") {
      narratives.push("Your careful resource management has ensured your survival through difficult times.");
    }

    // Exploration style narrative
    if (patterns.explorationStyle === "thorough") {
      narratives.push("Your methodical exploration has uncovered secrets others have missed.");
    } else if (patterns.explorationStyle === "rushed") {
      narratives.push("Your rapid exploration has covered much ground, though some details may have been overlooked.");
    }

    // Combine narratives
    if (narratives.length === 0) {
      return "Your journey continues, each choice shaping your path through the Amazon.";
    }

    return narratives.join(" ") + " Your journey continues, each choice shaping your path through the Amazon.";
  }

  /**
   * Calculate reputation change from choice
   */
  calculateReputationChange(choice, context) {
    const reputationChange = {
      trust: 0,
      fear: 0,
      respect: 0,
      suspicion: 0
    };

    // Dialogue choice effects
    if (choice.tone === "honest") {
      reputationChange.trust += 1;
      reputationChange.respect += 1;
    } else if (choice.tone === "deceptive") {
      reputationChange.suspicion += 1;
      reputationChange.fear += 1;
    } else if (choice.tone === "aggressive") {
      reputationChange.fear += 2;
      reputationChange.respect += 1;
    } else if (choice.tone === "diplomatic") {
      reputationChange.respect += 2;
      reputationChange.trust += 1;
    }

    // Context modifiers
    if (context.characterType === "merchant") {
      reputationChange.trust *= 1.5;
    } else if (context.characterType === "guardian") {
      reputationChange.respect *= 1.5;
    } else if (context.characterType === "spirit") {
      reputationChange.fear *= 2.0;
    }

    return reputationChange;
  }

  /**
   * Calculate resource change from choice
   */
  calculateResourceChange(choice, context) {
    const resourceChange = {
      food: 0,
      water: 0,
      medicine: 0,
      fuel: 0,
      tools: 0
    };

    // Action choice effects
    if (choice.action === "forage") {
      resourceChange.food += Math.floor(Math.random() * 3) + 1;
      resourceChange.water += Math.floor(Math.random() * 2) + 1;
    } else if (choice.action === "hunt") {
      resourceChange.food += Math.floor(Math.random() * 5) + 2;
    } else if (choice.action === "trade") {
      resourceChange.food += choice.tradeAmount || 0;
      resourceChange.water += choice.tradeAmount || 0;
    } else if (choice.action === "rest") {
      resourceChange.food -= 1;
      resourceChange.water -= 1;
    }

    // Context modifiers
    if (context.biome === "protected wilderness") {
      resourceChange.medicine += 1;
    } else if (context.biome === "riverside town") {
      resourceChange.tools += 1;
    }

    return resourceChange;
  }

  /**
   * Calculate relationship change from choice
   */
  calculateRelationshipChange(choice, context) {
    const relationshipChange = {
      affinity: 0,
      loyalty: 0,
      trust: 0,
      fear: 0
    };

    // Social choice effects
    if (choice.approach === "friendly") {
      relationshipChange.affinity += 2;
      relationshipChange.trust += 1;
    } else if (choice.approach === "hostile") {
      relationshipChange.fear += 2;
      relationshipChange.affinity -= 1;
    } else if (choice.approach === "respectful") {
      relationshipChange.respect += 2;
      relationshipChange.trust += 1;
    } else if (choice.approach === "manipulative") {
      relationshipChange.trust -= 1;
      relationshipChange.fear += 1;
    }

    // Context modifiers
    if (context.characterType === "guide") {
      relationshipChange.loyalty *= 1.5;
    } else if (context.characterType === "merchant") {
      relationshipChange.trust *= 1.5;
    }

    return relationshipChange;
  }

  /**
   * Calculate world state change from choice
   */
  calculateWorldStateChange(choice, context) {
    const worldStateChange = {
      region: context.region || "unknown",
      changes: {}
    };

    // Choice effects on world state
    if (choice.type === "exploration") {
      worldStateChange.changes.discovered = true;
      worldStateChange.changes.explorationLevel = (worldStateChange.changes.explorationLevel || 0) + 1;
    } else if (choice.type === "social") {
      worldStateChange.changes.socialNetwork = (worldStateChange.changes.socialNetwork || 0) + 1;
    } else if (choice.type === "resource") {
      worldStateChange.changes.resourceAvailability = (worldStateChange.changes.resourceAvailability || 0) + 1;
    }

    return worldStateChange;
  }

  /**
   * Calculate encounter modification from choice
   */
  calculateEncounterModification(choice, context) {
    const encounterModification = {
      type: "modification",
      effects: {}
    };

    // Choice effects on future encounters
    if (choice.type === "combat") {
      encounterModification.effects.combatDifficulty = -0.1;
      encounterModification.effects.combatRewards = 0.1;
    } else if (choice.type === "diplomatic") {
      encounterModification.effects.socialSuccess = 0.2;
      encounterModification.effects.tradeOpportunities = 0.1;
    } else if (choice.type === "stealth") {
      encounterModification.effects.stealthSuccess = 0.2;
      encounterModification.effects.detectionRisk = -0.1;
    }

    return encounterModification;
  }

  /**
   * Calculate reputation diffusion from choice
   */
  calculateReputationDiffusion(choice, context) {
    const reputationDiffusion = {
      region: context.region || "unknown",
      spread: 0.1,
      effects: {}
    };

    // Choice effects on reputation spread
    if (choice.type === "social" && choice.approach === "charismatic") {
      reputationDiffusion.spread = 0.3;
      reputationDiffusion.effects.positiveSpread = 0.2;
    } else if (choice.type === "combat" && choice.outcome === "victory") {
      reputationDiffusion.spread = 0.4;
      reputationDiffusion.effects.fearSpread = 0.3;
    } else if (choice.type === "diplomatic" && choice.outcome === "success") {
      reputationDiffusion.spread = 0.2;
      reputationDiffusion.effects.respectSpread = 0.2;
    }

    return reputationDiffusion;
  }

  /**
   * Calculate consequence delay
   */
  calculateConsequenceDelay(choice, context) {
    let delay = 0;

    // Base delay based on choice type
    switch (choice.type) {
      case "immediate":
        delay = 0;
        break;
      case "short_term":
        delay = 1000 * 60 * 60; // 1 hour
        break;
      case "medium_term":
        delay = 1000 * 60 * 60 * 24; // 1 day
        break;
      case "long_term":
        delay = 1000 * 60 * 60 * 24 * 7; // 1 week
        break;
      default:
        delay = 1000 * 60 * 60 * 2; // 2 hours
    }

    // Context modifiers
    if (context.urgency === "high") {
      delay *= 0.5;
    } else if (context.urgency === "low") {
      delay *= 2.0;
    }

    return delay;
  }

  /**
   * Apply world state change
   */
  applyWorldStateChange(sessionId, effect) {
    if (!this.worldState.has(sessionId)) {
      this.worldState.set(sessionId, {});
    }

    const worldState = this.worldState.get(sessionId);
    const region = effect.region;

    if (!worldState[region]) {
      worldState[region] = {};
    }

    Object.assign(worldState[region], effect.changes);
  }

  /**
   * Apply encounter modification
   */
  applyEncounterModification(sessionId, effect) {
    // Store encounter modifications for future use
    if (!this.worldState.has(sessionId)) {
      this.worldState.set(sessionId, {});
    }

    const worldState = this.worldState.get(sessionId);
    if (!worldState.encounterModifications) {
      worldState.encounterModifications = [];
    }

    worldState.encounterModifications.push(effect);
  }

  /**
   * Apply reputation diffusion
   */
  applyReputationDiffusion(sessionId, effect) {
    if (!this.worldState.has(sessionId)) {
      this.worldState.set(sessionId, {});
    }

    const worldState = this.worldState.get(sessionId);
    const region = effect.region;

    if (!worldState.reputation) {
      worldState.reputation = {};
    }

    if (!worldState.reputation[region]) {
      worldState.reputation[region] = {
        trust: 0,
        fear: 0,
        respect: 0,
        suspicion: 0
      };
    }

    // Apply reputation effects
    Object.keys(effect.effects).forEach(key => {
      if (worldState.reputation[region][key] !== undefined) {
        worldState.reputation[region][key] += effect.effects[key];
      }
    });
  }

  /**
   * Generate description for reputation change
   */
  generateReputationDescription(reputationChange, context) {
    const descriptions = [];

    if (reputationChange.trust > 0) {
      descriptions.push("Your honesty has earned trust");
    }
    if (reputationChange.fear > 0) {
      descriptions.push("Your actions have inspired fear");
    }
    if (reputationChange.respect > 0) {
      descriptions.push("Your behavior has earned respect");
    }
    if (reputationChange.suspicion > 0) {
      descriptions.push("Your actions have raised suspicion");
    }

    return descriptions.join(", ");
  }

  /**
   * Generate description for resource change
   */
  generateResourceDescription(resourceChange, context) {
    const descriptions = [];

    Object.keys(resourceChange).forEach(resource => {
      const change = resourceChange[resource];
      if (change > 0) {
        descriptions.push(`gained ${change} ${resource}`);
      } else if (change < 0) {
        descriptions.push(`lost ${Math.abs(change)} ${resource}`);
      }
    });

    return descriptions.join(", ");
  }

  /**
   * Generate description for relationship change
   */
  generateRelationshipDescription(relationshipChange, context) {
    const descriptions = [];

    if (relationshipChange.affinity > 0) {
      descriptions.push("relationship has improved");
    }
    if (relationshipChange.loyalty > 0) {
      descriptions.push("loyalty has increased");
    }
    if (relationshipChange.trust > 0) {
      descriptions.push("trust has grown");
    }
    if (relationshipChange.fear > 0) {
      descriptions.push("fear has been instilled");
    }

    return descriptions.join(", ");
  }

  /**
   * Generate description for world state change
   */
  generateWorldStateDescription(worldStateChange, context) {
    const descriptions = [];

    if (worldStateChange.changes.discovered) {
      descriptions.push("new areas have been discovered");
    }
    if (worldStateChange.changes.socialNetwork) {
      descriptions.push("social network has expanded");
    }
    if (worldStateChange.changes.resourceAvailability) {
      descriptions.push("resource availability has changed");
    }

    return descriptions.join(", ");
  }

  /**
   * Generate description for encounter modification
   */
  generateEncounterDescription(encounterModification, context) {
    const descriptions = [];

    Object.keys(encounterModification.effects).forEach(effect => {
      const value = encounterModification.effects[effect];
      if (value > 0) {
        descriptions.push(`${effect} has improved`);
      } else if (value < 0) {
        descriptions.push(`${effect} has decreased`);
      }
    });

    return descriptions.join(", ");
  }

  /**
   * Generate description for reputation diffusion
   */
  generateReputationDiffusionDescription(reputationDiffusion, context) {
    const descriptions = [];

    Object.keys(reputationDiffusion.effects).forEach(effect => {
      const value = reputationDiffusion.effects[effect];
      if (value > 0) {
        descriptions.push(`${effect} is spreading`);
      }
    });

    return descriptions.join(", ");
  }

  /**
   * Analyze dialogue style from choices
   */
  analyzeDialogueStyle(choices) {
    const tones = choices.map(c => c.choice.tone);
    const toneCounts = {};

    tones.forEach(tone => {
      toneCounts[tone] = (toneCounts[tone] || 0) + 1;
    });

    const mostCommonTone = Object.keys(toneCounts).reduce((a, b) => 
      toneCounts[a] > toneCounts[b] ? a : b
    );

    const styleMap = {
      "honest": "diplomatic",
      "deceptive": "mysterious",
      "aggressive": "aggressive",
      "diplomatic": "diplomatic",
      "cautious": "mysterious"
    };

    return styleMap[mostCommonTone] || "neutral";
  }

  /**
   * Analyze risk tolerance from choices
   */
  analyzeRiskTolerance(choices) {
    const riskLevels = choices.map(c => c.choice.riskLevel);
    const averageRisk = riskLevels.reduce((sum, risk) => sum + risk, 0) / riskLevels.length;

    if (averageRisk > 0.7) return "high";
    if (averageRisk < 0.3) return "low";
    return "moderate";
  }

  /**
   * Analyze social approach from choices
   */
  analyzeSocialApproach(choices) {
    const approaches = choices.map(c => c.choice.approach);
    const approachCounts = {};

    approaches.forEach(approach => {
      approachCounts[approach] = (approachCounts[approach] || 0) + 1;
    });

    const mostCommonApproach = Object.keys(approachCounts).reduce((a, b) => 
      approachCounts[a] > approachCounts[b] ? a : b
    );

    const approachMap = {
      "friendly": "charismatic",
      "hostile": "aggressive",
      "respectful": "diplomatic",
      "manipulative": "calculating",
      "neutral": "balanced"
    };

    return approachMap[mostCommonApproach] || "balanced";
  }

  /**
   * Analyze resource management from choices
   */
  analyzeResourceManagement(choices) {
    const resourceChoices = choices.map(c => c.choice.resourceAction);
    const resourceCounts = {};

    resourceChoices.forEach(action => {
      resourceCounts[action] = (resourceCounts[action] || 0) + 1;
    });

    const mostCommonAction = Object.keys(resourceCounts).reduce((a, b) => 
      resourceCounts[a] > resourceCounts[b] ? a : b
    );

    const actionMap = {
      "hoard": "hoarding",
      "share": "generous",
      "trade": "strategic",
      "consume": "balanced"
    };

    return actionMap[mostCommonAction] || "conservative";
  }

  /**
   * Analyze exploration style from choices
   */
  analyzeExplorationStyle(choices) {
    const explorationChoices = choices.map(c => c.choice.explorationAction);
    const explorationCounts = {};

    explorationChoices.forEach(action => {
      explorationCounts[action] = (explorationCounts[action] || 0) + 1;
    });

    const mostCommonAction = Object.keys(explorationCounts).reduce((a, b) => 
      explorationCounts[a] > explorationCounts[b] ? a : b
    );

    const actionMap = {
      "thorough": "thorough",
      "quick": "rushed",
      "careful": "methodical",
      "bold": "aggressive"
    };

    return actionMap[mostCommonAction] || "methodical";
  }

  /**
   * Get player choice history
   */
  getPlayerChoices(sessionId) {
    return this.playerChoices.get(sessionId) || [];
  }

  /**
   * Get world state
   */
  getWorldState(sessionId) {
    return this.worldState.get(sessionId) || {};
  }

  /**
   * Get emergent narratives
   */
  getEmergentNarratives(sessionId) {
    return this.emergentNarratives.get(sessionId) || [];
  }

  /**
   * Clear session data
   */
  clearSession(sessionId) {
    this.playerChoices.delete(sessionId);
    this.worldState.delete(sessionId);
    this.consequenceChains.delete(sessionId);
    this.emergentNarratives.delete(sessionId);
  }
}

export default StoryManager;
