import type { EncounterNode, EncounterChoice, EncounterOutcome, FieldNote } from "@igapo/shared";
import { GameState } from "../systems/GameState";

// --- Field Notes ---

export const FIELD_NOTES_BY_ID: Record<string, FieldNote> = {};

const FIELD_NOTES: Record<string, FieldNote> = {
  caiman_nesting: {
    id: "caiman_nesting",
    species: "Black Caiman",
    text: "Caimans are most aggressive during nesting season (Aug–Oct). Females guard nest sites aggressively; a wide berth is the safest passage.",
  },
  boto_navigation: {
    id: "boto_navigation",
    species: "Boto (Amazon River Dolphin)",
    text: "Botos navigate flooded forests using echolocation in turbid water. Their presence near a tree line often indicates a passable channel.",
  },
  harpy_perch: {
    id: "harpy_perch",
    species: "Harpy Eagle",
    text: "Harpy eagles have the largest talons of any living eagle. They perch motionless for hours, scanning for sloths and monkeys in the canopy below.",
  },
  otter_mob: {
    id: "otter_mob",
    species: "Giant River Otter",
    text: "Giant river otters mob predators cooperatively using coordinated noise and aggression. A group of 4+ otters will challenge even a caiman.",
  },
};

// Populate the exported lookup after the object is built
Object.assign(FIELD_NOTES_BY_ID, FIELD_NOTES);

// --- Encounters ---

