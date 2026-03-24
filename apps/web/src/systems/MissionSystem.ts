/**
 * Mission System
 *
 * Selects a telegram for the run and seeds the mission objective into the
 * geography, distributing intel hints along the path.
 *
 * STUB: Telegram pool is empty; selectTelegram returns null until content
 * is authored. Objective seeding uses a placeholder node.
 */

import type { ArchetypeId } from "@igapo/shared";
import type {
  TelegramTemplate,
  MissionObjective,
  RunHistoryEntry,
} from "@igapo/shared";
import type { DerivedStateSnapshot } from "@igapo/shared";

// ── Telegram pool ────────────────────────────────────────────────────────────

/**
 * Authored telegram templates. Empty until content is written.
 * Each archetype will have 2–3 templates per mission type.
 */
const TELEGRAM_POOL: TelegramTemplate[] = [
  // TODO: author telegram content in Phase 5
];

// ── Telegram selection ───────────────────────────────────────────────────────

/**
 * Selects a telegram template for the current run.
 *
 * Avoids immediate repetition. Applies world-state conditions when populated.
 * Returns null if no appropriate telegram is found (game falls back to
 * legacy behavior — no telegram shown).
 */
export function selectTelegram(
  archetypeId: ArchetypeId,
  runHistory: RunHistoryEntry[],
  _derivedState: DerivedStateSnapshot,
): TelegramTemplate | null {
  const recentIds = new Set(runHistory.slice(-2).map((r) => r.archetypeId + r.missionType));

  const candidates = TELEGRAM_POOL.filter(
    (t) =>
      t.archetypeId === archetypeId &&
      !recentIds.has(t.archetypeId + t.missionType),
  );

  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// ── Telegram body resolution ─────────────────────────────────────────────────

/**
 * Resolves {{placeholder}} tokens in the telegram body using world state
 * and run history. Used by the ArchetypeScene to display the telegram.
 */
export function resolveTelegramBody(
  template: TelegramTemplate,
  runHistory: RunHistoryEntry[],
  _derivedState: DerivedStateSnapshot,
): string {
  let body = template.bodyText;

  for (const ref of template.historicalReferences ?? []) {
    const lastRelevant = runHistory
      .filter((r) => r.missionType === (template as TelegramTemplate).missionType)
      .at(-1);

    let insert = "";
    if (lastRelevant && ref.condition.attribute === "prior_failure") {
      insert = lastRelevant.outcome !== "success" ? ref.text : "";
    }
    body = body.replace(ref.insertionPoint, insert);
  }

  // Clean up any unreplaced placeholders
  return body.replace(/\{\{[^}]+\}\}/g, "");
}

// ── Objective seeding ────────────────────────────────────────────────────────

/**
 * Seeds a mission objective into the geography for the current run.
 *
 * Stub: returns a placeholder until the World Population Engine's
 * compilation pass is implemented.
 */
export function seedMissionObjective(
  _archetypeId: ArchetypeId,
  _derivedState: DerivedStateSnapshot,
  _reachableNodeIds: string[],
): MissionObjective | null {
  // TODO: implement objective seeding in Phase 5
  // - Filter reachable nodes by mission type requirements
  // - Avoid recently-resolved nodes
  // - Distribute 2–4 intel hints along plausible paths
  return null;
}
