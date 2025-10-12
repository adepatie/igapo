# Phase 1: Foundation Enhancement

## Overview

**Duration**: 2-3 weeks
**Focus**: Core survival and time systems that form the foundation for all other gameplay
**Goal**: Transform basic prototype into a game with meaningful resource management and time awareness

## Current State Analysis

### **Supply System** (Current)

```typescript
// packages/shared/src/types.ts
interface WorldState {
  supplies?: number; // Single number
}

// apps/web/src/game-client/types.ts
interface HybridGameState extends GameState {
  supplies: number; // Single number
}
```

**Problems**:

- No distinction between food, water, medicine, fuel, tools
- No consumption mechanics or weight calculations
- UI shows single number, not individual types

### **Survival Mechanics** (Current)

- ❌ No survival timers or penalties
- ❌ No dehydration/starvation tracking
- ❌ No death conditions from resource depletion

### **Time System** (Current)

- ⚠️ Basic time tracking exists but no UI
- ❌ No distinction between interaction time vs action time
- ❌ No always-visible time display

## Target State

### **Supply System** (Target)

```typescript
// New: packages/shared/src/types.ts
interface WorldState {
  supplies?: {
    food: number;
    water: number;
    medicine: number;
    fuel: number;
    tools: number;
  };
}

// New: apps/web/src/game-client/types.ts
interface HybridGameState extends GameState {
  supplies: {
    food: number;
    water: number;
    medicine: number;
    fuel: number;
    tools: number;
  };
}
```

**Features**:

- 5 distinct supply types with individual tracking
- Consumption affects appropriate types
- Weight calculations and carrying capacity
- UI shows current/max for each type

### **Survival Mechanics** (Target)

- **Dehydration**: 72-hour timeline with progressive penalties
- **Starvation**: 21-day timeline with progressive penalties
- **Environmental Modifiers**: Heatwave accelerates, cool weather extends
- **Death Conditions**: Game over when thresholds exceeded

### **Time System** (Target)

- **Pocketwatch UI**: Always-visible brass pocketwatch in top-right
- **Interaction vs Action Time**: Dialogue = real-time, travel = game-time
- **Time of Day Effects**: Different gameplay based on time periods

## Implementation Plan

### **Week 1: Supply System Overhaul**

#### **Day 1-2: Database Schema & Types**

**Files to Create/Modify**:

1. `apps/server/src/database/sessionSchema.js` - Add session_supplies table
2. `packages/shared/src/types.ts` - Add SupplyState interface
3. `apps/web/src/game-client/types.ts` - Update HybridGameState

**Database Schema**:

```sql
CREATE TABLE session_supplies (
  session_id TEXT NOT NULL,
  supply_type TEXT NOT NULL, -- food, water, medicine, fuel, tools
  quantity REAL NOT NULL DEFAULT 0,
  max_capacity REAL,
  last_consumed INTEGER, -- Unix timestamp for survival tracking
  PRIMARY KEY (session_id, supply_type)
);
```

**Type Definitions**:

```typescript
// packages/shared/src/types.ts
export interface SupplyState {
  food: number;
  water: number;
  medicine: number;
  fuel: number;
  tools: number;
}

// apps/web/src/game-client/types.ts
export interface HybridGameState extends GameState {
  supplies: SupplyState;
  // ... other fields
}
```

#### **Day 3-4: State Manager Updates**

**Files to Modify**:

1. `apps/server/src/game/stateManager.js` - Update createInitialState()
2. `apps/server/src/game/stateManager.js` - Update action execution
3. `apps/server/src/server.js` - Update API responses

**Implementation**:

```typescript
// apps/server/src/game/stateManager.js
const createInitialState = (playerName, sessionId) => ({
  // ... existing fields
  supplies: {
    food: 20, // 20 rations
    water: 30, // 30 canteens
    medicine: 3, // 3 doses
    fuel: 10, // 10 units
    tools: 5, // 5 items
  },
});
```

#### **Day 5: UI Component Creation**

**Files to Create**:

1. `apps/web/src/components/ui/SupplyDisplay.tsx`

**Implementation**:

```typescript
// apps/web/src/components/ui/SupplyDisplay.tsx
interface SupplyState {
  food: { current: number; max: number };
  water: { current: number; max: number };
  medicine: { current: number; max: number };
  fuel: { current: number; max: number };
  tools: { current: number; max: number };
}

const SupplyDisplay: React.FC<{ supplies: SupplyState }> = ({ supplies }) => {
  const supplyConfig = {
    food: { icon: "🍖", color: "#8B4513", unit: "rations" },
    water: { icon: "💧", color: "#4682B4", unit: "canteens" },
    medicine: { icon: "💊", color: "#DC143C", unit: "doses" },
    fuel: { icon: "🔥", color: "#FF6347", unit: "units" },
    tools: { icon: "🔧", color: "#708090", unit: "items" },
  };

  return (
    <div className="supply-display">
      {Object.entries(supplies).map(([type, data]) => {
        const config = supplyConfig[type as keyof SupplyState];
        const percentage = (data.current / data.max) * 100;

        return (
          <div key={type} className="supply-item">
            <div className="supply-icon">{config.icon}</div>
            <div className="supply-info">
              <div className="supply-bar">
                <div
                  className="supply-fill"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: percentage < 25 ? "#DC143C" : "#32CD32",
                  }}
                />
              </div>
              <div className="supply-text">
                {data.current}/{data.max} {config.unit}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
```

### **Week 2: Survival Mechanics**

#### **Day 1-2: Survival State Tracking**

**Files to Create/Modify**:

1. `apps/server/src/database/sessionSchema.js` - Add session_survival table
2. `apps/server/src/game/stateManager.js` - Add survival fields
3. `apps/server/src/game/stateManager.js` - Implement survival logic

**Database Schema**:

```sql
CREATE TABLE session_survival (
  session_id TEXT PRIMARY KEY,
  last_food_consumption INTEGER, -- Unix timestamp
  last_water_consumption INTEGER, -- Unix timestamp
  starvation_stage INTEGER DEFAULT 0, -- 0-4 stages
  dehydration_stage INTEGER DEFAULT 0, -- 0-4 stages
  survival_modifiers TEXT -- JSON: {heatwave: 1.33, partySize: 1.2}
);
```

**Survival Logic**:

```typescript
// apps/server/src/game/stateManager.js
const updateSurvivalState = (state, currentTime) => {
  const timeSinceFood = currentTime - state.survival.lastFoodConsumption;
  const timeSinceWater = currentTime - state.survival.lastWaterConsumption;

  // Calculate stages based on time thresholds
  const dehydrationStage = calculateDehydrationStage(timeSinceWater);
  const starvationStage = calculateStarvationStage(timeSinceFood);

  return {
    ...state,
    survival: {
      ...state.survival,
      dehydrationStage,
      starvationStage,
      timeRemaining: {
        dehydration: Math.max(0, 72 * 3600 - timeSinceWater),
        starvation: Math.max(0, 21 * 24 * 3600 - timeSinceFood),
      },
    },
  };
};
```

#### **Day 3-4: Penalty Calculations**

**Files to Modify**:

1. `apps/server/src/game/stateManager.js` - Add penalty calculations
2. `apps/server/src/game/stateManager.js` - Update action execution

**Penalty Implementation**:

