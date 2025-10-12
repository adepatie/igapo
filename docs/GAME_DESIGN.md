# Igapó - Complete Game Design Document

**Version:** 2.0  
**Last Updated:** December 12, 2024  
**Game Type:** Story-driven survival adventure RPG  
**Setting:** 1930s Amazon River Basin  
**Core Mechanic:** Time-based travel with party management and dynamic storytelling

---

## Table of Contents

1. [Game Overview](#1-game-overview)
2. [Core Game Loop](#2-core-game-loop)
3. [Map System](#3-map-system)
4. [Travel & Time System](#4-travel--time-system)
5. [Party System](#5-party-system)
6. [Skills System](#6-skills-system)
7. [Language System](#7-language-system)
8. [Character Stats](#8-character-stats)
9. [Supply System](#9-supply-system)
10. [Location System](#10-location-system)
11. [Camping System](#11-camping-system)
12. [Encounter System](#12-encounter-system)
13. [Dialogue System](#13-dialogue-system)
14. [Progression & Win Conditions](#14-progression--win-conditions)
15. [User Interface](#15-user-interface)
16. [AI Integration](#16-ai-integration)

---

## 1. Game Overview

### 1.1 Premise

The year is 1935. Your grandmother lies dying from a mysterious illness. Legend speaks of **Lágrimas da Lua** (Tears of the Moon), a rare flower blooming deep in the Amazon that can cure any ailment. You must journey down the Amazon River, navigating treacherous waters, recruiting companions, and surviving dangers to find the flower before it's too late.

### 1.2 Core Pillars

1. **Meaningful Choices**: Every decision affects your journey
2. **Time Pressure**: The clock is always ticking
3. **Companion Dynamics**: Build a diverse party with unique abilities
4. **Dynamic Storytelling**: AI-powered narratives that respond to your actions
5. **Authentic Setting**: Real 1930s Amazon with historical accuracy

### 1.3 Unique Selling Points

- **Real-time clock system** with pocketwatch UI showing actual time passage
- **Distance-based travel** where every kilometer matters
- **Language barriers** requiring translators or learning
- **Party skills** that fundamentally change gameplay options
- **AI-generated dialogue** that adapts to your reputation and choices
- **Retreat mechanics** allowing strategic withdrawal from danger

---

## 2. Core Game Loop

### 2.1 High-Level Flow

```
START GAME
  ↓
[Exposition Screen]
  • Story introduction
  • Name your character
  • Choose starting language proficiency (English + optional Portuguese)
  ↓
[Map Generation]
  • Generate random Amazon trail (15-25 nodes)
  • Assign locations, distances, terrain types
  • Set encounter probabilities
  ↓
[Arrival at First Location]
  • Time: Day 1, 8:00 AM
  • Meet initial NPC guide
  • First dialogue interaction
  ↓
[MAIN GAMEPLAY LOOP] ──────────────────┐
  │                                     │
  ├─ [Location Screen] ←───────────────┤
  │    • View current location          │
  │    • Check minimap                  │
  │    • See available actions          │
  │    • Monitor time/stats             │
  │    ↓                                │
  ├─ [Action Selection]                 │
  │    ├→ Travel to next node           │
  │    ├→ Explore current location      │
  │    ├→ Talk to NPCs                  │
  │    ├→ Manage party/supplies         │
  │    ├→ Rest or camp                  │
  │    └→ Use special skills            │
  │    ↓                                │
  ├─ [Action Resolution]                │
  │    • Time advances                  │
  │    • Supplies consumed              │
  │    • Skills applied                 │
  │    • Events may trigger             │
  │    ↓                                │
  ├─ [Event/Encounter?] ──No────────────┤
  │    ↓ Yes                            │
  │   [Handle Event]                    │
  │    • Dialogue scene                 │
  │    • Combat/danger                  │
  │    • Discovery                      │
  │    • Choice point                   │
  │    ↓                                │
  └─ [Check Win/Lose] ──Continue────────┘
       ↓ End
     [Game Over]
       • Win: Found flower
       • Lose: Death/failure
```

### 2.2 Core Gameplay Loop Detail

**Phase 1: Location Assessment**

- Player arrives at a location (or starts game there)
- Location description displayed (AI-generated)
- Available NPCs shown (if any)
- Minimap updates to show position
- Time and stats displayed on HUD

**Phase 2: Information Gathering**

- Talk to NPCs (if present and language allows)
- Explore location (takes time, may find items/info)
- Check party status and supplies
- View map connections and distances

**Phase 3: Decision Making**

- Choose next destination from available nodes
- Decide whether to camp/rest before traveling
- Manage party (talk to companions, resolve conflicts)
- Trade/resupply if at settlement

**Phase 4: Travel/Action Execution**

- Select travel destination
- System calculates time/cost/risks
- Player confirms
- Travel simulation with event chances
- Arrival at new location OR event interruption

**Phase 5: Event Resolution**

- If event occurs: Handle through dialogue/choices
- Events may offer retreat option
- Resolution affects stats, time, possibly party
- Return to Phase 1 at new or same location

### 2.3 Session Structure

**Beginning:**

- Exposition (1-2 minutes)
- Character creation (30 seconds)
- Map generation (instant)
- First dialogue (2-5 minutes)

**Middle (Main Game):**

- Average play session: 30-60 minutes
- Typical activities per session:
  - 3-5 location visits
  - 2-3 travel segments
  - 1-2 dialogue scenes
  - 0-2 encounters
  - 1 camping sequence

**End:**

- Reach final location
- Find flower
- Victory scene
- OR death/failure
- Game over

---

## 3. Map System

### 3.1 Map Generation

**Generation Process:**

The game generates a unique Amazon trail each time a new game starts:

- **Node Count**: 15-25 locations along the river
- **Progressive Difficulty**: Each node becomes slightly more challenging
- **Node Types**: Distributed across 5 categories (empty, discovery, settlement, event, dialogue)
- **Connections**: Main path always exists, optional branches appear 30% of the time
- **Distances**: Range from 5-50 km between connected locations
- **Terrain Types**: Main river, tributaries, rapids, swamps
- **Discovery State**: Only starting location is revealed initially

**Node Types Distribution:**

- Empty scenic: 30%
- Discovery (item/animal/plant): 25%
- Settlement (village/post): 20%
- Event trigger: 15%
- NPC encounter: 10%

**Distance Ranges:**

- Short hop: 5-10 km (connects nearby locations)
- Standard: 10-25 km (most common)
- Long stretch: 25-40 km (requires planning)
- Marathon: 40-60 km (rare, dangerous)

### 3.2 Minimap Display

**UI Component: Minimap**

Location: Bottom-right corner of screen  
Size: 200×200 pixels  
Style: Hand-drawn parchment aesthetic

**Elements Shown:**

```
┌─────────────────────┐
│  N                  │
│  ↑                  │
│     ⚫ ?            │  ← Undiscovered node
│      ╱              │
│  ⚫─⊙─⚫             │  ← You (⊙) with connections
│   ╲  ↓15km          │
│    ⚫─?             │  ← Distance shown on edges
│                     │
│  🏛️ Discovered      │  ← Legend
│  ⚫ Undiscovered     │
│  ⊙ Current          │
└─────────────────────┘
```

**Visibility Rules:**

- Current node: Always fully visible
- Connected nodes: Show position, distance, terrain icon
- Unconnected nodes: Hidden until connected node discovered
- Visited nodes: Show name and type icon
- Unvisited nodes: Show "?" and fog

**Node Icons:**

- 🏛️ Settlement
- 🌳 Forest/scenic
- ⚠️ Dangerous area (after discovery)
- 🏺 Point of interest
- 💀 Death occurred here

**Interaction:**

- Hover: Show node details (if known)
- Click: Show full info panel
- Click connection: Show travel options
- Right-click: Set waypoint

### 3.3 Node Properties

**Node Properties:**

Each map node contains:

- **Identity**: Unique name and ID
- **Type**: One of five location categories
- **Biome**: Environmental setting (rainforest, river, wetland, etc.)
- **Position**: Coordinates for map display
- **Difficulty**: Easy, moderate, hard, or dangerous rating
- **Discovery State**: Whether shown on map and if player has visited
- **Generated Content**: AI-created descriptions, NPCs, items, events
- **Metadata**: Visit count, last visit time for dynamic changes

**Connection Properties:**

Each connection between nodes includes:

- **Route Information**: Distance in kilometers, terrain type, direction
- **Difficulty Rating**: How challenging the journey is
- **Discovery State**: Whether route is known and how often traveled
- **Dynamic State**: Can be blocked by events, danger level varies by conditions

---

## 4. Travel & Time System

### 4.1 Time Display: Pocketwatch UI

**Component Specifications:**

**Location:** Top-right corner  
**Size:** 80×100 pixels  
**Always visible:** Yes  
**Style:** Brass pocketwatch illustration

**Display Elements:**

```
┌──────────┐
│   🌙     │  ← Time of day icon (sun/moon/dawn/dusk)
│          │
│  2:45 PM │  ← Current time (12-hour format)
│          │
│  Day 3   │  ← Current day number
│          │
│ [zzz]    │  ← Camp button (moon icon at night)
└──────────┘
```

**Icons by Time:**

- 🌅 Dawn (5-7 AM): Orange sunrise
- ☀️ Day (7 AM-5 PM): Yellow sun
- 🌆 Dusk (5-7 PM): Orange/purple sunset
- 🌙 Night (7 PM-5 AM): Blue moon

**Interactions:**

- Hover: Shows detailed time info tooltip
- Click: Opens time management panel
  - Current time details
  - Time since game start
  - Estimated time to nightfall
  - Suggested actions before dark

**Animation:**

- Hands move in real-time during actions
- Glow effect during time advance
- Pulse warning when approaching night

### 4.2 Time Mechanics

**Time Simulation:**

- 24-hour clock (using 12-hour display)
- Game starts: Day 1, 8:00 AM
- Time advances based on actions
- Real-time passage during dialogue/decisions (slow, 1 real min = 5 game min)
- Instant skip for travel/camping

**Time Periods:**

| Period        | Hours      | Gameplay Effects                                                                                      |
| ------------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| **Dawn**      | 5-7 AM     | • +5% safe travel<br>• Wildlife quiet<br>• NPCs waking up<br>• Peaceful mood                          |
| **Morning**   | 7 AM-12 PM | • Optimal travel conditions<br>• All actions available<br>• NPCs active<br>• Best visibility          |
| **Afternoon** | 12-5 PM    | • Hot (+50% water consumption)<br>• Good travel conditions<br>• NPCs available<br>• Some seek shade   |
| **Dusk**      | 5-7 PM     | • Wildlife very active<br>• Visibility decreasing<br>• Travel riskier (-10%)<br>• Time to camp soon   |
| **Evening**   | 7-10 PM    | • Dangerous period<br>• Travel risky (-20%)<br>• Limited actions<br>• Settlements closing             |
| **Night**     | 10 PM-5 AM | • Very dangerous (-40% travel)<br>• Can only camp/rest<br>• Predators active<br>• Can't recruit/trade |

### 4.2 Interaction vs Action Time

The game distinguishes between two types of time passage:

**Interaction Time (Real-Time)**:

- **Dialogue**: All conversations with NPCs consume zero game time
- **Decisions**: Making choices in encounters or events is real-time
- **UI Navigation**: Browsing menus, inventory, map does not advance clock
- **Reading**: Journal entries, character info, location details are real-time
- **Philosophy**: Player thinking and planning time should not penalize gameplay

**Action Time (Game-Time)**:

- **Travel**: Moving between locations advances the clock based on distance
- **Exploration**: Searching locations consumes game time
- **Resting**: Sleeping, camping, or recovering advances time
- **Foraging/Hunting**: Gathering resources takes game time
- **Crafting/Repair**: Maintenance activities consume time
- **Training**: Explicit skill or language practice sessions

**Action Time Costs:**

**Dialogue Timing Rules:**

- **Real-Time Only**: All dialogue consumes zero game time
- **Conversation Duration**: Matches actual time spent talking
- **No Clock Advancement**: Time only passes during actual gameplay actions
- **Exception**: Language learning sessions (1 hour) - only when explicitly training
- **Trading**: Quick transactions (15-30 min) but dialogue portion is real-time

| Action            | Time Cost  | Notes                 |
| ----------------- | ---------- | --------------------- |
| Dialogue          | Real-time  | No game time consumed |
| Explore location  | 1-2 hours  | Thorough search       |
| Quick look around | 15-30 min  | Surface exploration   |
| Trade/shop        | 15-30 min  | At settlements        |
| Rest (short)      | 2 hours    | Partial stamina       |
| Rest (long)       | 4 hours    | Better stamina        |
| Camp              | Until 5 AM | Full restore          |
| Forage            | 1-2 hours  | Depends on skills     |
| Hunt              | 2-4 hours  | With hunting skill    |
| Repair equipment  | 1-3 hours  | Depends on damage     |
| Treat wounds      | 1-2 hours  | With healer           |
| Practice language | 1 hour     | Learning              |
| Travel            | Variable   | Based on distance     |

### 4.3 Distance-Based Travel

**Travel Time Calculation:**

The game calculates travel time based on multiple factors:

- **Base Speed**: Varies by terrain type (downstream fastest, rapids slowest)
- **Skill Modifiers**: Navigation skill reduces travel time by 15%
- **Stamina Effects**: High stamina speeds travel, low stamina slows it
- **Time of Day**: Night travel is 50% slower, dusk/dawn 15% slower
- **Weather**: Rain slows travel 20%, storms slow it 50%
- **Equipment**: Quality boats provide 20% speed bonus
- **Encumbrance**: Overloaded parties travel slower

**Travel Time Bounds:**

- **Minimum Travel Time**: 30 minutes (after all modifiers applied)
- **Maximum Travel Time**: 3 days (72 hours) (after all modifiers applied)
- **Purpose**: Prevents edge cases where extreme modifiers create unrealistic travel times

**Retreat Mechanics:**

- **Standard Retreat**: Costs 50% of the original travel time to return to previous location
- **Forced Retreat**: When circumstances force you back, costs 75% of original travel time
- **Weather Still Applies**: Current weather modifiers affect retreat travel time
- **Stamina Cost**: Same stamina cost as forward travel, but reduced by retreat percentage

The system shows estimated arrival time before departure and may vary due to events.

**Travel Interface:**

When player selects travel destination, the interface displays:

- **Estimated Travel Time**: Duration based on all modifiers
- **Arrival Time**: Exact time of day you'll arrive (e.g., "6:00 PM")
- **Time of Day Warning**: Alerts if arriving at dangerous times (dusk/night)
- **Resource Costs**: Food, water, stamina consumption preview
- **Risk Assessment**: Probability of safe passage vs. encounter

```
┌─────────────────────────────────────────┐
│ Travel to: Anavilhanas Archipelago      │
├─────────────────────────────────────────┤
│                                          │
│ Distance: 22 km downstream               │
│ Terrain: Main river (moderate current)  │
│ Difficulty: ⚫⚫⚪⚪ Moderate              │
│                                          │
│ Estimated Time: 3 hours, 15 minutes     │
│ Arrival Time: 6:00 PM (dusk)            │
│                                          │
│ Costs:                                   │
│  Stamina: -15 per person (−45 total)    │
│  Food: -3 rations                        │
│  Water: -6 canteens                      │
│                                          │
│ Risk Assessment: MODERATE                │
│  Base chance: 70% safe passage           │
│  + Party stamina (high): +10%            │
│  - Arriving at dusk: -10%                │
│  = Final: 70% safe, 30% event           │
│                                          │
│ ⚠️ Warning: You will arrive at dusk.     │
│    Consider camping here first.          │
│                                          │
│  [Depart Now]  [Cancel]  [Plan Route]   │
└─────────────────────────────────────────┘
```

### 4.4 Travel Events

**Event Probability:**

The game rolls for travel events based on safety chance:

- **Safe Passage**: If roll is below safety chance, travel proceeds normally
- **Event Occurs**: If roll exceeds safety chance, an event triggers
- **Event Severity**: Determined by second roll:
  - 30% chance: Minor event (equipment check, wildlife sighting)
  - 40% chance: Moderate event (repair needed, rest break)
  - 25% chance: Major event (illness, attack, getting lost)
  - 5% chance: Critical event (boat damage, serious injury)

**Event Types by Severity:**

**Minor Events (30% of events):**

- Equipment check needed (+15-30 min)
- Wildlife sighting (dolphins, birds)
- Interesting landmark noticed
- Weather change
- Minor current adjustment
- Crew morale moment

Example:

```
Your navigator spots pink river dolphins ahead,
playfully leaping in the water. Your party's
spirits lift from this beautiful sight.

+ 5 Morale (all party)
+ 20 minutes travel time

[Continue]
```

**Moderate Events (40% of events):**

- Minor repair needed (+1-2 hours)
- Shallow water, must navigate carefully
- Sudden weather change
- Equipment malfunction
- Need to rest briefly
- Spotted by observers (neutral)

Example:

```
The boat's rudder catches on submerged debris.
You'll need to stop and make repairs.

Time: +1 hour, 30 minutes
Required: Tools (have: ✓)

[Make Repairs]
```

**Major Events (25% of events):**

- Serious repair needed (+3-6 hours)
- Wildlife encounter (potentially dangerous)
- Getting turned around (navigation check)
- Party member illness begins
- Hostile humans spotted
- Dangerous rapids ahead

Example with Skill Options:

```
A massive anaconda blocks your path, coiled
on a fallen tree across the river!

Base Options:
  [Fight] - Attack the snake (dangerous)
  [Wait] - Hope it moves (takes 3 hours)
  [Retreat] - Go back and find another way

🎯 Hunter Option Available:
  [Scare Off] - Use hunting knowledge (70% success)

What do you do?
```

**Critical Events (5% of events):**

- Boat severely damaged (must retreat or repair)
- Serious injury to party member
- Completely lost (major time loss)
- Ambush by hostiles
- Capsizing risk
- Blocked route (landslide, fallen tree)

Example forcing retreat:

```
💥 CRITICAL: Your boat strikes hidden rocks!

The hull is badly damaged and taking on water.
You must make an immediate decision:

[Emergency Repair] - Attempt fix (4 hours, risky)
[Retreat to Previous Location] - Go back for proper repair
[Beach and Camp] - Pull ashore, camp, repair overnight

⚠️ Current stamina too low for emergency repair.
   Retreat recommended.
```

### 4.5 Retreat Mechanics

**When Retreat is Available:**

1. During travel event (player choice)
2. After arriving at dangerous location
3. When scouting ahead reveals danger
4. When party is too weak to continue
5. When approaching night in unsafe area

**Retreat Costs:**

| Resource | Retreat Cost                 |
| -------- | ---------------------------- |
| Time     | 50% of original travel time  |
| Stamina  | 50% of original stamina cost |
| Food     | 50% of original food cost    |
| Water    | 50% of original water cost   |

**Retreat Restrictions:**

- Cannot retreat if average party stamina < 10
- Cannot retreat from critical event until resolved
- Can only retreat once per route (prevents loops)
- Cannot retreat if route behind is blocked

**Retreat Benefits:**

- Escape from danger
- Regroup at safer location
- Try different route from previous node
- Rest before attempting again
- Gather more information from NPCs

**Retreat Example:**

```
You decide to retreat back to Rio Tambo Bend.

Retreat Time: 1 hour, 40 minutes (50% of 3h 20min)
Costs:
  - Stamina: -7 per person
  - Food: -1 ration
  - Water: -3 canteens

New arrival time: 4:15 PM (still daylight)

[Confirm Retreat]  [Stay and Handle Event]
```

---

## 5. Party System

### 5.1 Party Composition

**Party Size:**

- Minimum: 1 (player alone)
- Maximum: 4 (player + 3 companions)
- Optimal: 3-4 (access to all skill types)

**Party Slots:**

```
┌──────────────────────────────────────┐
│ Your Party                            │
├──────────────────────────────────────┤
│ Slot 1: [You] - Player Character     │
│         Health: ████████░░ 80%        │
│         Languages: English,Portuguese │
│                                       │
│ Slot 2: [Carlos] - Navigator         │
│         Health: ██████████ 100%       │
│         Skill: Navigation ⭐⭐         │
│         Languages: Portuguese, Tupi   │
│         Relationship: +45 (Friendly)  │
│                                       │
│ Slot 3: [Empty] - [Recruit]          │
│                                       │
│ Slot 4: [Empty] - [Recruit]          │
└──────────────────────────────────────┘
```

### 5.2 Recruitment

**Recruitment Process:**

1. **Meet NPC** during dialogue
2. **Build trust** through conversation choices
3. **Reach recruitment threshold** (relationship +30)
4. **Make offer:**
   - Some join for free (motivated by cause)
   - Some require payment (supplies, money)
   - Some require completing quest first
   - Some require specific party composition
5. **NPC considers:**
   - Your relationship level
   - Your reputation
   - Party composition (conflicts?)
   - Your resources
   - Your destination
6. **Accept or decline**

**Recruitment Dialogue Example:**

```
Carlos: "You're heading deeper into the jungle?
        That's dangerous territory, my friend."

You: "I need to find Lágrimas da Lua. My
     grandmother is dying."

Carlos: [thoughtful] "The Moon Tears... I've heard
        stories. The way is treacherous, but..."
        [pauses] "I know these rivers. I could
        guide you."

💬 Recruitment Opportunity!

Carlos wants to join your expedition.

Skills: Navigation ⭐⭐
Languages: Portuguese, Tupi
Stats: High instincts, good charisma

Requirements:
  ✓ Relationship: +40 (you have +45)
  ✓ Party space: 1 slot available
  ✓ Willing to share supplies

[Accept Carlos] [Politely Decline] [Negotiate Terms]
```

**Factors Affecting Recruitment:**

**Positive:**

- High relationship (+40 or more)
- Good reputation in region
- Shared goals/values
- Promise of payment
- Desperate character situation
- Player charisma
- Language compatibility

**Negative:**

- Low relationship (<20)
- Bad reputation
- Conflicting party members
- Dangerous mission
- Low supplies
- Character has obligations
- Language barrier (can't communicate offer)

### 5.3 Party Management

**Management Actions:**

**Talk to Companion:**

- Build relationship
- Learn backstory
- Get advice about current situation
- Resolve conflicts
- Practice language
- Time cost: 30-60 minutes

**Dismiss Companion:**

- Remove from party
- They leave with their items
- May affect relationship permanently
- May refuse to rejoin later
- Some will be hurt, others understanding

**Check Stats:**

- View all companion stats
- See equipment/inventory
- Check morale and relationship
- Review skills and languages
- No time cost

**Resolve Conflict:**

- Mediate between companions
- Choose sides or stay neutral
- Affects relationships with both
- May result in departure if handled badly
- Time cost: 30 minutes to 1 hour

### 5.4 Party Effects

**Resource Consumption Multipliers:**

**Party Resource Consumption:**

The game tracks consumption based on party size:

- **Food**: 3 units per person per day
- **Water**: 6 units per person per day
- **Medicine**: Only consumed when needed
- **Fuel**: 1 unit per 2 people for camping

**Travel Effects:**

- Larger party = More supplies needed
- Skills from party members apply to everyone
- Party average stamina affects travel speed
- Low party morale = Slower actions
- High party morale = Bonus to checks

**Combat Effects:**

- More party members = Better combat odds
- Skills provide combat options
- Companions can be injured/killed
- Party strength adds to combat power

**Dialogue Effects:**

- Companions present affect NPC reactions
- Translators enable conversations
- Charismatic companions help negotiations
- Some NPCs react to specific companions

---

## 6. Skills System

### 6.1 Overview

Skills are special abilities that companions possess, fundamentally changing gameplay options. Each companion has 1-2 skills. Skills provide passive bonuses and unlock new actions.

**The Four Core Skills:**

1. **Navigation** - Travel expertise
2. **Hunting** - Combat and foraging
3. **Naturalist** - Plant knowledge and resources
4. **Healer** - Medical expertise

### 6.2 Navigation Skill

**Possessed by:** River guides, explorers, indigenous trackers, cartographers

**Passive Benefits:**

- **Travel Time:** -15% to all travel duration
- **Safe Passage:** +10% to safe travel chance
- **Accurate Estimates:** Shows exact travel time (removes "3-4 hours" variance)
- **Route Knowledge:** Reveals terrain difficulty accurately before traveling
- **No Getting Lost:** Immunity to "lost" travel events

**Active Abilities:**

**Scout Ahead** (1 hour)

```
Use navigation expertise to scout the route ahead.

Effect: Reveals next 2 connected nodes on map
       Shows their terrain, distance, and difficulty
       May spot dangers or points of interest

Time: 1 hour
Cost: -5 stamina
Success: 90% (or auto-success with 2+ navigators)
```

**Choose Better Route** (at forks)

```
When multiple paths available, navigator can
analyze and recommend the safest/fastest route.

UI Enhancement:
  Path A: 22 km (🟢 Navigator recommends this)
  Path B: 18 km (⚠️ Navigator warns: dangerous)
```

**Read the River** (passive)

```
Navigators notice environmental clues:
- "The water is too calm here - something ahead"
- "Birds are fleeing - storm approaching"
- "This current will speed our journey"

These hints provide warnings or advantages
```

**Skill Stacking:**

- 2 Navigators: -30% travel time, +20% safety, scout reveals 3 nodes
- 3 Navigators: -45% travel time, +30% safety, scout reveals 4 nodes

**Example in Play:**

Without Navigator:

```
Travel to: Unknown Location
Distance: 25 km
Est. Time: 4-6 hours
Risk: Unknown
```

With Navigator:

```
Travel to: Manaus Trading Post (identified by navigator)
Distance: 25 km
Est. Time: 3 hours, 42 minutes (exact)
Risk: LOW (navigator knows safe passage)
+ Navigator bonus: -15% time = Actual: 3h 9min
```

### 6.3 Hunting Skill

**Possessed by:** Hunters, warriors, ex-soldiers, trackers

**Passive Benefits:**

- **Foraging Bonus:** +50% food from forage actions
- **Efficient Hunting:** Uses 50% less ammunition/tools
- **Danger Sense:** Warnings before animal encounters
- **Track Reading:** Can identify animal tracks at locations

**Active Abilities:**

**Hunt** (2-4 hours)

```
Actively hunt for game instead of just foraging.

Time: 2-4 hours (based on conditions)
Requirements: Weapon or trap
Success Chance:
  Base: 60%
  + Good area: +20%
  + Dawn/dusk: +10%
  + Multiple hunters: +10% each

Rewards on success:
  Standard: 8-12 food rations
  Excellent: 15-20 food rations + hide/trophy

Failures:
  Minor: No catch, -stamina
  Major: Injury from dangerous animal
```

**Combat Options** (during encounters)

```
When facing dangerous animals or hostiles,
hunters unlock special options:

vs. Predator:
  [Scare Off] - Use intimidation (70% success)
  [Set Trap] - Prepare defensive position
  [Counter-Attack] - Turn tables on stalker

vs. Hostile Humans:
  [Ambush] - Strike first
  [Flanking Maneuver] - Better position
  [Warning Shot] - Intimidate without killing
```

**Track & Identify** (15 minutes)

```
Read animal signs at any location.

Effect: Learn what animals are nearby
        Assess danger level
        Find animal paths (may reveal shortcuts)

Example outputs:
  "Fresh jaguar tracks. It passed within the hour."
  "Tapir droppings. Herbivores feel safe here - good sign."
  "No animal signs at all. Something's wrong."
```

**Skill Stacking:**

- 2 Hunters: +100% foraging, hunt success +20%, both can hunt simultaneously
- 3 Hunters: +150% foraging, hunt success +40%, instant danger detection

**Example in Play:**

During Travel Event:

```
🐍 ENCOUNTER: Anaconda blocks your path!

Standard options:
  [Fight] (risky, 50% injury chance)
  [Wait] (3 hours, may not leave)
  [Retreat] (go back, lose time)

🎯 HUNTER OPTION UNLOCKED:
  [Scare Off with Fire]
    Your hunter uses their experience with
    predators to safely intimidate the snake.
    Success: 85%
    Time: 30 minutes
    Cost: -1 fuel
```

### 6.4 Naturalist Skill

**Possessed by:** Botanists, biologists, herbalists, shamans, scientists

**Passive Benefits:**

- **Foraging Bonus:** +50% food from foraging
- **Resource Discovery:** Chance to find bonus items while foraging:
  - Medicinal plants (15% chance, +2-4 medicine)
  - Rare specimens (5% chance, valuable for trading)
  - Useful materials (20% chance, tools/crafting items)
- **Plant Identification:** Automatically identify plants at locations
- **Knowledge Sharing:** Party learns about flora/fauna (morale boost)

**Active Abilities:**

**Advanced Foraging** (1-2 hours)

```
Use botanical knowledge for superior foraging.

Time: 1-2 hours
Success: 85% (vs. 60% for standard foraging)

Rewards:
  Standard foraging: 3-5 food
  Naturalist foraging: 6-10 food + bonus chance

Bonus rolls:
  15%: +2-4 medicine (medicinal plants)
  20%: +1 tool/material (useful plant fibers)
  5%: +rare specimen (worth 20-50 at trade)
  10%: +knowledge (learn about area)
```

**Study Flora** (30 minutes)

```
Examine plants and ecosystem at current location.

Effect: Learn detailed information about area
        Identify edible/medicinal/dangerous plants
        Gain knowledge for future

Unlocks: "Nature's Pharmacy" - can use plants as medicine
         "Safe Foraging" - no chance of poisoning
         "Ecosystem Insight" - understand area dangers
```

**Prepare Herbal Remedy** (1 hour)

```
Craft medicine from plants (requires studying area first).

Requirements: Local plants identified
Time: 1 hour
Cost: None (uses found plants)

Creates: 2-4 medicine doses
Effect: As effective as regular medicine
Bonus: Naturalist + Healer combo = +2 extra doses
```

**Special Dialogue Options**

```
Naturalists can converse with:
- Scientists (shared knowledge)
- Shamans (plant lore exchange)
- Locals about plants
- Traders (identify valuable specimens)

This can unlock:
- Better prices for specimens
- Secret locations
- Plant knowledge
- Shortcuts through terrain
```

**Skill Stacking:**

- 2 Naturalists: +100% foraging, 30% bonus item chance, study time -50%
- 3 Naturalists: +150% foraging, 50% bonus item chance, instant plant ID

**Synergy with Healer:**

```
Naturalist + Healer in same party:
✓ Can craft superior medicine (3× effectiveness)
✓ Herbal remedies work better (+50%)
✓ Illness prevention increased to 50%
✓ Can cure some illnesses without medicine
```

### 6.5 Healer Skill

**Possessed by:** Doctors, nurses, shamans, herbalists, medics, missionaries

**Passive Benefits:**

- **Medicine Effectiveness:** +50% healing from medicine
- **Medicine Discovery:** +25% medicine found while foraging
- **Illness Prevention:** -30% chance of party illness
- **Early Detection:** Identifies illness symptoms before they worsen
- **Camping Benefit:** Checks on party health overnight

**Active Abilities:**

**Treat Illness/Injury** (2 hours)

```
Professional medical treatment.

Time: 2 hours (vs. 4 hours for rest/hope)
Requirements: Medicine (1 dose for minor, 2 for serious)
Success: 95% (vs. 60% without healer)

Effects:
  With healer: Full cure in 2 hours
  Without: Partial cure in 4 hours, may worsen

Healer + medicine bonus:
  1 medicine dose heals like 1.5 doses
  Can treat 2 minor injuries with 1 medicine
```

**Prepare for Journey** (30 minutes)

```
Before travel, healer checks party health.

Effect: +10% stamina to all party members
        Early warning of hidden illness
        Identifies who needs rest before travel
        Provides health advice

Benefit: Reduces travel injury chance by 20%
```

**Emergency Treatment** (immediate, during encounters)

```
When party member injured in encounter:

Standard:
  - Injury causes -30 stamina
  - Requires medicine later
  - May worsen if untreated

With Healer:
  - Immediate first aid: injury reduced to -15 stamina
  - Can stabilize without medicine
  - Prevents worsening
  - Faster recovery
```

**Diagnosis** (15 minutes)

```
Examine party member to assess health.

Reveals:
  - Hidden illness (before symptoms)
  - Injury severity
  - Exact treatment needed
  - Time to recovery
  - Risk factors

Allows: Preventive care
        Better treatment decisions
        Resource planning
```

**Special NPC Interactions:**

```
Healers can:
- Treat sick NPCs (improves reputation)
- Trade medical knowledge
- Get better prices on medicine
- Access medical facilities
- Unlock healer-only dialogue paths
```

**Skill Stacking:**

- 2 Healers: +100% medicine effectiveness, -50% illness chance, treat time -50%
- 3 Healers: +150% effectiveness, -70% illness chance, can cure without medicine

**Synergy with Naturalist:**

```
Naturalist + Healer combination:
✓ Herbal remedies replace medicine
✓ +100% foraged medicine
✓ Can craft powerful remedies
✓ Illness prevention: -60%
✓ Party health management excellence
```

**Example in Play:**

Without Healer:

```
⚠️ Travel Event: João has developed fever!

Options:
  [Use Medicine] -2 medicine, 60% cure, 4 hours
  [Rest and Hope] No cost, 30% cure, 6 hours
  [Ignore] Continue, will worsen
```

With Healer:

```
💊 Travel Event: João has fever!

Dr. Silva immediately begins treatment.

[Professional Treatment]
  Time: 2 hours
  Cost: -1 medicine (healer efficiency)
  Success: 95%
  Bonus: João will recover stamina faster
```

### 6.6 Skill Summary Table

| Skill          | Best For           | Primary Benefit     | Active Abilities                | Time Savings | Resource Savings |
| -------------- | ------------------ | ------------------- | ------------------------------- | ------------ | ---------------- |
| **Navigation** | Travel efficiency  | -15% travel time    | Scout ahead, route analysis     | ⭐⭐⭐⭐⭐   | ⭐⭐⭐           |
| **Hunting**    | Food security      | +50% foraged food   | Hunt, combat options            | ⭐⭐         | ⭐⭐⭐⭐         |
| **Naturalist** | Resource gathering | Bonus items         | Advanced forage, craft medicine | ⭐⭐⭐       | ⭐⭐⭐⭐⭐       |
| **Healer**     | Party survival     | +50% medicine power | Treat illness, prevent injury   | ⭐⭐⭐⭐     | ⭐⭐⭐⭐⭐       |

**Recommended Party Compositions:**

**Balanced Party** (recommended for new players):

- Slot 1: Player
- Slot 2: Navigator (fast travel)
- Slot 3: Hunter (food/combat)
- Slot 4: Healer (survival)

**Speed Run Party**:

- Slot 1: Player
- Slot 2: Navigator
- Slot 3: Navigator
- Slot 4: Hunter (for food)
  Result: -30% travel time, minimal events

**Resource Efficiency Party**:

- Slot 1: Player
- Slot 2: Naturalist
- Slot 3: Healer
- Slot 4: Hunter
  Result: Never run out of supplies, synergies

**Combat Party**:

- Slot 1: Player
- Slot 2: Hunter
- Slot 3: Hunter
- Slot 4: Healer
  Result: Excellent in encounters, safe from animals

---

## 7. Language System

### 7.1 Languages in the Amazon

**The Nine Languages:**

| Language       | Speakers                   | Usage Area                  | Difficulty to Learn |
| -------------- | -------------------------- | --------------------------- | ------------------- |
| **Portuguese** | Colonial settlers, traders | Major settlements, coast    | Medium              |
| **Spanish**    | Border regions             | Western Amazon              | Medium              |
| **English**    | Foreigners, scientists     | Rare, large cities only     | N/A (player native) |
| **Quechua**    | Highland indigenous        | Andes, upper Amazon         | Hard                |
| **Tupi**       | Indigenous peoples         | Central/lower Amazon        | Hard                |
| **Guarani**    | Southern tribes            | Southern Amazon             | Hard                |
| **Arawak**     | Northern tribes            | Northern Amazon, Orinoco    | Very Hard           |
| **Tikuna**     | Western tribes             | Western Amazon, Peru border | Very Hard           |
| **Yanomami**   | Isolated tribes            | Deep jungle, remote         | Very Hard           |

### 7.2 Player Language Selection

**At Game Start:**

```
┌──────────────────────────────────────────┐
│ Language Proficiency                      │
├──────────────────────────────────────────┤
│ You speak English fluently.               │
│                                           │
│ Do you also know Portuguese?              │
│                                           │
│ [Yes - I studied it] (Easier game start)  │
│ [No - English only] (Harder but possible) │
│                                           │
│ Note: You can learn languages from        │
│ companions during your journey.           │
└──────────────────────────────────────────┘
```

**Effect of Choice:**

- **With Portuguese:** Can talk to most settlers, traders, guides
- **Without Portuguese:** Must find English speakers or translators early

### 7.3 NPC Language Assignment

**Each NPC speaks 1-4 languages based on background:**

**Examples:**

**River Guide (Local)**:

- Name: Carlos
- Languages: Portuguese, Tupi
- Primary Language: Portuguese

**Indigenous Shaman**:

- Name: Ayahuasca
- Languages: Tupi, Yanomami
- Primary Language: Tupi

**Foreign Scientist**:

- Name: Dr. Schmidt
- Languages: English, Portuguese, German
- Primary Language: English

**Isolated Tribe Member**:

- Name: Kwame
- Languages: Yanomami only
- Primary Language: Yanomami

**Multilingual Trader**:

- Name: Roberto
- Languages: Portuguese, Spanish, Quechua, Guarani
- Primary Language: Portuguese

**Language Distribution by Location:**

- **Large Settlements:** Portuguese dominant, some Spanish
- **Trade Posts:** Portuguese, some indigenous
- **Small Villages:** Mix of Portuguese and local indigenous
- **Tribal Areas:** Indigenous languages only
- **Remote Locations:** Single tribal language

### 7.4 Language Barriers in Dialogue

**No Common Language:**

```
You approach an elderly indigenous woman.
She speaks in a language you don't understand.

[Available Actions]
  [Use Gestures] - Try to communicate non-verbally
  [Show Item] - Point to what you need
  [Leave] - Can't communicate effectively

⚠️ Language Barrier: You don't speak Tikuna
   She doesn't speak English

Finding a translator or learning the language
would allow real conversation.
```

**Result:**

- Cannot have meaningful dialogue
- Cannot recruit them
- Very limited trading (point at items)
- Cannot get detailed information
- Cannot build relationship effectively
- Miss story/quest opportunities

**With Translator in Party:**

```
You approach an elderly indigenous woman.
Your companion João steps forward to translate.

"She speaks Tikuna. I can translate," João says.

💬 Translation Available (via João)

[Talk to Woman] - João will translate
  (Note: Translation adds slight delay)
  (Complex nuance may be lost)
```

**Translation Quality Factors:**

| Factor                      | Effect                                       |
| --------------------------- | -------------------------------------------- |
| Translator Relationship     | High relationship = better translation       |
| Translator's Language Skill | Native speaker = perfect, learned = good     |
| Conversation Complexity     | Simple = accurate, complex = may lose nuance |
| Translator's Charisma       | High = adds helpful context                  |

**Translation Example:**

```
Woman (in Tikuna): [long speech]

João translates: "She says the river ahead is
dangerous. Spirits are angry. Her son disappeared
there three moons ago."

[Response Options]
  → "Ask about her son"
  → "Ask about the spirits"
  → "Thank her for warning"
  → "Offer help"

(Your response will be translated back by João)
```

### 7.5 Learning Languages

**Practice System:**

```
[Practice Tupi with Carlos]

Time: 1 hour
Effect: +1 Tupi proficiency point

Current Progress:
  Tupi: ▓▓▓▓░░░░░░ 8/50 (Basic Phrases)

Levels:
  0-9: No understanding
  10-24: Basic phrases (hello, help, food)
  25-49: Conversational (can have simple talks)
  50+: Fluent (full dialogue)

[Practice Now] [Cancel]
```

**Learning Speed:**

- 1 hour practice = +1 proficiency point
- Practicing with native speaker = +2 points
- Using language in real situation = +3 points
- 10 total: Basic phrases (emergency communication)
- 25 total: Conversational (can dialogue with assistance)
- 50 total: Fluent (perfect communication)

**Practical Example:**

Starting with no Portuguese:

- Hour 1-10: Learning basics from companion
- Hour 10: Can say "hello," "help," "thank you"
- Hour 25: Can have simple conversations
- Hour 50: Fluent, no translator needed

**Quick Learning Phrases:**

At 10+ proficiency, you can communicate basic needs without translator:

```
With Basic Tupi (10+ points):

Woman speaks Tupi: [asks something]

You understand: "...perigo...rio..." (danger...river)

[Available Responses]
  → "Obrigado" (Thank you) [Universal]
  → "Perigo?" (Danger?) [Learned from practice]
  → [Gesture] Follow up? (Non-verbal)

Not full dialogue, but better than nothing!
```

### 7.6 Language Strategy

**Strategic Considerations:**

**Early Game:**

- Prioritize recruiting Portuguese speakers
- Or Spanish if in western regions
- Find multilingual companions quickly

**Mid Game:**

- Learn most common indigenous language in your route
- Recruit translator for tribal areas
- Consider which areas you'll visit

**Late Game:**

- Hopefully have translator for final areas
- Or learned enough to communicate
- Language proficiency pays off

**Optimal Party Language Coverage:**

```
Example Strong Party:

Slot 1: Player (English, learning Tupi)
Slot 2: Carlos (Portuguese, Tupi) - Navigator
Slot 3: Dr. Silva (Portuguese, Spanish, Quechua) - Healer
Slot 4: Kaya (Tupi, Yanomami, Arawak) - Naturalist

Coverage: 7 of 9 languages
Can communicate almost anywhere!
```

### 7.7 Language Impact on Gameplay

**Recruitment:**

- Can't recruit if no common language
- Need translator present to make offer
- Building relationship impossible without communication

**Trading:**

- Basic trading possible with gestures (inefficient)
- Better prices with shared language
- Best deals with charisma + language

**Information:**

- Can't get directions without communication
- Can't learn about dangers/routes
- Miss valuable hints and lore

**Quests:**

- Can't receive quests if can't understand
- Can't complete dialogue-based quests
- Miss entire storylines

**Reputation:**

- Can't build reputation without talking
- Misunderstandings can hurt reputation
- Speaking native language shows respect (+relationship)

**Example Impact:**

Without Portuguese:

```
You arrive at a trading post.

The merchant speaks rapidly in Portuguese.
You don't understand a word.

[Point at supplies] - Try to buy, but prices unclear
[Show money] - He might help, might overcharge
[Leave] - Come back with translator
```

With Portuguese:

```
You arrive at a trading post.

Merchant: "Bem-vindo! Welcome! Looking to trade?"

Full dialogue options available:
  → "What do you have for sale?"
  → "I need supplies for a long journey"
  → "Have you heard of Lágrimas da Lua?"
  → "What's the situation downriver?"
  → [Haggle] Better prices
```

---

## 8. Character Stats

### 8.1 The Seven Stats

Every companion has seven stats that affect gameplay and relationships.

**Stat Ranges:**

- Most stats: 0-100 scale
- Relationship: -100 to +100 scale

### 8.2 Morale (0-100)

**What It Represents:**
Current mental state, motivation, happiness

**Affected By:**

- Success in challenges (+5-10)
- Failure in challenges (-5-10)
- Party member death (-30)
- Finding resources (+5)
- Running low on supplies (-10)
- Player treatment (+/-5-15)
- Conflicts with other companions (-10)
- Beautiful moments (+5)
- Dangerous situations (-5)

**Effects on Gameplay:**

| Morale Level          | Effects                                                                             |
| --------------------- | ----------------------------------------------------------------------------------- |
| **80-100:** Excellent | +10% to all skill checks, volunteers for tasks, positive attitude, shares resources |
| **50-79:** Good       | Normal performance, helpful, stable                                                 |
| **30-49:** Low        | -10% to skill checks, complains, less helpful, may argue                            |
| **10-29:** Poor       | -20% to skill checks, unhappy, considering leaving, conflicts                       |
| **0-9:** Critical     | -30% to skill checks, will leave at next opportunity, may desert                    |

**Improving Morale:**

- Talk to companion (1 hour, +5-15 based on your words)
- Success in missions (+automatic)
- Rest at nice locations (+5)
- Finding food when hungry (+10)
- Resolving their personal quest (+20)

**Example:**

```
Carlos's Morale: 35 (Low)

Effects:
  - Navigation skill reduced: -25% time (was -30%)
  - Complains during travel
  - Less likely to volunteer advice

Recent morale changes:
  - Lost supplies in storm: -15
  - Argument with Kaya: -10
  - You defended him in conversation: +5
  - Successful hunt: +5

Action needed: Talk to Carlos to improve morale
```

### 8.3 Trustworthiness (0-100, Hidden Stat)

**What It Represents:**
How reliable and honest the character is

**Player Never Sees This Number:**

- Revealed through actions, not stats
- Player must judge through behavior
- Some characters hide their true nature

**Determined By:**

- Character background
- Personal values
- Desperation level
- Relationship with player (can override low trust)

**Effects on Gameplay:**

| Trust Level                  | Behavior                                                         |
| ---------------------------- | ---------------------------------------------------------------- |
| **80-100:** Very Trustworthy | Always reliable, never steals, stays in danger, shares resources |
| **50-79:** Trustworthy       | Generally reliable, honest, stays with party                     |
| **30-49:** Questionable      | May steal if desperate, might flee danger, hides information     |
| **10-29:** Untrustworthy     | Steals supplies, lies, likely to abandon in danger               |
| **0-9:** Treacherous         | Will betray, steal, harm party for gain                          |

**How Player Learns About Trust:**

Through Events:

```
During the night, you notice João going through the supplies.

[Confront Him]
  High trust: "Just checking our inventory. We're running low on medicine."
  Low trust: "I was... uh... looking for... never mind." (Lies)

[Let it Slide]
  High trust: Nothing happens
  Low trust: Wake up with missing supplies
```

**Trust Can Change:**

- Saving their life: +20 trust
- Sharing resources when scarce: +10
- High relationship: Gradually increases trust
- Desperation (starving): Temporarily decreases effective trust

**Example Scenarios:**

**High Trust Companion:**

```
⚠️ CRITICAL DANGER: Jaguar attack!

[Distribute stamina potion - only 1 dose left]

João: "Give it to Maria, she's more injured than me.
       I'll manage."

(João has high trust - puts party first)
```

**Low Trust Companion:**

```
⚠️ CRITICAL DANGER: Jaguar attack!

[Distribute stamina potion - only 1 dose left]

Diego: "Give it to me! I can't fight like this!"
       (Grabs potion before you decide)

(Diego has low trust - selfish behavior)
```

### 8.4 Charisma (0-100)

**What It Represents:**
Personal charm, persuasiveness, social skills

**Effects on Gameplay:**

**In Dialogue:**

- High charisma companion present: Better NPC reactions
- NPCs more likely to share information
- Easier to defuse conflicts
- Better negotiation outcomes

**In Trading:**

- Buy prices: -1% per 10 charisma points
- Sell prices: +1% per 10 charisma points
- Character with 80 charisma: -8% buy, +8% sell

**In Recruitment:**

- Charismatic party members help recruit others
- +5% recruitment chance per 10 charisma of talker

**In Party Dynamics:**

- High charisma helps resolve conflicts
- Can mediate between other party members
- Improves group morale

**Example:**

Trading without charismatic companion:

```
Merchant: "Medicine? 50 reais per dose."
[Buy] -50 reais per dose
```

Trading with Carlos (Charisma 75):

```
Carlos handles the negotiation.

Carlos: "Come on, friend, we're traveling far.
         Can you do better than 50?"

Merchant: "For you, Carlos... 42 reais."

[Buy] -42 reais per dose (-16% discount!)
```

### 8.5 Strength (0-100)

**What It Represents:**
Physical power, endurance, toughness

**Effects on Gameplay:**

**Carrying Capacity:**

- Base capacity: 50 units
- +1 unit per 2 strength points
- Character with 80 strength: 50 + 40 = 90 capacity
- Party capacity = sum of all members

**Combat:**

- Physical combat effectiveness
- +1% damage per 5 strength points
- Better outcomes in strength-based encounters

**Physical Challenges:**

```
Event: Boulder blocking path

Standard option: [Try to Move] - 30% success

Strong party member: [João pushes boulder]
  João's strength: 85
  Success chance: 30% + 17% (from strength) = 47%
```

**Stamina:**

- High strength: Slower stamina loss during physical activity
- -1% stamina cost per 10 strength
- Character with 80 strength uses -8% less stamina

**Example:**

Weak party (avg strength 40):

```
Carrying capacity: 260 units
Current load: 245 units
Status: Nearly full (slow travel -5%)
```

Strong party (avg strength 70):

```
Carrying capacity: 340 units
Current load: 245 units
Status: Comfortable (no penalties)
```

### 8.6 Knowledge (0-100)

**What It Represents:**
Education, wisdom, information, expertise

**Effects on Gameplay:**

**Advice Quality:**

- High knowledge companions give better hints
- Identify dangers before encountering
- Provide historical/cultural context
- Suggest optimal strategies

**Puzzles and Mysteries:**

- Required for some dialogue options
- Unlocks knowledge-based solutions
- Can decipher clues

**Teaching:**

- Can teach player things
- Improves player's understanding
- Unlocks lore

**Special Dialogue:**

- Intellectual conversations with scholars
- Impresses educated NPCs
- Access to academic/scientific locations

**Example:**

```
You find ancient ruins carved with symbols.

Without high-knowledge companion:
  [Examine] - "These symbols are old. You can't read them."
  [Leave] - Move on

With Dr. Silva (Knowledge 85):
  [Silva Examines Ruins]

  Dr. Silva: "Fascinating! These are pre-Columbian
  glyphs. They indicate a sacred site nearby.
  The pattern suggests... yes, a healing spring!
  According to the inscription, it's east of here."

  ✓ New location revealed: Hidden Spring
  ✓ Gained knowledge: Ancient symbols
  ✓ Morale +5 (party inspired by discovery)
```

**Knowledge Checks:**

Some events require knowledge:

```
Event: Mysterious illness in village

Without high-knowledge healer:
  "You don't know what's causing this."
  Limited options, may make it worse

With Dr. Silva (Knowledge 85, Healer):
  "I've seen this before - it's malaria. The
  standing water nearby is breeding mosquitos.
  I can treat the sick and advise on prevention."

  ✓ Saves village
  ✓ +30 Reputation
  ✓ Village is grateful (rewards)
```

### 8.7 Instincts (0-100)

**What It Represents:**
Intuition, gut feelings, environmental awareness, street smarts

**Effects on Gameplay:**

**Danger Warnings:**

- High instinct: Warnings before bad events
- Sense when someone is lying
- Notice ambushes before they happen
- Feel when something is wrong

**Finding Hidden Things:**

- +1% chance per 5 instinct to find hidden items
- Notice secret passages
- Spot traps
- Discover shortcuts

**Event Preparation:**

```
Standard event: Ambush happens suddenly

High instinct party member:
  "Wait," Kaya whispers. "Something's not right.
   The birds went silent. I think we're being watched."

  ✓ Warning before ambush
  ✓ +20% combat advantage
  ✓ Option to avoid entirely
```

**Lie Detection:**

```
NPC: "The path ahead is totally safe, I promise."

Without high instinct:
  [Believe Him] or [Don't Believe Him] - You must guess

With Kaya (Instincts 90):
  Kaya mutters: "He's lying. His eyes shifted when
  he said 'safe.' He's hiding something."

  ✓ Player knows he's lying
  ✓ Can press for truth
  ✓ Avoid trap
```

**Exploration Bonus:**

- Find more items during exploration
- Notice details others miss
- Intuitive navigation aid

**Example Instinct Check:**

```
You approach a seemingly abandoned village.

João (Instincts 30): "Looks empty. Let's check it out."

Kaya (Instincts 85): [stops the party]
  "No. The doors are open but there's no wind damage.
   Fresh footprints in the dust going INTO buildings
   but not out. Someone's hiding. This is a trap."

Options unlocked:
  [Proceed Cautiously] - Combat advantage if ambush
  [Call Out] - Attempt communication
  [Avoid Entirely] - Go around
  [Investigate from Distance] - Use skills to scout
```

### 8.8 Relationship with Player (-100 to +100)

**What It Represents:**
How much the companion likes, respects, and trusts the player

**Most Important Stat:**

- Affects everything
- Determines loyalty
- Changes dialogue options
- Influences all interactions

**Relationship Ranges:**

| Range                    | Status                                                                               | Behavior |
| ------------------------ | ------------------------------------------------------------------------------------ | -------- |
| **70-100:** Close Friend | Maximum loyalty, will die for player, maximum skill effectiveness, shares everything |
| **40-69:** Friendly      | Loyal, helpful, performs well, shares information                                    |
| **10-39:** Neutral       | Does job, minimal extras, won't go out of way                                        |
| **0-9:** Distant         | Cold, minimal help, considering leaving                                              |
| **-1 to -30:** Dislike   | Unhelpful, may refuse tasks, likely to leave                                         |
| **-31 to -70:** Hostile  | Refuses to help, will leave soon, may sabotage                                       |
| **-71 to -100:** Enemy   | Will leave immediately or betray party                                               |

**Affected By:**

Positive:

- Respectful dialogue choices (+2-5)
- Defending them (+5-10)
- Sharing resources (+3-7)
- Listening to advice (+2-5)
- Completing personal quests (+20-30)
- Saving their life (+30)
- Fair treatment (+2-5)
- Victory/success (+3)

Negative:

- Rude dialogue (-5-15)
- Ignoring them (-2-3)
- Selfish decisions (-5-10)
- Endangering them unnecessarily (-10-20)
- Siding with their enemies (-15-25)
- Lying to them (-10)
- Unfair treatment (-5-10)

**Effects of High Relationship:**

At +70 (Close Friend):

```
Carlos: "Listen, I've been thinking about that fork
in the river ahead. The western route looks shorter,
but I've heard troubling things. Take the eastern
path - it's longer but I know it's safe. Trust me
on this, friend."

✓ Gives best advice (not just adequate)
✓ Uses resources to help you
✓ Won't leave even in danger
✓ May give you their last medicine
✓ +bonus to their skill effectiveness
```

**Effects of Low Relationship:**

At -20 (Dislike):

```
Carlos: "We're approaching a fork. I don't care
which way you go. Figure it out yourself."

✗ Won't share advice
✗ Minimal skill effectiveness
✗ Won't volunteer for anything
✗ Will leave at next settlement
✗ May demand extra payment
```

**Relationship Changes During Events:**

```
Event: You're ambushed. You have one escape route.

HIGH RELATIONSHIP COMPANION:
  Carlos: "Go! I'll hold them off!"
  (Sacrifices himself so you can escape)

LOW RELATIONSHIP COMPANION:
  Diego: "Every man for himself!"
  (Runs, leaving you behind)
```

**Relationship Dialog Unlocks:**

Different dialogue options appear based on relationship:

At +10 (Neutral):

```
→ "Let's keep moving"
→ "What do you think we should do?"
→ "Tell me about this area"
```

At +50 (Friendly):

```
→ "I really value your input, what do you think?"
→ "Are you doing okay? You seem troubled."
→ "Tell me about your past"
→ "I trust your judgment completely"
```

At +80 (Close):

```
→ "I couldn't do this without you, my friend"
→ "What are your deepest fears?"
→ "Tell me about your family"
→ "I promise I'll keep you safe"
```

### 8.9 Stats Summary Example

**Complete Companion Profile:**

```
═══════════════════════════════════════════
CARLOS MENDEZ - River Guide
═══════════════════════════════════════════

Skills: Navigation ⭐⭐
Languages: Portuguese, Tupi
Age: 42

STATS:
  Morale:        ████████░░ 78/100 (Good)
  Trust:         ████████░░ 82/100 (Hidden - Very Trustworthy)
  Charisma:      ███████░░░ 75/100 (Charming)
  Strength:      ██████░░░░ 60/100 (Average)
  Knowledge:     ████░░░░░░ 45/100 (Practical wisdom)
  Instincts:     ████████░░ 80/100 (Excellent intuition)
  Relationship:  ████████░░ +62/100 (Friendly)

EFFECTS ON PARTY:
  ✓ -30% travel time (navigation)
  ✓ +10% safe passage
  ✓ -16% trading prices (charisma)
  ✓ Danger warnings (high instincts)
  ✓ Good advice (high relationship)
  ✓ Loyal (will not abandon)

INVENTORY:
  - Worn map of Amazon
  - Compass
  - Machete
  - 2 medicine doses

BACKGROUND:
  Born in Manaus, Carlos has navigated these
  rivers for 25 years. He knows every current,
  every sandbar, every danger. Recently lost his
  wife to illness - your quest resonates with him.

═══════════════════════════════════════════
```

---

## 9. Supply System

### 9.1 The Five Supply Types

Instead of a single "supplies" number, the game tracks five distinct resource types:

| Supply Type  | Purpose                               | Consumption Rate                      | Weight per Unit |
| ------------ | ------------------------------------- | ------------------------------------- | --------------- |
| **Food**     | Prevents starvation, restores stamina | 3 per person per day                  | 2               |
| **Water**    | Prevents dehydration                  | 6 per person per day (9 in afternoon) | 1               |
| **Medicine** | Heals illness and injury              | As needed                             | 0.5             |
| **Tools**    | Repairs, crafting, utility            | Durability-based                      | 3               |
| **Fuel**     | Cooking, warmth, light                | 1 per camp, 0.5 per cooking           | 2               |

### 9.2 Food System

**Food Units:**

- 1 unit = 1 ration (meal for one person)
- Daily requirement: 3 units per person
- Miss meals: Gradual stamina loss

**Food Sources:**

- Start with: 20 units
- Forage: 3-5 units (1-2 hours)
- Hunt (with hunter): 8-12 units (2-4 hours)
- Advanced foraging (naturalist): 6-10 units
- Trade: Buy at settlements
- Find: Sometimes at locations

**Starvation Mechanics:**

Based on realistic human survival without food:

| Time Without Food | Effect                                                                  |
| ----------------- | ----------------------------------------------------------------------- |
| 0-24 hours        | Minor: -5% stamina regeneration                                         |
| 1-3 days          | Moderate: -15% stamina, -10% travel speed                               |
| 3-7 days          | Severe: -40% stamina, -25% travel speed, -20% max health                |
| 7-14 days         | Critical: -70% stamina, -50% travel speed, -50% max health, confusion   |
| 14-21 days        | Death imminent: Cannot perform strenuous actions, severe hallucinations |
| 21+ days          | Death                                                                   |

**Modifiers:**

- **Party Size**: Shared morale provides +20% tolerance (extends timeline by 20%)
- **Foraging**: Can slow starvation progression but not prevent death
- **Rest**: Reduces penalties temporarily while resting

**Food Spoilage:**

- Food spoils in hot conditions
- 5% chance per day in afternoon heat
- 15% chance if no preservation
- Spoiled food makes party sick

### 9.3 Water System

**Water Units:**

- 1 unit = 1 canteen
- Daily requirement: 6 units per person (9 in afternoon)
- More critical than food

**Water Sources:**

- Start with: 30 units
- River water: Unlimited but risky (must purify)
- Purification: 1 fuel per 10 water units
- Rain collection: 5-10 units during rain
- Settlements: Buy or refill for free
- Springs: Safe, unlimited

**Dehydration Mechanics:**

Based on realistic human survival without water (critical resource):

| Time Without Water | Effect                                                                            |
| ------------------ | --------------------------------------------------------------------------------- |
| 0-12 hours         | Minor: -10% stamina regeneration, -5% travel speed                                |
| 12-24 hours        | Moderate: -25% stamina, -15% travel speed, -10% max health                        |
| 24-48 hours        | Severe: -50% stamina, -30% travel speed, -25% max health, confusion               |
| 48-72 hours        | Critical: -75% stamina, -50% travel speed, -50% max health, severe hallucinations |
| 72+ hours          | Death                                                                             |

**Environmental Modifiers:**

- **Heatwave**: Accelerate timeline by 33% (death at 48 hours instead of 72)
- **Normal Weather**: Standard timeline as shown above
- **Cool/Rainy Weather**: Extend timeline by 25% (death at 90 hours)

**Activity Modifiers:**

- **Strenuous Travel**: Increases water consumption by 50%
- **Resting in Shade**: Slows dehydration progression by 20%
- **High Altitude/Humidity**: May slow or speed dehydration

**Purification:**

```
[Purify River Water]

Requirements: Fuel (1 unit per 10 water)
Time: 30 minutes
Result: +10 water units (safe)

Alternative: Drink unpurified (risk illness)
  Risk: 30% chance of waterborne illness
  Severity: -20 stamina per hour until treated
```

### 9.4 Medicine System

**Medicine Units:**

- 1 unit = 1 dose
- No daily consumption (only when needed)
- Most valuable resource

**Medicine Uses:**

- Cure illness: 1-2 doses
- Treat injury: 1 dose
- Prevent infection: 1 dose
- Boost stamina: +30 stamina

**Medicine Sources:**

- Start with: 5 doses
- Forage: 10% chance for 1 dose
- Naturalist forage: 15% chance for 2-4 doses
- Healer forage: 25% chance
- Herbal remedy (naturalist): Craft from plants
- Trade: Expensive at settlements
- Find: At medical locations

**Without Medicine:**

- Illness worsens over time
- Injuries heal very slowly
- Risk of permanent effects
- Possible death

**Healer Medicine Efficiency:**

- 1 dose works like 1.5 doses
- Can split doses (2 minor treatments from 1 dose)
- Better success rates

### 9.5 Tools System

**Tool Types:**

- **Machete**: Clearing paths, defense
- **Rope**: Climbing, securing boat, traps
- **Knife**: Hunting, crafting, utility
- **Axe**: Firewood, shelter, clearing
- **Fishing gear**: Catching fish (food source)
- **Repair kit**: Fixing boat, equipment

**Durability:**

- Each tool has durability: 100%
- Loses 10-20% per use
- At 0%: Tool breaks, must replace

**Tool Uses:**

```
Example: Machete

Durability: 65%

Uses:
  - Clear undergrowth (explore dense areas)
  - Defend against animals (+10% combat)
  - Harvest plants (foraging bonus)
  - Clear path (reduce travel time)

Per use: -10% durability
Repair: Requires repair kit + 1 hour
```

**Without Needed Tool:**

- Some actions impossible
- Other actions take 2× time
- Lower success rates
- May take damage trying

### 9.6 Fuel System

**Fuel Units:**

- 1 unit = Firewood or oil for one fire
- Used for: cooking, purifying water, warmth, light

**Fuel Uses:**

- Camping: 1 unit (required for safe camp)
- Cooking: 0.5 unit (makes food safer/better)
- Purify water: 1 unit per 10 water
- Signal fire: 2 units
- Scare animals: 0.5 unit

**Fuel Sources:**

- Start with: 10 units
- Gather firewood: 1 hour = 3-5 units
- Find: At locations
- Buy: At settlements (cheap)
- Forage: As side benefit

**Camping Without Fuel:**

- Cannot camp safely
- Cold (−10 stamina overnight)
- Predator risk (+30%)
- Morale penalty (−5)
- Cannot cook food

### 9.7 Weight & Carrying Capacity

**Carrying Limits:**

- Each party member has capacity based on strength
- Base: 50 units
- +1 per 2 strength points
- Total party capacity = sum of all members

**Weight per Supply:**

- Food: 2 per unit (heavy)
- Water: 1 per unit
- Medicine: 0.5 per unit (light)
- Tools: 3 per unit (very heavy)
- Fuel: 2 per unit

**Overweight Penalties:**

| Capacity Used | Effect                              |
| ------------- | ----------------------------------- |
| 0-70%         | No penalty                          |
| 71-85%        | −5% travel speed                    |
| 86-95%        | −10% travel speed, −5 stamina/hour  |
| 96-100%       | −20% travel speed, −10 stamina/hour |
| 100%+         | Cannot travel, must drop items      |

**Strategic Weight Management:**

- Drop non-essential items
- Cache supplies at safe locations
- Trade heavy items for lighter ones
- Recruit stronger companions
- Use supplies before they become burden

### 9.8 Supply Management UI

**Inventory Screen:**

```
┌──────────────────────────────────────────────────┐
│ Party Supplies                Day 3, 2:30 PM     │
├──────────────────────────────────────────────────┤
│                                                   │
│ 🍖 Food:      42 units  (3 days supply)          │
│    Daily need: 12 (4 people × 3)                 │
│    Status: ✓ Adequate                            │
│                                                   │
│ 💧 Water:     28 units  (1 day supply)           │
│    Daily need: 24 (4 people × 6)                 │
│    Status: ⚠️ Running low!                        │
│    Action: Purify river water or find spring     │
│                                                   │
│ 💊 Medicine:  3 doses                            │
│    Status: ⚠️ Low - restock at next settlement   │
│                                                   │
│ 🔧 Tools:                                         │
│    Machete (65% durability)                      │
│    Rope (90% durability)                         │
│    Fishing gear (40% durability) ⚠️ Needs repair │
│    Repair kit (2 uses left)                      │
│                                                   │
│ 🔥 Fuel:      8 units  (8 camps worth)           │
│    Status: ✓ Good                                │
│                                                   │
├──────────────────────────────────────────────────┤
│ Weight: 215 / 340 units (63%) ✓ Comfortable     │
├──────────────────────────────────────────────────┤
│                                                   │
│ [Manage] [Forage] [Purify Water] [Repair Tools] │
└──────────────────────────────────────────────────┘
```

**Supply Warnings:**

- Red warning when <1 day supply
- Yellow warning when <2 days supply
- Automatic suggestions for actions
- Projected days until depletion

### 9.9 Supply Strategy

**Early Game:**

- Focus on food and water security
- Gather fuel when available
- Conserve medicine
- Protect tools from breaking

**Mid Game:**

- Balance gathering vs. traveling
- Use skills efficiently (hunters for food, naturalists for medicine)
- Trade surplus for medicine
- Maintain 3-4 days of supplies

**Late Game:**

- Stock up before final push
- Know when to travel light vs. fully stocked
- Emergency caching of supplies
- Risk vs. reward decisions

**Example Supply Crisis:**

```
Day 5, Evening

Current supplies:
  Food: 5 units (half day)
  Water: 8 units (less than half day)
  Medicine: 0 doses
  Fuel: 2 units

Party: 4 people
Location: Remote area, 2 days from next settlement

Options:
  1. [Forage Immediately] - 2 hours, gather food (risky at night)
  2. [Ration Supplies] - Extend 1 day, but penalties
  3. [Emergency Travel] - Push through night to settlement
  4. [Hunt Tomorrow] - With hunter, but uses whole morning
  5. [Retreat] - Go back to previous settlement (3 days)

What do you do?
```

---

## 10. Location System

### 10.1 Location Types

Every node on the map is one of five types:

**1. Empty/Scenic Locations** (30% of map)

- Beautiful scenery
- Safe resting spots
- Minimal interaction
- Good for camping
- May have basic resources

Example:

```
═══════════════════════════════════════
LOCATION: Tranquil Lagoon
═══════════════════════════════════════

A peaceful lagoon surrounded by towering palms.
The water is crystal clear, and exotic birds call
from the canopy. This seems like a safe place to rest.

NPCs: None
Items: None
Danger Level: Safe

Available Actions:
  → Rest (2-4 hours)
  → Camp (until morning)
  → Forage (1-2 hours)
  → Enjoy scenery (+5 morale, 30 min)
  → Continue to next location
═══════════════════════════════════════
```

**2. Discovery Locations** (25% of map)

- Find items, animals, plants
- Learning opportunities
- Resource gathering
- Knowledge gains

Example:

```
═══════════════════════════════════════
LOCATION: Ancient Kapok Tree
═══════════════════════════════════════

A massive kapok tree towers above the forest floor,
its buttress roots forming natural chambers. Strange
mushrooms grow in the shaded areas.

Discovery: Medicinal Mushrooms (if naturalist present)

Available Actions:
  → Examine tree (learn about ecosystem)
  → Gather mushrooms (naturalist: +3 medicine)
  → Rest in root chamber (safe, comfortable)
  → Search area (1 hour, may find items)
  → Continue journey
═══════════════════════════════════════
```

**3. Settlement Locations** (20% of map)

- Villages, trade posts, missions
- NPCs to meet
- Trading available
- Information source
- Recruitment opportunities
- Rest and resupply

Example:

```
═══════════════════════════════════════
LOCATION: São Gabriel Trading Post
═══════════════════════════════════════

A bustling trading post on the riverbank. Boats are
moored along a wooden dock, and the smell of cooking
fires fills the air. Traders hawk their wares while
locals gather news from travelers.

NPCs Present:
  - Roberto (Trader) - Portuguese, Spanish, Quechua
  - Father Miguel (Missionary) - Portuguese, Tupi
  - Ana (Local guide) - Portuguese, Arawak

Available Actions:
  → Talk to NPCs
  → Trade supplies
  → Rest at inn (costs money, full restore)
  → Gather information
  → Recruit (if NPCs interested)
  → Resupply water (free)
  → Continue journey

Merchant Inventory:
  Food: 50 reais per 10 units
  Water: Free (river access)
  Medicine: 80 reais per dose
  Tools: 100-200 reais
  Fuel: 20 reais per 5 units
═══════════════════════════════════════
```

**4. Event Locations** (15% of map)

- Triggers scripted events
- Decision points
- Moral choices
- Story moments

Example:

```
═══════════════════════════════════════
LOCATION: Capsized Boat
═══════════════════════════════════════

You spot a capsized boat caught in branches near
the shore. Supplies float in the water, and you
hear weak cries for help from the riverbank.

EVENT: Rescue Decision

A man lies injured on the shore. He's badly hurt
and will die without help. His supplies are
scattered but could be gathered.

Options:
  → [Rescue Him] (1 hour, -1 medicine, +reputation)
       Risk: He might be dangerous

  → [Take Supplies, Leave Him] (30 min, +supplies)
       Consequence: He dies, -reputation, morale hit

  → [Rescue AND Take Supplies] (2 hours, -1 medicine)
       Best outcome but time-consuming

  → [Leave Entirely] (no time cost)
       Neutral outcome

What do you do?
═══════════════════════════════════════
```

**5. Dialogue Locations** (10% of map)

- Meet important NPCs
- Story progression
- Relationship building
- Quests and missions

Example:

```
═══════════════════════════════════════
LOCATION: Isolated Shaman's Hut
═══════════════════════════════════════

A small hut on stilts sits in a clearing. Smoke
rises from a fire pit, and strange totems surround
the dwelling. An elderly woman emerges, watching
you with keen eyes.

NPC: Ayahuasca (Shaman)
Languages: Tupi, Yanomami
Relationship: New (0)

"You seek the Moon Tears," she says in Tupi.
"I can see it in your aura. The path is dangerous,
but I know things that could help you..."

[Dialogue Begins]
═══════════════════════════════════════
```

### 10.2 Location Generation

**Location Content Generation:**

When a player first visits a node, the game generates:

- **Description**: AI-generated based on biome, type, weather, and time
- **NPCs**: Characters present based on location type and difficulty
- **Items**: Available pickups and resources
- **Events**: Triggered encounters and decision points
- **Danger Level**: Calculated from difficulty, time of day, and conditions

The AI creates unique, contextual content that never repeats exactly.

### 10.3 Time of Day Effects on Locations

**Settlements:**

- Day: Shops open, NPCs active, trading available
- Evening: Shops closing, inn available, limited NPCs
- Night: Most closed, inn only, guards suspicious

**Wilderness:**

- Day: Safe exploration, normal activities
- Dusk: Wildlife very active, visibility decreasing
- Night: Dangerous, limited visibility, predator encounters

**Abandoned Areas:**

- Day: Can explore safely
- Night: Very dangerous, horror elements

---

## 11. Camping System

### 11.1 Camping Overview

**When to Camp:**

- Night approaching (< 2 hours to nightfall)
- Party stamina low (<30 average)
- After difficult encounter
- Before major travel segment
- Strategic rest point

**Where to Camp:**

- Any location (but safety varies)
- Dedicated campsites (safest)
- Settlements (guaranteed safe)
- Wilderness (risky)

### 11.2 Setting Up Camp

**Camp Setup Process:**

```
[Set Up Camp]

Requirements:
  ✓ Fuel: 1 unit (required)
  ✓ Time: 30 minutes setup

Location Safety: MODERATE
  Base risk: 20%
  + Fire presence: -10%
  + Healer watch: -5%
  + Navigator chosen spot: -10%
  = Final risk: 5% (Very Low)

Benefits:
  • Advance time to 5:00 AM (next morning)
  • Restore stamina to 100% (all party)
  • Healing: Minor injuries recover
  • Morale: +5 (good rest)
  • Can cook food (better effect)

Event Chance: 5%
  • 70%: Positive (peaceful moment, discovery)
  • 25%: Neutral (normal night)
  • 5%: Negative (wildlife, weather)

[Confirm Camp] [Choose Different Location]
```

### 11.3 Camp Events

**Positive Events** (70% of camp events):

```
PEACEFUL NIGHT

The fire crackles softly as your party shares
stories under the stars. Carlos points out
constellations and tells tales of the river.

Effect:
  + Morale: +10 (all party)
  + Relationship with Carlos: +5
  + Party feels refreshed: +5 stamina bonus
  + Learned: River navigation tip
```

```
DISCOVERY

During the night, Kaya spots unusual plants
growing near the camp. Using her naturalist
knowledge, she identifies rare medicinal herbs.

Effect:
  + Medicine: +2 doses
  + Knowledge gained
  + Kaya feels useful: +5 morale
```

**Neutral Events** (25% of camp events):

```
UNEVENTFUL NIGHT

The night passes quietly. You wake to birdsong
and the smell of morning mist on the river.

Effect:
  • Normal stamina restore
  • No special bonuses or penalties
  • New day begins
```

**Negative Events** (5% of camp events):

```
⚠️ PREDATOR ENCOUNTER!

A jaguar prowls near your camp, drawn by the
smell of food. Your fire keeps it at bay, but
it circles, testing for weakness.

Options:
  [Keep Fire Burning] (-1 fuel, wait it out)
  [Scare It Off] (hunter can do safely)
  [Fight] (dangerous, may get injured)
  [Pack Up and Leave] (lose rest benefits)

What do you do?
```

```
STORM

A violent storm rolls in during the night.
Rain pounds the camp, and lightning illuminates
the forest. Your supplies get wet.

Effect:
  - Food: 10% spoils (−4 units)
  - Morale: -5 (uncomfortable night)
  - Stamina: Only 80% restored (poor sleep)
  - Tools: Durability -10% (water damage)
```

### 11.4 Camping Modifiers

**Safety Factors:**

| Factor                 | Effect on Safety                 |
| ---------------------- | -------------------------------- |
| Settlement/trade post  | 100% safe (no events)            |
| Designated campsite    | 95% safe                         |
| Navigator chooses spot | +15% safety                      |
| Fire burning           | +10% safety                      |
| Hunter on watch        | +10% safety (prevents predators) |
| Healer present         | +5% safety (health monitoring)   |
| Fortified position     | +10% safety                      |
| Remote/dangerous area  | -20% safety                      |
| After combat           | -10% safety (blood trail)        |
| Storm weather          | -15% safety                      |

**Camping Without Fuel:**

```
⚠️ Cannot camp safely without fuel!

No fire means:
  - Cold: -20 stamina overnight
  - Predator risk: 40% chance of encounter
  - Morale penalty: -10
  - No cooking benefits
  - Party uncomfortable

Options:
  [Camp Anyway] (risky)
  [Gather Firewood First] (1 hour, +3-5 fuel)
  [Find Shelter] (1 hour search, may find safe spot)
  [Don't Camp] (travel or rest instead)
```

### 11.5 Camp Conversations

**Talk to Companions at Camp:**

```
The fire crackles as your party settles in for
the night. This is a good time to talk.

Available Companions:
  → Carlos (Navigator) - Relationship: +62
  → Dr. Silva (Healer) - Relationship: +48
  → Kaya (Naturalist) - Relationship: +35

[Choose who to talk to]
```

**Camp Dialogue Example:**

```
You sit with Carlos by the fire.

Carlos: "You know, I've been thinking about why
I joined you on this crazy journey. When you told
me about your grandmother... it reminded me of my
wife. I couldn't save her. Maybe helping you saves
someone else's loved one."

Options:
  → "I'm grateful you're here" (+relationship)
  → "Tell me about your wife" (deeper conversation)
  → "We'll find the flower together" (+morale)
  → "I'm sorry for your loss" (+relationship)

This conversation can significantly improve your
relationship with Carlos.
```

### 11.6 Strategic Camping

**When to Camp:**

- Before nightfall (around 6-7 PM)
- Before major travel (enter well-rested)
- After resource gathering (process and rest)
- Before dangerous area (prepare)
- To skip bad weather

**When NOT to Camp:**

- Still early in day (waste time)
- In very dangerous location
- Without fuel
- When being pursued
- When time-sensitive quest active

---

## 12. Encounter System

### 12.1 Encounter Types

**Three Main Categories:**

1. **Wildlife Encounters** - Animals, predators
2. **Human Encounters** - Bandits, hostile groups
3. **Environmental Encounters** - Hazards, obstacles

### 12.2 Wildlife Encounters

**Common Wildlife:**

- Anaconda: Ambush predator, blocks paths
- Jaguar: Stalks party, attacks at night
- Caiman: River danger, attacks in water
- Piranha: Swarm attacks if bleeding
- Poison dart frog: Touch = poison
- Venomous snakes: Hidden danger

**Encounter Example:**

```
═══════════════════════════════════════
🐆 JAGUAR ENCOUNTER
═══════════════════════════════════════

A massive jaguar emerges from the undergrowth,
its eyes locked on your party. It's assessing
whether you're prey or threat.

Jaguar Status: Cautious (not yet attacking)
Party Strength: Moderate
Escape Routes: 2 available

BASE OPTIONS:
  [Stand Ground] (intimidate, 40% success)
    Success: Jaguar leaves
    Failure: Jaguar attacks

  [Retreat Slowly] (60% success)
    Success: Escape without fight
    Failure: Jaguar chases, forced combat

  [Attack First] (combat begins)
    Better position, but violence necessary

  [Run] (20% success)
    Very risky, likely triggers chase

🎯 HUNTER OPTION (João):
  [Scare with Fire and Sound]
    85% success rate
    João's expertise intimidates predator
    No combat needed
    Time: 30 minutes
    Cost: -0.5 fuel

What do you do?
═══════════════════════════════════════
```

### 12.3 Combat Resolution

**Combat Stats:**

- Party Combat Power = Sum of (Strength + Skills + Equipment)
- Enemy Combat Power = Base power + modifiers
- Success Chance = Party Power / (Party + Enemy Power)

**Combat Outcomes:**

**Victory:**

```
Your party defeats the jaguar!

Casualties:
  - João: -20 stamina (scratched)
  - Carlos: -10 stamina (exhausted)

Rewards:
  + Jaguar pelt (valuable trade item)
  + Hunter can harvest: +8 food
  + Morale: +5 (victory)
  + Experience: Party feels stronger

Treatment needed:
  → João's wound needs medicine (1 dose)
     or will worsen over time
```

**Defeat/Injury:**

```
The jaguar mauls João before fleeing!

Critical Injury:
  João: -50 stamina, bleeding
  Requires immediate treatment

Without healer:
  [Use 2 Medicine] (60% stop bleeding)
  [Try to Help] (40% success, may worsen)

With Dr. Silva (Healer):
  [Professional Treatment] (95% success)
  Uses: 1 medicine (healer efficiency)
  Time: 1 hour
  João will survive but needs rest
```

**Escape:**

```
Your party retreats successfully!

You escape back to the previous location.

Costs:
  - Time: Lost 2 hours
  - Stamina: -10 per person (running)
  - Morale: -5 (fled from danger)
  - Route: Must find alternate path
```

### 12.4 Human Encounters

**Types:**

- Bandits: Want supplies
- Hostile settlers: Territorial
- Suspicious locals: Distrust outsiders
- Desperate travelers: May rob or befriend

**Example:**

```
═══════════════════════════════════════
⚔️ BANDIT ENCOUNTER
═══════════════════════════════════════

Three armed men block your path. Their leader
steps forward with a machete.

"Nice supplies you have there," he sneers.
"Hand them over and nobody gets hurt."

Bandit Strength: Moderate (3 fighters)
Your Party: 4 members
Advantage: You look capable

OPTIONS:

💰 [Give Supplies] (-20 food, -10 water)
    Safest option, no combat
    Morale: -10 (humiliating)

⚔️ [Fight] (Combat begins)
    Your party: 65% chance to win
    Risk: Injuries, fatigue
    Reward: Keep supplies, may loot bandits

🗣️ [Intimidate] (Charisma check)
    Carlos (75 charisma): +15% success
    Base: 40% + 15% = 55%
    Success: Bandits back down
    Failure: They attack, you lose initiative

🤝 [Negotiate] (offer partial supplies)
    Give 10 food, keep rest
    50% success
    Preserves most supplies, avoids combat

🏃 [Attempt Escape] (30% success)
    Risky, but possible
    Failure: Combat at disadvantage

🎯 HUNTER OPTION (João):
    [Warning Shot]
    Fire weapon to intimidate
    70% success (bandits reconsider)
    Cost: Ammunition

What do you do?
═══════════════════════════════════════
```

### 12.5 Environmental Encounters

**Hazards:**

- Rapids: Risk capsizing
- Fallen trees: Blocked route
- Landslide: Route destroyed
- Swamp: Difficult terrain
- Storm: Weather danger

**Example:**

```
═══════════════════════════════════════
⚠️ RAPIDS AHEAD!
═══════════════════════════════════════

The river narrows into churning white water.
Jagged rocks protrude from the foam. This
looks extremely dangerous.

Danger Level: HIGH

OPTIONS:

🚣 [Navigate Rapids] (Base: 30% success)
    + Navigator (Carlos): +25%
    + Strong party: +10%
    = Total: 65% success

    Success: Pass through (+morale)
    Failure: Boat damaged, supplies lost, injuries
    Time: 1 hour

🏞️ [Portage Around] (100% safe)
    Carry boat overland around rapids
    Time: 4 hours
    Stamina: -20 per person (heavy work)
    Guaranteed safe passage

🔍 [Scout for Alternate Route] (Navigation)
    Carlos uses navigation skill
    Time: 1 hour scouting
    May find safer passage
    May find none (wasted time)

↩️ [Retreat] (Go back, find different path)
    Time: 2 hours return
    Must try alternate route from previous node

🎯 NAVIGATOR ADVANTAGE (Carlos):
    "I've seen rapids like this before. There's
    a channel on the left that's safer. Follow
    my guidance exactly."

    Success chance increased to: 85%

What do you do?
═══════════════════════════════════════
```

---

## 13. Dialogue System

### 13.1 AI-Powered Conversations

**The game uses Claude AI to generate dynamic, contextual dialogue:**

**Input to AI:**

- Character personality and background
- Current relationship level
- Game state (supplies, health, progress)
- Recent events
- Conversation history
- Player's reputation
- Language being spoken

**AI Generates:**

- Character responses (stay in character)
- Emotional reactions
- Information sharing based on trust
- Dialogue options for player
- Relationship changes
- Quest hooks

### 13.2 Dialogue Structure

**Starting Dialogue:**

```
═══════════════════════════════════════
CONVERSATION: Carlos Mendez
═══════════════════════════════════════

Relationship: +62 (Friendly)
Mood: Thoughtful
Location: Riverside camp
Time: Evening

Carlos sits by the fire, cleaning his machete.
He looks up as you approach.

Carlos: "Thinking about tomorrow. The river gets
rougher from here. We'll need to be careful."

[Response Options]
  → "What should we expect?"
      (Ask for advice - Carlos appreciates being consulted)

  → "I trust your judgment completely"
      (Supportive - improves relationship)

  → "We'll be fine, don't worry"
      (Dismissive - neutral or slight negative)

  → "Tell me about the rapids you mentioned"
      (Specific question - gets detailed info)

  → "How are you holding up?"
      (Personal - deepens relationship)

[Select response]
═══════════════════════════════════════
```

**Dialogue Continues:**

```
You: "What should we expect?"

Carlos: [leans forward] "There's a section called
Devil's Throat about 15 kilometers downriver. Rapids
like teeth. I've navigated it before, but..."
[pauses] "We'll need everyone alert. One mistake and
we could lose the boat - or worse."

He looks at you seriously. "We should rest well
tonight and start at first light. The morning water
is calmer."

[New Options]
  → "Thank you for the warning. We'll be ready."
      (+relationship, will follow advice)

  → "How dangerous is it really?"
      (Press for more detail)

  → "Maybe we should find another route?"
      (Consider alternatives)

  → "With you navigating, I'm confident"
      (+relationship, boosts his morale)

  → "We don't have time to wait. We go now."
      (-relationship, dismisses his expertise)
```

### 13.3 Dialogue Outcomes

**Information Gained:**

- Route details
- Danger warnings
- NPC backgrounds
- Quest opportunities
- Map knowledge
- Rumors and legends

**Relationship Changes:**

- Positive responses: +2 to +10
- Negative responses: -5 to -15
- Neutral responses: +/-1

**Choices Unlocked:**

- New dialogue trees
- Recruitment opportunities
- Trading benefits
- Quest acceptance

**Example Complete Conversation:**

```
CONVERSATION RESULT:

You spoke with Carlos for 45 minutes.

Changes:
  + Relationship: +62 → +68
  + Carlos morale: +5 (felt heard)
  + Gained information: Devil's Throat rapids
  + Learned: Best time to travel (morning)
  + Carlos will be more alert tomorrow

Carlos's opinion of you has improved. He's starting
to see you as a true friend, not just an employer.
```

### 13.4 Dialogue with Language Barriers

**Via Translator:**

```
═══════════════════════════════════════
CONVERSATION: Ayahuasca (Shaman)
Language: Tupi (Carlos translating)
═══════════════════════════════════════

The elderly shaman speaks in rapid Tupi. Carlos
listens carefully, then translates.

Ayahuasca: [speaks in Tupi]

Carlos translates: "She says the Moon Tears bloom
only during certain moons. The plant is sacred,
guarded by... [hesitates] spirits, she says. She
wants to know if your heart is pure."

[Response Options]
  → "Tell her my grandmother is dying"
  → "Ask her where to find it"
  → "Offer payment for information"
  → "Ask about the spirits"

(Note: Subtle details may be lost in translation.
Carlos's relationship with you affects translation quality.)
```

**With Basic Language Knowledge:**

```
You: [in broken Tupi] "Obrigado... help... grandmother..."

Ayahuasca: [smiles, understands your effort]
[speaks slowly in Tupi]

You understand: "...moon...flower...dangerous...respect..."

Your Tupi: 12/50 (Basic Phrases)
  ✓ Can communicate simple ideas
  ✗ Cannot have complex conversation
  ✓ She appreciates your effort (+relationship)

[Response Options - Limited]
  → [Gesture] Thank you
  → "Ajuda?" (Help?)
  → "Onde?" (Where?)
  → [Wait for Carlos to translate fully]
```

---

## 14. Progression & Win Conditions

### 14.1 Win Condition

**Primary Goal:**  
Reach the final location and find **Lágrimas da Lua** (Tears of the Moon) flower.

**Requirements to Win:**

1. Travel through all required locations
2. Survive the journey
3. Reach the final sacred grove
4. Successfully obtain the flower

**Estimated Play Time:** 3-6 hours

### 14.2 Lose Conditions

**Ways to Fail:**

**1. Death from Stamina Loss**

```
GAME OVER

Your stamina has reached zero. Exhausted and
unable to continue, you collapse by the river.

Your party tries to help, but you're too far
from any settlement. The jungle claims another
victim.

Cause of Death: Exhaustion
Day: 8
Location: Rio Tambo Bend

[Try Again] [Main Menu]
```

**2. Starvation/Dehydration**

```
GAME OVER

Without food or water for too long, your body
has given out. Your companions are powerless
to help this far from civilization.

Days without food: 4
Days without water: 1
Location: Deep jungle

Your quest ends here.

[Try Again] [Main Menu]
```

**3. Fatal Encounter**

```
GAME OVER

The jaguar's attack was too swift, too brutal.
Despite your party's efforts, you've sustained
fatal injuries. There's no medical help this
far into the jungle.

Your companions can only watch helplessly as
you take your last breath.

[Try Again] [Main Menu]
```

**4. Critical Illness**

```
GAME OVER

The fever has taken hold, and without medicine,
there's nothing to be done. Your companions
try traditional remedies, but it's too late.

The illness claims you on Day 6.

[Try Again] [Main Menu]
```

**5. Party Abandonment**

```
GAME OVER

One by one, your companions have left. Your
treatment of them, your decisions, drove them
away. Now, alone in the jungle without the skills
to survive, your quest is doomed.

Final party size: 0
You cannot continue alone.

[Try Again] [Main Menu]
```

**6. Time Limit (Optional Hard Mode)**

```
GAME OVER

Day 30 has passed. Your grandmother has succumbed
to her illness. Even if you found the flower now,
it's too late.

You've failed your quest.

[Try Again] [Main Menu]
```

### 14.3 Victory

**Final Scene:**

```
═══════════════════════════════════════
THE SACRED GROVE
═══════════════════════════════════════

After [X] days of travel, countless challenges,
and with your loyal companions by your side, you
finally reach the legendary grove.

There, bathed in moonlight, grows Lágrimas da Lua.

The flower glows with an ethereal light, its
petals shimmering like tears. This is what you've
journeyed so far to find.

[Approach the flower]
```

```
═══════════════════════════════════════
VICTORY!
═══════════════════════════════════════

You carefully harvest the Lágrimas da Lua.

Carlos: "We did it. Against all odds, we actually did it."

Dr. Silva: "I've read about this flower my whole life.
I never thought I'd see it."

Kaya: "The spirits have blessed this journey."

GAME STATISTICS:
──────────────────────────────────────
Days Traveled: 12
Locations Visited: 18
Encounters Survived: 7
Party Members: 3 loyal companions
Relationship Levels:
  Carlos: +85 (Close Friend)
  Dr. Silva: +72 (Close Friend)
  Kaya: +68 (Friendly)

Deaths: 0
Times Retreated: 2
Supplies Remaining: Adequate

Final Reputation: Hero of the Amazon
──────────────────────────────────────

EPILOGUE:

You return home with the flower. Your grandmother
makes a full recovery, and you've forged friendships
that will last a lifetime.

The Amazon tested you, and you emerged victorious.

[View Credits] [Play Again] [Main Menu]
═══════════════════════════════════════
```

### 14.4 Multiple Endings (Future Feature)

**Possible Ending Variations:**

1. **Perfect Ending**: All companions survive, grandmother healed
2. **Bittersweet Ending**: Success but companion deaths
3. **Hollow Victory**: Found flower but at great personal cost
4. **Scientific Ending**: Shared flower with science, changed world
5. **Spiritual Ending**: Learned deeper meaning beyond the quest

---

## 15. User Interface

### 15.1 HUD Layout

```
┌────────────────────────────────────────────────────────────┐
│ Igapó: Quest for Lágrimas da Lua                          │
├────────────────────────────────────────────────────────────┤
│                                              ┌──────────┐  │
│  Player Health: ████████░░ 80%               │   🌙     │  │
│  Party Morale:  ██████████ 100%              │          │  │
│                                              │  2:45 PM │  │
│  Quick Stats:                                │          │  │
│  🍖 Food: 42    💧 Water: 28                 │  Day 3   │  │
│  💊 Medicine: 3  🔥 Fuel: 8                  └──────────┘  │
│                                              [Pocketwatch] │
│                                                            │
│  ┌────────────────────────────┐      ┌─────────────────┐ │
│  │                            │      │    MINIMAP      │ │
│  │     MAIN CONTENT AREA      │      │                 │ │
│  │                            │      │      ⚫         │ │
│  │   Location description,    │      │      ↓15km      │ │
│  │   dialogue, encounters,    │      │   ⚫─⊙─⚫        │ │
│  │   or action menu           │      │                 │ │
│  │                            │      │   N             │ │
│  │                            │      │   ↑             │ │
│  └────────────────────────────┘      └─────────────────┘ │
│                                                            │
│  [Party] [Inventory] [Map] [Journal] [Settings]          │
└────────────────────────────────────────────────────────────┘
```

### 15.2 Key UI Components

**Pocketwatch** (Top-right)

- **Always Visible**: Remains on screen during all game modes (dialogue, action, exploration, encounters)
- **Never Hidden**: Even during full-screen modals or cinematics
- **Shows Current Time**: 12-hour format with AM/PM
- **Shows Current Day**: Day counter from game start
- **Time of Day Icon**: Visual indicator (sun/moon/dawn/dusk)
- **Clickable**: Opens time management panel with detailed info
- **Real-Time Updates**: Displays time passage during actions (but not during dialogue)
- Animated during time passage

**Minimap** (Right side)

- Shows current location
- Connected nodes with distances
- Fog of war for unexplored
- Clickable to open full map

**Quick Stats** (Top-left)

- Essential supplies at glance
- Color-coded warnings
- Click to open full inventory

**Party Panel** (Bottom navigation)

- View all party members
- Check individual stats
- Manage party composition

**Main Content** (Center)

- Primary gameplay area
- Dialogue, descriptions, choices
- Largest screen space

### 15.3 Modal Windows

**Full Map View:**

```
┌──────────────────────────────────────────────┐
│ Amazon River Map                    [Close]  │
├──────────────────────────────────────────────┤
│                                               │
│           N                                   │
│           ↑                                   │
│                                               │
│         🏛️─────⚫ ?                           │
│         │      ╱                              │
│         │   25km                              │
│         │   ╱                                 │
│    🌳──⊙─⚫                                    │
│     ╲   │                                     │
│   15km  │                                     │
│      ╲  │                                     │
│       ⚫─🏺                                    │
│                                               │
│  Legend:                                      │
│  ⊙ Current Location                          │
│  ⚫ Undiscovered                              │
│  🏛️ Settlement                                │
│  🌳 Forest/Scenic                             │
│  🏺 Point of Interest                         │
│  ? Unknown                                    │
│                                               │
└──────────────────────────────────────────────┘
```

**Inventory Screen:**

```
┌──────────────────────────────────────────────┐
│ Party Inventory                      [Close] │
├──────────────────────────────────────────────┤
│                                               │
│ SUPPLIES               TOOLS                 │
│ ────────               ─────                 │
│ 🍖 Food: 42           🔪 Machete (65%)       │
│ 💧 Water: 28          🪢 Rope (90%)          │
│ 💊 Medicine: 3        🎣 Fishing (40%) ⚠️     │
│ 🔥 Fuel: 8            🔧 Repair Kit (2)      │
│                                               │
│ SPECIAL ITEMS         VALUABLES              │
│ ─────────────         ─────────              │
│ 🗺️ Carlos's Map       💎 Jaguar Pelt         │
│ 🧭 Compass            🌿 Rare Specimens (3)   │
│                       💰 Money: 450 reais    │
│                                               │
│ Weight: 215/340 (63%) ✓ Comfortable          │
│                                               │
│ [Manage] [Drop Items] [Use Item]             │
└──────────────────────────────────────────────┘
```

**Party Management:**

```
┌──────────────────────────────────────────────┐
│ Your Party                           [Close] │
├──────────────────────────────────────────────┤
│                                               │
│ 1. YOU - Player Character                    │
│    Health: ████████░░ 80%                    │
│    Languages: English, Portuguese (learning  │
│               Tupi 12/50)                    │
│    [View Details]                            │
│                                               │
│ 2. CARLOS MENDEZ - Navigator ⭐⭐            │
│    Health: ██████████ 100%                   │
│    Morale: ████████░░ 78                     │
│    Relationship: +62 (Friendly)              │
│    Languages: Portuguese, Tupi               │
│    [Talk] [View Stats] [Dismiss]             │
│                                               │
│ 3. DR. SILVA - Healer ⭐                     │
│    Health: █████████░ 90%                    │
│    Morale: ██████████ 95                     │
│    Relationship: +48 (Friendly)              │
│    Languages: Portuguese, Spanish, Quechua   │
│    [Talk] [View Stats] [Dismiss]             │
│                                               │
│ 4. [EMPTY SLOT]                              │
│    [Recruit at next settlement]              │
│                                               │
└──────────────────────────────────────────────┘
```

### 15.4 Mobile Responsive Design

**Adapts for smaller screens:**

- Minimap becomes toggle overlay
- Pocketwatch becomes tap-to-view
- Simplified HUD for mobile
- Touch-optimized buttons
- Swipe navigation between screens

---

## 16. AI Integration

### 16.1 Claude AI Role

**The game uses Claude (Anthropic's AI) for:**

1. **Dynamic Dialogue Generation**

   - NPCs respond naturally to player choices
   - Conversations reference game state
   - Characters maintain personality consistency
   - Emotional reactions feel authentic

2. **Location Descriptions**

   - Unique descriptions for each location
   - Adapt to time of day, weather
   - Never repetitive
   - Atmospheric and immersive

3. **Event Generation**

   - Create contextual random events
   - Balance difficulty with game state
   - Integrate party skills into events
   - Provide meaningful choices

4. **Story Adaptation**
   - Main story adjusts to player choices
   - NPCs remember past interactions
   - Reputation affects all interactions
   - Multiple path options

### 16.2 AI Input Context

**AI Input Context:**

The AI system receives comprehensive game state information:

- **Game State**: Current location, time of day, day number, weather
- **Player Information**: Name, choice history, reputation level
- **Party Details**: Member names, relationships, skills, languages
- **Resource Status**: Current supplies, equipment, money
- **Conversation History**: Previous dialogue with each NPC
- **Character Profile**: NPC personality, background, languages, relationship level

This context ensures AI responses are consistent, relevant, and character-appropriate.

### 16.3 AI Prompt Engineering

**Example Dialogue Prompt:**

```
You are Carlos Mendez, a 42-year-old river guide who has navigated
the Amazon for 25 years. You recently lost your wife to illness,
which is why you agreed to help the player find a cure for their
grandmother. You're wise, cautious, and becoming genuinely fond of
the player (relationship: +62).

Current situation:
- Location: Riverside camp at evening
- The player just asked: "What should we expect tomorrow?"
- There are dangerous rapids 15km ahead called Devil's Throat
- You've navigated them before but they're genuinely dangerous
- You want to advise caution without seeming cowardly

Generate Carlos's response (2-4 sentences) and provide 4-5 dialogue
options for the player's reply. The options should include:
- One that asks for more detail
- One that shows trust in Carlos
- One that's somewhat dismissive
- One that deepens their relationship

Stay in character. Be natural and conversational.
```

**AI Response Format:**

The AI generates structured responses including:

- **NPC Dialogue**: Character's spoken response (2-4 sentences)
- **Player Options**: 4-5 dialogue choices with different tones and effects
- **Relationship Impact**: How each choice affects the relationship
- **Mood Changes**: Character's emotional state after the exchange

The system ensures responses stay in character and provide meaningful choices.

### 16.4 AI Safety & Consistency

**Guardrails:**

- Characters stay in personality
- No modern anachronisms
- Appropriate for historical setting
- Consistent with established facts
- Maintains game balance

**Memory Management:**

- Conversation history tracked per NPC
- Major events remembered
- Player reputation consistent
- Relationships evolve logically

### 16.5 Fallback Systems

**If AI unavailable:**

- Fallback to pre-written dialogues
- Template-based descriptions
- Graceful degradation
- User notification

---

## Conclusion

This game design document provides a complete specification for **Igapó: Quest for Lágrimas da Lua**.

**Core Systems:**
✅ Time & Travel (distance-based, pocketwatch UI)  
✅ Party Management (recruitment, skills, stats)  
✅ Languages (9 languages, barriers, learning)  
✅ Supply System (5 types, consumption, management)  
✅ Dynamic Map (random generation, exploration)  
✅ AI Integration (Claude-powered dialogue)

**Ready for Implementation:**

- All mechanics specified with formulas
- UI layouts designed
- Example content provided
- Balance parameters defined
- Success and failure conditions clear

**Estimated Development Time:**

- Core systems: 8-12 weeks
- Content generation: 4-6 weeks
- Polish & testing: 4-6 weeks
- **Total: 4-6 months**

**Next Steps:**

1. Review and approve design
2. Create technical specification
3. Begin implementation roadmap
4. Start with MVP (Minimum Viable Product)

---

_END OF GAME DESIGN DOCUMENT_

---

## 17. Player Character System

### 17.1 Default Player Character

**Starting Character:**

- **Name**: Player chooses at game start
- **Languages**: English only (native speaker)
- **Skills**: None (relies on party members for skills)
- **Stats**: Fixed baseline values (not customizable)
- **Background**: Foreigner seeking the legendary flower

**Player Character Stats:**

- **Health**: 100% (standard human)
- **Stamina**: 100% (full energy)
- **Carrying Capacity**: 50 units (average strength)
- **Languages**: English only (native speaker)
- **Reputation**: Starts at 0 (unknown)

**Character Progression:**

- Player character remains static throughout the game
- No skill learning or stat improvement
- Only party members provide specialized abilities
- Focus is on leadership, decision-making, and relationship management

### 17.2 Reputation System

**Per-Party Member Tracking:**
Each companion maintains their own reputation with different groups:

- **Local Settlements**: How well-known and trusted in specific villages
- **Indigenous Tribes**: Respect level with different tribal groups
- **Traders**: Business reputation for fair dealing
- **River Guides**: Professional reputation among navigators
- **Missionaries**: Religious/charitable reputation

**Reputation Effects:**

- **Recruitment**: High reputation makes recruitment easier
- **Trading**: Better prices and more options
- **Information**: NPCs share more details with trusted individuals
- **Safety**: Higher reputation reduces hostility in encounters
- **Quests**: Unlock special missions and opportunities

**Reputation Changes:**

- **Positive Actions**: Helping others, fair trading, completing quests
- **Negative Actions**: Stealing, abandoning people, breaking promises
- **Companion Actions**: Party members' behavior affects their individual reputation
- **Regional Spread**: Reputation spreads slowly through the river network

**Reputation Visibility:**

- **UI Display**: Icons and tooltips show reputation level with known groups
- **Hidden Details**: Exact numeric values are hidden; shown as tiers (Unknown, Neutral, Friendly, Trusted, Revered / Hostile, Enemy)
- **Regional Diffusion**: Reputation spreads to adjacent nodes over 2-4 days of game time
- **Story Impact**: NPCs will reference party member reputations in dialogue

---

## 18. Economy & Trading System

### 18.1 Currency System

**Primary Currency: Brazilian Réis (Mil-réis)**

- **Historical Context**: In the 1930s, Brazil used the réis (plural: réis) and mil-réis (1,000 réis). The modern real was introduced in 1994.
- **Starting Money**: Player starts with 200-500 mil-réis (randomized)
- **Remote Barter**: In isolated areas without established trade posts, barter economy may supplement or replace currency
- **No Money Rule**: Cannot purchase supplies or special items without money or bartering goods
- **Currency Notation**: Prices shown as "100$000" (100 mil-réis) or "5$500" (5 mil-réis and 500 réis)

**Money Sources:**

- **Trading**: Selling supplies, special items, artifacts
- **Quests**: Payment for helping NPCs
- **Discoveries**: Finding valuable items or locations
- **Companion Skills**: Charismatic party members get better deals
- **Reputation**: Higher reputation unlocks better-paying opportunities

### 18.2 Supply Trading

**Tradeable Supplies:**

- **Food**: 5-15 mil-réis per unit (varies by settlement)
- **Water**: 2-8 mil-réis per unit (cheaper near rivers)
- **Medicine**: 20-80 mil-réis per dose (most expensive)
- **Fuel**: 3-12 mil-réis per unit (firewood/oil)
- **Tools**: 50-200 mil-réis per item (varies by quality)

**Trading Mechanics:**

- **Base Prices**: Set by settlement type and location
- **Price Tiers by Location**: Wilderness (highest), Small Village (high), Trade Post (moderate), Major Settlement (lowest)
- **Charisma Modifier**: -1% per 10 charisma points (buying)
- **Reputation Modifier**: -5% per 20 reputation points
- **Supply/Demand**: Prices fluctuate based on settlement needs
- **Language Bonus**: Shared language improves negotiation
- **Trading Time**: Transaction takes 15-30 minutes; dialogue portion is real-time

### 18.3 Special Items Trading

**Special Item Categories:**

**Weapons & Tools:**

- **Rifles**: 200-500 mil-réis (combat advantage)
- **Machetes**: 50-150 mil-réis (clearing, defense)
- **Whips**: 30-100 mil-réis (animal control)
- **Compasses**: 100-300 mil-réis (navigation aid)
- **Binoculars**: 150-400 mil-réis (scouting)

**Artifacts & Maps:**

- **Ancient Maps**: 100-1000 mil-réis (reveal locations)
- **Tribal Artifacts**: 50-500 mil-réis (cultural value)
- **Scientific Specimens**: 200-800 mil-réis (research value)
- **Religious Items**: 100-600 mil-réis (spiritual significance)

**Luxury Items:**

- **Fine Tobacco**: 20-100 mil-réis (morale boost)
- **Quality Rum**: 30-150 mil-réis (party celebration)
- **Silk Fabric**: 100-500 mil-réis (gift for NPCs)
- **Jewelry**: 200-1000 mil-réis (status symbol)

**Special Item Effects:**

- **Combat Items**: Provide new options in dangerous encounters
- **Navigation Items**: Improve travel efficiency or safety
- **Social Items**: Enhance dialogue options and relationships
- **Utility Items**: Unlock new actions or improve existing ones

---

## 19. Weather System

### 19.1 Weather Types

**Seven Weather Conditions:**

| Weather            | Travel Speed | Encounter Risk | Description                         |
| ------------------ | ------------ | -------------- | ----------------------------------- |
| **Normal**         | 100%         | Base           | Clear skies, comfortable conditions |
| **Light Rain**     | 90%          | +5%            | Gentle drizzle, slightly slippery   |
| **Medium Rain**    | 75%          | +10%           | Steady rain, reduced visibility     |
| **Heavy Rain**     | 60%          | +15%           | Pouring rain, difficult conditions  |
| **Monsoon**        | 40%          | +25%           | Torrential downpour, dangerous      |
| **Tropical Storm** | 20%          | +40%           | Severe weather, very dangerous      |
| **Heatwave**       | 85%          | +20%           | Extreme heat, dehydration risk      |

### 19.2 Weather Mechanics

**Natural Weather Progression:**

- **Change Frequency**: Weather shifts every 2-6 hours
- **Transition Logic**: Gradual changes (light → medium → heavy)
- **Seasonal Patterns**: More rain during wet season
- **Regional Variation**: Different areas have different weather patterns
- **Duration**: Weather conditions last 1-8 hours

**Weather Effects on Gameplay:**

**Travel Impact:**

- **Speed Reduction**: As shown in table above
- **Safety Decrease**: Higher encounter risk in bad weather
- **Route Blocking**: Severe storms may block certain paths
- **Equipment Damage**: Heavy rain damages tools and supplies

**Encounter Modifiers:**

- **Visibility**: Rain reduces sight distance
- **Animal Behavior**: Weather affects wildlife activity
- **NPC Availability**: People seek shelter in storms
- **Resource Availability**: Foraging harder in bad weather

**Supply Consumption:**

- **Heatwave**: +50% water consumption
- **Cold Weather**: +25% fuel consumption for warmth
- **Wet Conditions**: Risk of food spoilage and tool damage

### 19.3 Weather Generation

**Weather State Machine:**

- **Current Weather**: Tracks active condition
- **Transition Probability**: Chance to change each hour
- **Severity Factors**: Location, season, recent weather
- **Duration Tracking**: How long current weather has lasted
- **Regional Influence**: Nearby areas affect local weather

**Weather Events:**

- **Sudden Storms**: Rapid weather changes (10% chance)
- **Weather Warnings**: NPCs may warn of approaching storms
- **Shelter Opportunities**: Find refuge during severe weather
- **Weather-Dependent Encounters**: Special events during storms

---

## 20. Difficulty & Roguelike Elements

### 20.1 Random Difficulty System

**Completely Randomized Challenge:**

- **No Scaling**: Difficulty doesn't increase with progress
- **Pure RNG**: Every encounter, location, and event is random
- **Unpredictable**: Players cannot prepare for specific challenges
- **High Variance**: Some runs are easy, others are extremely difficult

**Difficulty Factors:**

- **Location Generation**: Random difficulty assignment to nodes
- **Encounter Severity**: Random event types and challenges
- **Resource Availability**: Random supply distribution
- **Weather Patterns**: Random weather sequences
- **NPC Dispositions**: Random character personalities and motivations

### 20.2 Escape Opportunities

**Retreat Mechanics:**

- **Always Available**: Most encounters offer escape options
- **Skill-Dependent**: Some escapes require specific party skills
- **Cost-Benefit**: Escaping has consequences (time, supplies, reputation)
- **Multiple Routes**: Different escape methods for different situations

**Escape Options by Encounter Type:**

**Wildlife Encounters:**

- **Run Away**: Basic escape (60% success)
- **Make Noise**: Scare off animals (hunter skill)
- **Use Fire**: Intimidate with flames (fuel cost)
- **Climb Tree**: Escape to safety (strength check)

**Human Encounters:**

- **Negotiate**: Talk your way out (charisma check)
- **Pay Off**: Bribe with money or supplies
- **Intimidate**: Show strength (party strength)
- **Retreat**: Run back to previous location

**Environmental Hazards:**

- **Find Alternate Route**: Navigation skill required
- **Wait It Out**: Time cost but safe
- **Force Through**: Risk injury but continue
- **Turn Back**: Retreat to safety

### 20.3 Lethal Outcomes

**Permadeath Scenarios:**

- **Fatal Encounters**: Some situations have no escape
- **Resource Depletion**: Starvation/dehydration after extended periods
- **Environmental Death**: Falling, drowning, extreme weather
- **Combat Death**: Fatal injuries in unavoidable fights
- **Disease**: Untreatable illnesses without medicine

**Death Prevention:**

- **Skill Checks**: Party skills can prevent lethal outcomes
- **Resource Management**: Proper supply planning prevents starvation
- **Risk Assessment**: Player choices affect danger level
- **Party Protection**: Companions can sacrifice themselves

**Game Over Conditions:**

- **Player Death**: Main character dies
- **Party Abandonment**: All companions leave
- **Resource Exhaustion**: No food/water for 3+ days
- **Time Limit**: Optional 30-day limit for hardcore mode

---

## 21. Content Generation & Replayability

### 21.1 Procedural Content Generation

**Infinite Replayability Through:**

**Character Templates:**

- **500+ NPC Templates**: Diverse backgrounds, personalities, skills
- **Random Stat Generation**: Each NPC has unique stat distributions
- **Dynamic Relationships**: NPCs react differently each playthrough
- **Cultural Diversity**: Mix of settlers, indigenous, foreigners, traders

**Location Generation:**

- **1000+ Location Names**: Authentic Amazon place names
- **50+ Location Types**: Varied settlement and wilderness types
- **Random Biome Assignment**: Different environmental settings
- **Dynamic NPC Placement**: Different characters at each location

**Animal Encounters:**

- **200+ Animal Species**: Real Amazon wildlife
- **Behavior Patterns**: Different animals have unique behaviors
- **Seasonal Activity**: Animals appear based on time and weather
- **Ecosystem Interactions**: Animals affect each other and environment

**Special Items:**

- **500+ Unique Items**: Weapons, tools, artifacts, maps
- **Random Rarity**: Items have different availability and value
- **Cultural Significance**: Items tied to specific groups or regions
- **Historical Accuracy**: Items reflect 1930s Amazon context

### 21.2 Content Templates

**NPC Character Templates:**

**Settler Types:**

- **River Traders**: Portuguese-speaking merchants
- **Missionaries**: Religious figures with medical knowledge
- **Explorers**: Foreign adventurers and scientists
- **Local Guides**: Indigenous people with navigation skills
- **Bandits**: Desperate outlaws seeking supplies

**Indigenous Types:**

- **Shamans**: Spiritual leaders with plant knowledge
- **Hunters**: Skilled trackers and warriors
- **Village Elders**: Wise leaders with local knowledge
- **Young Warriors**: Aggressive but potentially recruitable
- **Healers**: Traditional medicine practitioners

**Foreign Types:**

- **Scientists**: Researchers studying Amazon flora/fauna
- **Adventurers**: Treasure hunters and explorers
- **Refugees**: People fleeing political situations
- **Merchants**: International traders
- **Missionaries**: Religious workers from various faiths

**Animal Templates:**

**Predators:**

- **Jaguars**: Stealthy ambush hunters
- **Anacondas**: Water-based constrictors
- **Caimans**: Aggressive crocodilians
- **Piranhas**: Swarming fish attacks
- **Poisonous Snakes**: Venomous threats

**Prey Animals:**

- **Tapirs**: Large herbivores
- **Monkeys**: Arboreal primates
- **Birds**: Various species with different behaviors
- **Fish**: River and lake species
- **Insects**: Both helpful and harmful varieties

### 21.3 Replayability Features

**Every Playthrough Different:**

- **Random Map**: Completely different trail each time
- **Different NPCs**: New characters at each location
- **Varied Encounters**: Different events and challenges
- **Unique Items**: Different special items available
- **Weather Patterns**: Different weather sequences
- **Party Composition**: Different recruitment opportunities

**Emergent Storytelling:**

- **Dynamic Relationships**: NPCs remember past interactions
- **Consequence Chains**: Early decisions affect later events
- **Reputation Effects**: Actions have lasting consequences
- **Cultural Interactions**: Language barriers create unique situations
- **Resource Scarcity**: Different supply challenges each run

**Player Agency:**

- **Multiple Solutions**: Different approaches to same problems
- **Skill Combinations**: Party composition affects available options
- **Risk Management**: Player chooses danger vs. safety
- **Resource Allocation**: Strategic supply management
- **Relationship Building**: Social gameplay affects outcomes

---

_END OF GAME DESIGN DOCUMENT_

**Version 3.0 | 85 pages | Complete Specification**
