import type { Archetype } from "./types";

export const ARCHETYPES: Archetype[] = [
  {
    id: "naturalist",
    name: "The Naturalist",
    background:
      "Wildlife researcher on a documentation grant. You have spent years reading ecosystems — animals are less spooked by your approach, and every observation sharpens faster.",
    startingResources: {
      fuel: 80,
      food: 60,
      medicine: 60,
      equipment: 100,
      morale: 90,
    },
    bonusFieldNoteIds: [],
  },
  {
    id: "correspondent",
    name: "The Correspondent",
    background:
      "Journalist following a story about illegal extraction. You read people the way others read rivers. Human encounters run deeper, and rumors reach you faster.",
    startingResources: {
      fuel: 90,
      food: 80,
      medicine: 50,
      equipment: 80,
      morale: 100,
    },
    bonusFieldNoteIds: [],
  },
  {
    id: "river_guide",
    name: "The River Guide",
    background:
      "Local expert hired to lead an outside expedition. You know the water. You know the season. The fog of war lifts faster — and the hidden routes are never entirely hidden from you.",
    startingResources: {
      fuel: 100,
      food: 90,
      medicine: 60,
      equipment: 90,
      morale: 80,
    },
    bonusFieldNoteIds: ["boto_navigation"],
  },
  {
    id: "medic",
    name: "The Medic",
    background:
      "Field doctor running a river health clinic circuit. Communities trust you immediately. Medical crises that would end another expedition are recoverable. You are bad at being invisible.",
    startingResources: {
      fuel: 80,
      food: 70,
      medicine: 100,
      equipment: 70,
      morale: 90,
    },
    bonusFieldNoteIds: [],
  },
];
