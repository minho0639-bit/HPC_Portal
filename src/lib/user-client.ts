"use client";

export interface UserData {
  id: string;
  username: string;
  email: string;
  name: string;
  organization?: string;
  role?: string;
  status: "active" | "inactive" | "suspended";
}

export function getUserFromSession(): UserData | null {
  if (typeof window === "undefined") {
    return null;
  }

  const userDataStr = sessionStorage.getItem("user-data");
  if (!userDataStr) {
    return null;
  }

  try {
    return JSON.parse(userDataStr) as UserData;
  } catch {
    return null;
  }
}

export function logoutUser(): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.removeItem("user-authenticated");
  sessionStorage.removeItem("user-data");
}

