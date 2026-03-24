import type { EncounterNode, EncounterChoice, EncounterOutcome, FieldNote } from "@igapo/shared";
import { GameState } from "../systems/GameState";

// --- Field Notes ---

export const FIELD_NOTES_BY_ID: Record<string, FieldNote> = {};

const FIELD_NOTES: Record<string, FieldNote> = {
  anaconda_behavior: {
    id: "anaconda_behavior",
    species: "Green Anaconda",
    text: "Green anacondas are not aggressive without provocation. When thermoregulating on banks they are slow to move — startling them causes a defensive strike. Predictable approach at low speed prompts retreat, not attack.",
  },
  piranha_behavior: {
    id: "piranha_behavior",
    species: "Piranha",
    text: "Piranhas are primarily scavengers. Their aggressive feeding behavior peaks midday in confined dry-season pools. Vibration and slow movement reduce threat response. Wading is riskier than poling.",
  },
  stingray_behavior: {
    id: "stingray_behavior",
    species: "River Stingray",
    text: "Freshwater stingrays camouflage in sandy shallows and respond to vibration. Hull movement propagated through the water displaces them before physical contact. Temperature drops cause repositioning.",
  },
  jaguar_behavior: {
    id: "jaguar_behavior",
    species: "Jaguar",
    text: "Jaguars are the only big cat in the Americas comfortable in water. They drink at predictable times — dawn and dusk at regular sites. Unlike other big cats, they kill with a single bite through the skull rather than suffocation.",
  },
  tapir_ecology: {
    id: "tapir_ecology",
    species: "Tapir",
    text: "Tapirs disperse more seeds than any other Amazonian mammal. They are primarily nocturnal and crepuscular, using river crossings at dawn and dusk. A tapir crossing is a reliable sign of a shallow, safe ford.",
  },
  spectacled_owl: {
    id: "spectacled_owl",
    species: "Spectacled Owl",
    text: "The spectacled owl's call — a rapid series of knocking sounds — is often mistaken for a primate. It hunts from a perch, remaining motionless for hours. Calls indicate it is either establishing territory or communicating with a mate.",
  },
  arapaima_ecology: {
    id: "arapaima_ecology",
    species: "Arapaima",
    text: "Arapaima are obligate air-breathers that surface every 5–15 minutes. They are found in flood-season várzea lakes and retreat to deep channels in the dry season. Sustainable arapaima fishing programs in Brazil have become a model for community-managed conservation.",
  },
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

  town_start_wet: {
    id: "town_start_wet",
    title: "Porto Alegre do Rio — Flood Season",
    type: "human",
    arrivalText:
      "The dock town is half-drowned. The lower market stalls are underwater; the trader has moved everything to the second floor of a stilted warehouse. The river is copper-colored from upstream sediment. A boat has come loose from a mooring and drifted into the fuel depot — no one seems alarmed.",
    choices: [
      { id: "trade_wet", label: "Resupply through the upper window. Standard prices.", successChance: 1.0 },
      { id: "ask_flooding", label: "Ask how far the flooding extends upstream.", successChance: 1.0 },
    ],
  },

  town_start_dry: {
    id: "town_start_dry",
    title: "Porto Alegre do Rio — Dry Season",
    type: "human",
    arrivalText:
      "The dock extends into what was, in the wet season, three meters of navigable water. The fuel depot is beached on cracked mud. A hand-painted sign reads: COMBUSTÍVEL RACIONADO — CONSULTE O PREÇO. The trader stands at the end of the dock, arms crossed, watching your approach.",
    choices: [
      { id: "trade_dry", label: "Buy fuel at dry-season price — you need it.", successChance: 1.0 },
      { id: "ask_routes_dry", label: "Ask about navigable routes in low water.", successChance: 1.0 },
      { id: "negotiate_dry", label: "Negotiate a lower price — explain the expedition.", successChance: 0.5 },
    ],
  },

  story_destination_fragments: {
    id: "story_destination_fragments",
    title: "Estação Científica Várzea",
    type: "story",
    arrivalText:
      "You've arrived. The station director is waiting at the dock — she received word of your approach by radio two days ago. She looks at you for a moment before speaking. 'The trader on the Marié told us someone was asking about the Zona Silenciosa at every stop. We hoped it was you.' She hands you a file. It has your name on the cover, written in handwriting you don't recognize.",
    choices: [
      { id: "report_findings_fragments", label: "Report everything you found — every detail.", successChance: 1.0 },
      { id: "ask_file_origin", label: "Ask who prepared this file before you arrived.", successChance: 1.0 },
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

  // World-state variant: fires when has_medical_history is true for this node
  human_village_return: {
    id: "human_village_return",
    title: "Vila Ribeirinha",
    type: "human",
    arrivalText:
      "The dock looks familiar. Someone has repaired the railing that was broken when you were last here. A child runs inside before you've finished tying off — you hear the word spreading through the settlement. By the time you climb the bank, the elder is already standing. He doesn't open one eye this time. He opens both. 'I wondered if you'd come back.'",
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
  // ── New encounters ──────────────────────────────────────────────────────

  wildlife_jaguar: {
    id: "wildlife_jaguar",
    title: "The Bank at Dawn",
    type: "wildlife",
    arrivalText:
      "You cut the engine to drift around a tight bend — and there it is. A jaguar at the water's edge, drinking. She doesn't look up immediately. When she does, her eyes hold you for three full seconds before she turns and walks into the tree line without urgency.",
    choices: [
      { id: "jaguar_observe", label: "Don't move. Don't breathe. Document everything.", successChance: 1.0 },
      { id: "jaguar_photo", label: "Reach slowly for the camera — you need this documented.", successChance: 0.7 },
    ],
  },

  wildlife_tapir: {
    id: "wildlife_tapir",
    title: "Tapir at the Crossing",
    type: "wildlife",
    arrivalText:
      "In the grey pre-dawn light, a tapir stands mid-river at a shallow crossing. It's enormous — the size of a small horse — and utterly calm. It watches your boat with mild interest, snout raised, reading the air.",
    choices: [
      { id: "tapir_observe", label: "Drift silently. Let it cross in its own time.", successChance: 1.0 },
      { id: "tapir_approach", label: "Move closer. Tapirs are famously docile.", successChance: 0.6 },
    ],
  },

  wildlife_tapir_night: {
    id: "wildlife_tapir_night",
    title: "Something on the Bank",
    type: "wildlife",
    arrivalText:
      "Your spotlight catches a large dark shape at the waterline. It freezes. You cut the light — too bright, too sudden for a night encounter. In the darkness, you can hear it moving away through the shallows: heavy, unhurried.",
    choices: [
      { id: "tapir_night_wait", label: "Wait in darkness. Let your eyes adjust.", successChance: 0.85 },
      { id: "tapir_night_light", label: "Sweep the spotlight — you need to identify what it is.", successChance: 0.4 },
    ],
  },

  wildlife_capybara: {
    id: "wildlife_capybara",
    title: "The Colony",
    type: "wildlife",
    arrivalText:
      "A family of capybaras occupies a low mudflat ahead — at least fifteen of them, including several young. A sentinel adult stands slightly apart from the group, watching the water. They seem entirely unbothered by your approach.",
    choices: [
      { id: "capybara_observe", label: "Slow to a drift and watch. They're a good sign — the area is calm.", successChance: 1.0 },
      { id: "capybara_pass", label: "Pass through quietly and continue.", successChance: 1.0 },
    ],
  },

  wildlife_anaconda: {
    id: "wildlife_anaconda",
    title: "The Root Mass",
    type: "wildlife",
    arrivalText:
      "A thick rope of muscle is draped across the submerged roots along the bank — an anaconda, easily four meters, basking in a patch of filtered sunlight. It's partially in the water. The channel runs directly past it.",
    choices: [
      { id: "anaconda_observe", label: "Stop and observe from distance. Document carefully.", successChance: 1.0 },
      { id: "anaconda_navigate", label: "Navigate past slowly on the far side. Give it the bank.", successChance: 0.8 },
      { id: "anaconda_knowledge", label: "It's thermoregulating, not hunting. Pass at normal speed — startling it would be worse.", requiresFieldNote: "anaconda_behavior", successChance: 0.95 },
    ],
  },

  wildlife_piranha: {
    id: "wildlife_piranha",
    title: "Dry Season Pool",
    type: "wildlife",
    arrivalText:
      "The dry season has concentrated everything. A pool in a shrinking oxbow holds hundreds of piranha — you can see the boil of them just below the surface, jostling for space. The water here barely covers the prop. To continue you'll need to cross the shallows.",
    choices: [
      { id: "piranha_wade", label: "Lift the motor and wade through carefully.", successChance: 0.6 },
      { id: "piranha_pole", label: "Pole through without entering the water.", requiresFieldNote: "piranha_behavior", successChance: 0.9 },
      { id: "piranha_wait", label: "Wait until evening — their feeding behavior peaks midday.", requiresFieldNote: "piranha_behavior", successChance: 1.0 },
    ],
  },

  wildlife_arapaima: {
    id: "wildlife_arapaima",
    title: "The Giant of the Lake",
    type: "wildlife",
    arrivalText:
      "A shadow passes under the hull — then surfaces. An arapaima, two meters if it's an inch, rolling to gulp air. Its scales catch the light like hammered copper. It surfaces again twenty meters ahead, indifferent to you, going about a life that predates most of what humans call history.",
    choices: [
      { id: "arapaima_observe", label: "Observe and document. These sightings are increasingly rare.", successChance: 1.0 },
      { id: "arapaima_follow", label: "Follow it. Arapaima tend to surface near shallow lake exits.", successChance: 0.8 },
    ],
  },

  wildlife_owl: {
    id: "wildlife_owl",
    title: "The Knock in the Dark",
    type: "wildlife",
    arrivalText:
      "Moored for the night, you hear it: a sound like someone rapping their knuckles on hollow wood, slow and deliberate, close. You sweep the nearest tree with a dim light — and find two eyes looking back at you, framed by a clown-white face. A spectacled owl, regarding you from three meters.",
    choices: [
      { id: "owl_observe", label: "Keep the light very low. Watch.", successChance: 1.0 },
      { id: "owl_record", label: "Note the call pattern. It's distinctive enough to use later.", successChance: 1.0 },
    ],
  },

  wildlife_morpho: {
    id: "wildlife_morpho",
    title: "The Blue Corridor",
    type: "discovery",
    arrivalText:
      "A gap in the canopy has created a natural clearing above a flooded channel. Morpho butterflies — dozens of them — are working the light column. Each wingbeat flashes iridescent blue that doesn't come from pigment: it's physics, structural color, light itself being sorted. For thirty seconds you forget about the fuel gauge.",
    choices: [
      { id: "morpho_observe", label: "Sit with it. This is why you came.", successChance: 1.0 },
    ],
  },

  wildlife_stingray: {
    id: "wildlife_stingray",
    title: "Shallow Sandy Crossing",
    type: "navigation",
    arrivalText:
      "A sandy-bottomed ford — the river narrows and drops to less than a meter. You can see the bottom clearly. You can also see, if you look carefully, the faint outlines of freshwater stingrays buried in the sand. Five, maybe six of them. The route requires crossing this stretch.",
    choices: [
      { id: "stingray_careful", label: "Proceed extremely slowly, watching every centimeter.", successChance: 0.75 },
      { id: "stingray_knowledge", label: "Shuffle the boat hull forward — vibration before contact warns them off.", requiresFieldNote: "stingray_behavior", successChance: 0.95 },
      { id: "stingray_wait", label: "Wait for current to shift. Stingrays move with water temperature change.", requiresFieldNote: "stingray_behavior", successChance: 1.0 },
    ],
  },

  human_trader: {
    id: "human_trader",
    title: "The Trading Boat",
    type: "human",
    arrivalText:
      "A wooden boat piled with goods sits moored at a makeshift dock — cooking oil, rope, batteries, medicine in unlabeled bottles. The operator, a slight man with a sun-bleached hat, calls out before you've docked: 'I've got what you need. Question is whether you've got what I want.'",
    choices: [
      { id: "trader_trade", label: "Trade — offer equipment for medicine and food.", successChance: 1.0 },
      { id: "trader_news", label: "Ask what he's heard upriver. Traders know things.", successChance: 1.0 },
      { id: "trader_haggle", label: "Haggle. You don't have much to offer.", successChance: 0.6 },
    ],
  },

  crisis_storm: {
    id: "crisis_storm",
    title: "The Storm",
    type: "navigation",
    arrivalText:
      "It hits without the warning you thought you had. Rain arrives horizontal, reducing visibility to ten meters. The river churns white. A dead tree, dislodged upstream, passes six meters off the bow moving faster than you can navigate. You need to make a decision immediately.",
    choices: [
      { id: "storm_shelter", label: "Find the nearest bank and shelter until it passes.", successChance: 0.85 },
      { id: "storm_push", label: "Push through — you can't afford to lose the time.", successChance: 0.3 },
      { id: "storm_navigate_knowledge", label: "Use the current to your advantage — ride the storm rather than fight it.", requiresFieldNote: "boto_navigation", successChance: 0.7 },
    ],
  },

  nav_fallen_tree: {
    id: "nav_fallen_tree",
    title: "The Fallen Ceiba",
    type: "navigation",
    arrivalText:
      "A ceiba tree — enormous, centuries old — has fallen across the channel. The crown is submerged; the trunk blocks three-quarters of the passage. A narrow gap remains near the far bank. The water is moving fast here.",
    choices: [
      { id: "tree_gap", label: "Take the gap carefully at low throttle.", successChance: 0.7 },
      { id: "tree_portage", label: "Portage — pull everything over the trunk by hand.", successChance: 0.95 },
      { id: "tree_guide_knowledge", label: "Read the current. The gap is deeper than it looks — take it at speed.", requiresFieldNote: "boto_navigation", successChance: 0.9 },
    ],
  },

  // ── Season / weather variants ──────────────────────────────────────────────

  human_extractivist_storm: {
    id: "human_extractivist_storm",
    title: "Shelter",
    type: "human",
    arrivalText:
      "The storm has driven everyone inside. You find the logging camp crowded under a tarp — four men, chainsaws stacked under shelter, the smell of wet wood and cigarettes. The youngest one looks relieved to see a boat. 'We've been waiting for it to pass. You have fuel?'",
    choices: [
      { id: "storm_share_fuel", label: "Share your fuel in exchange for information about the upper river.", successChance: 1.0 },
      { id: "storm_shelter_only", label: "Take shelter and wait out the storm. Nothing more.", successChance: 1.0 },
    ],
  },

  human_extractivist_dry: {
    id: "human_extractivist_dry",
    title: "The Camp in Dry Season",
    type: "human",
    arrivalText:
      "The dry season has exposed the forest floor. Log roads that were underwater months ago are now traversable. The camp is larger than it looked in high water — more men, more equipment, a second chainsaw crew finishing a run close to the river. The young man with the prepared explanation is still here.",
    choices: [
      { id: "dry_no_judgment", label: "Say nothing about the operation. Ask to buy fuel.", successChance: 1.0 },
      { id: "dry_document", label: "Make discreet notes about the extent of the operation.", successChance: 0.7 },
    ],
  },

  human_trader_night: {
    id: "human_trader_night",
    title: "The Boat at Night",
    type: "human",
    arrivalText:
      "The trading boat is lit by a single kerosene lamp. The operator hears your engine and appears in the stern with a flashlight. After a moment, he sets it down. 'You're out late. So am I.' He has supplies — you can see them in the lamplight — and something else: the look of someone who has been waiting for a different boat.",
    choices: [
      { id: "night_trade", label: "Trade for what you need. Don't ask about the other boat.", successChance: 1.0 },
      { id: "night_ask", label: "Ask about the boat he was expecting.", successChance: 0.55 },
    ],
  },

  human_trader_dry: {
    id: "human_trader_dry",
    title: "Low Water Market",
    type: "human",
    arrivalText:
      "The dry season has exposed sandbanks on both sides of the channel. The trader's boat sits lower — less stock, harder run upriver. He looks thinner. 'Prices are different in dry season,' he says, before you've asked. 'Everything costs more to move.'",
    choices: [
      { id: "dry_trade_accept", label: "Accept the dry-season prices. You need supplies.", successChance: 1.0 },
      { id: "dry_trade_refuse", label: "Push back on the markup. The river is the same.", successChance: 0.45 },
      { id: "dry_trade_barter", label: "Offer equipment rather than trying to argue about currency.", successChance: 0.9 },
    ],
  },

  human_researcher_dry: {
    id: "human_researcher_dry",
    title: "Dr. Ferreira — Dry Season",
    type: "human",
    arrivalText:
      "The camp looks different in dry season — the water has dropped two meters, exposing a mudflat that wasn't here in the wet. Dr. Ferreira is standing at the water's edge looking at something in the exposed sediment. She doesn't look up when you arrive. 'The low-water channel runs thirty meters east of where it was last year,' she says. 'That doesn't happen.'",
    choices: [
      { id: "dry_ask_channel", label: "Ask what a shifted channel means.", successChance: 1.0 },
      { id: "dry_ask_silence", label: "Ask if the silence zones have changed with the water level.", requiresFieldNote: "boto_navigation", successChance: 1.0 },
    ],
  },

  human_researcher_night: {
    id: "human_researcher_night",
    title: "Lamplight and Data",
    type: "human",
    arrivalText:
      "The camp is quiet at night except for a generator and Dr. Ferreira at her laptop, going through acoustic data. She waves you toward the camp table without looking up. On the screen: a spectrogram — time on one axis, frequency on the other. The right side is almost entirely blank. 'That used to be full,' she says.",
    choices: [
      { id: "night_ask_data", label: "Ask her to explain the spectrogram.", successChance: 1.0 },
      { id: "night_ask_origin", label: "Ask when the silence started.", successChance: 1.0 },
    ],
  },

  human_ngo: {
    id: "human_ngo",
    title: "The Conservation Team",
    type: "human",
    arrivalText:
      "Three people in matching shirts — an NGO logo on the chest — are interviewing an elderly woman on her porch while a fourth photographs her fish traps. The woman looks patient in the way people look patient when they have learned that patience is the fastest way through certain conversations.",
    choices: [
      { id: "ngo_observe", label: "Wait at the dock. Don't interrupt.", successChance: 1.0 },
      { id: "ngo_engage", label: "Introduce yourself to the team leader.", successChance: 1.0 },
      { id: "ngo_speak_elder", label: "Wait for the team to leave, then speak with the elder directly.", successChance: 0.8 },
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

  trade_wet: () => ({
    text: "You load supplies through an upper window — there's no deck space. The trader charges standard prices without comment. As you push off, she calls down: 'The upper river is three weeks behind last year's flood peak. Your side channels will be deeper than any map shows. Allow extra time.'",
    resourceDelta: { fuel: 30, food: 25 },
  }),

  ask_flooding: () => ({
    text: "The trader pulls out a hand-drawn waterline map, updated in pencil. 'As of four days ago: two meters above last year at this date. The Mata Alagada is fully flooded — deeper than most boats have seen. Your engine will hit submerged roots if you're not watching.' She points to a section of river ahead.",
    resourceDelta: { morale: 5 },
  }),

  trade_dry: () => ({
    text: "You pay the dry-season price. It's steep. The trader counts the money without apology. As she hands over the fuel, she adds: 'If you're going to Banco dos Jacarés, avoid the left channel — the water's gone and the caimans have nowhere to go. They're not happy about it.'",
    resourceDelta: { fuel: 25, food: 20 },
  }),

  ask_routes_dry: () => ({
    text: "She draws a route from memory — main channel to the first fork, right tributary, then a sandbar you'll need to portage around. 'The left route is sand from the Banco to the Igarapé Escuro. Three boats got stuck last week. Right adds an hour but you'll have water under you.'",
    resourceDelta: { fuel: 5 },
  }),

  negotiate_dry: (success) => success
    ? {
        text: "She listens to the expedition brief without expression, then discounts the fuel by twenty percent. 'Research is one of three reasons I do that. The other two are medical and government, and I don't like governments.' She doesn't elaborate.",
        resourceDelta: { fuel: 30, food: 20 },
      }
    : {
        text: "'Dry season price is dry season price.' She isn't unkind about it. 'I have six fishing families who need the same fuel and none of them have expedition backing.' Fair point. You pay full price.",
        resourceDelta: { fuel: 20, food: 15 },
      },

  report_findings_fragments: () => ({
    text: "She listens for forty minutes without interrupting. When you finish, she opens a cabinet: a shelf of identical files. Twelve. Yours is the thirteenth. 'Every expedition that found something.' She taps your file label. 'You found more than most. That's why your file existed before you arrived.' She sits back down. 'The Zona Silenciosa is not an ecological event. We need someone to go to the origin point. The coordinates are in the file.' She looks at you. 'We need that to be you.'",
    resourceDelta: { morale: 20 },
  }),

  ask_file_origin: () => ({
    text: "'Dr. Ferreira compiled it from radio reports,' the director says. She pauses. 'Dr. Ferreira went into the upper Marié basin three months ago. She hasn't made contact since.' She says it like a statement of fact. Then: 'The file was prepared before she left. She believed someone would follow the trail she laid.' A pause. 'That's you.'",
    resourceDelta: { morale: -5 },
  }),

  // ── New outcomes ──────────────────────────────────────────────────────────

  jaguar_observe: () => ({
    text: "You don't move for four minutes. The jaguar drinks, scans the opposite bank, then melts into the undergrowth without sound. You have a field note and the memory of being looked at by something that categorized you and found you uninteresting.",
    fieldNote: FIELD_NOTES.jaguar_behavior,
    resourceDelta: { morale: 10 },
  }),

  jaguar_photo: (success) => success
    ? {
        text: "Your hand is steadier than you thought. You get three clear frames. The jaguar glances at the click of the shutter — not alarmed, just noting it — and walks away.",
        fieldNote: FIELD_NOTES.jaguar_behavior,
        resourceDelta: { morale: 8 },
      }
    : {
        text: "The movement spooks her. She's gone in a second — a flash of spots, then nothing. You don't get the shot. But the sighting itself is logged.",
        resourceDelta: { morale: 3 },
      },

  tapir_observe: () => ({
    text: "The tapir crosses at its own pace. It pauses once to look at you — ancient, calm eyes — then climbs the far bank and disappears. Where it crossed is knee-deep at most. You note the ford.",
    fieldNote: FIELD_NOTES.tapir_ecology,
    resourceDelta: { morale: 8 },
  }),

  tapir_approach: (success) => success
    ? {
        text: "Tapirs are indeed docile. It watches you approach, huffs once, then continues grazing. You get within ten meters before it ambles away.",
        fieldNote: FIELD_NOTES.tapir_ecology,
        resourceDelta: { morale: 6 },
      }
    : {
        text: "Docile doesn't mean unbothered. It bolts into the undergrowth, crashing through brush, and you've startled the whole bank.",
        resourceDelta: { morale: -5 },
      },

  tapir_night_wait: (success) => success
    ? {
        text: "As your eyes adjust, you pick out the tapir shape — enormous, snuffling at the bank. It grazes for ten minutes, unaware of you, then wades back into the night shallows.",
        fieldNote: FIELD_NOTES.tapir_ecology,
        resourceDelta: {},
      }
    : {
        text: "Whatever it was has moved on by the time your eyes adjust. The bank is empty.",
        resourceDelta: {},
      },

  tapir_night_light: (success) => success
    ? {
        text: "You catch it just as it turns — a tapir, caught in the light, staring back at you before it bolts. Confirmed at least.",
        resourceDelta: {},
      }
    : {
        text: "The light spooks it instantly. Gone before you can identify it properly. The bank's crashing brush tells you it was large.",
        resourceDelta: { morale: -3 },
      },

  capybara_observe: () => ({
    text: "The sentinel adult monitors you for two minutes, then apparently files you under 'not a threat' and returns to grazing. The young ones climb over each other in the shallows. This is what ecological health looks like — large herbivores, relaxed, in the open.",
    resourceDelta: { morale: 12 },
  }),

  capybara_pass: () => ({
    text: "They scatter briefly at your engine, then regroup as you pass. The sentinel watches you all the way around the bend.",
    resourceDelta: {},
  }),

  anaconda_observe: () => ({
    text: "You watch it for twenty minutes. It doesn't move, except to taste the air once with a tongue the color of charcoal. Then the light shifts and it slides silently into the water — so fluidly it barely breaks the surface.",
    fieldNote: FIELD_NOTES.anaconda_behavior,
    resourceDelta: {},
  }),

  anaconda_navigate: (success) => success
    ? {
        text: "Wide berth, slow approach. The anaconda registers you at three meters, decides the bank is more appealing than conflict, and slides off. Clean passage.",
        resourceDelta: {},
      }
    : {
        text: "You misjudged the distance. The anaconda thrashes into the water — not at you, but the hull takes a glancing blow from its tail. Equipment takes minor damage.",
        resourceDelta: { equipment: -10, morale: -8 },
      },

  anaconda_knowledge: () => ({
    text: "Standard speed, steady approach. The anaconda tracks your movement, evaluates threat, and makes the rational decision — the bank is finite, the river is not. It slips in ahead of you and is gone.",
    resourceDelta: { morale: 5 },
  }),

  piranha_wade: (success) => success
    ? {
        text: "You move in increments of centimeters. The piranhas jostle around your legs — they're not interested in you, they're competing for bottom scraps. You make it across with nothing worse than nerves.",
        resourceDelta: { morale: -5 },
      }
    : {
        text: "A shallow cut on your ankle from a rock — blood in the water. The piranhas react immediately. You get back in the boat with a bite that needs medicine to prevent infection.",
        resourceDelta: { medicine: -15, morale: -15 },
      },

  piranha_pole: () => ({
    text: "Eight careful minutes. Pole planted, push, rest, repeat. The piranhas churn below you the whole time. You emerge on the other side dry and intact.",
    fieldNote: FIELD_NOTES.piranha_behavior,
    resourceDelta: { morale: 5 },
  }),

  piranha_wait: () => ({
    text: "You wait two hours in the midday heat. When the sun drops behind the canopy, the pool settles. The piranhas disperse to the edges and you cross without incident.",
    fieldNote: FIELD_NOTES.piranha_behavior,
    resourceDelta: { food: -5 },
  }),

  arapaima_observe: () => ({
    text: "You watch four surfacing cycles — each time the great head rolls and gulps air, you note the interval. Around seven minutes. The arapaima is feeding, moving in slow arcs along the lake bottom. A healthy individual in healthy water.",
    fieldNote: FIELD_NOTES.arapaima_ecology,
    resourceDelta: { morale: 10 },
  }),

  arapaima_follow: (success) => success
    ? {
        text: "The arapaima leads you around the lake's perimeter and surfaces near a barely-visible channel mouth between two stands of flooded trees. A shortcut you wouldn't have found on your own.",
        fieldNote: FIELD_NOTES.arapaima_ecology,
        resourceDelta: { fuel: 8, morale: 8 },
      }
    : {
        text: "The arapaima dives deep and you lose it. But following brought you to a quieter section of lake where the morning mist sits on the water undisturbed. Worth something.",
        fieldNote: FIELD_NOTES.arapaima_ecology,
        resourceDelta: { morale: 5 },
      },

  owl_observe: () => ({
    text: "You watch it for thirty minutes in dim light. It doesn't move except to track a sound you can't hear, rotating its head in degrees, then settling again. When it finally calls — that wooden knock — the sound travels much farther through the night air than you expected.",
    fieldNote: FIELD_NOTES.spectacled_owl,
    resourceDelta: { morale: 12 },
  }),

  owl_record: () => ({
    text: "You record the call pattern in your journal. It's a territorial advertisement — consistent intervals, specific cadence. You now know the signature of this individual. You'll recognize it if you ever come back.",
    fieldNote: FIELD_NOTES.spectacled_owl,
    resourceDelta: { morale: 10 },
  }),

  morpho_observe: () => ({
    text: "You sit in the light column for fifteen minutes and don't write a single note. Sometimes the right response to beauty is to let it be exactly that.",
    resourceDelta: { morale: 20 },
  }),

  stingray_careful: (success) => success
    ? {
        text: "Centimeter by centimeter. You can see them adjusting as you approach — the slight tremor, the realignment. Three pass within hull-width. None strike.",
        resourceDelta: {},
      }
    : {
        text: "The hull clips one. It doesn't sting the boat — but it triggers a chain reaction, three or four stingrays thrashing in all directions. You take a barb through the hull planking. Manageable but ugly.",
        resourceDelta: { equipment: -15, medicine: -5 },
      },

  stingray_knowledge: () => ({
    text: "Controlled vibration forward. Stingrays are displacing before you reach them — you can see the sand puffs ahead of the hull. You cross the ford without incident.",
    fieldNote: FIELD_NOTES.stingray_behavior,
    resourceDelta: {},
  }),

  stingray_wait: () => ({
    text: "An hour. The afternoon temperature drops a degree — imperceptible to you, significant to a cold-blooded animal. The stingrays migrate toward the deeper end. You cross clean.",
    fieldNote: FIELD_NOTES.stingray_behavior,
    resourceDelta: { food: -5 },
  }),

  trader_trade: () => ({
    text: "He drives a harder bargain than you'd like but a fairer one than you expected. You trade worn equipment for medicine and a bag of dried food. He also throws in a waterproofed map section he says 'came off a researcher's boat a few months ago.'",
    resourceDelta: { medicine: 20, food: 15, equipment: -10 },
  }),

  trader_news: () => ({
    text: "'Nothing moves on the upper Marié anymore,' he says, not looking up from his inventory. 'No fish boats, no community barges, nothing. Three months ago there were six families making that run. Now none.' He seals a crate. 'Market dried up. Not worth the trip.' He doesn't say what dried it up.",
    resourceDelta: {},
  }),

  trader_haggle: (success) => success
    ? {
        text: "You wear him down. He sells you fuel at a grudging price and adds a can of food almost as an insult. Better than nothing.",
        resourceDelta: { fuel: 15, food: 8 },
      }
    : {
        text: "He doesn't budge. 'I have a fixed price and I have it for a reason.' You leave with nothing.",
        resourceDelta: { morale: -5 },
      },

  storm_shelter: (success) => success
    ? {
        text: "You find a sheltered creek mouth and tie off to a root mass. The storm passes in forty minutes — loudly. When it clears, the river is two meters higher and a different color entirely. Equipment intact. You lost time, not resources.",
        resourceDelta: { food: -8 },
      }
    : {
        text: "The shelter holds until a wind gust brings a branch down on the canopy cover. Minor damage — waterproofing compromised, equipment exposed. It'll cost you later.",
        resourceDelta: { equipment: -12, food: -8 },
      },

  storm_push: (success) => success
    ? {
        text: "Fifteen minutes of white-knuckle navigation. The river wants to put you into the bank twice. You get through on stubbornness and fuel burn.",
        resourceDelta: { fuel: -20, morale: -10 },
      }
    : {
        text: "A submerged log catches the prop. You're adrift in a storm for twenty minutes before you can repair it. Equipment takes serious damage.",
        resourceDelta: { fuel: -15, equipment: -25, morale: -20 },
      },

  storm_navigate_knowledge: (success) => success
    ? {
        text: "You read the current like the botos do — not fighting the river's new geometry, finding the path of least resistance. You emerge downstream faster than sheltering would have allowed, hull intact.",
        resourceDelta: { fuel: -10, morale: 5 },
      }
    : {
        text: "The current is stronger than you read it. You navigate well but the river wins this one — minor equipment damage from debris.",
        resourceDelta: { fuel: -12, equipment: -10 },
      },

  tree_gap: (success) => success
    ? {
        text: "You thread the gap with two handspans to spare on each side. The current pushes you slightly toward the trunk on exit but you correct in time.",
        resourceDelta: {},
      }
    : {
        text: "The current catches you at the wrong moment. The hull scrapes the trunk. You make it through but equipment condition takes a hit.",
        resourceDelta: { equipment: -15, morale: -8 },
      },

  tree_portage: () => ({
    text: "An hour of work. Every piece of equipment lifted, the hull dragged across the bark with rope and sweat. Exhausting but methodical. Nothing lost, nothing damaged.",
    resourceDelta: { food: -10, morale: -8 },
  }),

  tree_guide_knowledge: (success) => success
    ? {
        text: "Speed is counterintuitive but it works — the momentum carries you past the turbulence before the current can turn you. Clean passage in seconds.",
        resourceDelta: { fuel: -5 },
      }
    : {
        text: "The speed helps but the current angle was worse than you read. You make it through — barely — with a scrape along the port side.",
        resourceDelta: { equipment: -8 },
      },

  // ── Season / weather variant outcomes ──────────────────────────────────────

  storm_share_fuel: () => ({
    text: "'We appreciate it.' He tells you something in exchange — a route that avoids the upper bank during the storm, used by the logging trucks. It costs you fuel, but you leave knowing the river's behavior in this weather a little better.",
    resourceDelta: { fuel: -15, morale: 8 },
  }),

  storm_shelter_only: () => ({
    text: "You wait in silence while the rain hammers the tarp. No one talks much. When the storm breaks, you leave having said almost nothing. But you sheltered, and the boat is intact.",
    resourceDelta: { food: -8 },
  }),

  dry_no_judgment: () => ({
    text: "'Fair enough,' he says. He fills your tank without ceremony. As you're leaving he adds, without being asked: 'Don't go past the falls right now. Water's too low. Anyone who went up there recently came back looking wrong.' He doesn't elaborate.",
    resourceDelta: { fuel: 20 },
  }),

  dry_document: (success) => success
    ? {
        text: "You note the extent of the operation — the roads, the cleared hectares, the zone numbers visible on a map posted to a tree. This information will be useful to someone. The young man watches you but says nothing.",
        resourceDelta: { morale: -5 },
      }
    : {
        text: "You're not subtle enough. One of the older men puts himself between you and the operation map. 'You a journalist?' The conversation ends. You leave without what you came for.",
        resourceDelta: { morale: -10 },
      },

  night_trade: () => ({
    text: "He sells you what you need at fair prices, by lamplight. The transaction is quiet and professional. Whatever boat he was waiting for, he doesn't bring it up. Neither do you.",
    resourceDelta: { medicine: 15, food: 12 },
  }),

  night_ask: (success) => success
    ? {
        text: "'A researcher's boat. She went upriver six weeks ago. She hasn't come back.' He says it the way people say things they've decided to stop worrying about. 'Not my concern anymore.' He charges you nothing for the information.",
        resourceDelta: { morale: -5 },
      }
    : {
        text: "His expression closes. 'Just a regular trade run.' He finishes the transaction and goes back inside. Whatever you almost learned stays with the river.",
        resourceDelta: {},
      },

  dry_trade_accept: () => ({
    text: "You pay the dry-season price and leave with what you need. He's right — everything costs more to move when the channel is half sand. You don't blame him for it.",
    resourceDelta: { medicine: 18, food: 10 },
  }),

  dry_trade_refuse: (success) => success
    ? {
        text: "He shrugs, unexpectedly. 'Fine. My price was high anyway.' You get a fair deal — and a piece of information about a low-water shortcut through the next bend.",
        resourceDelta: { medicine: 12, food: 8, fuel: 5 },
      }
    : {
        text: "He doesn't budge. 'You can wait for the rains.' You leave with nothing. The dry season is not on your side.",
        resourceDelta: { morale: -8 },
      },

  dry_trade_barter: () => ({
    text: "He looks at your spare equipment with genuine interest. 'Deal.' A worn hand-pump and a spare prop shaft buy you more than cash would have. Equipment trades well when roads are dust.",
    resourceDelta: { medicine: 22, food: 15, equipment: -12 },
  }),

  dry_ask_channel: () => ({
    text: "'It means the bottom substrate is moving,' she says, still looking at the sediment. 'Not seasonally — permanently. Something is changing the river's course at the upper watershed. That takes force. Or absence of force. I don't know which is worse.'",
    resourceDelta: { morale: -5 },
  }),

  dry_ask_silence: () => ({
    text: "She finally looks at you. 'In the wet season the zones were a fixed area. I could map them. In the dry season they're larger. As if the water was containing them.' She walks back to camp without finishing the thought.",
    resourceDelta: { morale: -8 },
  }),

  night_ask_data: () => ({
    text: "'Frequency range 200-8000Hz — that's the acoustic signature of a healthy river. Fish, frogs, insects, birds at the surface. This recording is from fourteen months ago.' She points to the blank section. 'This is from last month. Same location, same time of day, same equipment.' She closes the laptop. 'I don't show people this usually.'",
    resourceDelta: { morale: -10 },
  }),

  night_ask_origin: () => ({
    text: "'Eighteen months ago, the first anomaly. Fourteen months ago, the first three complete silences. It's been spreading since then.' She refills her coffee. 'The unusual thing isn't the rate. The unusual thing is the shape. It's moving like a biological boundary. Like something is advancing.'",
    resourceDelta: { morale: -12 },
  }),

  ngo_observe: () => ({
    text: "The interview ends. The team thanks the woman and packs up with efficiency. She watches them go with an expression you've seen before — the polite face worn while waiting for outsiders to finish.",
    resourceDelta: {},
  }),

  ngo_engage: () => ({
    text: "'We're documenting traditional fishing territories,' the team leader says. 'To support land rights claims.' It's good work, probably. But the woman on the porch is watching the conversation about her land happen between two people who aren't her.",
    resourceDelta: { morale: -5 },
  }),

  ngo_speak_elder: (success) => success
    ? {
        text: "She offers you coffee and talks for an hour. She knows the upper river better than any map. She describes the silence that has settled into it — not emptiness, she says, but wrongness. Like a held breath. She gives you a hand-drawn route note.",
        resourceDelta: { morale: 10, fuel: 5 },
      }
    : {
        text: "She's polite but closed. Too many strangers this season asking questions. You leave knowing only that the wariness itself tells you something.",
        resourceDelta: {},
      },
};

function defaultOutcome(success: boolean): EncounterOutcome {
  return {
    text: success
      ? "You proceed without incident."
      : "Something goes wrong. Resources are lost.",
    resourceDelta: success ? {} : { equipment: -10 },
  };
}
