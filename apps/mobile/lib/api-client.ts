import Constants from "expo-constants";

export type CategoryDto = {
  id: string;
  name: string;
  slug: string;
  signCount: number;
};

export type SignDto = {
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

export type PagedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  expiresAtUtc: string;
  userId: string;
  email: string;
  displayName: string;
  role: string;
};

export type MeResponse = {
  userId: string | null;
  email: string | null;
  displayName: string | null;
  role: string | null;
};

export type RecognitionStatus = {
  status: string;
  message: string;
  modelVersion: string | null;
  datasetVersion: string | null;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const API_BASE_URL: string =
  (Constants.expoConfig?.extra?.isharaApiUrl as string | undefined) ?? "http://localhost:5090";

async function getJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Accept: "application/json" }
    });
    if (!response.ok) {
      return fallback;
    }
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

async function sendJson<TResponse>(
  path: string,
  method: "POST",
  body?: unknown,
  accessToken?: string
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
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

export async function getCategories(): Promise<CategoryDto[]> {
  return getJson<CategoryDto[]>("/api/categories", []);
}

export async function getSigns(params: {
  q?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}): Promise<PagedResult<SignDto>> {
  const search = new URLSearchParams();
  search.set("page", String(params.page ?? 1));
  search.set("pageSize", String(params.pageSize ?? 20));
  if (params.q) search.set("q", params.q);
  if (params.category) search.set("category", params.category);

  return getJson<PagedResult<SignDto>>(`/api/signs?${search.toString()}`, {
    items: [],
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
    totalCount: 0
  });
}

export async function getSign(id: string): Promise<SignDto | null> {
  return getJson<SignDto | null>(`/api/signs/${id}`, null);
}

export async function register(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<AuthResponse> {
  return sendJson<AuthResponse>("/api/auth/register", "POST", input);
}

export async function login(input: { email: string; password: string }): Promise<AuthResponse> {
  return sendJson<AuthResponse>("/api/auth/login", "POST", input);
}

export async function logout(refreshToken: string): Promise<void> {
  await sendJson<void>("/api/auth/logout", "POST", { refreshToken });
}

export async function getMe(accessToken: string): Promise<MeResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${accessToken}` }
    });
    if (!response.ok) {
      return { userId: null, email: null, displayName: null, role: null };
    }
    return (await response.json()) as MeResponse;
  } catch {
    return { userId: null, email: null, displayName: null, role: null };
  }
}

export async function getRecognitionStatus(): Promise<RecognitionStatus> {
  return getJson<RecognitionStatus>("/api/recognition/status", {
    status: "unavailable",
    message: "Recognition model is not available",
    modelVersion: null,
    datasetVersion: null
  });
}