```typescript
const applySurvivalPenalties = (state) => {
  const penalties = {
    staminaRegeneration: 1.0,
    travelSpeed: 1.0,
    maxHealth: 1.0,
  };

  // Dehydration penalties
  switch (state.survival.dehydrationStage) {
    case 1:
      penalties.staminaRegeneration *= 0.9;
      penalties.travelSpeed *= 0.95;
      break;
    case 2:
      penalties.staminaRegeneration *= 0.75;
      penalties.travelSpeed *= 0.85;
      penalties.maxHealth *= 0.9;
      break;
    case 3:
      penalties.staminaRegeneration *= 0.5;
      penalties.travelSpeed *= 0.7;
      penalties.maxHealth *= 0.75;
      break;
    case 4:
      penalties.staminaRegeneration *= 0.25;
      penalties.travelSpeed *= 0.5;
      penalties.maxHealth *= 0.5;
      break;
  }

  // Starvation penalties (less severe initially)
  switch (state.survival.starvationStage) {
    case 1:
      penalties.staminaRegeneration *= 0.95;
      break;
    case 2:
      penalties.staminaRegeneration *= 0.85;
      penalties.travelSpeed *= 0.9;
      break;
    case 3:
      penalties.staminaRegeneration *= 0.6;
      penalties.travelSpeed *= 0.75;
      penalties.maxHealth *= 0.8;
      break;
    case 4:
      penalties.staminaRegeneration *= 0.3;
      penalties.travelSpeed *= 0.5;
      penalties.maxHealth *= 0.5;
      break;
  }

  return penalties;
};
```

#### **Day 5: UI Integration**

**Files to Create**:

1. `apps/web/src/components/ui/SurvivalStatus.tsx`

**Implementation**:

```typescript
// apps/web/src/components/ui/SurvivalStatus.tsx
interface SurvivalState {
  dehydration: { stage: number; timeRemaining: number };
  starvation: { stage: number; timeRemaining: number };
}

const SurvivalStatus: React.FC<{ survival: SurvivalState }> = ({
  survival,
}) => {
  const getStageColor = (stage: number) => {
    const colors = ["#32CD32", "#FFD700", "#FF8C00", "#DC143C"];
    return colors[stage] || colors[0];
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="survival-status">
      <div className="survival-item">
        <div className="survival-label">💧 Hydration</div>
        <div className="survival-bar">
          <div
            className="survival-fill"
            style={{
              width: `${((4 - survival.dehydration.stage) / 4) * 100}%`,
              backgroundColor: getStageColor(survival.dehydration.stage),
            }}
          />
        </div>
        <div className="survival-time">
          {formatTime(survival.dehydration.timeRemaining)}
        </div>
      </div>

      <div className="survival-item">
        <div className="survival-label">🍖 Nutrition</div>
        <div className="survival-bar">
          <div
            className="survival-fill"
            style={{
              width: `${((4 - survival.starvation.stage) / 4) * 100}%`,
              backgroundColor: getStageColor(survival.starvation.stage),
            }}
          />
        </div>
        <div className="survival-time">
          {formatTime(survival.starvation.timeRemaining)}
        </div>
      </div>
    </div>
  );
};
```

### **Week 3: Pocketwatch UI & Integration**

#### **Day 1-2: Component Creation**

**Files to Create**:

1. `apps/web/src/components/ui/Pocketwatch.tsx`

**Implementation**:

```typescript
// apps/web/src/components/ui/Pocketwatch.tsx
interface PocketwatchProps {
  currentTime: string; // "2:45 PM"
  currentDay: number; // 3
  timeOfDay: "dawn" | "morning" | "afternoon" | "dusk" | "evening" | "night";
  onClick?: () => void;
}

const Pocketwatch: React.FC<PocketwatchProps> = ({
  currentTime,
  currentDay,
  timeOfDay,
  onClick,
}) => {
  const timeIcon = {
    dawn: "🌅",
    morning: "☀️",
    afternoon: "☀️",
    dusk: "🌆",
    evening: "🌙",
    night: "🌙",
  }[timeOfDay];

  return (
    <div className="pocketwatch" onClick={onClick}>
      <div className="pocketwatch__face">
        <div className="pocketwatch__icon">{timeIcon}</div>
        <div className="pocketwatch__time">{currentTime}</div>
        <div className="pocketwatch__day">Day {currentDay}</div>
      </div>
    </div>
  );
};
```

#### **Day 3-4: Layout Integration**

**Files to Modify**:

1. `apps/web/src/components/Layout.tsx` - Add pocketwatch to header
2. `apps/web/src/AppHybrid.tsx` - Connect to game state

