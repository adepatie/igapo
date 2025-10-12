# Phase 4: Advanced Features

## Overview

**Duration**: 4-5 weeks
**Focus**: Complex gameplay systems that add strategic depth and variety
**Goal**: Transform basic survival into rich, multi-layered gameplay experience

## Prerequisites

**Phases 1-3 Must Be Complete**:

- ✅ Supply System Overhaul (5 distinct types)
- ✅ Survival Mechanics (dehydration/starvation timers)
- ✅ Pocketwatch UI (always-visible time display)
- ✅ Party System (character recruitment and skills)
- ✅ Reputation System (per-party member tracking)
- ✅ Economy System (currency and trading mechanics)
- ✅ Weather System (progression and travel effects)
- ✅ Minimap UI (node exploration and discovery)
- ✅ Camping System (camp setup and events)

## Current State Analysis

### **Equipment System** (Current)

- ❌ No special items inventory or encounter effects
- ❌ No equipment that provides unique options
- ❌ No item rarity or cultural significance

### **Enhanced Travel** (Current)

- ⚠️ Basic travel exists but lacks distance calculation
- ❌ No weather effects on travel time
- ❌ No travel time bounds (30 min min, 3 days max)
- ❌ No retreat mechanics implementation

### **Location Enhancement** (Current)

- ❌ No time-of-day effects on locations
- ❌ No dynamic content based on conditions
- ❌ Static location behavior

## Target State

### **Equipment System** (Target)

- **Special Items**: Weapons, tools, artifacts, maps with unique effects
- **Encounter Effects**: Items provide new options in dangerous situations
- **Rarity System**: Items have different availability and value
- **Cultural Significance**: Items tied to specific groups or regions

### **Enhanced Travel** (Target)

- **Distance Calculation**: Realistic travel times based on route distance
- **Weather Modifiers**: Rain slows travel, storms block routes
- **Time Bounds**: Minimum 30 minutes, maximum 3 days after modifiers
- **Retreat Mechanics**: 50% standard retreat, 75% forced retreat

### **Location Enhancement** (Target)

- **Time-of-Day Effects**: Different behavior morning vs night
- **Dynamic Content**: Weather and party affect location encounters
- **Settlement Hours**: Shops open/close based on time
- **Wilderness Activity**: Wildlife more active at certain times

## Implementation Plan

### **Week 1: Equipment System**

#### **Day 1-2: Equipment Database & Types**

**Files to Create/Modify**:

1. `apps/server/src/database/sessionSchema.js` - Add equipment tables
2. `packages/shared/src/types.ts` - Add Equipment interfaces
3. `apps/web/src/game-client/types.ts` - Update game state

**Database Schema**:

```sql
CREATE TABLE session_equipment (
  session_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL, -- weapon, tool, artifact, map
  name TEXT NOT NULL,
  description TEXT,
  rarity TEXT, -- common, uncommon, rare, legendary
  effects TEXT, -- JSON: {combat: 1.2, navigation: 1.1}
  cultural_significance TEXT,
  acquired_at INTEGER,
  acquired_from TEXT, -- location or character
  PRIMARY KEY (session_id, item_id)
);

CREATE TABLE item_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  rarity TEXT NOT NULL,
  effects TEXT NOT NULL,
  cultural_groups TEXT, -- JSON array of affected groups
  spawn_locations TEXT, -- JSON array of possible locations
  base_value INTEGER,
  description TEXT
);
```

**Equipment Types**:

```typescript
// packages/shared/src/types.ts
export interface Equipment {
  id: string;
  name: string;
  type: "weapon" | "tool" | "artifact" | "map" | "luxury";
  rarity: "common" | "uncommon" | "rare" | "legendary";
  effects: {
    combat?: number; // Combat effectiveness multiplier
    navigation?: number; // Travel speed/navigation modifier
    social?: number; // Charisma/reputation modifier
    utility?: number; // General utility modifier
  };
  culturalSignificance?: string[];
  description: string;
  value: number; // Base value in mil-réis
}
```

