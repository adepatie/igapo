import type { BackendResponse, TurnRequestPayload } from "./types";

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

async function handleResponse(response: Response): Promise<BackendResponse> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  return (await response.json()) as BackendResponse;
}

export async function fetchStart(seed?: string): Promise<BackendResponse> {
  const rawUrl = createApiUrl("/start");
  const url = new URL(rawUrl, WINDOW_ORIGIN ?? "http://localhost");
  if (seed) {
    url.searchParams.set("seed", seed);
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: DEFAULT_HEADERS,
  });

  return handleResponse(response);
}

export async function postTurn(
  payload: TurnRequestPayload
): Promise<BackendResponse> {
  const response = await fetch(createApiUrl("/turn"), {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}
