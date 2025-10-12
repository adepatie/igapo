# Phase 3: World Enhancement

## Overview

**Duration**: 3-4 weeks
**Focus**: Environmental and exploration systems that create immersive world interaction
**Goal**: Transform static locations into dynamic, responsive environments

## Prerequisites

**Phases 1 & 2 Must Be Complete**:

- ✅ Supply System Overhaul (5 distinct types)
- ✅ Survival Mechanics (dehydration/starvation timers)
- ✅ Pocketwatch UI (always-visible time display)
- ✅ Party System (character recruitment and skills)
- ✅ Reputation System (per-party member tracking)
- ✅ Economy System (currency and trading mechanics)

## Current State Analysis

### **Weather System** (Current)

- ❌ No weather types or progression
- ❌ No weather effects on travel/encounters/supplies
- ❌ No weather state machine or UI indicators
- ❌ No weather-dependent encounters

### **Minimap System** (Current)

- ❌ No minimap UI component
- ❌ No node discovery mechanics
- ❌ No distance-based travel calculation
- ❌ No weather effects on travel

### **Camping System** (Current)

- ❌ No camping mechanics
- ❌ No camp setup process
- ❌ No camp events system
- ❌ No camp safety calculations

## Target State

### **Weather System** (Target)

- **7 Weather Types**: Normal, light rain, medium rain, heavy rain, monsoon, tropical storm, heatwave
- **Dynamic Progression**: Weather changes every 2-6 hours with realistic transitions
- **Gameplay Effects**: Travel speed, encounter risk, supply consumption
- **Visual Indicators**: Always-visible weather display

### **Minimap System** (Target)

- **Node Network**: Visual representation of connected locations
- **Discovery Mechanics**: Nodes revealed as player explores
- **Travel Planning**: Click nodes to see travel options
- **Information Display**: Current location, connected nodes, unvisited areas

### **Camping System** (Target)

- **Camp Setup**: Strategic rest points with safety calculations
- **Camp Events**: Random encounters during camping (70% positive, 25% neutral, 5% negative)
- **Resource Management**: Fuel consumption, cooking benefits
- **Safety Factors**: Location, party skills, equipment affect camp safety

## Implementation Plan

### **Week 1: Weather System**

#### **Day 1-2: Weather State Management**

**Files to Create/Modify**:

1. `apps/server/src/database/sessionSchema.js` - Add weather_states table
2. `apps/server/src/game/stateManager.js` - Add weather logic
3. `apps/server/src/game/weatherManager.js` - New weather management system

**Database Schema**:

```sql
CREATE TABLE weather_states (
  id TEXT PRIMARY KEY,
  location_id TEXT,
  weather_type TEXT NOT NULL, -- normal, light_rain, medium_rain, heavy_rain, monsoon, tropical_storm, heatwave
  intensity INTEGER DEFAULT 1, -- 1-5 for severity
  start_time INTEGER NOT NULL,
  duration_hours INTEGER,
  temperature REAL, -- For heatwave calculations
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);
```

**Weather State Management**:

```typescript
// apps/server/src/game/weatherManager.js
class WeatherManager {
  constructor() {
    this.weatherTypes = [
      "normal",
      "light_rain",
      "medium_rain",
      "heavy_rain",
      "monsoon",
      "tropical_storm",
      "heatwave",
    ];

    this.weatherEffects = {
      normal: { travelSpeed: 1.0, encounterRisk: 1.0, supplyMod: 1.0 },
      light_rain: { travelSpeed: 0.9, encounterRisk: 1.05, supplyMod: 1.0 },
      medium_rain: { travelSpeed: 0.75, encounterRisk: 1.1, supplyMod: 1.1 },
      heavy_rain: { travelSpeed: 0.6, encounterRisk: 1.15, supplyMod: 1.2 },
      monsoon: { travelSpeed: 0.4, encounterRisk: 1.25, supplyMod: 1.3 },
      tropical_storm: { travelSpeed: 0.2, encounterRisk: 1.4, supplyMod: 1.5 },
      heatwave: { travelSpeed: 0.85, encounterRisk: 1.2, supplyMod: 1.5 },
    };
  }

  generateWeather(locationId, currentTime) {
    // Weather progression logic
    // Change frequency: every 2-6 hours
    // Seasonal patterns, location influence
    return {
      type: this.selectWeatherType(locationId),
      intensity: this.calculateIntensity(),
      duration: this.calculateDuration(),
      startTime: currentTime,
    };
  }

  getWeatherEffects(weatherType) {
    return this.weatherEffects[weatherType] || this.weatherEffects.normal;
  }
}
```