#### **Day 3-4: Item Effects System**

**Files to Create**:

1. `apps/server/src/game/equipmentManager.js` - Equipment effects logic

**Equipment Effects Implementation**:

```typescript
// apps/server/src/game/equipmentManager.js
class EquipmentManager {
  applyEquipmentEffects(state, actionType) {
    let modifiers = { combat: 1.0, navigation: 1.0, social: 1.0, utility: 1.0 };

    // Apply weapon effects in combat
    if (actionType === "combat") {
      const weapons = state.equipment.filter((item) => item.type === "weapon");
      weapons.forEach((weapon) => {
        modifiers.combat *= weapon.effects.combat || 1.0;
      });
    }

    // Apply navigation items for travel
    if (actionType === "travel") {
      const navigationItems = state.equipment.filter(
        (item) => item.type === "tool" && item.effects.navigation
      );
      navigationItems.forEach((item) => {
        modifiers.navigation *= item.effects.navigation || 1.0;
      });
    }

    // Apply social items for dialogue
    if (actionType === "social") {
      const socialItems = state.equipment.filter(
        (item) => item.type === "luxury" || item.type === "artifact"
      );
      socialItems.forEach((item) => {
        modifiers.social *= item.effects.social || 1.0;
      });
    }

    return modifiers;
  }

  getEncounterOptions(equipment, encounterType) {
    const options = [];

    // Weapons provide combat options
    if (equipment.some((item) => item.type === "weapon")) {
      options.push({
        id: "fight_with_weapon",
        label: "Fight with Weapon",
        description: "Use equipped weapon for combat advantage",
        effects: { combat: 1.5, risk: 0.8 },
      });
    }

    // Maps provide navigation options
    if (equipment.some((item) => item.type === "map")) {
      options.push({
        id: "use_map",
        label: "Consult Map",
        description: "Use map to find safer route or hidden paths",
        effects: { navigation: 1.2, discovery: 1.3 },
      });
    }

    // Artifacts provide social options
    if (equipment.some((item) => item.type === "artifact")) {
      options.push({
        id: "show_artifact",
        label: "Show Artifact",
        description: "Present cultural artifact to gain trust or information",
        effects: { social: 1.4, reputation: 1.2 },
      });
    }

    return options;
  }
}
```

#### **Day 5: Equipment UI**

**Files to Create**:

1. `apps/web/src/components/modals/EquipmentModal.tsx`

### **Week 2: Enhanced Travel**

#### **Day 1-2: Distance-Based Travel**

**Files to Modify**:

1. `apps/server/src/game/stateManager.js` - Add distance calculations
2. `apps/server/src/database/sessionSchema.js` - Add travel_routes table

**Travel Calculation**:

```typescript
// Enhanced travel time calculation
const calculateTravelTime = (distanceKm, terrain, weather, partySkills) => {
  let baseSpeed = getBaseSpeedForTerrain(terrain); // km/h
  let travelTime = distanceKm / baseSpeed; // hours

  // Apply weather modifiers
  const weatherEffects = getWeatherEffects(weather.type);
  travelTime /= weatherEffects.travelSpeed;

  // Apply skill modifiers (navigation reduces time)
  const navigationSkill = getPartyNavigationLevel(partySkills);
  travelTime *= 1 - navigationSkill * 0.15; // 15% reduction per skill level

  // Apply bounds
  travelTime = Math.max(0.5, Math.min(72, travelTime)); // 30 min to 3 days

  return travelTime;
};
```

#### **Day 3-4: Travel Interface Enhancement**

**Files to Create**:

1. `apps/web/src/components/modals/TravelModal.tsx`

**Enhanced Travel Interface**:

```typescript
// apps/web/src/components/modals/TravelModal.tsx
interface TravelModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromLocation: Location;
  toLocation: Location;
  party: PartyMember[];
  weather: WeatherState;
  onTravel: (route: TravelRoute) => void;
}

const TravelModal: React.FC<TravelModalProps> = ({
  isOpen,
  onClose,
  fromLocation,
  toLocation,
  party,
  weather,
  onTravel,
}) => {
  const distance = calculateDistance(fromLocation, toLocation);
  const baseTime = calculateBaseTravelTime(distance, toLocation.biome);
  const weatherTime = applyWeatherToTravel(baseTime, weather);
  const skillTime = applySkillsToTravel(weatherTime, party);
  const finalTime = Math.max(0.5, Math.min(72, skillTime));

  return (
    <div className="travel-modal">
      <div className="travel-modal__content">
        <div className="travel-modal__header">
          <h2>Travel to {toLocation.name}</h2>
          <div className="travel-modal__distance">
            📏 {distance} km {toLocation.biome}
          </div>
        </div>

        <div className="travel-modal__breakdown">
          <div className="travel-calculation">
            <div className="calc-item">
              <span className="calc-label">Base Time:</span>
              <span className="calc-value">{formatTime(baseTime)}</span>
            </div>
            <div className="calc-item">
              <span className="calc-label">Weather ({weather.type}):</span>
              <span className="calc-value">
                {weather.type === "normal"
                  ? "No change"
                  : `${formatTime(weatherTime - baseTime)}`}
              </span>
            </div>
            <div className="calc-item">
              <span className="calc-label">Party Skills:</span>
              <span className="calc-value">
                {skillTime < weatherTime
                  ? `-${formatTime(weatherTime - skillTime)}`
                  : "No bonus"}
              </span>
            </div>
            <div className="calc-divider"></div>
            <div className="calc-item calc-total">
              <span className="calc-label">Total Time:</span>
              <span className="calc-value">{formatTime(finalTime)}</span>
            </div>
            <div className="calc-item">
              <span className="calc-label">Arrival:</span>
              <span className="calc-value">{formatArrivalTime(finalTime)}</span>
            </div>
          </div>
        </div>

        <div className="travel-modal__costs">
          <h4>Resource Costs</h4>
          <div className="cost-items">
            <div className="cost-item">
              <span>🍖 Food:</span>
              <span>-{Math.ceil(distance * 0.1)} rations</span>
            </div>
            <div className="cost-item">
              <span>💧 Water:</span>
              <span>-{Math.ceil(distance * 0.2)} canteens</span>
            </div>
            <div className="cost-item">
              <span>💪 Stamina:</span>
              <span>-{Math.ceil(finalTime * 2)} per person</span>
            </div>
          </div>
        </div>

        <div className="travel-modal__warnings">
          {finalTime > 24 && (
            <div className="warning-item">
              ⚠️ Long journey - consider camping midway
            </div>
          )}
          {weather.type === "tropical_storm" && (
            <div className="warning-item">
              🌀 Dangerous weather - high risk of encounters
            </div>
          )}
        </div>

        <div className="travel-modal__footer">
          <button onClick={onClose}>Cancel</button>
          <button
            onClick={() => onTravel({ distance, estimatedTime: finalTime })}
          >
            Begin Journey
          </button>
        </div>
      </div>
    </div>
  );
};
```

#### **Day 5: Retreat Mechanics**

**Files to Modify**:

1. `apps/server/src/game/stateManager.js` - Add retreat logic

**Retreat Implementation**:

```typescript
const calculateRetreatCost = (originalTime, retreatType) => {
  switch (retreatType) {
    case "standard":
      return originalTime * 0.5; // 50% of original time
    case "forced":
      return originalTime * 0.75; // 75% of original time
    default:
      return originalTime * 0.5;
  }
};

const executeRetreat = (state, originalTravelTime) => {
  const retreatTime = calculateRetreatCost(originalTravelTime, "standard");
  const retreatCost = {
    food: Math.ceil(retreatTime * 0.05), // Half the consumption rate
    water: Math.ceil(retreatTime * 0.1),
    stamina: Math.ceil(retreatTime * 1), // Same stamina cost
  };

  return {
    ...state,
    currentTime: state.currentTime + retreatTime,
    location: state.previousLocation,
    supplies: {
      food: state.supplies.food - retreatCost.food,
      water: state.supplies.water - retreatCost.water,
      medicine: state.supplies.medicine,
      fuel: state.supplies.fuel,
      tools: state.supplies.tools,
    },
    // Apply stamina cost to all party members
    party: state.party.map((member) => ({
      ...member,
      stats: {
        ...member.stats,
        stamina: Math.max(0, member.stats.stamina - retreatCost.stamina),
      },
    })),
  };
};
```

### **Week 3: Location Enhancement**

#### **Day 1-2: Time-of-Day Effects**

**Files to Modify**:

1. `apps/server/src/game/stateManager.js` - Add time-based location logic
2. `apps/server/src/game/locationManager.js` - New location enhancement system

**Time-of-Day Logic**:

```typescript
// apps/server/src/game/locationManager.js
const getTimeOfDayEffects = (currentTime, location) => {
  const hour = new Date(currentTime * 1000).getHours();

  switch (location.type) {
    case "settlement":
      if (hour >= 22 || hour < 6) {
        return {
          shopOpen: false,
          npcAvailability: 0.3,
          safety: 0.8,
          description: "Most shops are closed, only inn available",
        };
      } else if (hour >= 18) {
        return {
          shopOpen: false,
          npcAvailability: 0.7,
          safety: 0.9,
          description: "Shops closing, inn available",
        };
      } else {
        return {
          shopOpen: true,
          npcAvailability: 1.0,
          safety: 1.0,
          description: "All shops open, NPCs active",
        };
      }

    case "wilderness":
      if (hour >= 22 || hour < 5) {
        return {
          visibility: 0.3,
          predatorRisk: 1.5,
          foraging: 0.5,
          description: "Very dark, dangerous predators active",
        };
      } else if (hour >= 18 || hour < 7) {
        return {
          visibility: 0.6,
          predatorRisk: 1.2,
          foraging: 0.8,
          description: "Decreasing visibility, wildlife active",
        };
      } else {
        return {
          visibility: 1.0,
          predatorRisk: 1.0,
          foraging: 1.0,
          description: "Good visibility, normal wildlife activity",
        };
      }

    default:
      return { description: "Normal conditions" };
  }
};
```

#### **Day 3-4: Dynamic Location Content**

**Files to Modify**:

1. `apps/server/src/game/locationManager.js` - Add dynamic content generation
2. `apps/server/src/server.js` - Update location endpoints

**Dynamic Content**:

```typescript
const generateLocationContent = (location, state) => {
  const timeEffects = getTimeOfDayEffects(state.currentTime, location);
  const weather = getCurrentWeather(location.id);
  const partySize = state.party.length;

  // Base content modified by conditions
  let content = {
    description: location.description,
    availableActions: [],
    npcAvailability: 1.0,
    dangerLevel: location.dangerLevel || 1.0,
    foragingMultiplier: 1.0,
  };

  // Apply time effects
  Object.assign(content, timeEffects);

  // Apply weather effects
  if (weather.type === "heavy_rain") {
    content.visibility *= 0.7;
    content.dangerLevel *= 1.2;
  }

  // Apply party effects
  if (partySize > 3) {
    content.npcAvailability *= 1.2; // Larger party attracts more attention
  }

  return content;
};
```

#### **Day 5: Integration & Testing**

**Testing Checklist**:

- [ ] Equipment effects work in encounters
- [ ] Travel time calculations are accurate
- [ ] Retreat mechanics function correctly
- [ ] Location behavior changes based on time/weather
- [ ] All systems integrate smoothly

