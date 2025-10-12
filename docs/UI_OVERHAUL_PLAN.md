# Igapó Game UI Overhaul Plan

## Executive Summary

The current UI provides a solid foundation but is missing **9 critical components** required for the complete gameplay experience. This plan outlines a systematic overhaul to transform the basic prototype UI into the full-featured interface specified in the game design document.

---

## Current UI Status Analysis

### ✅ **Existing & Working Components**

**Core Architecture:**

- ✅ **Layout.tsx** - Responsive grid layout with header/main/sidebar/footer
- ✅ **AppHybrid.tsx** - Main orchestrator with modal state management
- ✅ **Mode System** - Dialogue, exploration, encounter, reflection modals

**Gameplay Components:**

- ✅ **ActionMenuBar.tsx** - Categorized action system with popover interface
- ✅ **DialogueModal.tsx** - Character conversations with options
- ✅ **ExplorationModal.tsx** - Location exploration mechanics
- ✅ **EncounterModal.tsx** - Dynamic encounter handling
- ✅ **CharacterPortrait.tsx** - Character display with mood indicators

**Supporting Components:**

- ✅ **LocationScene.tsx** - Location descriptions and ambiance
- ✅ **Journal.tsx** - Journal entries with tags and metadata
- ✅ **FactChips.tsx** - Knowledge and fact display system
- ✅ **ExpositionScene.tsx** - Game introduction and setup
- ✅ **ModeTransitionBanner.tsx** - Smooth mode transition effects

### ⚠️ **Partially Implemented**

**Styling & Polish:**

- ⚠️ **Global CSS** - Beautiful dark theme with gradients and animations
- ⚠️ **Responsive Design** - Mobile-first approach with breakpoints
- ⚠️ **Accessibility** - ARIA labels and keyboard navigation

### ❌ **Critical Missing Components** (9 Major Gaps)

Based on the game design document and implementation plan:

1. **Pocketwatch UI** - Always-visible time display (Sec 4.1)
2. **Supply Display** - 5 distinct supply type counters (Sec 9.1)
3. **Survival Status** - Health/dehydration/starvation indicators (Sec 9.2-9.3)
4. **Weather Indicator** - Current weather display (Sec 19)
5. **Party Panel** - Party member management and stats (Sec 5)
6. **Reputation Display** - Reputation status by group (Sec 17.2)
7. **Trading Interface** - Currency and barter trading UI (Sec 18)
8. **Minimap** - Node exploration and discovery display (Sec 3)
9. **Enhanced Travel Interface** - ETA, warnings, risk assessment (Sec 4.3)

---

## UI Overhaul Strategy

### **Phase 1: Foundation Enhancement (Week 1-2)**

#### **1.1 Pocketwatch UI Implementation**

**Current State**: No time display in UI
**Target State**: Always-visible brass pocketwatch in top-right corner

**Design Requirements**:

- **Position**: Top-right corner, always visible (even during modals)
- **Size**: 80×100 pixels (compact but readable)
- **Style**: Brass pocketwatch aesthetic matching game theme
- **Content**: Time of day icon + current time + current day
- **Interactions**: Clickable for time management panel

**Implementation**:

```typescript
// New component: apps/web/src/components/Pocketwatch.tsx
interface PocketwatchProps {
  currentTime: string; // "2:45 PM"
  currentDay: number;  // 3
  timeOfDay: 'dawn' | 'morning' | 'afternoon' | 'dusk' | 'evening' | 'night';
  onClick?: () => void;
}

const Pocketwatch: React.FC<PocketwatchProps> = ({ ... }) => {
  const timeIcon = {
    dawn: '🌅', morning: '☀️', afternoon: '☀️',
    dusk: '🌆', evening: '🌙', night: '🌙'
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

**Integration Points**:

- Add to `Layout.tsx` header area
- Connect to game state time tracking
- Style with CSS animations and hover effects

#### **1.2 Supply Display System**

**Current State**: Single "supplies" number in basic display
**Target State**: 5 distinct supply counters with individual mechanics

**Design Requirements**:

- **Layout**: Horizontal bar below main content area
- **Supply Types**: Food 🍖, Water 💧, Medicine 💊, Fuel 🔥, Tools 🔧
- **Display**: Current/max for each type with color coding
- **Interactions**: Hover tooltips, click for detailed view

**Implementation**:

```typescript
// New component: apps/web/src/components/SupplyDisplay.tsx
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

**Integration Points**:

- Add to `Layout.tsx` main content area
- Connect to game state supply tracking
- Update all API responses to include supply object

#### **1.3 Survival Status Indicators**

**Current State**: No survival mechanics or warnings
**Target State**: Visual indicators for dehydration/starvation with progressive warnings

