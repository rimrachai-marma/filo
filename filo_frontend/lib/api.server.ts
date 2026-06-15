"use server";

import { cookies } from "next/headers";

const BASE_URL = (process.env.API_URL || "http://localhost:8080") + "/api/v1";

type Method = "POST" | "PUT" | "PATCH" | "DELETE";
type QueryParam = string | number | boolean;
export type TokenKind = "user" | "admin";

// ─── Options ──────────────────────────────────────────────────────────────────
interface BaseOptions {
  token?: string;
  tokenKind?: TokenKind;
  next?: NextFetchRequestConfig;
  cache?: RequestCache;
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

export type MutationState<T = unknown> =
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

// ─── Token helpers ────────────────────────────────────────────────────────────
async function getAccessToken(kind?: TokenKind): Promise<string | null> {
  const store = await cookies();
  if (kind === "admin") return store.get("admin_access_token")?.value ?? null;
  if (kind === "user") return store.get("user_access_token")?.value ?? null;
  return store.get("user_access_token")?.value ?? store.get("admin_access_token")?.value ?? null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildQuery(query?: Record<string, QueryParam>): string {
  if (!query || Object.keys(query).length === 0) return "";

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => params.append(key, String(value)));

  return `?${params.toString()}`;
}

function buildHeaders(token: string | null, body?: MutationOptions["body"]): Record<string, string> {
  const headers: Record<string, string> = {};

  if (body && !(body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

// ─── Core ─────────────────────────────────────────────────────────────────────
async function apiQuery<T>(path: string, options: QueryOptions = {}): Promise<QueryState<T>> {
  const { token, tokenKind, query, next, cache } = options;

  const accessToken = token ?? (await getAccessToken(tokenKind));

  try {
    const res = await fetch(`${BASE_URL}${path}${buildQuery(query)}`, {
      method: "GET",
      headers: buildHeaders(accessToken),
      next,
      cache,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        status: "error",
        message: json?.message ?? `Request failed with status ${res.status}`,
      };
    }

    return json;
  } catch (error) {
    console.log(error);
    return { status: "error", message: "Network error" };
  }
}

async function apiMutation<T>(path: string, options: MutationOptions = {}): Promise<MutationState<T>> {
  const { method = "POST", body, token, tokenKind } = options;

  const accessToken = token ?? (await getAccessToken(tokenKind));
  const serializedBody = body instanceof FormData ? body : body ? JSON.stringify(body) : undefined;

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: buildHeaders(accessToken, body),
      body: serializedBody,
    });

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
    console.log(error);
    return { status: "error", message: "Network error" };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────
export const get = async <T>({ path, ...options }: { path: string } & QueryOptions) => {
  return await apiQuery<T>(path, options);
};

export const post = async <T = null>({
  path,
  ...options
}: { path: string; body?: Record<string, unknown> } & BaseOptions) => {
  return await apiMutation<T>(path, { method: "POST", ...options });
};

export const patch = async <T = null>({
  path,
  ...options
}: { path: string; body?: Record<string, unknown> } & BaseOptions) => {
  return await apiMutation<T>(path, { method: "PATCH", ...options });
};

export const put = async <T = null>({
  path,
  ...options
}: { path: string; body?: Record<string, unknown> } & BaseOptions) => {
  return await apiMutation<T>(path, { method: "PUT", ...options });
};

export const del = async <T = null>({ path, ...options }: { path: string } & BaseOptions) => {
  return await apiMutation<T>(path, { method: "DELETE", ...options });
};

export const upload = async <T = null>({ path, ...options }: { path: string; body: FormData } & BaseOptions) => {
  return await apiMutation<T>(path, { method: "POST", ...options });
};
