const API = process.env.NEXT_PUBLIC_ISHARA_API_URL ?? "http://localhost:5090";

export type Category = { id: string; name: string; slug: string; signCount: number };
export type Sign = {
  id: string;
  arabicLabel: string;
  gloss: string | null;
  category: string | null;
  sourceName: string;
  sourceRecordId: string;
  hasHamNoSys: boolean;
  hasSigml: boolean;
  hasMedia: boolean;
  hamNoSys: string | null;
  sigml: string | null;
  mediaUrl: string | null;
};
export type Page<T> = { items: T[]; page: number; pageSize: number; totalCount: number };

export type AuthResponse = {
  userId: string;
  email: string;
  displayName: string;
  role: string;
  accessToken: string;
  refreshToken: string;
  expiresAtUtc: string;
};

export type MeResponse = {
  userId: string | null;
  email: string | null;
  displayName: string | null;
  role: string | null;
};

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function json<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${API}${path}`, { next: { revalidate: 30 } });
    return response.ok ? await response.json() : fallback;
  } catch {
    return fallback;
  }
}

async function send<TResponse>(path: string, body?: unknown, accessToken?: string): Promise<TResponse> {
  const response = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  if (!response.ok) {
    let message = "Request failed.";
    let code: string | undefined;
    try {
      const problem = await response.json();
      message = problem.title ?? problem.message ?? message;
      code = problem.code ?? problem.extensions?.code;
    } catch {
      // Non-JSON error body.
    }
    throw new ApiError(message, response.status, code);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }
  return (await response.json()) as TResponse;
}

export function getCategories() {
  return json<Category[]>("/api/categories", []);
}

export function getSigns(params: { q?: string; category?: string; page: number; pageSize: number }) {
  const query = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) });
  if (params.q) query.set("q", params.q);
  if (params.category) query.set("category", params.category);
  return json<Page<Sign>>(`/api/signs?${query}`, { items: [], page: params.page, pageSize: params.pageSize, totalCount: 0 });
}

export function getSign(id: string) {
  return json<Sign | null>(`/api/signs/${id}`, null);
}

export function register(input: { email: string; password: string; displayName: string }) {
  return send<AuthResponse>("/api/auth/register", input);
}

export function login(input: { email: string; password: string }) {
  return send<AuthResponse>("/api/auth/login", input);
}

export function logout(refreshToken: string) {
  return send<void>("/api/auth/logout", { refreshToken });
}

export async function getMe(accessToken: string): Promise<MeResponse> {
  try {
    const response = await fetch(`${API}/api/auth/me`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${accessToken}` }
    });
    if (!response.ok) return { userId: null, email: null, displayName: null, role: null };
    return (await response.json()) as MeResponse;
  } catch {
    return { userId: null, email: null, displayName: null, role: null };
  }
}
