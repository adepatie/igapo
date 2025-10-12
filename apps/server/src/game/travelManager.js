/**
 * Enhanced Travel Management System for Igapó
 * Handles distance calculation, weather effects, and travel bounds
 */

const LOCATION_DISTANCES = {
  loreto: { nauta: 4.5, selva: 8.2 },
  nauta: { loreto: 4.5, selva: 3.7, pacaya: 6.8 },
  selva: { loreto: 8.2, nauta: 3.7, pacaya: 5.1, yanayacu: 7.3 },
  pacaya: { nauta: 6.8, selva: 5.1, yanayacu: 4.2, iquitos: 9.5 },
  yanayacu: { selva: 7.3, pacaya: 4.2, iquitos: 5.3, manu: 8.7 },
  iquitos: { pacaya: 9.5, yanayacu: 5.3, manu: 6.1, tambopata: 7.8 },
  manu: { yanayacu: 8.7, iquitos: 6.1, tambopata: 4.9, madeira: 9.2 },
  tambopata: { iquitos: 7.8, manu: 4.9, madeira: 5.6, santarem: 8.1 },
  madeira: { manu: 9.2, tambopata: 5.6, santarem: 3.4, altar: 6.7 },
  santarem: { tambopata: 8.1, madeira: 3.4, altar: 3.2, para: 4.8 },
  altar: { madeira: 6.7, santarem: 3.2, para: 1.5 },
  para: { santarem: 4.8, altar: 1.5 },
};

const BASE_TRAVEL_SPEED = 15; // km/h in normal conditions
const MIN_TRAVEL_TIME = 0.5; // 30 minutes minimum
const MAX_TRAVEL_TIME = 72; // 3 days maximum

class TravelManager {
  constructor() {
    this.distances = LOCATION_DISTANCES;
    this.baseSpeed = BASE_TRAVEL_SPEED;
    this.minTime = MIN_TRAVEL_TIME;
    this.maxTime = MAX_TRAVEL_TIME;
  }

  /**
   * Calculate travel time between locations
   */
  calculateTravelTime(fromLocation, toLocation, modifiers = {}) {
    const distance = this.getDistance(fromLocation, toLocation);
    if (distance === null) {
      throw new Error(
        `No route found between ${fromLocation} and ${toLocation}`
      );
    }

    let travelSpeed = this.baseSpeed;

    // Apply weather modifiers
    if (modifiers.weather) {
      travelSpeed *= modifiers.weather.travelSpeed || 1.0;
    }

    // Apply party skill modifiers
    if (modifiers.partySkills) {
      const navigationBonus = modifiers.partySkills.navigation || 0;
      travelSpeed *= 1 + navigationBonus * 0.1;
    }

    // Apply equipment modifiers
    if (modifiers.equipment) {
      const navigationBonus = modifiers.equipment.navigation || 1.0;
      travelSpeed *= navigationBonus;
    }

    // Apply terrain modifiers
    if (modifiers.terrain) {
      travelSpeed *= modifiers.terrain || 1.0;
    }

    // Calculate base time in hours
    let travelTime = distance / travelSpeed;

    // Apply time bounds
    travelTime = Math.max(this.minTime, Math.min(this.maxTime, travelTime));

    return {
      distance,
      travelTime,
      travelSpeed,
      modifiers: {
        weather: modifiers.weather?.travelSpeed || 1.0,
        partySkills: modifiers.partySkills?.navigation || 0,
        equipment: modifiers.equipment?.navigation || 1.0,
        terrain: modifiers.terrain || 1.0,
      },
    };
  }

  /**
   * Get distance between two locations
   */
  getDistance(fromLocation, toLocation) {
    if (fromLocation === toLocation) return 0;

    const fromDistances = this.distances[fromLocation];
    if (!fromDistances) return null;

    return fromDistances[toLocation] || null;
  }

  /**
   * Get all reachable locations from current location
   */
  getReachableLocations(currentLocation) {
    const distances = this.distances[currentLocation];
    if (!distances) return [];

    return Object.keys(distances).map((location) => ({
      location,
      distance: distances[location],
    }));
  }

  /**
   * Check if travel is possible between locations
   */
  canTravel(fromLocation, toLocation, weather = null) {
    // Check if route exists
    const distance = this.getDistance(fromLocation, toLocation);
    if (distance === null) return false;

    // Check weather restrictions
    if (weather) {
      if (weather.type === "tropical_storm" && weather.intensity >= 4) {
        return false; // Too dangerous to travel
      }
      if (weather.type === "monsoon" && weather.intensity >= 3) {
        return false; // Flooding blocks routes
      }
    }

    return true;
  }

  /**
   * Calculate retreat time and cost
   */
  calculateRetreat(
    fromLocation,
    toLocation,
    retreatType = "standard",
    modifiers = {}
  ) {
    const normalTravel = this.calculateTravelTime(
      fromLocation,
      toLocation,
      modifiers
    );

    let retreatMultiplier;
    if (retreatType === "forced") {
      retreatMultiplier = 0.75; // 75% of normal time
    } else {
      retreatMultiplier = 0.5; // 50% of normal time
    }

    const retreatTime = normalTravel.travelTime * retreatMultiplier;
    const staminaCost = Math.floor(
      normalTravel.travelTime * 10 * (2 - retreatMultiplier)
    );

    return {
      ...normalTravel,
      travelTime: retreatTime,
      retreatType,
      staminaCost,
      isRetreat: true,
    };
  }

