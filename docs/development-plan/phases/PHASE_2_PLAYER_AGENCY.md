# Phase 2: Player Agency

## Overview

**Duration**: 3-4 weeks
**Focus**: Player capabilities and social systems that give meaningful choices
**Goal**: Transform solitary explorer into leader with party management and social influence

## Prerequisites

**Phase 1 Must Be Complete**:

- ✅ Supply System Overhaul (5 distinct types)
- ✅ Survival Mechanics (dehydration/starvation timers)
- ✅ Pocketwatch UI (always-visible time display)

## Current State Analysis

### **Party System** (Current)

- ❌ No party/crew member management
- ❌ No skill system (Navigation, Hunting, Naturalist, Healer)
- ❌ No character stats (morale, trustworthiness, charisma, etc.)
- ❌ No language proficiency system

### **Reputation System** (Current)

- ❌ No per-party member reputation tracking
- ❌ No reputation effects on gameplay
- ❌ No reputation UI display
- ❌ No regional reputation diffusion

### **Economy System** (Current)

- ❌ No currency system (Brazilian réis)
- ❌ No supply trading mechanics
- ❌ No special items trading
- ❌ No barter system for remote areas

## Target State

### **Party System** (Target)

- **Recruitment**: Meet and recruit NPCs as party members
- **Skills**: 4 skill types (Navigation, Hunting, Naturalist, Healer)
- **Stats**: Character attributes (morale, trustworthiness, charisma, strength, knowledge, instincts)
- **Languages**: NPCs speak different languages affecting communication

### **Reputation System** (Target)

- **Per-Member Tracking**: Each companion has individual reputation with different groups
- **Group Categories**: Local settlements, indigenous tribes, traders, river guides, missionaries
- **Effects**: Recruitment, trading, information access, safety, quest availability
- **Regional Spread**: Reputation diffuses through river network over time

### **Economy System** (Target)

- **Currency**: Brazilian Réis (Mil-réis) for 1930s historical accuracy
- **Trading**: Buy/sell supplies and special items with reputation modifiers
- **Barter**: Alternative economy in remote areas
- **Price Tiers**: Different prices based on location type and reputation

## Implementation Plan

### **Week 1: Party System Basics**

#### **Day 1-2: Database Schema & Types**

**Files to Create/Modify**:

1. `apps/server/src/database/sessionSchema.js` - Add session_party table
2. `packages/shared/src/types.ts` - Add PartyMember and Skill interfaces
3. `apps/web/src/game-client/types.ts` - Update game state types

**Database Schema**:

```sql
CREATE TABLE session_party (
  session_id TEXT NOT NULL,
  character_id TEXT NOT NULL,
  role TEXT NOT NULL, -- navigator, hunter, naturalist, healer
  skills TEXT, -- JSON array: ["navigation", "hunting"]
  stats TEXT, -- JSON object: {morale: 80, trustworthiness: 75, charisma: 60}
  reputation_groups TEXT, -- JSON object: {"settlers": 50, "indigenous": 25}
  recruited_at INTEGER,
  languages TEXT, -- JSON array of spoken languages
  PRIMARY KEY (session_id, character_id)
);
```

**Type Definitions**:

```typescript
// packages/shared/src/types.ts
export interface Skill {
  type: "navigation" | "hunting" | "naturalist" | "healer";
  level: number; // 1-10
  description: string;
}

export interface PartyMember {
  id: string;
  name: string;
  role: string;
  archetype: string;
  skills: Skill[];
  stats: {
    morale: number;
    trustworthiness: number;
    charisma: number;
    strength: number;
    knowledge: number;
    instincts: number;
    playerLiking: number;
  };
  reputation: {
    settlers: number;
    indigenous: number;
    traders: number;
    riverGuides: number;
    missionaries: number;
  };
  languages: string[];
  recruitedAt: number;
}
```

#### **Day 3-4: Recruitment Mechanics**

**Files to Modify**:

1. `apps/server/src/game/stateManager.js` - Add party management functions
2. `apps/server/src/server.js` - Add party-related API endpoints

**Recruitment Implementation**:

```typescript
// apps/server/src/game/stateManager.js
const recruitPartyMember = (state, characterId) => {
  // Check if already recruited
  if (state.party.some((member) => member.id === characterId)) {
    throw new Error("Character already in party");
  }

  // Get character data from database
  const character = getCharacterById(characterId);

  // Create party member with initial stats
  const newMember = {
    id: characterId,
    name: character.name,
    role: character.role,
    archetype: character.archetype,
    skills: character.skills || [],
    stats: {
      morale: 80,
      trustworthiness: 75,
      charisma: 60,
      strength: 50,
      knowledge: 65,
      instincts: 70,
      playerLiking: 0,
    },
    reputation: {
      settlers: 0,
      indigenous: 0,
      traders: 0,
      riverGuides: 0,
      missionaries: 0,
    },
    languages: character.languages || ["Portuguese"],
    recruitedAt: state.currentTime,
  };

  return {
    ...state,
    party: [...state.party, newMember],
  };
};
```