#### **Day 3-4: Weather UI Component**

**Files to Create**:

1. `apps/web/src/components/ui/WeatherIndicator.tsx`

**Implementation**:

```typescript
// apps/web/src/components/ui/WeatherIndicator.tsx
interface WeatherIndicatorProps {
  weather: {
    type: string;
    intensity: number;
    temperature?: number;
  };
  onClick?: () => void;
}

const WeatherIndicator: React.FC<WeatherIndicatorProps> = ({
  weather,
  onClick,
}) => {
  const weatherConfig = {
    normal: { icon: "☀️", label: "Clear", color: "#FFD700" },
    light_rain: { icon: "🌦️", label: "Light Rain", color: "#87CEEB" },
    medium_rain: { icon: "🌧️", label: "Rain", color: "#4682B4" },
    heavy_rain: { icon: "⛈️", label: "Heavy Rain", color: "#2F4F4F" },
    monsoon: { icon: "🌊", label: "Monsoon", color: "#191970" },
    tropical_storm: { icon: "🌀", label: "Storm", color: "#8B0000" },
    heatwave: { icon: "🔥", label: "Heatwave", color: "#FF4500" },
  };

  const config =
    weatherConfig[weather.type as keyof typeof weatherConfig] ||
    weatherConfig.normal;

  return (
    <div className="weather-indicator" onClick={onClick}>
      <div className="weather-indicator__icon" style={{ color: config.color }}>
        {config.icon}
      </div>
      <div className="weather-indicator__info">
        <div className="weather-indicator__label">{config.label}</div>
        {weather.intensity > 1 && (
          <div className="weather-indicator__intensity">
            Intensity: {weather.intensity}/5
          </div>
        )}
      </div>
    </div>
  );
};
```

#### **Day 5: Weather Integration**

**Files to Modify**:

1. `apps/server/src/game/stateManager.js` - Apply weather effects to actions
2. `apps/server/src/server.js` - Include weather in API responses

**Weather Effects Integration**:

```typescript
// Apply weather effects to travel
const applyWeatherToTravel = (baseTime, weather) => {
  const effects = getWeatherEffects(weather.type);
  return Math.round(baseTime / effects.travelSpeed);
};

// Apply weather effects to survival
const applyWeatherToSurvival = (survivalState, weather) => {
  if (weather.type === "heatwave") {
    // Accelerate dehydration by 33%
    return {
      ...survivalState,
      dehydrationModifier: 1.33,
    };
  }
  return survivalState;
};
```

### **Week 2: Minimap System**

#### **Day 1-2: Minimap Data Structure**

**Files to Modify**:

1. `apps/server/src/game/stateManager.js` - Add minimap data to state
2. `apps/server/src/server.js` - Add minimap API endpoint

**Minimap Data Structure**:

```typescript
interface MinimapNode {
  id: string;
  name: string;
  type: "settlement" | "wilderness" | "river" | "camp" | "danger";
  position: { x: number; y: number };
  discovered: boolean;
  visited: boolean;
  current: boolean;
  connections: string[]; // Connected node IDs
  difficulty?: number;
  biome?: string;
}

interface MinimapData {
  nodes: MinimapNode[];
  playerPosition: { x: number; y: number };
  discoveredNodes: string[];
  currentRoute: string[];
}
```

