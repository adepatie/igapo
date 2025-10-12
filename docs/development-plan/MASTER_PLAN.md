# Igapó Game Development Master Plan

## Overview

This master plan provides the complete development roadmap for transforming the current Igapó prototype into a full-featured roguelike adventure game. The plan is structured into 5 phases, each with its own dedicated document containing detailed implementation instructions.

## Development Philosophy

### **Incremental Development**

- Build one system at a time with clear success criteria
- Each phase enhances existing functionality rather than rebuilding
- Test integration before moving to the next phase

### **Technical Excellence**

- Maintain backward compatibility during transitions
- Follow existing code patterns and architectural decisions
- Use TypeScript interfaces for type safety
- Implement proper error handling and validation

### **Player Experience Focus**

- Each phase should enhance gameplay meaningfully
- New features should integrate seamlessly with existing UI
- Maintain game balance and progression

## Phase Structure & Timeline

### **Phase 1: Foundation Enhancement (2-3 weeks)**

**Document**: `phases/PHASE_1_FOUNDATION.md`

**Focus**: Core survival and time systems

- Supply System Overhaul (5 distinct types vs single number)
- Survival Mechanics (dehydration/starvation timers)
- Pocketwatch UI (always-visible time display)

**Success Criteria**:

- 5 distinct supply types tracked separately
- Realistic survival timers with progressive penalties
- Always-visible time display with interaction vs action distinction

### **Phase 2: Player Agency (3-4 weeks)**

**Document**: `phases/PHASE_2_PLAYER_AGENCY.md`

**Focus**: Player capabilities and social systems

- Party System (character recruitment and skills)
- Reputation System (per-party member tracking)
- Economy System (currency and trading mechanics)

**Success Criteria**:

- Party members provide distinct skills and capabilities
- Reputation affects NPC interactions and opportunities
- Meaningful trading decisions with currency system

### **Phase 3: World Enhancement (3-4 weeks)**

**Document**: `phases/PHASE_3_WORLD_SYSTEMS.md`

**Focus**: Environmental and exploration systems

- Weather System (progression and travel effects)
- Minimap UI (node exploration and discovery)
- Camping System (camp setup and events)

**Success Criteria**:

- Weather creates varied gameplay experiences
- Minimap provides meaningful exploration feedback
- Camping offers strategic rest and event opportunities

### **Phase 4: Advanced Features (4-5 weeks)**

**Document**: `phases/PHASE_4_ADVANCED_FEATURES.md`

**Focus**: Complex gameplay systems

- Equipment System (special items and encounter effects)
- Enhanced Travel (distance calculation and modifiers)
- Location Enhancement (time-of-day effects)

**Success Criteria**:

- Equipment provides unique encounter options
- Travel feels dynamic with multiple factors
- Locations behave differently based on time/weather

### **Phase 5: Content & Polish (4-6 weeks)**

**Document**: `phases/PHASE_5_CONTENT_POLISH.md`

**Focus**: Infinite replayability and refinement

- Procedural Templates (character and location generation)
- Dynamic Storytelling (consequence chains)
- UI Polish & Testing (complete interface refinement)

**Success Criteria**:

- Meaningfully different experiences across playthroughs
- Emergent storytelling through player choices
- Polished, accessible interface

## Technical Architecture Overview

### **Database Schema Evolution**

**Phase 1 Tables**:

```sql
-- Supply tracking per session
CREATE TABLE session_supplies (
  session_id TEXT NOT NULL,
  supply_type TEXT NOT NULL, -- food, water, medicine, fuel, tools
  quantity REAL NOT NULL DEFAULT 0,
  max_capacity REAL,
  last_consumed INTEGER,
  PRIMARY KEY (session_id, supply_type)
);

-- Survival state tracking
CREATE TABLE session_survival (
  session_id TEXT PRIMARY KEY,
  last_food_consumption INTEGER,
  last_water_consumption INTEGER,
  starvation_stage INTEGER DEFAULT 0,
  dehydration_stage INTEGER DEFAULT 0,
  survival_modifiers TEXT
);
```

**Phase 2 Tables**:

```sql
-- Party/crew system
CREATE TABLE session_party (
  session_id TEXT NOT NULL,
  character_id TEXT NOT NULL,
  role TEXT NOT NULL,
  skills TEXT, -- JSON array of skills
  stats TEXT, -- JSON object of character stats
  reputation_groups TEXT, -- JSON object of reputation by group
  recruited_at INTEGER,
  PRIMARY KEY (session_id, character_id)
);

-- Economy system
CREATE TABLE session_economy (
  session_id TEXT PRIMARY KEY,
  currency_amount REAL DEFAULT 0,
  barter_goods TEXT -- JSON of tradeable items
);
```

**Phase 3 Tables**:

```sql
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

-- Enhanced travel tracking
CREATE TABLE travel_routes (
  session_id TEXT NOT NULL,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  distance_km REAL,
  base_time_minutes INTEGER,
  weather_modifier REAL DEFAULT 1.0,
  skill_modifier REAL DEFAULT 1.0,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);
```

### **API Evolution**

**Phase 1 Endpoints**:

- `GET /api/supplies` - Get current supply levels
- `POST /api/supplies/consume` - Consume supplies for actions
- `GET /api/survival/status` - Get survival state and warnings

**Phase 2 Endpoints**:

- `POST /api/party/recruit` - Recruit party members
- `GET /api/party/status` - Get party member details and stats
- `POST /api/trade` - Execute trading transactions
- `GET /api/reputation` - Get reputation status by group

**Phase 3 Endpoints**:

- `GET /api/weather/current` - Get current weather state
- `GET /api/minimap/data` - Get minimap node data
- `POST /api/camping/setup` - Set up camp
- `GET /api/camping/events` - Get camp events

### **Frontend Architecture**

**Component Structure**:

```
apps/web/src/components/
├── ui/              # Reusable UI components
│   ├── Pocketwatch.tsx
│   ├── SupplyDisplay.tsx
│   ├── SurvivalStatus.tsx
│   ├── WeatherIndicator.tsx
│   └── StatusBar.tsx
├── panels/          # Complex UI panels
│   ├── PartyPanel.tsx
│   ├── ReputationPanel.tsx
│   └── Minimap.tsx
├── modals/          # Enhanced modals
│   ├── TradingModal.tsx
│   ├── TravelModal.tsx
│   └── SurvivalWarningModal.tsx
└── layout/          # Layout enhancements
    ├── GameHUD.tsx
    └── StatusOverlay.tsx
```

**State Management**:

- Extend existing Zustand store
- Add new slices for supplies, survival, party, reputation, weather
- Maintain backward compatibility with existing state

## Development Workflow

### **Weekly Development Cycle**

**Monday-Wednesday**: Implementation

- Focus on core functionality
- Create/modify database schemas
- Implement backend logic
- Build UI components

**Thursday-Friday**: Integration & Testing

- Integrate new systems with existing code
- Test all interactions
- Fix integration issues
- Performance testing

**Weekend**: Review & Documentation

- Code review and cleanup
- Update documentation
- Plan next week's work

### **Quality Assurance**

**Testing Strategy**:

1. **Unit Tests**: Test individual functions and components
2. **Integration Tests**: Test system interactions
3. **E2E Tests**: Test complete user workflows
4. **Performance Tests**: Monitor frame rate and load times

**Code Quality**:

1. **TypeScript**: Strict type checking for all new code
2. **ESLint**: Consistent code style and best practices
3. **Error Handling**: Proper error boundaries and user feedback
4. **Accessibility**: WCAG 2.1 AA compliance

## Risk Management

### **High-Risk Areas**

1. **Performance**: Multiple always-visible UI elements
2. **State Complexity**: Integration with existing modal system
3. **Database Migration**: Schema changes without data loss
4. **UI Consistency**: New components matching existing design

### **Mitigation Strategies**

1. **Progressive Enhancement**: Start basic, enhance over time
2. **Feature Flags**: Enable/disable new features for testing
3. **Rollback Plans**: Maintain ability to revert changes
4. **Performance Monitoring**: Track metrics throughout development

## Success Metrics

### **Overall Game Success**

- **Playability**: Complete game experience from start to finish
- **Replayability**: Meaningfully different experiences across playthroughs
- **Player Agency**: Meaningful choices that affect gameplay
- **Immersion**: Cohesive world that feels alive and responsive

### **Technical Success**

- **Performance**: Maintains 60fps with all features enabled
- **Stability**: No crashes or critical bugs in normal gameplay
- **Scalability**: Architecture supports future feature additions
- **Maintainability**: Clean, well-documented codebase

## Getting Started

1. **Read Phase 1 Document**: Begin with `phases/PHASE_1_FOUNDATION.md`
2. **Set Up Development Environment**: Ensure all tools and dependencies are ready
3. **Create Development Branch**: Use feature branches for each phase
4. **Follow Implementation Order**: Each phase builds on the previous one

## Phase Dependencies

```
Phase 1 (Foundation) → Phase 2 (Player Agency) → Phase 3 (World) → Phase 4 (Advanced) → Phase 5 (Content)
     ↓                        ↓                        ↓                    ↓                    ↓
  Supply System        Party System           Weather System     Equipment System  Procedural Generation
  Survival Mechanics   Reputation System      Minimap UI         Enhanced Travel   Dynamic Storytelling
  Pocketwatch UI       Economy System         Camping System     Location Effects  UI Polish
```

Each phase provides the foundation for subsequent phases. The modular design ensures that if any phase needs adjustment, it won't break the entire system.

---

_This master plan provides the complete roadmap for developing the full Igapó roguelike adventure game. Each phase document contains detailed implementation instructions for successful execution._
