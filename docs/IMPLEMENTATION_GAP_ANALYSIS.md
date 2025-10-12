# Igapó Game Implementation Gap Analysis & Development Plan

## Executive Summary

This document provides a **realistic, incremental development plan** based on thorough analysis of the current codebase and game design specification. The plan prioritizes **achievable milestones** and **technical accuracy** for successful agent-driven development.

---

## Current Implementation Status (Validated)

### ✅ **Fully Implemented & Working**

- **Session Management**: ✅ Complete in-memory SQLite per player session system
- **Character System**: ✅ Session-based character relationships and conversation memory
- **Dialogue System**: ✅ MCP integration with AI-powered dialogue generation
- **API Architecture**: ✅ 13+ endpoints for dialogue, actions, exploration, sessions
- **Frontend Architecture**: ✅ React-based modal system with proper state management
- **Database Foundation**: ✅ Amazon data populated (locations, animals, plants, characters)
- **Basic State Management**: ✅ Player state with location, morale, stamina, supplies

### ⚠️ **Partially Implemented (Need Enhancement)**

- **Time System**: ⚠️ Basic tracking exists, needs pocketwatch UI and interaction vs action time distinction
- **Action System**: ⚠️ Basic action framework exists, needs categorization and mode transitions
- **Exploration System**: ⚠️ Basic exploration mechanics exist, needs full implementation

### ❌ **Major Gaps (High Priority)**

- **Supply System**: ❌ Single "supplies" number vs 5 distinct types (food, water, medicine, fuel, tools)
- **Survival Mechanics**: ❌ No dehydration/starvation timers or penalties
- **Weather System**: ❌ No weather effects, progression, or UI indicators
- **Party System**: ❌ No crew/party member management or skills
- **Reputation System**: ❌ No per-party member reputation tracking
- **Economy System**: ❌ No currency (réis) or trading mechanics
- **Minimap UI**: ❌ No map display or node exploration mechanics
- **Camping System**: ❌ No camping mechanics or camp events
- **Equipment System**: ❌ No special items inventory or encounter effects
- **Procedural Content**: ❌ No infinite replayability through template generation

---

## Detailed Gap Analysis by Game Design Section

### 1. **Player Character System (Sec 17)**

**Status**: ❌ Partially implemented
**Gaps**:

- ✅ Player name selection implemented
- ❌ Static character with English-only language (needs verification)
- ❌ No player stats (health, stamina, carrying capacity) in UI
- ❌ No reputation display or mechanics

### 2. **Economy & Trading System (Sec 18)**

**Status**: ❌ Not implemented
**Gaps**:

- ❌ No currency system (Brazilian réis)
- ❌ No supply trading mechanics
- ❌ No special items trading
- ❌ No price tiers by location type
- ❌ No barter system for remote areas

### 3. **Weather System (Sec 19)**

**Status**: ❌ Not implemented
**Gaps**:

- ❌ No weather types or progression
- ❌ No weather effects on travel/encounters/supplies
- ❌ No weather state machine or UI indicators
- ❌ No weather-dependent encounters

### 4. **Time System (Sec 4)**

**Status**: ⚠️ Partially implemented
**Gaps**:

- ❌ No pocketwatch UI component
- ❌ No distinction between interaction time vs action time
- ❌ No travel time bounds (30 min min, 3 days max)
- ❌ No retreat mechanics implementation
- ❌ Time advances during all actions (should not advance during dialogue)

### 5. **Supply System (Sec 9)**

**Status**: ❌ Major gap
**Gaps**:

- ❌ Single "supplies" number vs 5 distinct types
- ❌ No realistic survival mechanics (dehydration/starvation)
- ❌ No food spoilage system
- ❌ No water purification mechanics
- ❌ No medicine system

### 6. **Party System (Sec 5)**

**Status**: ❌ Not implemented
**Gaps**:

- ❌ No party/crew member management
- ❌ No skill system (Navigation, Hunting, Naturalist, Healer)
- ❌ No character stats (morale, trustworthiness, charisma, etc.)
- ❌ No language proficiency system

### 7. **Reputation System (Sec 17.2)**

**Status**: ❌ Not implemented
**Gaps**:

- ❌ No per-party member reputation tracking
- ❌ No reputation effects on gameplay
- ❌ No reputation UI display
- ❌ No regional reputation diffusion

### 8. **Map & Travel System (Sec 3)**

**Status**: ⚠️ Basic implementation
**Gaps**:

- ❌ No minimap UI component
- ❌ No node discovery mechanics
- ❌ No distance-based travel calculation
- ❌ No weather effects on travel
- ❌ Static route vs procedural generation

### 9. **Camping System (Sec 11)**

**Status**: ❌ Not implemented
**Gaps**:

- ❌ No camping mechanics
- ❌ No camp setup process
- ❌ No camp events system
- ❌ No camp safety calculations

### 10. **Content Generation (Sec 21)**

**Status**: ❌ Not implemented
**Gaps**:

- ❌ No procedural content generation
- ❌ No character templates (500+ NPCs)
- ❌ No location generation (1000+ locations)
- ❌ No animal encounter templates (200+ species)

---

## Improved Development Strategy

### **Key Principles for Agent Success**

1. **Start Small, Build Incrementally**: Focus on **one system at a time** with clear success criteria
2. **Leverage Existing Code**: Build upon working dialogue/exploration systems
3. **Realistic Scope**: Each phase should be **completable in 2-3 weeks** with clear deliverables
4. **Technical Accuracy**: Ensure database schemas match current architecture
5. **Test-First Approach**: Each system should be testable before moving to the next

### **Revised Phase Structure (Realistic Timeline)**

**Phase 1: Foundation Enhancement (2-3 weeks)**

- ✅ **Supply System Overhaul** - Replace single supplies with 5 distinct types
- ✅ **Survival Mechanics** - Add dehydration/starvation timers and penalties
- ✅ **Pocketwatch UI** - Visual time display with interaction vs action distinction

**Phase 2: Player Agency (3-4 weeks)**

- ✅ **Party System** - Character recruitment and basic skill framework
- ✅ **Reputation System** - Per-party member reputation tracking
- ✅ **Economy Basics** - Currency system and simple trading

**Phase 3: World Enhancement (3-4 weeks)**

- ✅ **Weather System** - Basic weather progression and travel effects
- ✅ **Minimap UI** - Node exploration and discovery display
- ✅ **Camping Basics** - Camp setup and rest mechanics

**Phase 4: Advanced Features (4-5 weeks)**

- ✅ **Equipment System** - Special items and encounter effects
- ✅ **Enhanced Travel** - Distance calculation and weather modifiers
- ✅ **Location Enhancement** - Time-of-day effects and dynamic content

**Phase 5: Content & Polish (4-6 weeks)**

- ✅ **Procedural Templates** - Character and location generation framework
- ✅ **Dynamic Storytelling** - Consequence chains and emergent narratives
- ✅ **UI Polish** - Complete interface refinement and testing

---

## Phase 1: Foundation Enhancement Implementation

### **1.1 Supply System Overhaul (Week 1)**

**Current State Analysis**:

```typescript
// Current: packages/shared/src/types.ts
interface WorldState {
  supplies?: number; // Single number
}

// Current: apps/web/src/game-client/types.ts
interface HybridGameState extends GameState {
  supplies: number; // Single number
}
```

**Target State**:

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

**Implementation Tasks**:

1. **Database Schema**: Add `session_supplies` table for per-session tracking
2. **Type Updates**: Modify shared and frontend type definitions
3. **State Manager**: Update `createInitialState()` and supply consumption logic
4. **UI Component**: Create `SupplyDisplay.tsx` component
5. **Integration**: Update all API endpoints to use new supply structure

**Success Criteria**:

- ✅ 5 distinct supply types tracked separately in database
- ✅ Supply consumption affects appropriate types (food for eating, water for drinking)
- ✅ UI shows current levels for all 5 supply types
- ✅ Basic supply weight calculations implemented

**Files to Modify (Priority Order)**:

1. `packages/shared/src/types.ts` - Add supply object interface
2. `apps/web/src/game-client/types.ts` - Update HybridGameState
3. `apps/server/src/database/sessionSchema.js` - Add session_supplies table
4. `apps/server/src/game/stateManager.js` - Update state creation/consumption
5. `apps/web/src/components/SupplyDisplay.tsx` - New component
6. `apps/web/src/AppHybrid.tsx` - Integrate supply display

### **1.2 Survival Mechanics (Week 2)**

**Current State**: No survival timers or penalties
**Target State**: Basic dehydration/starvation with realistic thresholds

**Implementation Strategy**:

1. **Database**: Add `session_survival` table for tracking
2. **State Updates**: Add survival fields to game state
3. **Timer Logic**: Implement time-based penalty progression
4. **UI Warnings**: Add survival status indicators
5. **Death Conditions**: Handle game over when thresholds exceeded