#### **Day 5: Party UI Component**

**Files to Create**:

1. `apps/web/src/components/panels/PartyPanel.tsx`

**Implementation**:

```typescript
// apps/web/src/components/panels/PartyPanel.tsx
interface PartyPanelProps {
  party: PartyMember[];
  onMemberSelect?: (memberId: string) => void;
  onMemberDismiss?: (memberId: string) => void;
}

const PartyPanel: React.FC<PartyPanelProps> = ({
  party,
  onMemberSelect,
  onMemberDismiss,
}) => {
  return (
    <div className="party-panel">
      <h3 className="party-panel__title">Party Members</h3>
      <div className="party-panel__list">
        {party.length === 0 ? (
          <div className="party-panel__empty">
            No party members recruited yet
          </div>
        ) : (
          party.map((member) => (
            <div key={member.id} className="party-member-card">
              <div className="party-member__portrait">
                <CharacterPortrait character={member} size="small" />
              </div>
              <div className="party-member__info">
                <div className="party-member__name">{member.name}</div>
                <div className="party-member__role">{member.role}</div>
                <div className="party-member__skills">
                  {member.skills.map((skill) => (
                    <span
                      key={skill.type}
                      className={`skill-badge skill-${skill.type}`}
                    >
                      {skill.type}
                    </span>
                  ))}
                </div>
              </div>
              <div className="party-member__actions">
                <button
                  onClick={() => onMemberSelect?.(member.id)}
                  className="party-member__view"
                >
                  View
                </button>
                <button
                  onClick={() => onMemberDismiss?.(member.id)}
                  className="party-member__dismiss"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
```

### **Week 2: Reputation System**

#### **Day 1-2: Reputation Tracking**

**Files to Modify**:

1. `apps/server/src/game/stateManager.js` - Add reputation update functions
2. `apps/server/src/database/sessionSchema.js` - Update party table schema

**Reputation Implementation**:

```typescript
// apps/server/src/game/stateManager.js
const updateReputation = (state, memberId, groupType, delta) => {
  const member = state.party.find((m) => m.id === memberId);
  if (!member) return state;

  const currentRep = member.reputation[groupType] || 0;
  const newRep = Math.max(-100, Math.min(100, currentRep + delta));

  const updatedMember = {
    ...member,
    reputation: {
      ...member.reputation,
      [groupType]: newRep,
    },
  };

  return {
    ...state,
    party: state.party.map((m) => (m.id === memberId ? updatedMember : m)),
  };
};

const getReputationEffects = (member, groupType) => {
  const rep = member.reputation[groupType] || 0;

  if (rep >= 75) return { recruitment: 1.5, trading: 0.8, information: 2.0 };
  if (rep >= 50) return { recruitment: 1.2, trading: 0.9, information: 1.5 };
  if (rep >= 25) return { recruitment: 1.1, trading: 0.95, information: 1.2 };
  if (rep >= 0) return { recruitment: 1.0, trading: 1.0, information: 1.0 };
  if (rep >= -25) return { recruitment: 0.9, trading: 1.05, information: 0.8 };
  if (rep >= -50) return { recruitment: 0.7, trading: 1.1, information: 0.5 };
  return { recruitment: 0.5, trading: 1.2, information: 0.2 };
};
```

#### **Day 3-4: Reputation UI**

**Files to Create**:

1. `apps/web/src/components/panels/ReputationPanel.tsx`

**Implementation**:

```typescript
// apps/web/src/components/panels/ReputationPanel.tsx
interface ReputationPanelProps {
  member: PartyMember;
}

const ReputationPanel: React.FC<ReputationPanelProps> = ({ member }) => {
  const reputationGroups = [
    { key: "settlers", label: "Local Settlements", icon: "🏛️" },
    { key: "indigenous", label: "Indigenous Tribes", icon: "🌿" },
    { key: "traders", label: "Traders", icon: "💰" },
    { key: "riverGuides", label: "River Guides", icon: "🛶" },
    { key: "missionaries", label: "Missionaries", icon: "⛪" },
  ];

  const getReputationTier = (value: number) => {
    if (value >= 75) return { tier: "Revered", color: "#FFD700" };
    if (value >= 50) return { tier: "Trusted", color: "#32CD32" };
    if (value >= 25) return { tier: "Friendly", color: "#87CEEB" };
    if (value >= 0) return { tier: "Neutral", color: "#D3D3D3" };
    if (value >= -25) return { tier: "Suspicious", color: "#FFA500" };
    if (value >= -50) return { tier: "Hostile", color: "#FF6347" };
    return { tier: "Enemy", color: "#DC143C" };
  };

  return (
    <div className="reputation-panel">
      <h4 className="reputation-panel__title">Reputation</h4>
      <div className="reputation-panel__list">
        {reputationGroups.map((group) => {
          const value =
            member.reputation[group.key as keyof typeof member.reputation] || 0;
          const tier = getReputationTier(value);

          return (
            <div key={group.key} className="reputation-item">
              <div className="reputation-item__icon">{group.icon}</div>
              <div className="reputation-item__info">
                <div className="reputation-item__label">{group.label}</div>
                <div
                  className="reputation-item__tier"
                  style={{ color: tier.color }}
                >
                  {tier.tier}
                </div>
              </div>
              <div className="reputation-item__value">
                {value > 0 ? "+" : ""}
                {value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

#### **Day 5: Integration Testing**

**Testing Checklist**:

- [ ] Party members can be recruited successfully
- [ ] Reputation updates work correctly
- [ ] Reputation effects applied in appropriate contexts
- [ ] UI displays party and reputation information accurately

### **Week 3-4: Economy System**

#### **Day 1-2: Currency & Trading Database**

**Files to Create/Modify**:

1. `apps/server/src/database/sessionSchema.js` - Add session_economy table
2. `apps/server/src/game/stateManager.js` - Add economy functions

**Database Schema**:

```sql
CREATE TABLE session_economy (
  session_id TEXT PRIMARY KEY,
  currency_amount REAL DEFAULT 0, -- mil-réis
  barter_goods TEXT, -- JSON of tradeable items
  last_trade INTEGER -- Unix timestamp
);
```

**Economy Implementation**:

```typescript
// apps/server/src/game/stateManager.js
const createInitialEconomy = (sessionId) => ({
  currency: 300, // Starting mil-réis (random 200-500)
  barterGoods: {},
  lastTrade: Date.now(),
});

const executeTrade = (state, tradeType, itemType, quantity, price) => {
  const totalCost = price * quantity;

  if (tradeType === "buy") {
    if (state.economy.currency < totalCost) {
      throw new Error("Insufficient funds");
    }

    // Apply reputation modifier
    const reputationModifier = calculateReputationModifier(state.party);
    const finalPrice = Math.round(totalCost * reputationModifier);

    return {
      ...state,
      economy: {
        ...state.economy,
        currency: state.economy.currency - finalPrice,
      },
      supplies: {
        ...state.supplies,
        [itemType]: state.supplies[itemType] + quantity,
      },
    };
  } else if (tradeType === "sell") {
    // Similar logic for selling
  }
};
```

#### **Day 3-4: Trading Interface**

**Files to Create**:

1. `apps/web/src/components/modals/TradingModal.tsx`

**Implementation**:

```typescript
// apps/web/src/components/modals/TradingModal.tsx
interface TradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: Location;
  party: PartyMember[];
  economy: EconomyState;
  supplies: SupplyState;
  onTrade: (trade: TradeRequest) => void;
}