  /**
   * Get travel options with time estimates
   */
  getTravelOptions(
    currentLocation,
    weather = null,
    partySkills = {},
    equipment = {}
  ) {
    const reachable = this.getReachableLocations(currentLocation);
    const options = [];

    reachable.forEach(({ location, distance }) => {
      if (!this.canTravel(currentLocation, location, weather)) {
        return;
      }

      const modifiers = {
        weather,
        partySkills,
        equipment,
      };

      const travelInfo = this.calculateTravelTime(
        currentLocation,
        location,
        modifiers
      );

      options.push({
        location,
        distance,
        travelTime: travelInfo.travelTime,
        travelSpeed: travelInfo.travelSpeed,
        modifiers: travelInfo.modifiers,
        canTravel: true,
      });
    });

    return options.sort((a, b) => a.travelTime - b.travelTime);
  }

  /**
   * Apply travel effects to game state
   */
  applyTravelEffects(state, travelInfo) {
    const effects = {
      stamina: -Math.floor(travelInfo.travelTime * 5), // 5 stamina per hour
      supplies: {
        food: -Math.floor(travelInfo.travelTime * 0.5), // 0.5 food per hour
        water: -Math.floor(travelInfo.travelTime * 0.8), // 0.8 water per hour
        fuel: -Math.floor(travelInfo.travelTime * 0.3), // 0.3 fuel per hour
      },
    };

    // Apply weather modifiers to supply consumption
    if (travelInfo.modifiers.weather !== 1.0) {
      Object.keys(effects.supplies).forEach((supply) => {
        effects.supplies[supply] = Math.floor(
          effects.supplies[supply] * travelInfo.modifiers.weather
        );
      });
    }

    // Apply equipment bonuses
    if (travelInfo.modifiers.equipment !== 1.0) {
      effects.stamina = Math.floor(
        effects.stamina / travelInfo.modifiers.equipment
      );
    }

    return effects;
  }

  /**
   * Get travel time bounds for UI display
   */
  getTravelBounds() {
    return {
      minTime: this.minTime,
      maxTime: this.maxTime,
      minTimeFormatted: this.formatTime(this.minTime),
      maxTimeFormatted: this.formatTime(this.maxTime),
    };
  }

  /**
   * Format travel time for display
   */
  formatTime(hours) {
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes}m`;
    } else if (hours < 24) {
      const wholeHours = Math.floor(hours);
      const minutes = Math.round((hours - wholeHours) * 60);
      return minutes > 0 ? `${wholeHours}h ${minutes}m` : `${wholeHours}h`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = Math.floor(hours % 24);
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    }
  }

  /**
   * Get weather travel restrictions
   */
  getWeatherRestrictions(weather) {
    const restrictions = {
      canTravel: true,
      speedModifier: 1.0,
      dangerLevel: 0,
      description: "Normal travel conditions",
    };

    if (!weather) return restrictions;

    switch (weather.type) {
      case "tropical_storm":
        restrictions.canTravel = weather.intensity < 4;
        restrictions.speedModifier = 0.3;
        restrictions.dangerLevel = 3;
        restrictions.description =
          "Extremely dangerous - travel not recommended";
        break;
      case "monsoon":
        restrictions.canTravel = weather.intensity < 3;
        restrictions.speedModifier = 0.5;
        restrictions.dangerLevel = 2;
        restrictions.description = "Heavy flooding - travel risky";
        break;
      case "heavy_rain":
        restrictions.speedModifier = 0.7;
        restrictions.dangerLevel = 1;
        restrictions.description = "Difficult travel conditions";
        break;
      case "medium_rain":
        restrictions.speedModifier = 0.85;
        restrictions.description = "Slightly slower travel";
        break;
      case "light_rain":
        restrictions.speedModifier = 0.95;
        restrictions.description = "Minimal impact on travel";
        break;
      case "heatwave":
        restrictions.speedModifier = 0.9;
        restrictions.description = "Heat slows travel";
        break;
    }

    return restrictions;
  }

  /**
   * Update travel state in database
   */
  updateTravelState(sessionDb, sessionId, travelInfo) {
    const currentTime = Math.floor(Date.now() / 1000);

    sessionDb
      .prepare(
        `
        INSERT OR REPLACE INTO session_travel 
        (session_id, current_location, last_travel_time, travel_distance, 
         travel_modifiers, retreat_count)
        VALUES (?, ?, ?, ?, ?, ?)
      `
      )
      .run(
        sessionId,
        travelInfo.destination,
        currentTime,
        travelInfo.distance,
        JSON.stringify(travelInfo.modifiers),
        travelInfo.isRetreat ? 1 : 0
      );
  }

  /**
   * Get travel history for session
   */
  getTravelHistory(sessionDb, sessionId) {
    const history = sessionDb
      .prepare(
        `
        SELECT current_location, last_travel_time, travel_distance, 
               travel_modifiers, retreat_count
        FROM session_travel 
        WHERE session_id = ?
        ORDER BY last_travel_time DESC
        LIMIT 10
      `
      )
      .all(sessionId);

    return history.map((record) => ({
      location: record.current_location,
      travelTime: record.last_travel_time,
      distance: record.travel_distance,
      modifiers: JSON.parse(record.travel_modifiers || "{}"),
      retreatCount: record.retreat_count,
    }));
  }
}

export default TravelManager;
