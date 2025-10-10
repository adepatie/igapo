import crypto from "node:crypto";

const random = () => {
  const buffer = crypto.randomBytes(4);
  return buffer.readUInt32BE(0) / 2 ** 32;
};

export const randomEncounter = (state) => {
  const roll = random();
  if (roll < 0.2) {
    return {
      title: "Sudden Storm",
      narrative:
        "A torrential downpour drenches the rainforest, slowing the canoe to a crawl.",
      deltas: { stamina: -12, morale: -6, supplies: -8 },
      tags: ["weather", "setback"],
    };
  }

  if (roll < 0.4) {
    return {
      title: "Tropical Bloom",
      narrative:
        "Rare orchids bloom along the bank, their scent lifting everyone's spirits.",
      deltas: { morale: +10 },
      tags: ["nature", "boon"],
    };
  }

  if (roll < 0.55) {
    return {
      title: "Jaguar Shadows",
      narrative:
        "Golden eyes glint from the underbrush. The crew tightens their grip on paddles.",
      deltas: { stamina: -4, morale: -8 },
      tags: ["wildlife", "risk"],
    };
  }

  if (roll < 0.7) {
    return {
      title: "Fresh Catch",
      narrative:
        "An unexpected school of fish leaps near the canoe. Dinner is secured.",
      deltas: { supplies: +12, morale: +4 },
      tags: ["resource", "boon"],
    };
  }

  if (roll < 0.85) {
    return {
      title: "Hidden Current",
      narrative:
        "A swift current pushes the crew forward, shaving time off the journey.",
      deltas: { progress: +1, stamina: -3 },
      tags: ["river", "progress"],
    };
  }

  return {
    title: "Quiet Watch",
    narrative:
      "The rainforest hums softly tonight. The crew rests and regains focus.",
    deltas: { stamina: +6, morale: +6 },
    tags: ["rest", "boon"],
  };
};

export const applyEncounter = (state, encounter) => {
  const nextState = { ...state };
  const deltas = encounter.deltas ?? {};
  nextState.stamina = Math.max(
    0,
    Math.min(100, nextState.stamina + (deltas.stamina ?? 0))
  );
  nextState.morale = Math.max(
    0,
    Math.min(100, nextState.morale + (deltas.morale ?? 0))
  );
  nextState.supplies = Math.max(0, nextState.supplies + (deltas.supplies ?? 0));
  nextState.progress = Math.max(
    0,
    Math.min(
      nextState.route.length - 1,
      nextState.progress + (deltas.progress ?? 0)
    )
  );
  nextState.journal.push({
    kind: "encounter",
    encounter,
    timestamp: Date.now(),
  });
  return nextState;
};