**Key Features**:

- **Dehydration**: 72-hour timeline with progressive penalties
- **Starvation**: 21-day timeline with progressive penalties
- **Environmental Modifiers**: Heatwave accelerates, cool weather extends
- **Activity Modifiers**: Travel increases consumption, rest slows progression

**Success Criteria**:

- ✅ Survival timers track time since last consumption
- ✅ Penalties applied at realistic intervals (12h, 24h, 48h for dehydration)
- ✅ Death occurs at 72h dehydration, 21d starvation
- ✅ UI shows survival status and warnings

### **1.3 Pocketwatch UI (Week 2-3)**

**Current State**: Basic time tracking without visual UI
**Target State**: Visual pocketwatch with interaction vs action time distinction

**Implementation Strategy**:

1. **UI Component**: Create `Pocketwatch.tsx` component
2. **Time Logic**: Implement interaction vs action time distinction
3. **State Integration**: Connect to existing time tracking
4. **Visual Design**: Brass pocketwatch aesthetic matching game theme
5. **Interactions**: Clickable for time management panel

**Key Features**:

- **Always Visible**: Top-right corner, never hidden
- **Real-Time Updates**: Shows time passage during actions only
- **Time of Day Icons**: Visual indicators (sun/moon/dawn/dusk)
- **Click Interaction**: Opens detailed time management panel

**Files to Create/Modify**:

- `apps/web/src/components/Pocketwatch.tsx` - New component
- `apps/web/src/AppHybrid.tsx` - Integrate into layout
- `apps/web/src/components/Layout.tsx` - Add to header area

---

## Technical Architecture Considerations

### Database Design Updates

**New Tables Needed**:

```sql
-- Supply tracking per session
CREATE TABLE session_supplies (
  session_id TEXT NOT NULL,
  supply_type TEXT NOT NULL, -- food, water, medicine, fuel, tools
  quantity REAL NOT NULL DEFAULT 0,
  max_capacity REAL,
  PRIMARY KEY (session_id, supply_type)
);

-- Survival state tracking
CREATE TABLE session_survival (
  session_id TEXT PRIMARY KEY,
  last_food_consumption INTEGER,
  last_water_consumption INTEGER,
  starvation_stage INTEGER DEFAULT 0,
  dehydration_stage INTEGER DEFAULT 0,
  survival_modifiers TEXT -- JSON of current modifiers
);

-- Weather system
CREATE TABLE weather_states (
  id TEXT PRIMARY KEY,
  location_id TEXT,
  weather_type TEXT NOT NULL,
  intensity INTEGER DEFAULT 1,
  start_time INTEGER NOT NULL,
  duration_hours INTEGER,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Party/crew system
CREATE TABLE session_party (
  session_id TEXT NOT NULL,
  character_id TEXT NOT NULL,
  role TEXT NOT NULL,
  skills TEXT, -- JSON array of skills
  stats TEXT, -- JSON object of character stats
  reputation_groups TEXT, -- JSON object of reputation by group
  PRIMARY KEY (session_id, character_id)
);

-- Economy system
CREATE TABLE session_economy (
  session_id TEXT PRIMARY KEY,
  currency_amount REAL DEFAULT 0,
  barter_goods TEXT -- JSON of tradeable items
);
```

### API Endpoint Updates

**New Endpoints Needed**:

- `GET /api/supplies` - Get current supply levels
- `POST /api/supplies/consume` - Consume supplies for actions
- `GET /api/survival/status` - Get survival state and warnings
- `GET /api/weather/current` - Get current weather state
- `POST /api/party/recruit` - Recruit party members
- `GET /api/party/status` - Get party member details and stats
- `POST /api/trade` - Execute trading transactions
- `GET /api/reputation` - Get reputation status by group

### Frontend Component Architecture

**New Components Needed**:

- `Pocketwatch` - Time display and management
- `SupplyDisplay` - Five supply type counters
- `SurvivalStatus` - Health/dehydration/starvation indicators
- `WeatherIndicator` - Current weather display
- `PartyPanel` - Party member management and stats
- `ReputationDisplay` - Reputation status by group
- `TradingInterface` - Currency and barter trading UI
- `Minimap` - Node exploration and discovery display

---

## Risk Assessment & Mitigation

### High-Risk Areas

