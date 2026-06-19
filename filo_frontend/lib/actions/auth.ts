"use server";

import { Admin, MutationState, Subscription, Token, User } from "@/types";
import { AdminLoginFormData, LoginFormData, RegisterFormData, ResetPasswordFormData } from "../schemas";
import { get, post } from "../api.server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const BASE_URL = (process.env.API_URL || "http://localhost:8080") + "/api/v1";

export async function login(
  _prev: MutationState<User & { accessToken: Token; refreshToken: Token }> | null,
  formData: LoginFormData,
): Promise<MutationState<User & { accessToken: Token; refreshToken: Token }> | null> {
  const result = await post<User & { accessToken: Token; refreshToken: Token }>({
    path: "/auth/login",
    body: formData,
  });

  if (result?.status === "success" && result.data) {
    await saveTokens(result.data.accessToken.token, result.data.refreshToken.token, "user");
  }

  return result;
}

export async function signup(_prev: MutationState | null, formData: RegisterFormData): Promise<MutationState> {
  return await post({
    path: "/auth/register",
    body: formData,
  });
}

export async function loginAdmin(
  _prev: MutationState<Admin & { accessToken: Token; refreshToken: Token }> | null,
  formData: AdminLoginFormData,
): Promise<MutationState<Admin & { accessToken: Token; refreshToken: Token }> | null> {
  const result = await post<Admin & { accessToken: Token; refreshToken: Token }>({
    path: "/admin/login",
    body: formData,
  });

  if (result?.status === "success" && result.data) {
    await saveTokens(result.data.accessToken.token, result.data.refreshToken.token, "admin");
  }

  return result;
}

export async function verifyEmail(_prev: MutationState | null, formData: FormData): Promise<MutationState | null> {
  const token = formData.get("token") as string;

  if (!token) {
    return { status: "error", message: "No token provided." };
  }

  return await post({
    path: "/auth/verify-email",
    body: { token },
  });
}

export async function forgotPassword(_prev: MutationState | null, formData: FormData): Promise<MutationState | null> {
  const email = formData.get("email") as string;

  if (email == "") {
    return { status: "error", message: "Email is required." };
  }

  return await post({ path: "/auth/forgot-password", body: { email } });
}

export async function resetPassword(
  _prev: MutationState | null,
  formData: Omit<ResetPasswordFormData, "confirm"> & { token: string },
): Promise<MutationState | null> {
  return await post({ path: "/auth/reset-password", body: formData });
}

export async function getAuthUser() {
  return await get<{ user: User; subscription: Subscription | null }>({ path: "/auth/me" });
}

export async function userTokenVerify(
  token: string,
): Promise<{ user: User; newTokens?: { access: string; refresh: string } } | null> {
  try {
    const response = await fetch(`${BASE_URL}/auth/verify`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const user = (await response.json())?.data ?? null;
      return user ? { user } : null;
    }

    // Access token expired — attempt refresh
    if (response.status === 401) {
      const store = await cookies();
      store.delete("user_access_token");
      const refreshToken = store.get("user_refresh_token")?.value;

      if (!refreshToken) return null;

      const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { Cookie: `user_refresh_token=${refreshToken}` },
      });

      if (!refreshResponse.ok) return null;

      const refreshJson = await refreshResponse.json();
      const newAccessToken: string = refreshJson?.data?.accessToken?.token;
      const newRefreshToken: string = refreshJson?.data?.refreshToken?.token;

      if (!newAccessToken) return null;

      await saveTokens(newAccessToken, newRefreshToken, "user");

      const retryResponse = await fetch(`${BASE_URL}/auth/verify`, {
        headers: {
          Authorization: `Bearer ${newAccessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!retryResponse.ok) return null;

      const user = (await retryResponse.json())?.data ?? null;
      return user ? { user, newTokens: { access: newAccessToken, refresh: newRefreshToken } } : null;
    }

    return null;
  } catch (error) {
    console.error("Auth validation failed: ", error);
    return null;
  }
}

export async function adminTokenVerify(
  token: string,
): Promise<{ admin: Admin; newTokens?: { access: string; refresh: string } } | null> {
  try {
    const response = await fetch(`${BASE_URL}/admin/verify`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const admin = (await response.json())?.data ?? null;
      return admin ? { admin } : null;
    }

    // Access token expired — attempt refresh
    if (response.status === 401) {
      const store = await cookies();
      store.delete("admin_access_token");
      const refreshToken = store.get("admin_refresh_token")?.value;

      if (!refreshToken) return null;

      const refreshResponse = await fetch(`${BASE_URL}/admin/refresh`, {
        method: "POST",
        headers: { Cookie: `admin_refresh_token=${refreshToken}` },
      });

      if (!refreshResponse.ok) return null;

      const refreshJson = await refreshResponse.json();
      const newAccessToken: string = refreshJson?.data?.accessToken?.token;
      const newRefreshToken: string = refreshJson?.data?.refreshToken?.token;

      if (!newAccessToken) return null;

      const retryResponse = await fetch(`${BASE_URL}/admin/verify`, {
        headers: {
          Authorization: `Bearer ${newAccessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!retryResponse.ok) return null;

      await saveTokens(newAccessToken, newRefreshToken, "admin");

      const admin = (await retryResponse.json())?.data ?? null;
      return admin ? { admin, newTokens: { access: newAccessToken, refresh: newRefreshToken } } : null;
    }

    return null;
  } catch (error) {
    console.error("Auth validation failed: ", error);
    return null;
  }
}

export async function userLogout(): Promise<MutationState> {
  const result = await post({ path: "/auth/logout" });

  if (result?.status === "success") {
    await clearTokens("user");
    redirect("/auth/login");
  }

  return result;
}

export async function userLogoutAllDevices(): Promise<MutationState> {
  const result = await post({ path: "/auth/logout-all" });

  if (result?.status === "success") {
    await clearTokens("user");
    redirect("/auth/login");
  }

  return result;
}

export async function adminLogout(): Promise<MutationState> {
  const result = await post({ path: "/admin/logout" });

  if (result?.status === "success") {
    await clearTokens("admin");
    redirect("/admin/login");
  }

  return result;
}

export async function adminLogoutAllDevices(): Promise<MutationState> {
  const result = await post({ path: "/admin/logout-all" });

  if (result?.status === "success") {
    await clearTokens("admin");
    redirect("/admin/login");
  }

  return result;
}

const cookieOptions = (maxAgeSeconds: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  domain: process.env.NODE_ENV === "production" ? process.env.COOKIE_DOMAIN : undefined,
  path: "/",
  maxAge: maxAgeSeconds,
});
const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 minutes, in seconds
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60; // 30 days, in seconds

export type TokenKind = "user" | "admin";

export async function saveTokens(accessToken: string, refreshToken: string, kind: TokenKind = "user") {
  const store = await cookies();
  store.set(`${kind}_access_token`, accessToken, cookieOptions(ACCESS_TOKEN_MAX_AGE));
  store.set(`${kind}_refresh_token`, refreshToken, cookieOptions(REFRESH_TOKEN_MAX_AGE));
}

export async function clearTokens(kind: TokenKind = "user") {
  const store = await cookies();
  store.delete(`${kind}_access_token`);
  store.delete(`${kind}_refresh_token`);
}
