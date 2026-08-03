import type { PublicUser } from "@vinted-hunter/shared";
import { apiFetch } from "./api-client";

export interface AuthSession {
  user: PublicUser;
  accessToken: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstname?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export function register(input: RegisterInput): Promise<AuthSession> {
  return apiFetch<AuthSession>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function login(input: LoginInput): Promise<AuthSession> {
  return apiFetch<AuthSession>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function refresh(): Promise<{ accessToken: string }> {
  return apiFetch<{ accessToken: string }>("/auth/refresh", { method: "POST" });
}

export function me(): Promise<PublicUser> {
  return apiFetch<PublicUser>("/auth/me");
}

export function logout(): Promise<{ loggedOut: boolean }> {
  return apiFetch<{ loggedOut: boolean }>("/auth/logout", { method: "POST" });
}