1. **Performance**: Procedural content generation may impact performance
2. **Complexity**: Multiple interlocking systems (weather, survival, party, economy)
3. **Balance**: Survival timers and resource scarcity may frustrate players
4. **Technical Debt**: Current simple systems may need extensive refactoring

### Mitigation Strategies

1. **Incremental Implementation**: Build systems one at a time, test thoroughly
2. **Modular Architecture**: Design systems to be independent where possible
3. **Balance Testing**: Extensive playtesting at each phase
4. **Fallback Systems**: Maintain backwards compatibility during transitions

---

## Success Metrics

### Phase 1 Success Criteria

- [ ] Supply system displays 5 distinct types correctly
- [ ] Survival mechanics trigger appropriate penalties at realistic intervals
- [ ] Pocketwatch UI shows accurate time and distinguishes interaction vs action time
- [ ] Weather affects travel speed and creates different gameplay experiences

### Phase 2 Success Criteria

- [ ] Party members can be recruited with distinct skills and stats
- [ ] Reputation system affects NPC interactions and available options
- [ ] Currency system enables meaningful trading decisions
- [ ] Special items provide unique encounter options

### Phase 3 Success Criteria

- [ ] Minimap shows node exploration and discovery mechanics
- [ ] Camping provides strategic rest and event opportunities
- [ ] Travel feels dynamic with weather, distance, and time effects
- [ ] Locations change behavior based on time of day

### Phase 4 Success Criteria

- [ ] Game provides meaningfully different experiences across multiple playthroughs
- [ ] 500+ unique NPCs with distinct personalities and knowledge
- [ ] Emergent storytelling through consequence chains
- [ ] Player agency in all major decision points

---

## Realistic Development Timeline

### **Phase 1: Foundation Enhancement (2-3 weeks)**

**Week 1**: Supply System Overhaul

- Day 1-2: Database schema and type updates
- Day 3-4: State manager modifications
- Day 5: UI component creation and integration

**Week 2**: Survival Mechanics

- Day 1-2: Database and state tracking
- Day 3-4: Timer logic and penalty calculations
- Day 5: UI warnings and death conditions

**Week 3**: Pocketwatch UI & Integration

- Day 1-2: Component creation and styling
- Day 3-4: Time logic implementation
- Day 5: Testing and polish

### **Phase 2: Player Agency (3-4 weeks)**

**Week 4**: Party System Basics

- Character recruitment framework
- Basic skill system implementation

**Week 5-6**: Reputation System

- Per-party member reputation tracking
- UI display and mechanics

**Week 7**: Economy Basics

- Currency system (réis)
- Simple trading mechanics

### **Phase 3: World Enhancement (3-4 weeks)**

**Week 8**: Weather System

- Basic weather progression
- Travel speed effects

**Week 9**: Minimap UI

- Node exploration display
- Discovery mechanics

**Week 10-11**: Camping System

- Camp setup and rest mechanics
- Basic camp events

### **Phase 4: Advanced Features (4-5 weeks)**

**Week 12-13**: Equipment System

- Special items inventory
- Encounter effects

**Week 14-15**: Enhanced Travel

- Distance calculation
- Weather modifiers

**Week 16**: Location Enhancement

- Time-of-day effects

### **Phase 5: Content & Polish (4-6 weeks)**

**Week 17-18**: Procedural Templates

- Character generation framework
- Location templates

**Week 19-20**: Dynamic Storytelling

- Consequence chains
- Emergent narratives

**Week 21-22**: UI Polish & Testing

- Interface refinement
- Comprehensive testing

**Total Realistic Timeline: 22-26 weeks (5-6 months)**

### **Weekly Checkpoints**

- **End of Week 3**: Phase 1 complete - supply system, survival, pocketwatch working
- **End of Week 7**: Phase 2 complete - party, reputation, economy functional
- **End of Week 11**: Phase 3 complete - weather, minimap, camping integrated
- **End of Week 16**: Phase 4 complete - equipment, travel, locations enhanced
- **End of Week 22**: Full game with content generation and polish

---

## Next Steps

1. **Review and Approve Plan**: Confirm this analysis and development approach
2. **Resource Allocation**: Assign team members to priority systems
3. **Technical Planning**: Create detailed technical specifications for Phase 1 systems
4. **Development Kickoff**: Begin with supply system overhaul as foundation
5. **Regular Reviews**: Weekly progress reviews and plan adjustments

---

_This plan represents a comprehensive roadmap to transform the current basic prototype into the full roguelike adventure game specified in the design document. The phased approach ensures steady progress while maintaining system stability._