**Layout Integration**:

```typescript
// apps/web/src/components/Layout.tsx
export function Layout({
  children,
  sidebar,
  footer,
  pocketwatch,
}: LayoutProps) {
  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <h1 className="app-shell__brand">Igapó Expedition</h1>
        {pocketwatch && (
          <div className="app-shell__pocketwatch">{pocketwatch}</div>
        )}
      </header>
      {/* ... rest of layout */}
    </div>
  );
}
```

#### **Day 5: Testing & Polish**

**Testing Checklist**:

- [ ] Supply consumption works correctly for different actions
- [ ] Survival timers update when supplies are consumed
- [ ] Penalties are applied correctly based on survival stages
- [ ] Pocketwatch displays accurate time and day
- [ ] UI responds correctly to state changes
- [ ] No performance impact on existing functionality

## API Endpoints (New for Phase 1)

### **Supply Management**

```typescript
GET / api / supplies;
// Returns current supply levels for all 5 types

POST / api / supplies / consume;
// Body: { type: 'food', amount: 2 }
// Updates supply levels and survival timers

GET / api / survival / status;
// Returns current survival state and warnings
```

## Database Migration Strategy

**Migration Steps**:

1. Create new tables alongside existing ones
2. Populate new tables with initial data
3. Update existing code to use new tables
4. Test thoroughly before removing old tables
5. Remove old tables in subsequent phases

**Backup Strategy**:

- Export existing session data before migration
- Test migration on development environment first
- Have rollback script ready if issues arise

## Integration Points

### **With Existing Systems**

- **Action System**: Update action execution to consume appropriate supplies
- **Dialogue System**: Continue working without time advancement
- **Exploration System**: Continue working with new supply mechanics

### **With Future Systems**

- **Party System**: Party size affects survival tolerance
- **Weather System**: Weather affects survival timelines
- **Economy System**: Supplies can be traded for currency

## Success Criteria

### **Supply System**

- ✅ 5 distinct supply types tracked separately in database
- ✅ Supply consumption affects appropriate types (food for eating, water for drinking)
- ✅ UI shows current levels for all 5 supply types with color coding
- ✅ Basic supply weight calculations implemented

### **Survival Mechanics**

- ✅ Survival timers track time since last consumption
- ✅ Penalties applied at realistic intervals (12h, 24h, 48h for dehydration)
- ✅ Death occurs at 72h dehydration, 21d starvation
- ✅ UI shows survival status and warnings

### **Time System**

- ✅ Pocketwatch shows accurate time and day
- ✅ Always-visible during all game modes
- ✅ Clickable for time management panel
- ✅ Time advances only during actions, not dialogue

## Testing Strategy

### **Unit Tests**

- Supply consumption calculations
- Survival stage calculations
- Time advancement logic

### **Integration Tests**

- Action execution affects correct supply types
- Survival penalties applied correctly
- UI updates when state changes

### **E2E Tests**

- Complete gameplay session with supply management
- Survival warnings appear at correct times
- Pocketwatch displays accurate information

## Files Summary

**New Files**:

- `apps/web/src/components/ui/SupplyDisplay.tsx`
- `apps/web/src/components/ui/SurvivalStatus.tsx`
- `apps/web/src/components/ui/Pocketwatch.tsx`

**Modified Files**:

- `packages/shared/src/types.ts` - Add SupplyState interface
- `apps/web/src/game-client/types.ts` - Update HybridGameState
- `apps/server/src/database/sessionSchema.js` - Add new tables
- `apps/server/src/game/stateManager.js` - Update state creation/consumption
- `apps/web/src/components/Layout.tsx` - Add pocketwatch integration
- `apps/web/src/AppHybrid.tsx` - Connect new UI components

**API Changes**:

- All existing endpoints updated to return new supply/survival data
- 3 new endpoints added for supply and survival management

---

_Phase 1 establishes the core foundation systems that all other gameplay features will build upon. Complete implementation and testing of these systems is critical before moving to Phase 2._
