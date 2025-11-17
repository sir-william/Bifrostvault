import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  /** Master password hash for vault encryption (never transmitted to server in plaintext) */
  masterPasswordHash: varchar("masterPasswordHash", { length: 255 }),
  /** Salt for master password derivation */
  passwordSalt: varchar("passwordSalt", { length: 255 }),
  /** Encrypted vault key (encrypted with master password) */
  encryptedVaultKey: text("encryptedVaultKey"),
  /** Email verification status */
  emailVerified: boolean("emailVerified").default(false).notNull(),
  /** Email verification token */
  verificationToken: varchar("verificationToken", { length: 255 }),
  /** Email verification token expiry */
  verificationTokenExpiry: timestamp("verificationTokenExpiry"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * WebAuthn credentials for YubiKey authentication
 */
export const webauthnCredentials = mysqlTable("webauthn_credentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Base64url encoded credential ID */
  credentialId: varchar("credentialId", { length: 512 }).notNull().unique(),
  /** Base64url encoded public key */
  publicKey: text("publicKey").notNull(),
  /** Signature counter to prevent replay attacks */
  counter: int("counter").notNull().default(0),
  /** Transports supported by this credential */
  transports: text("transports"),
  /** Friendly name for the credential */
  name: varchar("name", { length: 255 }),
  /** AAGUID for authenticator identification */
  aaguid: varchar("aaguid", { length: 64 }),
  /** Key type detected from AAGUID */
  keyType: varchar("keyType", { length: 32 }),
  /** Whether user verification was used during registration */
  userVerified: boolean("userVerified").default(false),
  /** Authenticator type: platform or cross-platform */
  authenticatorType: varchar("authenticatorType", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastUsed: timestamp("lastUsed"),
  /** Last time user verification was successful */
  lastVerified: timestamp("lastVerified"),
});

export type WebAuthnCredential = typeof webauthnCredentials.$inferSelect;
export type InsertWebAuthnCredential = typeof webauthnCredentials.$inferInsert;

/**
 * Vault entries (passwords, notes, etc.)
 * All sensitive data is encrypted client-side before storage
 */
export const vaultEntries = mysqlTable("vault_entries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Entry type: login, note, card, identity */
  type: mysqlEnum("type", ["login", "note", "card", "identity"]).notNull().default("login"),
  /** Encrypted entry name/title */
  encryptedName: text("encryptedName").notNull(),
  /** Encrypted username/email */
  encryptedUsername: text("encryptedUsername"),
  /** Encrypted password */
  encryptedPassword: text("encryptedPassword"),
  /** Encrypted URL/website */
  encryptedUrl: text("encryptedUrl"),
  /** Encrypted notes */
  encryptedNotes: text("encryptedNotes"),
  /** Encrypted custom fields (JSON) */
  encryptedCustomFields: text("encryptedCustomFields"),
  /** Favorite flag for quick access */
  isFavorite: boolean("isFavorite").notNull().default(false),
  /** Folder/category for organization */
  folder: varchar("folder", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastAccessed: timestamp("lastAccessed"),
});

export type VaultEntry = typeof vaultEntries.$inferSelect;
export type InsertVaultEntry = typeof vaultEntries.$inferInsert;

/**
 * TOTP secrets for two-factor authentication
 */
export const totpSecrets = mysqlTable("totp_secrets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  secret: varchar("secret", { length: 255 }).notNull(),
  backupCodes: text("backupCodes"), // JSON array of backup codes
  enabled: int("enabled").notNull().default(0), // 0 = disabled, 1 = enabled
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastUsed: timestamp("lastUsed"),
});

export type TotpSecret = typeof totpSecrets.$inferSelect;
export type InsertTotpSecret = typeof totpSecrets.$inferInsert;