**Design Requirements**:

- **Position**: Bottom-left corner, always visible but unobtrusive
- **Stages**: 4-stage system (minor/moderate/severe/critical)
- **Visual**: Color-coded bars with percentage indicators
- **Warnings**: Modal alerts at critical thresholds

**Implementation**:

```typescript
// New component: apps/web/src/components/SurvivalStatus.tsx
interface SurvivalState {
  dehydration: { stage: number; timeRemaining: number }; // 0-4 stages
  starvation: { stage: number; timeRemaining: number }; // 0-4 stages
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

**Integration Points**:

- Add to `Layout.tsx` as overlay in bottom-left
- Connect to survival state tracking system
- Implement warning modals for critical stages

### **Phase 2: Player Agency UI (Week 3-4)**

#### **2.1 Party Panel**

**Design Requirements**:

- **Position**: Right sidebar area
- **Content**: Party member portraits, stats, skills, reputation
- **Interactions**: Recruit/dismiss members, view details
- **Visual**: Character cards with mood indicators

#### **2.2 Reputation Display**

**Design Requirements**:

- **Position**: Integrated into party panel or separate widget
- **Content**: Reputation levels by group (settlers, indigenous, traders, etc.)
- **Visual**: Tier indicators (Unknown → Trusted → Revered)

#### **2.3 Trading Interface**

**Design Requirements**:

- **Position**: Modal overlay for trading interactions
- **Content**: Currency display, barter options, price calculations
- **Interactions**: Buy/sell interface with reputation modifiers

### **Phase 3: World Enhancement UI (Week 5-6)**

#### **3.1 Weather Indicator**

**Design Requirements**:

- **Position**: Top area near pocketwatch
- **Content**: Current weather type, intensity, duration
- **Visual**: Weather icons with transition animations

#### **3.2 Minimap**

**Design Requirements**:

- **Position**: Right sidebar or dedicated panel
- **Content**: Node network, current location, connected nodes
- **Interactions**: Click to view node details, set waypoints

#### **3.3 Enhanced Travel Interface**

**Design Requirements**:

- **Position**: Modal overlay for travel planning
- **Content**: ETA, arrival time, resource costs, risk assessment
- **Visual**: Route visualization with weather/time effects

---

## Technical Implementation Strategy

### **Component Architecture**

**New Component Structure**:

```
apps/web/src/components/
├── ui/                          # Reusable UI components
│   ├── Pocketwatch.tsx
│   ├── SupplyDisplay.tsx
│   ├── SurvivalStatus.tsx
│   ├── WeatherIndicator.tsx
│   └── StatusBar.tsx           # Combined status display
├── panels/                      # Complex UI panels
│   ├── PartyPanel.tsx
│   ├── ReputationPanel.tsx
│   └── Minimap.tsx
├── modals/                      # Enhanced modals
│   ├── TradingModal.tsx
│   ├── TravelModal.tsx
│   └── SurvivalWarningModal.tsx
└── layout/                      # Layout enhancements
    ├── GameHUD.tsx             # Main game interface
    └── StatusOverlay.tsx       # Always-visible status info
```

### **State Management Integration**

**Redux/Zustand Store Updates**:

```typescript
// Enhanced game state
interface GameState {
  // ... existing fields
  supplies: SupplyState;
  survival: SurvivalState;
  party: PartyState;
  reputation: ReputationState;
  weather: WeatherState;
  time: TimeState;
}

// UI-specific state
interface UIState {
  showSurvivalWarnings: boolean;
  showTradingInterface: boolean;
  showTravelInterface: boolean;
  selectedPartyMember: string | null;
}
```

### **CSS Architecture Enhancement**

**New CSS Structure**:

```css
/* Core HUD Components */
.pocketwatch {
  /* Always visible, top-right */
}
.supply-display {
  /* Horizontal bar, below content */
}
.survival-status {
  /* Bottom-left overlay */
}
.weather-indicator {
  /* Top area, near pocketwatch */
}

/* Panel Components */
.party-panel {
  /* Right sidebar */
}
.reputation-display {
  /* Integrated in party panel */
}
.minimap {
  /* Dedicated minimap area */
}