export const ENCOUNTERS: Record<string, EncounterNode> = {
  town_start: {
    id: "town_start",
    title: "Porto Alegre do Rio",
    type: "human",
    arrivalText:
      "The dock town is the last resupply point before the deep várzea. A weathered fuel depot sits next to a market stall. The trader, a broad-shouldered woman with ink-stained hands, watches your boat approach without expression.",
    choices: [
      {
        id: "trade",
        label: "Resupply — purchase fuel and food.",
        requiresFieldNote: undefined,
        successChance: 1.0,
      },
      {
        id: "ask_river",
        label: "Ask the trader about river conditions upstream.",
        requiresFieldNote: undefined,
        successChance: 1.0,
      },
    ],
  },

  wildlife_caiman: {
    id: "wildlife_caiman",
    title: "Caiman Banks",
    type: "wildlife",
    arrivalText:
      "Three black caimans are thermoregulating on a mudflat that extends into the channel. One is enormous — four meters at least. Your boat's engine noise hasn't spooked them yet. The channel narrows here.",
    choices: [
      {
        id: "observe_quietly",
        label: "Cut the engine. Observe quietly from distance.",
        requiresFieldNote: undefined,
        successChance: 0.9,
      },
      {
        id: "navigate_through",
        label: "Navigate through at slow speed — stay to the far bank.",
        requiresFieldNote: undefined,
        successChance: 0.65,
      },
      {
        id: "disturbance_technique",
        label: "Create a disturbance to clear the channel — mimic a mob scenario.",
        requiresFieldNote: "otter_mob",
        successChance: 0.9,
      },
    ],
  },

  wildlife_boto: {
    id: "wildlife_boto",
    title: "Flooded Forest at Dusk",
    type: "wildlife",
    arrivalText:
      "The river has swallowed the forest entirely. Trees stand chest-deep in dark water. A pink shape rolls alongside the hull — a boto, curious, its blunt head surfacing to breathe. Then another. A small pod, heading toward the tree line.",
    choices: [
      {
        id: "follow_boto",
        label: "Follow the botos — they may know a passage through the flooded forest.",
        requiresFieldNote: undefined,
        successChance: 0.75,
      },
      {
        id: "observe_boto",
        label: "Stay and observe the pod's behavior carefully.",
        requiresFieldNote: undefined,
        successChance: 1.0,
      },
    ],
  },

  wildlife_harpy: {
    id: "wildlife_harpy",
    title: "Alto das Gaviões",
    type: "discovery",
    arrivalText:
      "High in the emergent layer — impossibly still — a harpy eagle sits. Grey-crested, pale-chested, watching. You are not the most interesting thing in this forest. But for a moment, its yellow eye finds you.",
    choices: [
      {
        id: "observe_harpy",
        label: "Remain absolutely still. Document what you see.",
        requiresFieldNote: undefined,
        successChance: 1.0,
      },
      {
        id: "approach_slowly",
        label: "Move closer for a better view.",
        requiresFieldNote: undefined,
        successChance: 0.4,
      },
    ],
  },

  wildlife_otter: {
    id: "wildlife_otter",
    title: "Lago das Lontras",
    type: "wildlife",
    arrivalText:
      "A family of giant river otters patrols the lake perimeter in a loose V formation, rolling and surfacing in sequence. One spots you and freezes. The whole group goes silent. Then: a coordinated barrage of snorts and chirps.",
    choices: [
      {
        id: "hold_position",
        label: "Hold position. Let them assess you.",
        requiresFieldNote: undefined,
        successChance: 0.85,
      },
      {
        id: "retreat",
        label: "Back away slowly — give them the lake.",
        requiresFieldNote: undefined,
        successChance: 1.0,
      },
    ],
  },

  human_village: {
    id: "human_village",
    title: "Vila Ribeirinha",
    type: "human",
    arrivalText:
      "A riverside village on stilts. Children watch from a dock. An elder man in a hammock opens one eye as your boat slows. He speaks before you do: 'You're heading upstream. Sit down first.'",
    choices: [
      {
        id: "accept_hospitality",
        label: "Accept his invitation. Sit and listen.",
        requiresFieldNote: undefined,
        successChance: 1.0,
      },
      {
        id: "ask_directly",
        label: "Ask directly about the upper river and what's changed.",
        requiresFieldNote: undefined,
        successChance: 0.6,
      },
    ],
  },

  human_extractivist: {
    id: "human_extractivist",
    title: "The Logging Camp",
    type: "human",
    arrivalText:
      "Three men are eating at a camp table. Chainsaws in the brush. One looks up — he's young, maybe twenty, with the flat expression of someone who has rehearsed an explanation for strangers. 'We have papers,' he says, before you've asked.",
    choices: [
      {
        id: "no_judgment",
        label: "Say nothing about the logging. Ask if they have fuel to trade.",
        requiresFieldNote: undefined,
        successChance: 1.0,
      },
      {
        id: "challenge",
        label: "Ask to see the papers.",
        requiresFieldNote: undefined,
        successChance: 0.3,
      },
    ],
  },

  human_researcher: {
    id: "human_researcher",
    title: "Research Camp",
    type: "human",
    arrivalText:
      "Dr. Ferreira is pinning specimens to a foam board when you arrive. She doesn't look up. 'There's coffee if you want it.' Her camp is meticulous — labeled jars, weather station, a notebook open to a page of river dolphin sketches. Something in her face is tired in a way that isn't physical.",
    choices: [
      {
        id: "ask_research",
        label: "Ask about her work. What is she documenting?",
        requiresFieldNote: undefined,
        successChance: 1.0,
      },
      {
        id: "ask_quiet_zones",
        label: "Ask her about the 'quiet zones' — you've heard the phrase.",
        requiresFieldNote: "boto_navigation",
        successChance: 1.0,
      },
    ],
  },

  nav_blackwater: {
    id: "nav_blackwater",
    title: "The Dark Tributary",
    type: "navigation",
    arrivalText:
      "The water shifts from brown to the color of dark tea. Tannins from leaf litter, you know — acidic, low-nutrient, but uniquely beautiful. The engine sputters once. A reminder that blackwater runs harder on metal.",
    choices: [
      {
        id: "proceed_carefully",
        label: "Proceed slowly, monitoring the engine.",
        requiresFieldNote: undefined,
        successChance: 0.7,
      },
      {
        id: "proceed_knowledgeable",
        label: "Flush the fuel line before entering — blackwater's acidity demands it.",
        requiresFieldNote: "boto_navigation",
        successChance: 0.95,
      },
    ],
  },

  discovery_hidden: {
    id: "discovery_hidden",
    title: "Igarapé Sem Nome",
    type: "discovery",
    arrivalText:
      "No map marks this channel. The trees close overhead into a cathedral of roots and vines. Then: a concrete structure, half-swallowed by the floodplain. A research facility, abandoned. On the door, stenciled in faded paint: INPA / PROJETO SILÊNCIO.",
    choices: [
      {
        id: "enter_facility",
        label: "Enter and document what's inside.",
        requiresFieldNote: undefined,
        successChance: 1.0,
      },
    ],
  },

  story_destination: {
    id: "story_destination",
    title: "Estação Científica Várzea",
    type: "story",
    arrivalText:
      "You've arrived. The research station is functional but skeletal — a skeleton crew of three, a shortwave radio, and a whiteboard covered in migration data. Someone has drawn a red circle on a map of the upper Marié basin and written two words: 'Zona Silenciosa.'",
    choices: [
      {
        id: "report_findings",
        label: "Report your findings from the expedition.",
        requiresFieldNote: undefined,
        successChance: 1.0,
      },
    ],
  },
};

