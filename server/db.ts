import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, webauthnCredentials, InsertWebAuthnCredential, vaultEntries, InsertVaultEntry, totpSecrets, InsertTotpSecret } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "masterPasswordHash", "passwordSalt", "encryptedVaultKey"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// WebAuthn Credentials
export async function addWebAuthnCredential(credential: InsertWebAuthnCredential) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(webauthnCredentials).values(credential);
}

export async function getWebAuthnCredentialsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(webauthnCredentials).where(eq(webauthnCredentials.userId, userId));
}

export async function getWebAuthnCredentialByCredentialId(credentialId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(webauthnCredentials).where(eq(webauthnCredentials.credentialId, credentialId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateWebAuthnCredentialCounter(
  credentialId: string,
  counter: number,
  userVerified?: boolean
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updates: any = {
    counter,
    lastUsed: new Date(),
  };

  if (userVerified !== undefined) {
    updates.lastVerified = userVerified ? new Date() : null;
  }

  await db.update(webauthnCredentials)
    .set(updates)
    .where(eq(webauthnCredentials.credentialId, credentialId));
}

// Vault Entries
export async function getVaultEntriesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(vaultEntries).where(eq(vaultEntries.userId, userId));
}

export async function addVaultEntry(entry: InsertVaultEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(vaultEntries).values(entry);
  return result;
}

export async function updateVaultEntry(id: number, userId: number, updates: Partial<InsertVaultEntry>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(vaultEntries)
    .set(updates)
    .where(eq(vaultEntries.id, id));
}

export async function deleteVaultEntry(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(vaultEntries).where(eq(vaultEntries.id, id));
}

export async function updateVaultEntryLastAccessed(id: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(vaultEntries)
    .set({ lastAccessed: new Date() })
    .where(eq(vaultEntries.id, id));
}

// TOTP Secrets
export async function getTotpSecret(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(totpSecrets).where(eq(totpSecrets.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertTotpSecret(data: InsertTotpSecret) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const existing = await getTotpSecret(data.userId);
  
  if (existing) {
    await db.update(totpSecrets)
      .set({
        secret: data.secret,
        backupCodes: data.backupCodes,
        enabled: data.enabled,
        lastUsed: data.lastUsed,
      })
      .where(eq(totpSecrets.userId, data.userId));
  } else {
    await db.insert(totpSecrets).values(data);
  }
}

export async function updateTotpLastUsed(userId: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(totpSecrets)
    .set({ lastUsed: new Date() })
    .where(eq(totpSecrets.userId, userId));
}