/* Modal Enhancements */
.trading-modal {
  /* Full trading interface */
}
.travel-modal {
  /* Enhanced travel planning */
}
.survival-warning-modal {
  /* Critical alerts */
}
```

---

## Development Timeline & Milestones

### **Week 1: Foundation Setup**

- [ ] Create component architecture and folder structure
- [ ] Implement Pocketwatch UI component
- [ ] Set up state management for new UI elements
- [ ] Create basic SupplyDisplay component

### **Week 2: Core Status Systems**

- [ ] Complete Supply Display with 5 supply types
- [ ] Implement Survival Status indicators
- [ ] Integrate survival warning modals
- [ ] Test time/supply/survival integration

### **Week 3: Player Agency UI**

- [ ] Create Party Panel component
- [ ] Implement Reputation Display
- [ ] Build Trading Interface modal
- [ ] Test party/reputation/economy integration

### **Week 4: World Enhancement UI**

- [ ] Implement Weather Indicator
- [ ] Create Minimap component
- [ ] Build Enhanced Travel Interface
- [ ] Test weather/travel/camping integration

### **Week 5: Polish & Integration**

- [ ] Optimize responsive design for all new components
- [ ] Enhance accessibility (ARIA, keyboard navigation)
- [ ] Performance optimization and bundle size management
- [ ] Cross-browser testing and visual consistency

### **Week 6: Testing & Final Polish**

- [ ] Comprehensive user experience testing
- [ ] Performance benchmarking and optimization
- [ ] Visual design consistency audit
- [ ] Documentation and component usage examples

---

## Success Criteria & Validation

### **Phase 1 Success (End of Week 2)**

- ✅ Pocketwatch shows accurate time and day
- ✅ Supply display shows 5 distinct types with current/max values
- ✅ Survival status indicates dehydration/starvation stages
- ✅ All components are responsive and accessible

### **Phase 2 Success (End of Week 4)**

- ✅ Party panel displays recruited members with stats/skills
- ✅ Reputation system shows status by group with tier indicators
- ✅ Trading interface enables currency and barter transactions
- ✅ All player agency systems are functional and integrated

### **Phase 3 Success (End of Week 6)**

- ✅ Weather indicator shows current conditions and transitions
- ✅ Minimap displays node network and exploration state
- ✅ Travel interface shows ETA, warnings, and risk assessment
- ✅ All world systems provide meaningful gameplay enhancement

### **Technical Success Metrics**

- **Performance**: No significant impact on frame rate or load times
- **Accessibility**: All components meet WCAG 2.1 AA standards
- **Responsive**: All components work on mobile, tablet, and desktop
- **Integration**: New UI seamlessly integrates with existing modal system

---

## Risk Assessment & Mitigation

### **High-Risk Areas**

1. **Performance Impact**: Multiple always-visible UI elements may affect rendering
2. **State Complexity**: New UI state management may conflict with existing modal system
3. **Visual Consistency**: New components must match existing design language
4. **Responsive Design**: Complex layouts may break on smaller screens

### **Mitigation Strategies**

1. **Performance**: Use React.memo, selective rendering, and efficient state updates
2. **State Management**: Extend existing Zustand store rather than creating new system
3. **Design Consistency**: Create design tokens and component variants system
4. **Responsive Design**: Mobile-first approach with progressive enhancement

### **Fallback Plans**

1. **Progressive Enhancement**: Start with basic versions, enhance over time
2. **Feature Flags**: Allow disabling new UI elements if performance issues arise
3. **A/B Testing**: Test new components with subset of users before full rollout
4. **Rollback Strategy**: Maintain ability to revert to simpler UI if needed

---

## Component Specifications Summary

| Component          | Position       | Always Visible | Size     | Key Features                     |
| ------------------ | -------------- | -------------- | -------- | -------------------------------- |
| Pocketwatch        | Top-right      | ✅             | 80×100px | Time/day display, clickable      |
| Supply Display     | Below content  | ✅             | Variable | 5 supply counters, color coding  |
| Survival Status    | Bottom-left    | ✅             | Compact  | Stage indicators, time remaining |
| Weather Indicator  | Top area       | ✅             | Small    | Weather icon, transitions        |
| Party Panel        | Right sidebar  | ❌             | Variable | Member cards, stats display      |
| Reputation Display | In party panel | ❌             | Small    | Group reputation tiers           |
| Trading Interface  | Modal          | ❌             | Full     | Currency/barter trading          |
| Minimap            | Right panel    | ❌             | Variable | Node network, exploration        |
| Travel Interface   | Modal          | ❌             | Full     | ETA, warnings, risk assessment   |

---

## Next Steps

1. **Approve Component Architecture**: Confirm the proposed component structure and naming
2. **Design System Enhancement**: Create design tokens for new UI elements
3. **Development Kickoff**: Begin with Phase 1 (Pocketwatch, Supply Display, Survival Status)
4. **Integration Testing**: Ensure new components work with existing modal system
5. **Performance Monitoring**: Track impact of new UI elements on game performance

---

_This UI overhaul plan provides a systematic approach to transform the current basic interface into the complete, feature-rich UI required for the full roguelike adventure game experience._