const TradingModal: React.FC<TradingModalProps> = ({
  isOpen,
  onClose,
  location,
  party,
  economy,
  supplies,
  onTrade,
}) => {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState(1);

  const tradeableItems = {
    buy: [
      { type: "food", name: "Food Rations", price: 8, icon: "🍖" },
      { type: "water", name: "Water Canteens", price: 4, icon: "💧" },
      { type: "medicine", name: "Medicine Doses", price: 45, icon: "💊" },
      { type: "fuel", name: "Fuel Units", price: 6, icon: "🔥" },
      { type: "tools", name: "Tools", price: 120, icon: "🔧" },
    ],
    sell: [
      { type: "food", name: "Food Rations", price: 6, icon: "🍖" },
      { type: "water", name: "Water Canteens", price: 3, icon: "💧" },
      // Add other sellable items based on inventory
    ],
  };

  const reputationModifier = calculateReputationModifier(party);
  const locationModifier = getLocationPriceModifier(location.type);

  if (!isOpen) return null;

  return (
    <div className="trading-modal">
      <div className="trading-modal__content">
        <div className="trading-modal__header">
          <h2>Trading at {location.name}</h2>
          <div className="trading-modal__currency">
            💰 {economy.currency} mil-réis
          </div>
        </div>

        <div className="trading-modal__main">
          <div className="trading-modal__tabs">
            <button
              className={tradeType === "buy" ? "active" : ""}
              onClick={() => setTradeType("buy")}
            >
              Buy
            </button>
            <button
              className={tradeType === "sell" ? "active" : ""}
              onClick={() => setTradeType("sell")}
            >
              Sell
            </button>
          </div>

          <div className="trading-modal__items">
            {tradeableItems[tradeType].map((item) => {
              const basePrice = item.price;
              const finalPrice = Math.round(
                basePrice * reputationModifier * locationModifier
              );

              return (
                <div key={item.type} className="trading-item">
                  <div className="trading-item__icon">{item.icon}</div>
                  <div className="trading-item__info">
                    <div className="trading-item__name">{item.name}</div>
                    <div className="trading-item__price">
                      {finalPrice} mil-réis each
                    </div>
                  </div>
                  <div className="trading-item__controls">
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={selectedItem === item.type ? quantity : 1}
                      onChange={(e) => {
                        setSelectedItem(item.type);
                        setQuantity(parseInt(e.target.value) || 1);
                      }}
                    />
                    <button
                      onClick={() =>
                        onTrade({
                          type: tradeType,
                          itemType: item.type,
                          quantity,
                          price: finalPrice,
                        })
                      }
                      disabled={
                        tradeType === "buy" &&
                        economy.currency < finalPrice * quantity
                      }
                    >
                      {tradeType === "buy" ? "Buy" : "Sell"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="trading-modal__footer">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};
```

#### **Day 5: Integration & Testing**

**Testing Checklist**:

- [ ] Currency system works correctly
- [ ] Trading calculations apply correct modifiers
- [ ] Barter system functions in remote areas
- [ ] UI displays trading interface properly

## API Endpoints (New for Phase 2)

### **Party Management**

```typescript
POST / api / party / recruit;
// Body: { characterId: string }
// Adds character to party if available

GET / api / party / status;
// Returns current party member details and stats

POST / api / party / dismiss;
// Body: { memberId: string }
// Removes member from party

GET / api / party / skills;
// Returns combined party skills and their effects
```

### **Reputation System**

```typescript
GET / api / reputation;
// Returns reputation status for all party members by group

POST / api / reputation / update;
// Body: { memberId: string, groupType: string, delta: number }
// Updates reputation for specific member and group
```

### **Trading System**

```typescript
GET / api / trade / options;
// Query: ?locationType=settlement&partyMembers=...
// Returns available trading options with prices

POST / api / trade / execute;
// Body: { type: 'buy'|'sell', itemType: string, quantity: number }
// Executes trade transaction
```

## Integration Points

### **With Phase 1 Systems**

- **Supply System**: Trading affects supply levels
- **Survival System**: Party size affects survival tolerance
- **Time System**: Trading transactions take time (15-30 minutes)

### **With Future Systems**

- **Weather System**: Weather affects trading availability and prices
- **Location System**: Different locations have different trade options
- **Equipment System**: Special items can be traded

## Success Criteria

### **Party System**

- ✅ Party members can be recruited with distinct skills and stats
- ✅ Skills provide gameplay benefits (navigation reduces travel time, etc.)
- ✅ Party members have individual personalities and relationships
- ✅ Language barriers create meaningful gameplay choices

### **Reputation System**

- ✅ Each party member has individual reputation with different groups
- ✅ Reputation affects recruitment, trading, and information access
- ✅ Reputation spreads regionally over time
- ✅ UI displays reputation status clearly

### **Economy System**

- ✅ Currency system (réis) enables meaningful trading decisions
- ✅ Trading prices affected by reputation and location type
- ✅ Barter system available in remote areas
- ✅ Supply trading integrates with survival mechanics

## Testing Strategy

### **Unit Tests**

- Party recruitment and dismissal logic
- Reputation calculation and effects
- Trading price calculations and modifiers

### **Integration Tests**

- Party skills affect travel and survival
- Reputation changes affect NPC interactions
- Trading updates both currency and supplies

### **E2E Tests**

- Recruit party members and see skill effects
- Build reputation and observe improved trading
- Complete trading transactions with correct calculations

## Files Summary

**New Files**:

- `apps/web/src/components/panels/PartyPanel.tsx`
- `apps/web/src/components/panels/ReputationPanel.tsx`
- `apps/web/src/components/modals/TradingModal.tsx`

**Modified Files**:

- `packages/shared/src/types.ts` - Add party and economy interfaces
- `apps/web/src/game-client/types.ts` - Update game state types
- `apps/server/src/database/sessionSchema.js` - Add party and economy tables
- `apps/server/src/game/stateManager.js` - Add party/reputation/economy logic
- `apps/server/src/server.js` - Add party/reputation/trading endpoints
- `apps/web/src/AppHybrid.tsx` - Integrate party panel
- `apps/web/src/components/Layout.tsx` - Add party sidebar

**API Changes**:

- 6 new endpoints for party, reputation, and trading
- All existing endpoints updated to include party/economy data

---

_Phase 2 transforms the solitary explorer into a party leader with meaningful social and economic choices. The party system, reputation mechanics, and economy integration provide the foundation for player agency in the game world._
