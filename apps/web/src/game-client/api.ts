import type {
  StartResponse,
  ActionResponse,
  NarrateResponse,
  GameState,
  TurnContext,
  Action,
} from "./types";

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

export async function startGame(playerName: string): Promise<StartResponse> {
  const response = await fetch(createApiUrl("/api/start"), {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({ playerName }),
  });

  return handleResponse<StartResponse>(response);
}

export async function performAction(
  state: GameState,
  actionId: string
): Promise<ActionResponse> {
  const response = await fetch(createApiUrl("/api/action"), {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({ state, actionId }),
  });

  return handleResponse<ActionResponse>(response);
}

export async function getNarration(
  type: "intro" | "turn",
  params: { state?: GameState; context?: TurnContext }
): Promise<NarrateResponse> {
  const response = await fetch(createApiUrl("/api/narrate"), {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({ type, ...params }),
  });

  return handleResponse<NarrateResponse>(response);
}

export async function getAvailableActions(
  state: GameState
): Promise<{ actions: Action[] }> {
  const response = await fetch(createApiUrl("/api/actions"), {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({ state }),
  });

  return handleResponse<{ actions: Action[] }>(response);
}
