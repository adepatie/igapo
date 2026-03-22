import type { CrewMember } from "./types";

// Named crew pool — procedurally assigned 2 per run
export const CREW_POOL: CrewMember[] = [
  {
    id: "solange",
    name: "Solange",
    role: "Boatwoman",
    traits: [
      { id: "expert_navigator", label: "Expert Navigator", description: "Reduces navigation risk on known tributaries." },
      { id: "superstitious", label: "Superstitious", description: "Morale penalty when entering igapó at night." },
    ],
    morale: 90,
  },
  {
    id: "dr_melo",
    name: "Dr. Melo",
    role: "Field Biologist",
    traits: [
      { id: "wildlife_eye", label: "Wildlife Eye", description: "Adds +1 choice option on wildlife encounters (Observe Carefully)." },
      { id: "bad_with_people", label: "Bad With People", description: "Human encounter trust checks suffer a minor penalty." },
    ],
    morale: 85,
  },
  {
    id: "raimundo",
    name: "Raimundo",
    role: "Mechanic",
    traits: [
      { id: "engine_sense", label: "Engine Sense", description: "Equipment condition degrades 20% slower." },
      { id: "anxious_in_storms", label: "Anxious in Storms", description: "Crew morale takes extra hit during weather crises." },
    ],
    morale: 80,
  },
  {
    id: "catarina",
    name: "Catarina",
    role: "Indigenous Liaison",
    traits: [
      { id: "community_trust", label: "Community Trust", description: "Indigenous and settlement encounters start with higher trust." },
      { id: "distrusts_researchers", label: "Distrusts Researchers", description: "Dialogue options with researchers lose one branch." },
    ],
    morale: 95,
  },
];

export function assignCrew(count: number = 2): CrewMember[] {
  const shuffled = [...CREW_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