#### **Day 3-4: Minimap UI Component**

**Files to Create**:

1. `apps/web/src/components/panels/Minimap.tsx`

**Implementation**:

```typescript
// apps/web/src/components/panels/Minimap.tsx
interface MinimapProps {
  minimapData: MinimapData;
  onNodeClick?: (nodeId: string) => void;
  onConnectionClick?: (fromId: string, toId: string) => void;
}

const Minimap: React.FC<MinimapProps> = ({
  minimapData,
  onNodeClick,
  onConnectionClick,
}) => {
  const nodeConfig = {
    settlement: { icon: "🏛️", color: "#FFD700" },
    wilderness: { icon: "🌳", color: "#32CD32" },
    river: { icon: "🌊", color: "#4682B4" },
    camp: { icon: "🏕️", color: "#8B4513" },
    danger: { icon: "⚠️", color: "#DC143C" },
  };

  return (
    <div className="minimap">
      <div className="minimap__header">
        <h3 className="minimap__title">Map</h3>
        <div className="minimap__legend">
          <div className="legend-item">
            <span className="legend-icon">⊙</span>
            <span className="legend-label">Current Location</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">⚫</span>
            <span className="legend-label">Discovered</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">⚪</span>
            <span className="legend-label">Undiscovered</span>
          </div>
        </div>
      </div>

      <div className="minimap__content">
        <svg className="minimap__svg" viewBox="0 0 400 300">
          {/* Render connections first */}
          {minimapData.nodes.map((node) =>
            node.connections.map((connectedId) => {
              const connectedNode = minimapData.nodes.find(
                (n) => n.id === connectedId
              );
              if (!connectedNode) return null;

              return (
                <line
                  key={`${node.id}-${connectedId}`}
                  x1={node.position.x}
                  y1={node.position.y}
                  x2={connectedNode.position.x}
                  y2={connectedNode.position.y}
                  stroke="#666"
                  strokeWidth="1"
                  opacity="0.5"
                />
              );
            })
          )}

          {/* Render nodes */}
          {minimapData.nodes.map((node) => {
            const config =
              nodeConfig[node.type as keyof typeof nodeConfig] ||
              nodeConfig.wilderness;

            return (
              <g key={node.id}>
                <circle
                  cx={node.position.x}
                  cy={node.position.y}
                  r={node.current ? 8 : 6}
                  fill={
                    node.current
                      ? "#FFD700"
                      : node.discovered
                      ? config.color
                      : "#666"
                  }
                  stroke={node.current ? "#FFA500" : "#fff"}
                  strokeWidth={node.current ? 2 : 1}
                  className={`minimap-node ${node.current ? "current" : ""}`}
                  onClick={() => onNodeClick?.(node.id)}
                  style={{ cursor: node.discovered ? "pointer" : "default" }}
                />
                {node.discovered && (
                  <text
                    x={node.position.x}
                    y={node.position.y + 20}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#fff"
                  >
                    {node.name.length > 8
                      ? node.name.substring(0, 8) + "..."
                      : node.name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
```

#### **Day 5: Minimap Integration**

**Files to Modify**:

1. `apps/web/src/components/Layout.tsx` - Add minimap to sidebar
2. `apps/web/src/AppHybrid.tsx` - Connect minimap data

### **Week 3: Camping System**

#### **Day 1-2: Camping Mechanics**

**Files to Create/Modify**:

1. `apps/server/src/game/campingManager.js` - New camping system
2. `apps/server/src/database/sessionSchema.js` - Add camping tracking

**Camping Logic**:

