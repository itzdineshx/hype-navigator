const USER_STORAGE_KEY = "hype_email_users";
const SESSION_STORAGE_KEY = "hype_email_session";

export type EmailUser = {
  email: string;
  password: string;
  createdAt: string;
};

export type EmailSession = {
  email: string;
  signedAt: string;
};

function normalizeEmail(rawEmail: string): string {
  return rawEmail.trim().toLowerCase();
}

function loadUsers(): EmailUser[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as EmailUser[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => Boolean(item?.email) && Boolean(item?.password));
  } catch {
    return [];
  }
}

function saveUsers(users: EmailUser[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
}

export function registerWithEmail(email: string, password: string): EmailSession {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !password) {
    throw new Error("Email and password are required.");
  }

  const users = loadUsers();
  const alreadyExists = users.some((user) => user.email === normalizedEmail);
  if (alreadyExists) {
    throw new Error("An account with this email already exists.");
  }

  users.push({
    email: normalizedEmail,
    password,
    createdAt: new Date().toISOString(),
  });
  saveUsers(users);

  const session = {
    email: normalizedEmail,
    signedAt: new Date().toISOString(),
  } satisfies EmailSession;

  saveEmailSession(session);
  return session;
}

export function signInWithEmail(email: string, password: string): EmailSession {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !password) {
    throw new Error("Email and password are required.");
  }

  const users = loadUsers();
  const user = users.find((item) => item.email === normalizedEmail && item.password === password);
  if (!user) {
    throw new Error("Invalid email or password.");
  }

  const session = {
    email: normalizedEmail,
    signedAt: new Date().toISOString(),
  } satisfies EmailSession;

  saveEmailSession(session);
  return session;
}

export function loadEmailSession(): EmailSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as EmailSession;
    if (!parsed?.email || !parsed?.signedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveEmailSession(session: EmailSession): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearEmailSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}
