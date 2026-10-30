import { apiFetch } from "./client";

export type User = {
  id: number;
  email: string;
};

type UserResponse = {
  user: User;
};

export async function getMe() {
  const userResponse = await apiFetch<UserResponse>("/api/auth/me");
  return userResponse.user;
}

export async function login(email: string, password: string) {
  const userResponse = await apiFetch<UserResponse>("/api/auth/login", {
    body: { email, password },
    method: "POST",
  });
  return userResponse.user;
}

export async function register(email: string, password: string) {
  const userResponse = await apiFetch<UserResponse>("/api/auth/register", {
    body: { email, password },
    method: "POST",
  });
  return userResponse.user;
}

export async function logout() {
  await apiFetch<void>("/api/auth/logout", { method: "POST" });
}
