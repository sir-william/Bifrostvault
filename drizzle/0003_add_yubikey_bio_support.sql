-- Migration: Add YubiKey Bio support fields
-- Date: 2025-11-11
-- Description: Adds AAGUID detection, key type identification, and user verification tracking

ALTER TABLE `webauthn_credentials` 
  ADD COLUMN `aaguid` VARCHAR(64),
  ADD COLUMN `keyType` VARCHAR(32),
  ADD COLUMN `userVerified` BOOLEAN DEFAULT FALSE,
  ADD COLUMN `authenticatorType` VARCHAR(32),
  ADD COLUMN `lastVerified` TIMESTAMP;

-- Add index for faster key type queries
CREATE INDEX `idx_key_type` ON `webauthn_credentials` (`keyType`);
CREATE INDEX `idx_user_verified` ON `webauthn_credentials` (`userVerified`);
