"use server";

import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "users.json");

export interface User {
  id: string;
  username: string;
  email: string;
  password: string; // 실제 프로덕션에서는 해시된 비밀번호 저장
  name: string;
  organization?: string;
  role?: string;
  status: "active" | "inactive" | "suspended";
  createdAt: string;
  updatedAt: string;
  createdBy?: string; // 관리자 ID
}

type UserStore = {
  users: User[];
};

const defaultStore: UserStore = {
  users: [],
};

async function ensureStore(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(defaultStore, null, 2), "utf-8");
  }
}

async function readStore(): Promise<UserStore> {
  await ensureStore();
  const content = await fs.readFile(DATA_FILE, "utf-8");
  try {
    return JSON.parse(content) as UserStore;
  } catch {
    return defaultStore;
  }
}

async function writeStore(store: UserStore): Promise<void> {
  await ensureStore();
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
}

export async function listUsers(): Promise<User[]> {
  const store = await readStore();
  return store.users;
}

export async function getUserById(id: string): Promise<User | null> {
  const store = await readStore();
  return store.users.find((u) => u.id === id) || null;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const store = await readStore();
  return store.users.find((u) => u.username === username) || null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const store = await readStore();
  return store.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function createUser(input: {
  username: string;
  email: string;
  password: string;
  name: string;
  organization?: string;
  role?: string;
  createdBy?: string;
}): Promise<User> {
  const username = input.username.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const name = input.name.trim();

  if (!username) {
    throw new Error("사용자 이름을 입력하세요.");
  }
  if (!email) {
    throw new Error("이메일을 입력하세요.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("올바른 이메일 주소를 입력하세요.");
  }
  if (!password || password.length < 6) {
    throw new Error("비밀번호는 최소 6자 이상이어야 합니다.");
  }
  if (!name) {
    throw new Error("이름을 입력하세요.");
  }

  const store = await readStore();

  if (store.users.some((u) => u.username === username)) {
    throw new Error("이미 사용 중인 사용자 이름입니다.");
  }

  if (store.users.some((u) => u.email === email)) {
    throw new Error("이미 등록된 이메일입니다.");
  }

  const now = new Date().toISOString();
  const newUser: User = {
    id: randomUUID(),
    username,
    email,
    password, // 실제 프로덕션에서는 bcrypt 등으로 해시
    name,
    organization: input.organization?.trim(),
    role: input.role?.trim(),
    status: "active",
    createdAt: now,
    updatedAt: now,
    createdBy: input.createdBy,
  };

  store.users.push(newUser);
  await writeStore(store);

  return newUser;
}

export async function updateUser(
  id: string,
  updates: Partial<Pick<User, "name" | "email" | "organization" | "role" | "status">>,
): Promise<User> {
  const store = await readStore();
  const userIndex = store.users.findIndex((u) => u.id === id);

  if (userIndex === -1) {
    throw new Error("사용자를 찾을 수 없습니다.");
  }

  const user = store.users[userIndex];

  if (updates.email && updates.email !== user.email) {
    const email = updates.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("올바른 이메일 주소를 입력하세요.");
    }
    if (store.users.some((u) => u.id !== id && u.email === email)) {
      throw new Error("이미 등록된 이메일입니다.");
    }
    user.email = email;
  }

  if (updates.name) {
    user.name = updates.name.trim();
  }
  if (updates.organization !== undefined) {
    user.organization = updates.organization?.trim();
  }
  if (updates.role !== undefined) {
    user.role = updates.role?.trim();
  }
  if (updates.status) {
    user.status = updates.status;
  }

  user.updatedAt = new Date().toISOString();
  store.users[userIndex] = user;
  await writeStore(store);

  return user;
}

export async function deleteUser(id: string): Promise<void> {
  const store = await readStore();
  const userIndex = store.users.findIndex((u) => u.id === id);

  if (userIndex === -1) {
    throw new Error("사용자를 찾을 수 없습니다.");
  }

  store.users.splice(userIndex, 1);
  await writeStore(store);
}

export async function authenticateUser(username: string, password: string): Promise<User | null> {
  const user = await getUserByUsername(username);
  if (!user) {
    return null;
  }

  // 실제 프로덕션에서는 bcrypt.compare 사용
  if (user.password !== password) {
    return null;
  }

  if (user.status !== "active") {
    return null;
  }

  return user;
}

