import type { GameState } from "./types";

const RAW_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const WINDOW_ORIGIN =
  typeof window !== "undefined" ? window.location.origin : undefined;
const API_BASE = RAW_BACKEND_URL?.replace(/\/+$/, "") || WINDOW_ORIGIN || "";

function createApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!API_BASE) {
    return normalizedPath;
  }

  const base = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;
  return `${base}${normalizedPath}`;
}

const DEFAULT_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

// DIALOGUE API FUNCTIONS

export async function startDialogueGame(
  playerName: string
): Promise<import("./types").StartDialogueResponse> {
  const response = await fetch(createApiUrl("/api/dialogue/start"), {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({ playerName }),
  });

  return handleResponse<import("./types").StartDialogueResponse>(response);
}

export async function continueDialogue(params: {
  state: GameState;
  characterId: string;
  selectedOptionId: string;
  selectedOptionText: string;
  selectedOptionTone: string;
  previousDialogue: string;
}): Promise<{ dialogue: import("./types").DialogueResponse }> {
  const response = await fetch(createApiUrl("/api/dialogue/continue"), {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(params),
  });

  return handleResponse<{ dialogue: import("./types").DialogueResponse }>(
    response
  );
}

export async function getNewCharacter(params: {
  state: GameState;
  rolePreference?: string;
  excludeIds?: string[];
}): Promise<{ dialogue: import("./types").DialogueResponse }> {
  const response = await fetch(createApiUrl("/api/dialogue/new-character"), {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(params),
  });

  return handleResponse<{ dialogue: import("./types").DialogueResponse }>(
    response
  );
}

// HYBRID SYSTEM API FUNCTIONS

export async function listActions(
  state: import("./types").HybridGameState
): Promise<import("./types").ActionListResponse> {
  const response = await fetch(createApiUrl("/api/actions/list"), {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({ state }),
  });

  return handleResponse<import("./types").ActionListResponse>(response);
}

export async function executeAction(
  state: import("./types").HybridGameState,
  actionId: string
): Promise<import("./types").ActionExecuteResponse> {
  const response = await fetch(createApiUrl("/api/actions/execute"), {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({ state, actionId }),
  });

  return handleResponse<import("./types").ActionExecuteResponse>(response);
}

export async function transitionFromDialogue(
  state: import("./types").HybridGameState,
  dialogueResult: Record<string, any>,
  excludeIds?: string[]
): Promise<import("./types").ModeTransitionResponse> {
  const response = await fetch(
    createApiUrl("/api/modes/transition-from-dialogue"),
    {
      method: "POST",
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ state, dialogueResult, excludeIds }),
    }
  );

  return handleResponse<import("./types").ModeTransitionResponse>(response);
}

export async function startExploration(
  state: import("./types").HybridGameState
): Promise<import("./types").ExplorationStartResponse> {
  const response = await fetch(createApiUrl("/api/exploration/start"), {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({ state }),
  });

  return handleResponse<import("./types").ExplorationStartResponse>(response);
}

export async function exploreArea(
  state: import("./types").HybridGameState,
  action: "search" | "observe" | "rest" | "leave"
): Promise<import("./types").ExplorationExploreResponse> {
  const response = await fetch(createApiUrl("/api/exploration/explore"), {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({ state, action }),
  });

  return handleResponse<import("./types").ExplorationExploreResponse>(response);
}
