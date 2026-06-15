"use client";

const BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080") + "/api/v1";

type Method = "POST" | "PUT" | "PATCH" | "DELETE";
type QueryParam = string | number | boolean;

// ─── Options ──────────────────────────────────────────────────────────────────
interface BaseOptions {
  timeout?: number;
}

interface QueryOptions extends BaseOptions {
  query?: Record<string, QueryParam>;
}

interface MutationOptions extends BaseOptions {
  method?: Method;
  body?: Record<string, unknown> | FormData;
}

// ─── Response types ───────────────────────────────────────────────────────────
export interface Pagination {
  page: number;
  pages: number;
  perPage: number;
  total: number;
}

export interface Meta {
  timestamp: string;
  pagination?: Pagination;
}

export type QueryState<T> =
  | {
      status: "success";
      message: string;
      data: T;
      meta?: Meta;
    }
  | {
      status: "error";
      message: string;
    };

export type MutationState<T = null> =
  | {
      status: "success";
      message: string;
      data?: T;
    }
  | {
      status: "error";
      message: string;
      errors?: Record<string, string[]>;
    };

// ─── Refresh lock (prevents concurrent refresh races) ────────────────────────
let refreshLock: Promise<{ ok: boolean; message?: string }> | null = null;

async function doRefresh(): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  const json = await res.json().catch(() => null);

  return {
    ok: res.ok,
    message: json?.message,
  };
}

function refreshAccessToken(): Promise<{ ok: boolean; message?: string }> {
  if (refreshLock) return refreshLock;

  refreshLock = doRefresh().finally(() => {
    refreshLock = null;
  });

  return refreshLock;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildQuery(query?: Record<string, QueryParam>): string {
  if (!query || Object.keys(query).length === 0) return "";

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => params.append(key, String(value)));

  return `?${params.toString()}`;
}

function buildHeaders(body?: MutationOptions["body"]): Record<string, string> {
  const headers: Record<string, string> = {};

  if (body && !(body instanceof FormData)) headers["Content-Type"] = "application/json";

  return headers;
}

// ─── Core ─────────────────────────────────────────────────────────────────────
async function apiQuery<T>(path: string, options: QueryOptions = {}): Promise<QueryState<T>> {
  const { query, timeout = 10000 } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    let res = await fetch(`${BASE}${path}${buildQuery(query)}`, {
      method: "GET",
      headers: buildHeaders(),
      credentials: "include",
      signal: controller.signal,
    });

    if (res.status === 401) {
      const { ok, message } = await refreshAccessToken();

      if (!ok) {
        clearTimeout(timer);
        return {
          status: "error",
          message: message ?? "Session expired. Please login again.",
        };
      }

      res = await fetch(`${BASE}${path}${buildQuery(query)}`, {
        method: "GET",
        headers: buildHeaders(),
        credentials: "include",
        signal: controller.signal,
      });
    }

    clearTimeout(timer);

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        status: "error",
        message: json?.message ?? `Request failed with status ${res.status}`,
      };
    }

    return json;
  } catch (error) {
    clearTimeout(timer);

    if ((error as Error).name === "AbortError") return { status: "error", message: "Request timeout" };

    return { status: "error", message: "Network error" };
  }
}

async function apiMutation<T>(path: string, options: MutationOptions = {}): Promise<MutationState<T>> {
  const { method = "POST", body, timeout = 10000 } = options;

  const serializedBody = body instanceof FormData ? body : body ? JSON.stringify(body) : undefined;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    let res = await fetch(`${BASE}${path}`, {
      method,
      headers: buildHeaders(body),
      body: serializedBody,
      credentials: "include",
      signal: controller.signal,
    });

    if (res.status === 401) {
      const { ok, message } = await refreshAccessToken();

      if (!ok) {
        clearTimeout(timer);
        return {
          status: "error",
          message: message ?? "Session expired. Please login again.",
        };
      }

      res = await fetch(`${BASE}${path}`, {
        method,
        headers: buildHeaders(body),
        body: serializedBody,
        credentials: "include",
        signal: controller.signal,
      });
    }

    clearTimeout(timer);

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        status: "error",
        message: json?.message ?? `Request failed with status ${res.status}`,
        errors: json?.errors,
      };
    }

    return json;
  } catch (error) {
    clearTimeout(timer);

    if ((error as Error).name === "AbortError") return { status: "error", message: "Request timeout" };

    return { status: "error", message: "Network error" };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────
export const get = <T>({ path, ...options }: { path: string } & QueryOptions) => {
  return apiQuery<T>(path, options);
};

export const post = <T = null>({
  path,
  ...options
}: { path: string; body?: Record<string, unknown> } & BaseOptions) => {
  return apiMutation<T>(path, { method: "POST", ...options });
};

export const put = <T = null>({ path, ...options }: { path: string; body?: Record<string, unknown> } & BaseOptions) => {
  return apiMutation<T>(path, { method: "PUT", ...options });
};

export const patch = <T = null>({
  path,
  ...options
}: { path: string; body?: Record<string, unknown> } & BaseOptions) => {
  return apiMutation<T>(path, { method: "PATCH", ...options });
};

export const del = <T = null>({ path, ...options }: { path: string } & BaseOptions) => {
  return apiMutation<T>(path, { method: "DELETE", ...options });
};

export const upload = <T = null>({ path, ...options }: { path: string; body: FormData } & BaseOptions) => {
  return apiMutation<T>(path, { method: "POST", ...options });
};