```typescript
// apps/server/src/game/campingManager.js
class CampingManager {
  calculateCampSafety(state, location) {
    let safety = 50; // Base safety

    // Location modifiers
    if (location.type === "settlement") safety += 50;
    if (location.type === "wilderness") safety -= 20;

    // Party skill modifiers
    const hasNavigator = state.party.some((m) =>
      m.skills.some((s) => s.type === "navigation")
    );
    if (hasNavigator) safety += 15;

    const hasHealer = state.party.some((m) =>
      m.skills.some((s) => s.type === "healer")
    );
    if (hasHealer) safety += 5;

    // Equipment modifiers
    if (state.supplies.fuel > 0) safety += 10;

    // Weather modifiers
    const weather = getCurrentWeather(location.id);
    if (weather.type === "tropical_storm") safety -= 15;

    return Math.max(0, Math.min(100, safety));
  }

  generateCampEvent(safety, party) {
    const rand = Math.random() * 100;

    if (rand < safety * 0.7) {
      // Positive event (70% of events)
      return this.generatePositiveEvent(party);
    } else if (rand < safety * 0.95) {
      // Neutral event (25% of events)
      return this.generateNeutralEvent();
    } else {
      // Negative event (5% of events)
      return this.generateNegativeEvent();
    }
  }
}
```

#### **Day 3-4: Camping UI**

**Files to Create**:

1. `apps/web/src/components/modals/CampingModal.tsx`

**Implementation**:

```typescript
// apps/web/src/components/modals/CampingModal.tsx
interface CampingModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: Location;
  party: PartyMember[];
  supplies: SupplyState;
  onCamp: (campOptions: CampOptions) => void;
}

const CampingModal: React.FC<CampingModalProps> = ({
  isOpen,
  onClose,
  location,
  party,
  supplies,
  onCamp,
}) => {
  const [campOptions, setCampOptions] = useState({
    fuelUsed: 1,
    cooking: false,
    watchOrder: [],
  });

  if (!isOpen) return null;

  return (
    <div className="camping-modal">
      <div className="camping-modal__content">
        <div className="camping-modal__header">
          <h2>Set Up Camp</h2>
          <div className="camping-modal__location">📍 {location.name}</div>
        </div>

        <div className="camping-modal__safety">
          <div className="safety-meter">
            <div className="safety-label">Camp Safety</div>
            <div className="safety-bar">
              <div
                className="safety-fill"
                style={{ width: "75%" }} // Calculated from party/location
              />
            </div>
            <div className="safety-value">75% Safe</div>
          </div>
        </div>

        <div className="camping-modal__options">
          <div className="camping-option">
            <label>
              <input
                type="checkbox"
                checked={campOptions.cooking}
                onChange={(e) =>
                  setCampOptions({ ...campOptions, cooking: e.target.checked })
                }
              />
              Cook Food (+10% stamina recovery, -1 fuel)
            </label>
          </div>

          <div className="camping-option">
            <label>
              Fuel Used:
              <select
                value={campOptions.fuelUsed}
                onChange={(e) =>
                  setCampOptions({
                    ...campOptions,
                    fuelUsed: parseInt(e.target.value),
                  })
                }
              >
                <option value={1}>1 unit (basic fire)</option>
                <option value={2}>2 units (large fire, +10% safety)</option>
              </select>
            </label>
          </div>
        </div>

        <div className="camping-modal__effects">
          <h4>Camp Effects</h4>
          <ul>
            <li>✅ Advance time to 5:00 AM</li>
            <li>✅ Restore stamina to 100%</li>
            <li>✅ Minor injuries recover</li>
            <li>✅ +5 morale for good rest</li>
            {campOptions.cooking && (
              <li>✅ Cooked food provides better effects</li>
            )}
          </ul>
        </div>

        <div className="camping-modal__footer">
          <button onClick={onClose}>Cancel</button>
          <button
            onClick={() => onCamp(campOptions)}
            disabled={supplies.fuel < campOptions.fuelUsed}
          >
            Set Up Camp
          </button>
        </div>
      </div>
    </div>
  );
};
```

#### **Day 5: Integration & Testing**

**Testing Checklist**:

- [ ] Weather transitions occur at correct intervals
- [ ] Weather effects applied to travel and survival
- [ ] Minimap shows correct node states
- [ ] Camping safety calculations work correctly
- [ ] Camp events trigger appropriately

## API Endpoints (New for Phase 3)

### **Weather System**

```typescript
GET / api / weather / current;
// Query: ?locationId=location123
// Returns current weather state for location

GET / api / weather / forecast;
// Query: ?locationId=location123&hours=24
// Returns weather forecast for next 24 hours

POST / api / weather / update;
// Body: { locationId: string, weatherType: string, intensity: number }
// Updates weather state for location
```

### **Minimap System**

```typescript
GET / api / minimap / data;
// Returns minimap node data for current session

POST / api / minimap / discover;
// Body: { nodeId: string }
// Marks node as discovered

GET / api / minimap / route;
// Query: ?fromNode=node1&toNode=node2
// Returns travel route information
```

### **Camping System**

```typescript
GET / api / camping / safety;
// Query: ?locationId=location123&partyMembers=...
// Returns camp safety calculation

POST / api / camping / setup;
// Body: { locationId: string, options: { fuelUsed: number, cooking: boolean } }
// Sets up camp and returns camp event

GET / api / camping / events;
// Returns possible camp events for current situation
```

## Integration Points

### **With Phase 1 & 2 Systems**

- **Supply System**: Camping consumes fuel, cooking affects food
- **Survival System**: Camping resets survival timers and provides rest
- **Party System**: Party skills affect camp safety and events
- **Economy System**: No direct integration in Phase 3

### **With Future Systems**

- **Equipment System**: Special items can improve camp safety
- **Location System**: Different locations have different camp modifiers

## Success Criteria

### **Weather System**

- ✅ 7 distinct weather types with realistic progression
- ✅ Weather affects travel speed, encounter risk, and supply consumption
- ✅ Weather indicator shows current conditions
- ✅ Weather transitions create varied gameplay experiences

### **Minimap System**

- ✅ Node network displays correctly with current/discovered/undiscovered states
- ✅ Clicking nodes shows travel options and information
- ✅ Minimap updates as player explores and discovers new areas
- ✅ Provides meaningful exploration feedback

### **Camping System**

- ✅ Camp safety calculations consider location, party, and equipment
- ✅ Camp events provide strategic rest opportunities
- ✅ Resource consumption (fuel) affects camp quality
- ✅ Camping integrates with survival mechanics

## Testing Strategy

### **Unit Tests**

- Weather state transitions and calculations
- Minimap node discovery and connection logic
- Camp safety calculations and event generation

### **Integration Tests**

- Weather effects applied correctly to travel and survival
- Minimap updates when nodes are discovered
- Camping affects survival timers and party morale

### **E2E Tests**

- Complete weather cycle affects gameplay
- Exploration reveals minimap nodes correctly
- Camping provides strategic advantages in difficult situations

## Files Summary

**New Files**:

- `apps/server/src/game/weatherManager.js` - Weather state management
- `apps/server/src/game/campingManager.js` - Camping mechanics
- `apps/web/src/components/ui/WeatherIndicator.tsx`
- `apps/web/src/components/panels/Minimap.tsx`
- `apps/web/src/components/modals/CampingModal.tsx`

**Modified Files**:

- `apps/server/src/database/sessionSchema.js` - Add weather and camping tables
- `apps/server/src/game/stateManager.js` - Integrate weather and camping logic
- `apps/server/src/server.js` - Add weather/minimap/camping endpoints
- `apps/web/src/components/Layout.tsx` - Add weather indicator and minimap
- `apps/web/src/AppHybrid.tsx` - Connect new systems to UI

**API Changes**:

- 7 new endpoints for weather, minimap, and camping
- All existing endpoints updated to include weather data

---

_Phase 3 creates dynamic, responsive world systems that make exploration and survival feel alive and interconnected. Weather, minimap, and camping mechanics provide strategic depth and meaningful player choices._