## API Endpoints (New for Phase 4)

### **Equipment System**

```typescript
GET / api / equipment / list;
// Returns all equipment in inventory

POST / api / equipment / use;
// Body: { itemId: string, context: 'combat'|'travel'|'social' }
// Applies equipment effects

GET / api / equipment / options;
// Query: ?encounterType=combat&locationId=location123
// Returns available equipment options for situation
```

### **Enhanced Travel**

```typescript
GET / api / travel / calculate;
// Query: ?fromLocation=location1&toLocation=location2&partySkills=...
// Returns detailed travel calculation

POST / api / travel / retreat;
// Body: { originalTime: number, retreatType: 'standard'|'forced' }
// Executes retreat with correct time/cost calculation

GET / api / travel / route;
// Query: ?fromNode=node1&toNode=node2
// Returns enhanced route information with weather/effects
```

### **Location Enhancement**

```typescript
GET / api / location / enhanced;
// Query: ?locationId=location123&currentTime=timestamp
// Returns location with time/weather/party modifications

GET / api / location / content;
// Query: ?locationId=location123&partySize=3&weather=heavy_rain
// Returns dynamic content for current conditions
```

## Integration Points

### **With Previous Phases**

- **Supply System**: Equipment affects resource consumption
- **Party System**: Party skills affect travel and location interactions
- **Weather System**: Weather affects location behavior and travel
- **Survival System**: Time-of-day affects survival mechanics

### **With Future Systems**

- **Content Generation**: Dynamic content affects procedural generation
- **Storytelling**: Location conditions affect narrative generation

## Success Criteria

### **Equipment System**

- ✅ Special items provide unique options in encounters
- ✅ Equipment effects scale appropriately with rarity
- ✅ Cultural items provide social advantages in appropriate contexts
- ✅ Equipment integrates with existing systems (party, survival, economy)

### **Enhanced Travel**

- ✅ Distance-based travel times feel realistic and varied
- ✅ Weather and skills meaningfully affect travel outcomes
- ✅ Travel bounds prevent unrealistic edge cases
- ✅ Retreat mechanics provide strategic options

### **Location Enhancement**

- ✅ Locations behave differently based on time of day
- ✅ Weather and party composition affect location encounters
- ✅ Settlement hours create meaningful time management
- ✅ Dynamic content provides varied experiences

## Testing Strategy

### **Unit Tests**

- Equipment effect calculations
- Travel time and cost calculations
- Location modification logic

### **Integration Tests**

- Equipment effects work with party skills and reputation
- Travel calculations account for all modifiers correctly
- Location content updates based on multiple factors

### **E2E Tests**

- Complete journey with equipment usage and travel decisions
- Location behavior changes meaningfully across different conditions
- All advanced features enhance rather than complicate gameplay

## Files Summary

**New Files**:

- `apps/server/src/game/equipmentManager.js` - Equipment effects and management
- `apps/server/src/game/locationManager.js` - Dynamic location content
- `apps/web/src/components/modals/EquipmentModal.tsx`
- `apps/web/src/components/modals/TravelModal.tsx`

**Modified Files**:

- `packages/shared/src/types.ts` - Add Equipment and enhanced interfaces
- `apps/web/src/game-client/types.ts` - Update game state types
- `apps/server/src/database/sessionSchema.js` - Add equipment and travel tables
- `apps/server/src/game/stateManager.js` - Add equipment/travel/location logic
- `apps/server/src/server.js` - Add equipment/travel/location endpoints
- `apps/web/src/AppHybrid.tsx` - Integrate enhanced systems

**API Changes**:

- 6 new endpoints for equipment, enhanced travel, and location enhancement
- All travel and location endpoints enhanced with new calculation logic

---

_Phase 4 adds sophisticated gameplay systems that create strategic depth and varied experiences. Equipment, enhanced travel, and dynamic locations transform the game from basic survival into a rich adventure with meaningful player choices._
