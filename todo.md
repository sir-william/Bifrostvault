# YubiPass Manager - TODO

## Phase 1: Configuration and Architecture
- [x] Define database schema for vaults and passwords
- [x] Configure tables for YubiKey authentication (WebAuthn)
- [x] Install necessary dependencies (crypto, WebAuthn, etc.)

## Phase 2: Backend - YubiKey Authentication
- [x] Implement YubiKey registration (WebAuthn registration)
- [x] Implement authentication with YubiKey (WebAuthn authentication)
- [x] Create tRPC procedures to manage WebAuthn credentials
- [x] Add validation and error handling

## Phase 3: Backend - Password Management
- [x] Create procedures to add/edit/delete vault entries
- [x] Implement server-side encryption (for metadata)
- [x] Create procedures for password generation
- [x] Implement search and filtering of entries

## Phase 4: Frontend - User Interface
- [x] Create main layout with navigation
- [x] Implement authentication page with YubiKey support
- [x] Create vault page (list of entries)
- [x] Create add/edit entry form
- [x] Implement password generator
- [x] Add search functionality

## Phase 5: Client-Side Encryption and Security
- [x] Implement client-side encryption/decryption with Web Crypto API
- [x] Manage master key derived from user password
- [x] Implement vault unlock functionality
- [x] Add secure clipboard copy functionality

## Phase 6: Testing and Finalization
- [x] Test YubiKey registration and authentication
- [x] Test data encryption/decryption
- [x] Verify security and best practices
- [x] Create checkpoint for deployment

## Phase 7: GitHub Deployment
- [x] Create new private repository on sir-william GitHub account
- [x] Push completed project to the repository
- [x] Verify repository access and settings

## Phase 8: TOTP Support
- [x] Install speakeasy and qrcode packages
- [x] Create TOTP database schema
- [x] Implement TOTP secret generation
- [x] Create QR code generation endpoint
- [x] Implement TOTP verification
- [ ] Create TOTP setup UI page
- [x] Add backup codes generation

## Phase 9: Complete Vault Entry Management
- [ ] Create add/edit entry modal with encryption
- [ ] Implement password reveal/hide toggle
- [ ] Add copy to clipboard functionality
- [ ] Implement entry deletion with confirmation
- [ ] Add password strength indicator for entries
- [ ] Create entry detail view
- [ ] Implement folders/categories organization
- [ ] Add favorites functionality
