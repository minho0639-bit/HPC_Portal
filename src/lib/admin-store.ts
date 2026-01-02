"use server";

import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "admins.json");

export interface Admin {
  id: string;
  username: string;
  password: string; // 실제 프로덕션에서는 해시된 비밀번호 저장
  name: string;
  email?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

type AdminStore = {
  admins: Admin[];
};

const defaultStore: AdminStore = {
  admins: [],
};

async function ensureStore(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(defaultStore, null, 2), "utf-8");
  }
}

async function readStore(): Promise<AdminStore> {
  await ensureStore();
  const content = await fs.readFile(DATA_FILE, "utf-8");
  let store: AdminStore;
  try {
    store = JSON.parse(content) as AdminStore;
  } catch {
    store = defaultStore;
  }

  // 기본 관리자 계정이 없으면 자동 생성
  const defaultAdminUsername = "bitcorp148";
  const hasDefaultAdmin = store.admins.some((a) => a.username === defaultAdminUsername);
  
  if (!hasDefaultAdmin) {
    const now = new Date().toISOString();
    const defaultAdmin: Admin = {
      id: randomUUID(),
      username: defaultAdminUsername,
      password: "7890uiop",
      name: "관리자",
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
    store.admins.push(defaultAdmin);
    await writeStore(store);
  }

  return store;
}

async function writeStore(store: AdminStore): Promise<void> {
  await ensureStore();
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
}

export async function listAdmins(): Promise<Admin[]> {
  const store = await readStore();
  return store.admins;
}

export async function getAdminById(id: string): Promise<Admin | null> {
  const store = await readStore();
  return store.admins.find((a) => a.id === id) || null;
}

export async function getAdminByUsername(username: string): Promise<Admin | null> {
  const store = await readStore();
  return store.admins.find((a) => a.username === username) || null;
}

export async function createAdmin(input: {
  username: string;
  password: string;
  name: string;
  email?: string;
}): Promise<Admin> {
  const username = input.username.trim();
  const password = input.password;
  const name = input.name.trim();
  const email = input.email?.trim().toLowerCase();

  if (!username) {
    throw new Error("관리자 아이디를 입력하세요.");
  }
  if (!password || password.length < 6) {
    throw new Error("비밀번호는 최소 6자 이상이어야 합니다.");
  }
  if (!name) {
    throw new Error("이름을 입력하세요.");
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("올바른 이메일 주소를 입력하세요.");
  }

  const store = await readStore();

  if (store.admins.some((a) => a.username === username)) {
    throw new Error("이미 사용 중인 관리자 아이디입니다.");
  }

  const now = new Date().toISOString();
  const newAdmin: Admin = {
    id: randomUUID(),
    username,
    password, // 실제 프로덕션에서는 bcrypt 등으로 해시
    name,
    email,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  store.admins.push(newAdmin);
  await writeStore(store);

  return newAdmin;
}

export async function updateAdmin(
  id: string,
  updates: Partial<Pick<Admin, "name" | "email" | "status" | "password">>,
): Promise<Admin> {
  const store = await readStore();
  const adminIndex = store.admins.findIndex((a) => a.id === id);

  if (adminIndex === -1) {
    throw new Error("관리자를 찾을 수 없습니다.");
  }

  const admin = store.admins[adminIndex];

  if (updates.email !== undefined) {
    if (updates.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) {
      throw new Error("올바른 이메일 주소를 입력하세요.");
    }
    admin.email = updates.email?.trim().toLowerCase();
  }

  if (updates.name) {
    admin.name = updates.name.trim();
  }
  if (updates.status) {
    admin.status = updates.status;
  }
  if (updates.password) {
    if (updates.password.length < 6) {
      throw new Error("비밀번호는 최소 6자 이상이어야 합니다.");
    }
    admin.password = updates.password; // 실제 프로덕션에서는 bcrypt 등으로 해시
  }

  admin.updatedAt = new Date().toISOString();
  store.admins[adminIndex] = admin;
  await writeStore(store);

  return admin;
}

export async function deleteAdmin(id: string): Promise<void> {
  const store = await readStore();
  const adminIndex = store.admins.findIndex((a) => a.id === id);

  if (adminIndex === -1) {
    throw new Error("관리자를 찾을 수 없습니다.");
  }

  store.admins.splice(adminIndex, 1);
  await writeStore(store);
}

export async function authenticateAdmin(username: string, password: string): Promise<Admin | null> {
  const admin = await getAdminByUsername(username);
  if (!admin) {
    return null;
  }

  // 실제 프로덕션에서는 bcrypt.compare 사용
  if (admin.password !== password) {
    return null;
  }

  if (admin.status !== "active") {
    return null;
  }

  return admin;
}

