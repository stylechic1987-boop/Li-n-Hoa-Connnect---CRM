import { Account, Client, ID, Query, TablesDB } from "appwrite";

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID as string | undefined;
export const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || "lienhoa";

export const backendConfigured = Boolean(projectId);
const client = new Client().setEndpoint(endpoint).setProject(projectId || "unconfigured");
export const account = new Account(client);
export const tablesDB = new TablesDB(client);
export const db = backendConfigured ? tablesDB : null;

type Ref = { tableId: string; rowId: string };
type CollectionRef = { tableId: string };
type Constraint = { field: string; op: string; value: unknown };

export function collection(_db: unknown, tableId: string): CollectionRef { return { tableId }; }
export function doc(_db: unknown, tableId: string, rowId: string): Ref { return { tableId, rowId }; }
export function where(field: string, op: string, value: unknown): Constraint { return { field, op, value }; }
export function query(ref: CollectionRef, ...constraints: Constraint[]) { return { ...ref, constraints }; }

export async function getDocs(q: ReturnType<typeof query> | CollectionRef) {
  if (!backendConfigured) return { docs: [] as Array<{ id: string; data: () => Record<string, unknown> }>, empty: true };
  const constraints = "constraints" in q ? q.constraints : [];
  const queries = constraints.filter(c => c.op === "==").map(c => Query.equal(c.field, c.value as any));
  const result = await tablesDB.listRows({ databaseId, tableId: q.tableId, queries });
  return { docs: result.rows.map((row: any) => ({ id: row.$id, data: () => row })), empty: result.total === 0 };
}

export async function getDoc(ref: Ref) {
  if (!backendConfigured) return { exists: () => false, data: () => ({}) };
  try {
    const row = await tablesDB.getRow({ databaseId, tableId: ref.tableId, rowId: ref.rowId });
    return { exists: () => true, data: () => row };
  } catch { return { exists: () => false, data: () => ({}) }; }
}

export async function setDoc(ref: Ref, data: Record<string, unknown>, options?: { merge?: boolean }) {
  if (!backendConfigured) return;
  if (options?.merge) await tablesDB.upsertRow({ databaseId, tableId: ref.tableId, rowId: ref.rowId, data });
  else await tablesDB.createRow({ databaseId, tableId: ref.tableId, rowId: ref.rowId || ID.unique(), data });
}
export async function updateDoc(ref: Ref, data: Record<string, unknown>) {
  if (!backendConfigured) return;
  await tablesDB.updateRow({ databaseId, tableId: ref.tableId, rowId: ref.rowId, data });
}
export async function addDoc(ref: CollectionRef, data: Record<string, unknown>) {
  if (!backendConfigured) return { id: ID.unique() };
  const row = await tablesDB.createRow({ databaseId, tableId: ref.tableId, rowId: ID.unique(), data });
  return { id: row.$id };
}

export const auth = {
  async signInWithEmailAndPassword(email: string, password: string) {
    const session = await account.createEmailPasswordSession({ email, password });
    window.dispatchEvent(new Event("lh-auth-change"));
    return session;
  },
  async signOut() {
    try { await account.deleteSession({ sessionId: "current" }); }
    finally { window.dispatchEvent(new Event("lh-auth-change")); }
  }
};

export async function getCurrentUser() {
  if (!backendConfigured) return null;
  try { return await account.get(); } catch { return null; }
}
export function onAuthStateChanged(callback: (user: any | null) => void) {
  let alive = true;
  const emit = async () => { const user = await getCurrentUser(); if (alive) callback(user ? { ...user, uid: user.$id } : null); };
  void emit();
  const listener = () => void emit();
  window.addEventListener("lh-auth-change", listener);
  return () => { alive = false; window.removeEventListener("lh-auth-change", listener); };
}
export { ID };