// --- Outcome resolver ---

export function resolveOutcome(
  choice: EncounterChoice,
  state: GameState
): EncounterOutcome {
  const roll = Math.random();
  const success = roll <= (choice.successChance ?? 1.0);

  return OUTCOME_MAP[choice.id]?.(success, state) ?? defaultOutcome(success);
}

type OutcomeFn = (success: boolean, state: GameState) => EncounterOutcome;

const OUTCOME_MAP: Record<string, OutcomeFn> = {
  trade: () => ({
    text: "You resupply fully. The trader says nothing, but slides a folded note across the counter with your change. It's a rough sketch of a channel marked 'safe in wet season.'",
    resourceDelta: { fuel: 30, food: 30 },
  }),

  ask_river: () => ({
    text: "'The river dolphins are moving strange,' she says. 'Upstream, near the Marié. They're bunched up. Something pushed them down.' She doesn't elaborate. Charges you nothing for the information.",
    resourceDelta: {},
  }),

  observe_quietly: (success) =>
    success
      ? {
          text: "The caimans ignore you entirely. You watch for twenty minutes. The largest one slides into the water without urgency — she's defending a nest site ten meters to your left. You note the location and route carefully around it.",
          fieldNote: FIELD_NOTES.caiman_nesting,
          resourceDelta: {},
        }
      : {
          text: "One caiman opens its jaws in a threat display. You back the engine slowly. Ten minutes lost, but no damage done.",
          resourceDelta: { fuel: -5 },
        },

  navigate_through: (success) =>
    success
      ? {
          text: "You ease through. The caimans watch but don't move. Clean passage.",
          resourceDelta: {},
        }
      : {
          text: "The large female lunges at the hull — defensive, not hunting. The impact damages a fuel line. You lose fuel you can't afford.",
          resourceDelta: { fuel: -20, equipment: -15, morale: -10 },
        },

  disturbance_technique: (success) =>
    success
      ? {
          text: "You bang the hull metal and create a noise pattern that mimics an otter mob in distress. The caimans respond immediately — heads up, then sliding into the water away from the channel. Clean. Fast. Elegant.",
          resourceDelta: {},
        }
      : {
          text: "The technique half-works. Two caimans retreat; the large female doesn't buy it. You lose time navigating around her.",
          resourceDelta: { fuel: -5 },
        },

  follow_boto: (success) =>
    success
      ? {
          text: "The botos lead you through a winding channel invisible from the main river — flooded forest opening into a hidden oxbow lake. You emerge two kilometers ahead with full fuel and a field note worth remembering.",
          fieldNote: FIELD_NOTES.boto_navigation,
          resourceDelta: {},
        }
      : {
          text: "The botos dive and vanish. The channel they were in narrows to nothing. You backtrack, losing time.",
          resourceDelta: { fuel: -8 },
        },

  observe_boto: () => ({
    text: "The pod mills in the flooded forest for thirty minutes. You watch one navigate a gap between submerged tree trunks at speed — echolocation clicking clearly audible. You note the behavior in detail.",
    fieldNote: FIELD_NOTES.boto_navigation,
    resourceDelta: {},
  }),

  observe_harpy: () => ({
    text: "The harpy doesn't move for six minutes. Then, without warning, it drops — a controlled fall into the canopy. Forty meters below, something screams briefly. The eagle returns to its perch. You have documented a hunt most researchers spend careers trying to witness.",
    fieldNote: FIELD_NOTES.harpy_perch,
    resourceDelta: {},
  }),

  approach_slowly: (success) =>
    success
      ? {
          text: "The harpy watches you approach with what feels like contempt, then lifts silently on wings wider than your arm span. Gone.",
          resourceDelta: {},
        }
      : {
          text: "The harpy leaves immediately. Opportunity missed.",
          resourceDelta: {},
        },

  hold_position: (success) =>
    success
      ? {
          text: "After five minutes of inspection-noise, the otters determine you are neither prey nor threat. They resume patrol. You watch the coordination of their hunting formation and take careful notes.",
          fieldNote: FIELD_NOTES.otter_mob,
          resourceDelta: {},
        }
      : {
          text: "The otters escalate. One slaps the water in front of the hull. You back off before it becomes a full mob response.",
          resourceDelta: {},
        },

  retreat: () => ({
    text: "You give them the lake. From a distance you watch them resume — rolling, surfacing, whistling to each other in a language you are just beginning to parse.",
    resourceDelta: {},
  }),

  accept_hospitality: () => ({
    text: "'We've lived here four generations,' he says. 'The river changes every wet season. This year the dolphins didn't come up as far. The otters left the northern lake.' He pauses. 'Something's different up there. I don't know what it is. But it's different.'",
    resourceDelta: { morale: -5 },
  }),

  ask_directly: (success) =>
    success
      ? {
          text: "He tells you more than you expected — about strangers with equipment coming upriver, about a section of the Marié where the usual sounds have stopped. He watches your face as he talks.",
          resourceDelta: {},
        }
      : {
          text: "He closes up. 'I don't know you.' You leave with less than you arrived with.",
          resourceDelta: { morale: -10 },
        },

  no_judgment: () => ({
    text: "They trade you fuel at fair price. The young one refills your tank himself. As you leave he says, quietly: 'There's something wrong up past the falls. I don't know what it is. But we stopped going up there three months ago.'",
    resourceDelta: { fuel: 20 },
  }),

  challenge: (success) =>
    success
      ? {
          text: "The papers are real, mostly. There's a zone number that doesn't match any legal concession you know. You note it without comment.",
          resourceDelta: {},
        }
      : {
          text: "They close ranks. One man's hand moves toward a radio. You leave. Your morale drops — not because of them, but because you weren't in any position to do anything about it either way.",
          resourceDelta: { morale: -15 },
        },

  ask_research: () => ({
    text: "'River dolphin distribution patterns. Specifically why they've retreated from the upper Marié system. My last three sensor buoys up there have gone silent.' She finally looks up. 'Equipment failure doesn't explain all of them.'",
    resourceDelta: {},
  }),

  ask_quiet_zones: () => ({
    text: "She sets down the pin. 'Where did you hear that term?' You tell her. She's quiet for a long time. 'It's what I'm calling the areas where the acoustic record has dropped to near zero. No birds. No frogs. No fish sounds. It started eighteen months ago and it's expanding.' She pours you coffee without asking.",
    resourceDelta: { morale: -5 },
  }),

  proceed_carefully: (success) =>
    success
      ? {
          text: "The engine holds. Dark water, overhanging roots, and the smell of tannins. Beautiful in its way. You emerge intact.",
          resourceDelta: { equipment: -8 },
        }
      : {
          text: "The acidity gets into the fuel line. Minor damage — fixable, but it costs equipment condition you'll need later.",
          resourceDelta: { equipment: -20, fuel: -10, morale: -5 },
        },

  proceed_knowledgeable: () => ({
    text: "A pre-emptive flush of the fuel line — thirty seconds of work that saves the engine from hours of wear. You move through the blackwater cleanly.",
    resourceDelta: { equipment: -3, morale: 5 },
  }),

  enter_facility: () => ({
    text: "Inside: water-stained data tables, a topographic map with areas marked in red, and a field journal belonging to Dr. A. Carvalho. The last entry is dated fourteen months ago. It ends mid-sentence: 'The silence isn't absence — it's something el'",
    resourceDelta: { morale: -10 },
  }),

  report_findings: () => ({
    text: "The station director listens without interrupting. When you finish, she pulls out the map with the red circle. 'You're the third expedition to come back with pieces of this. The first two didn't get as far as you.' She taps the Zona Silenciosa. 'We need someone to go in. Not this season. But next season — with the right equipment.' She looks at you.",
    resourceDelta: {},
  }),
};

function defaultOutcome(success: boolean): EncounterOutcome {
  return {
    text: success
      ? "You proceed without incident."
      : "Something goes wrong. Resources are lost.",
    resourceDelta: success ? {} : { equipment: -10 },
  };
}
